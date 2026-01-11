# 🚀 Próximos Passos - Firebase Configurado!

## ✅ Configuração Concluída

Suas credenciais do Firebase foram adicionadas ao projeto:
- **Projeto:** pc-formatech
- **Arquivo:** firebase-config.js

---

## 📋 Checklist de Configuração do Firebase

### 1. ⚙️ Configurar Firestore Database

Acesse: https://console.firebase.google.com/project/pc-formatech/firestore

1. Clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de produção"**
4. Escolha a localização: **southamerica-east1 (São Paulo)**
5. Clique em **"Ativar"**

### 2. 🔐 Configurar Regras de Segurança

Ainda em **Firestore Database**, clique na aba **"Regras"** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função para verificar se o usuário está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.email == 'admin@pcformatech.com';
    }
    
    // Clientes - Apenas admin autenticado
    match /clients/{clientId} {
      allow read, write: if isAdmin();
    }
    
    // Orçamentos - Apenas admin autenticado
    match /budgets/{budgetId} {
      allow read, write: if isAdmin();
    }
    
    // Produtos - Apenas admin autenticado
    match /products/{productId} {
      allow read, write: if isAdmin();
    }
    
    // Serviços - Apenas admin autenticado
    match /services/{serviceId} {
      allow read, write: if isAdmin();
    }
    
    // Slides da tela inicial - Admin para escrita, todos para leitura
    match /hero_slides/{slideId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Bloquear tudo que não foi especificado
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Clique em **"Publicar"**.

### 3. 🔑 Configurar Authentication

Acesse: https://console.firebase.google.com/project/pc-formatech/authentication

1. Clique em **"Authentication"**
2. Clique em **"Começar"**
3. Habilite **"E-mail/senha"**
4. Clique em **"Salvar"**

### 4. 👤 Adicionar Usuário Administrador

Ainda em **"Authentication"**, aba **"Users"**:

1. Clique em **"Add user"**
2. **Email:** `admin@pcformatech.com`
3. **Senha:** escolha uma senha forte (guarde bem!)
4. Clique em **"Add user"**

---

## 🧪 Testar Localmente

1. Abra o arquivo **admin.html** no navegador
2. Faça login com:
   - **Email:** admin@pcformatech.com
   - **Senha:** (a senha que você criou)
3. Verifique o console do navegador (F12) para ver se o Firebase foi inicializado

---

## 🌐 Deploy no Vercel

### Opção 1: Via GitHub

1. Crie um repositório no GitHub
2. **IMPORTANTE:** Antes de fazer commit, remova as credenciais do firebase-config.js:
   ```javascript
   const firebaseConfig = {
       apiKey: process.env.VITE_FIREBASE_API_KEY || "",
       authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "",
       // ... use variáveis de ambiente para todas as chaves
   };
   ```
3. Faça push do código
4. Conecte o Vercel ao repositório
5. Configure as variáveis de ambiente no Vercel

### Opção 2: Configurar Variáveis de Ambiente no Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Settings** > **Environment Variables**
3. Adicione estas variáveis:

```
VITE_FIREBASE_API_KEY=AIzaSyAIKqmS_Mj4fOP9j8SSugosV5Hahm48J5M
VITE_FIREBASE_AUTH_DOMAIN=pc-formatech.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pc-formatech
VITE_FIREBASE_STORAGE_BUCKET=pc-formatech.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=584035762234
VITE_FIREBASE_APP_ID=1:584035762234:web:97df96d921450949b8b503
VITE_FIREBASE_MEASUREMENT_ID=G-3SMZZB891S
```

4. Selecione **Production, Preview, Development**
5. Clique em **Save**

---

## ⚠️ IMPORTANTE - Segurança

### Nunca faça commit de credenciais!

Se você for usar Git/GitHub:

1. Adicione `firebase-config.js` ao `.gitignore`
2. Use variáveis de ambiente
3. Mantenha suas credenciais em segredo

### O arquivo atual tem suas credenciais REAIS!

**Opções:**
1. **Não usar Git:** Continue usando localmente sem versionamento
2. **Usar variáveis de ambiente:** Modifique o firebase-config.js para usar process.env
3. **Criar arquivo separado:** Mantenha as credenciais em arquivo local não versionado

---

## 📞 Suporte

- **Firebase Console:** https://console.firebase.google.com/project/pc-formatech
- **Documentação Firebase:** https://firebase.google.com/docs
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ✨ O que acontece agora?

Com o Firebase configurado:
- ✅ Dados serão salvos na nuvem (Firestore)
- ✅ Login seguro com autenticação Firebase
- ✅ Backup automático dos dados
- ✅ Sincronização em tempo real
- ✅ Acesso de qualquer lugar

---

**Status Atual:** ⏳ Firebase configurado, aguardando ativação do Firestore e Authentication
