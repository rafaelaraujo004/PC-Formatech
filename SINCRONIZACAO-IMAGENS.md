# 📱 Sistema de Sincronização de Imagens - PC Formatech

## Visão Geral
As imagens do carrossel agora são **sincronizadas automaticamente entre todos os dispositivos** usando Firebase Cloud Firestore e Storage.

## Como Funciona

### 1. **Upload de Imagem (Admin Panel)**
Quando você adiciona uma imagem via upload do dispositivo:
```
Dispositivo 1 (Admin) → Upload → Firebase Storage → URL Pública → Firestore
                          ↓
Dispositivo 2 (Visitante) ← Firestore (escuta em tempo real)
Dispositivo 3 (Visitante) ← Firestore (escuta em tempo real)
```

### 2. **Fluxo de Sincronização**

#### **No Painel Administrativo (admin.html):**
1. Usuário clica "Adicionar Nova Imagem"
2. Escolhe "Fazer Upload" e seleciona arquivo
3. Sistema redimensiona para 800x400px
4. Converte para Base64
5. Verifica se Firebase está disponível:
   - ✅ Se sim: Envia para Firebase Storage, recebe URL pública
   - ❌ Se não: Usa Base64 diretamente (fallback)
6. Salva no Firestore (documento: `slider/images`)
7. Também salva no localStorage como backup
8. **Resultado:** Todos os visitantes veem a imagem ao mesmo tempo

#### **Na Página Pública (index.html):**
1. Página carrega
2. Tenta conectar ao Firestore
3. Escuta mudanças em tempo real no documento `slider/images`
4. Quando há mudança, atualiza automaticamente o carrossel
5. Se Firebase não estiver disponível, carrega do localStorage

### 3. **Recursos**

✅ **Sincronização em Tempo Real**
- Mudanças aparecem instantaneamente em todos os dispositivos
- Sem necessidade de atualizar página

✅ **Redimensionamento Automático**
- Imagens redimensionadas para 800x400px
- Mantém proporção original
- Compactação automática (qualidade: 85%)

✅ **Fallback Robusto**
- Se Firebase falhar → usa localStorage
- Se URL de imagem morrer → usa placeholder
- Sistema sempre funciona

✅ **Upload de Arquivo**
- Suporta JPG, PNG, WebP
- Máximo 10MB por imagem
- Pré-visualização em tempo real

✅ **URL (Link Externo)**
- Copie URL de qualquer imagem online
- Perfeito para imagens do Unsplash, Pexels, etc.

---

## Tecnologias Utilizadas

| Componente | Função |
|-----------|--------|
| **Firebase Storage** | Armazenar imagens em nuvem |
| **Firestore** | Sincronizar URLs entre dispositivos |
| **Canvas API** | Redimensionar imagens no navegador |
| **localStorage** | Fallback se Firebase não disponível |

---

## Estrutura de Dados

### Documento Firestore: `slider/images`
```json
{
  "slides": [
    {
      "url": "https://...",  // URL pública (Firebase ou externa)
      "alt": "Descrição"     // Texto alternativo
    }
  ],
  "updatedAt": "2026-04-23T..."
}
```

---

## Cenários de Uso

### 📍 Cenário 1: Dispositivo com Internet
```
Admin abre painel → Faz upload → Firebase recebe
↓
Visitante A (Brasil) → Vê imagem (Firebase)
Visitante B (Portugal) → Vê imagem (Firebase)
Visitante C (USA) → Vê imagem (Firebase)
```

### 📍 Cenário 2: Sem Internet (modo offline)
```
Admin faz upload → localStorage salva
↓
Visitante acessa site → localStorage carrega
(Sem sincronização entre dispositivos, apenas local)
```

---

## Para o Usuário (você)

### ✅ Passo a Passo para Adicionar Imagem

1. **Acesse o Painel:** http://localhost:3000/admin.html
2. **Faça login:** Senha: `pcformatech2026`
3. **Clique:** "Imagens da Tela Inicial"
4. **Clique:** "Adicionar Nova Imagem"
5. **Escolha:**
   - 🔗 **Usar URL:** Cole um link de imagem online
   - 📁 **Fazer Upload:** Selecione arquivo do seu PC
6. **Preencha:** Descrição da imagem (acessibilidade)
7. **Clique:** "Adicionar"
8. **Pronto!** ✨ Todos os visitantes veem a imagem

### 🔄 Em Qualquer Dispositivo
- Abra o site público: http://localhost:3000
- A imagem aparece **automaticamente**
- Não precisa atualizar página
- Funciona no celular, tablet, PC

---

## Segurança

✅ **URLs do Firebase Storage são públicas de leitura**
- Configurado nas regras do Firestore
- Perfetto para site público

✅ **Painel administrativo protegido**
- Apenas com senha correta consegue editar

✅ **Imagens não armazenam dados sensíveis**
- Apenas URLs de imagens

---

## Troubleshooting

### ❓ Imagem não sincroniza entre dispositivos?
→ Verifique se Firebase está inicializado (veja console do navegador)
→ Se não, o localStorage é usado como fallback

### ❓ Erro ao fazer upload?
→ Arquivo pode estar muito grande (máximo 10MB)
→ Formato pode ser inválido (use JPG, PNG ou WebP)

### ❓ Imagem quebrada (não carrega)?
→ URL pode estar inválida ou expirada
→ Sistema mostra placeholder automaticamente

---

## Próximos Passos (Opcional)

Para melhorias futuras:
- [ ] Compressão WEBP para melhor performance
- [ ] Editar ordem das imagens (drag-drop)
- [ ] Criptografia de URLs sensíveis
- [ ] Analytics de visualizações

---

**Status:** ✅ **Funcionando com sincronização entre dispositivos**
**Última atualização:** 23 de abril de 2026
**Autor:** GitHub Copilot
