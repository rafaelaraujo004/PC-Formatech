# 🚀 Instruções de Deploy - GitHub + Vercel

## ✅ Preparação Concluída

Os dados sensíveis foram removidos e o projeto está pronto para o GitHub!

---

## 📋 Checklist Pré-Deploy

- [x] Credenciais removidas do código
- [x] Variáveis de ambiente configuradas
- [x] .gitignore criado
- [x] Regras do Firestore salvas
- [x] Arquivo vercel.json criado

---

## 🔧 1. Configurar Firebase Console

### 1.1 Ativar Firestore Database

1. Acesse: https://console.firebase.google.com/project/pc-formatech/firestore
2. Clique em **"Criar banco de dados"**
3. Modo: **Produção**
4. Localização: **southamerica-east1 (São Paulo)**
5. Clique em **"Ativar"**

### 1.2 Aplicar Regras de Segurança

1. Em **Firestore Database**, clique em **"Regras"**
2. Cole o conteúdo do arquivo `firestore-rules.txt`
3. Clique em **"Publicar"**

### 1.3 Configurar Authentication

1. Acesse: https://console.firebase.google.com/project/pc-formatech/authentication
2. Clique em **"Começar"**
3. Habilite **"E-mail/senha"**
4. Adicione usuário:
   - Email: `admin@pcformatech.com`
   - Senha: **escolha uma senha forte**

---

## 📦 2. Publicar no GitHub

### 2.1 Criar Repositório

```bash
# Inicializar Git (se ainda não estiver)
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "Initial commit - PC Formatech"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/pc-formatech.git

# Enviar para GitHub
git push -u origin main
```

### 2.2 Verificar se .env.local NÃO foi enviado

```bash
# Este comando NÃO deve mostrar .env.local
git ls-files | grep .env
```

**✅ Correto:** Apenas `.env.example` deve aparecer  
**❌ Errado:** Se `.env.local` aparecer, remova imediatamente!

---

## 🌐 3. Deploy no Vercel

### 3.1 Conectar Repositório

1. Acesse: https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Selecione seu repositório **pc-formatech**
4. Clique em **"Import"**

### 3.2 Configurar Variáveis de Ambiente

**ANTES de fazer deploy**, adicione estas variáveis:

```
VITE_FIREBASE_API_KEY=AIzaSyAIKqmS_Mj4fOP9j8SSugosV5Hahm48J5M
VITE_FIREBASE_AUTH_DOMAIN=pc-formatech.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pc-formatech
VITE_FIREBASE_STORAGE_BUCKET=pc-formatech.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=584035762234
VITE_FIREBASE_APP_ID=1:584035762234:web:97df96d921450949b8b503
VITE_FIREBASE_MEASUREMENT_ID=G-3SMZZB891S
```

**Passos:**
1. Em **Environment Variables**, adicione cada variável acima
2. Selecione: **Production**, **Preview**, **Development**
3. Clique em **Add** para cada uma

### 3.3 Deploy

1. Clique em **"Deploy"**
2. Aguarde a conclusão (1-2 minutos)
3. Acesse a URL fornecida pelo Vercel

---

## 🧪 4. Testar em Produção

### 4.1 Testar Site Principal

1. Acesse: `https://seu-projeto.vercel.app`
2. Verifique se as imagens carregam
3. Teste o formulário de contato
4. Verifique o WhatsApp widget

### 4.2 Testar Painel Admin

1. Acesse: `https://seu-projeto.vercel.app/admin.html`
2. Faça login com: `admin@pcformatech.com`
3. Verifique se o dashboard carrega
4. Adicione um cliente de teste
5. Verifique se salva no Firestore

---

## 🔍 5. Verificar Firestore

1. Acesse: https://console.firebase.google.com/project/pc-formatech/firestore
2. Verifique se as coleções foram criadas:
   - `clients`
   - `budgets`
   - `products`
   - `services`
   - `hero_slides`

---

## 🛡️ 6. Segurança - Checklist Final

- [ ] `.env.local` está no `.gitignore`
- [ ] Credenciais NÃO estão no código no GitHub
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Regras do Firestore aplicadas
- [ ] HTTPS ativo (automático no Vercel)
- [ ] Apenas admin@pcformatech.com pode acessar dados

---

## 📱 7. Configurar Domínio Personalizado (Opcional)

### No Vercel:

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio: `pcformatech.com`
3. Configure os DNS conforme instruções do Vercel
4. Aguarde propagação (até 48h)

---

## 🔄 8. Fazer Alterações Futuras

```bash
# Fazer alterações no código
# ...

# Adicionar mudanças
git add .

# Commit
git commit -m "Descrição da mudança"

# Enviar para GitHub
git push

# Vercel fará deploy automático!
```

---

## ⚠️ IMPORTANTE - Backup de Dados

### Exportar dados do Firestore

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Exportar dados
firebase firestore:export backup-$(date +%Y%m%d)
```

---

## 🆘 Problemas Comuns

### Erro: Firebase não inicializado

**Solução:** Verifique se as variáveis de ambiente foram configuradas no Vercel

### Erro: Permissão negada no Firestore

**Solução:** Verifique se as regras do Firestore foram aplicadas corretamente

### Erro: Build falhou no Vercel

**Solução:** Verifique se todos os arquivos necessários foram commitados

---

## 📞 Links Úteis

- **Projeto Firebase:** https://console.firebase.google.com/project/pc-formatech
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/SEU_USUARIO/pc-formatech

---

## ✨ Pronto!

Seu projeto está seguro e pronto para produção! 🎉

**URLs:**
- **Site:** https://seu-projeto.vercel.app
- **Admin:** https://seu-projeto.vercel.app/admin.html
