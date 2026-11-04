# Atendimento WhatsApp Business — PC Formatech

Integração **oficial** com a **WhatsApp Business Platform (Cloud API)** da Meta.
Serve para a empresa atender seus próprios clientes: chegam ao painel as
mensagens que o cliente envia para o **número comercial** da PC Formatech, e
saem as respostas que o atendente escreve. É o mesmo mecanismo do WhatsApp Web,
pela API que a Meta disponibiliza — com o consentimento natural de quem escreve
para a empresa.

> **Não** é cópia de conversas de outro aparelho nem de terceiros. A Cloud API
> só entrega o que é dirigido ao número comercial.

---

## O que foi criado neste projeto

| Arquivo | Função |
|---|---|
| `api/whatsapp.js` | Webhook: a Meta chama aqui a cada mensagem recebida. Confere a assinatura e grava no Firestore. |
| `api/whatsapp-enviar.js` | Envia a resposta pela Cloud API. Exige login de administrador. |
| `api/_whatsapp.js` | Utilitários (assinatura, envio, configuração). |
| `whatsapp.html` + `whatsapp.js` | Painel de atendimento (tema escuro, verde). Acesse em `/whatsapp.html`. |
| `firestore.rules` | Regras das coleções `whatsappConversations` (só o admin lê; só o servidor grava). |

Estrutura no Firestore:

```
whatsappConversations/{telefone}
    telefone, nome, ultimoTexto, ultimaDirecao, naoLidas, atualizadoEm
whatsappConversations/{telefone}/mensagens/{idDaMensagem}
    direcao (recebida|enviada), tipo, texto, status, criadoEm, waMessageId
```

O id da mensagem é o id que a Meta gera, então webhook repetido **não duplica**.

---

## Decisão importante antes de começar: o número

O número que entra na **Cloud API não pode continuar sendo usado no aplicativo
normal do WhatsApp** (nem no WhatsApp Business app). Ao migrar um número para a
API, ele sai do app. Opções:

- **Para testar hoje, sem comprometer nada:** a Meta dá um **número de teste**
  gratuito e deixa você cadastrar até 5 números de destino. Dá para ver tudo
  funcionando sem verificar a empresa e sem mexer no seu número real.
- **Para produção:** use um número novo (um chip só para o atendimento), ou
  migre o comercial sabendo que ele deixará o app.

---

## Passo a passo na Meta (pelo celular dá)

1. Acesse **developers.facebook.com** e entre com sua conta Facebook.
2. **Criar app** → tipo **"Negócios"** (Business).
3. No app, adicione o produto **WhatsApp**.
4. Em **WhatsApp → API Setup (Configuração da API)** você verá:
   - um **número de teste** e o **Phone number ID** → use no `WHATSAPP_PHONE_NUMBER_ID`;
   - um **token de acesso temporário** → use no `WHATSAPP_TOKEN` (expira em ~24 h;
     depois gere um permanente com "System User", explicado no fim);
   - o campo **"To"**: cadastre aí o seu outro número para receber os testes.
5. Em **Configurações do app → Básico**, copie o **App Secret** → `WHATSAPP_APP_SECRET`.

---

## Configurar na Vercel

No painel da Vercel do projeto → **Settings → Environment Variables**, adicione
(ambiente **Production**):

| Variável | Valor |
|---|---|
| `WHATSAPP_TOKEN` | token da API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | um texto que **você inventa** (ex.: `pcf-2026-verifica`) |
| `WHATSAPP_APP_SECRET` | App Secret |

Depois faça um **Redeploy** para as variáveis valerem.

> O projeto já usa `FIREBASE_SERVICE_ACCOUNT` (credencial de administrador do
> Firebase). A integração reaproveita essa mesma credencial para gravar no
> Firestore — nada novo a configurar aí.

---

## Ligar o webhook

1. Na Meta, em **WhatsApp → Configuration (Configuração) → Webhook**, clique em
   **Editar**.
2. **Callback URL:** `https://www.pcformatech.com.br/api/whatsapp`
3. **Verify token:** o mesmo texto que você pôs em `WHATSAPP_VERIFY_TOKEN`.
4. Clique em **Verificar e salvar**. A Meta chama o `GET` e deve dar certo.
5. Em **Webhook fields**, assine o campo **`messages`**.

---

## Publicar as regras do Firestore

Firebase Console → **Firestore Database → Regras** → cole o conteúdo de
`firestore.rules` → **Publicar**. (Elas liberam a leitura das conversas só para
o seu e-mail de administrador.)

---

## Testar

1. Abra **`https://www.pcformatech.com.br/whatsapp.html`** e entre com seu
   e-mail e senha de administrador.
2. Do seu outro celular (o número cadastrado em "To"), mande uma mensagem para
   o número de teste da Meta.
3. A conversa deve aparecer no painel em segundos. Responda pela caixa de texto.

> **Janela de 24 h:** a Meta só permite **texto livre** nas 24 h após a última
> mensagem do cliente. Fora disso, apenas **modelos (templates)** aprovados são
> entregues. O painel avisa quando a janela passou.

---

## Depois dos testes: token permanente

O token da API Setup expira. Para produção, gere um que não expira:

1. **business.facebook.com → Configurações do negócio → Usuários → Usuários do
   sistema** → criar um usuário do sistema.
2. Dê a ele acesso ao app e ao ativo do WhatsApp.
3. **Gerar token** com as permissões `whatsapp_business_messaging` e
   `whatsapp_business_management`.
4. Troque o `WHATSAPP_TOKEN` na Vercel por esse token e faça Redeploy.

---

## Limites e próximos passos

- **v1 (agora):** receber e responder **texto**. Mídia recebida aparece como
  aviso (📷 Imagem, 🎧 Áudio…), sem baixar o arquivo.
- **Próximo:** baixar/mostrar mídia (exige uma chamada autenticada extra à
  Meta); enviar imagens; cadastrar e disparar **templates** para iniciar
  conversa fora das 24 h; marcar conversa como lida ao abrir.
