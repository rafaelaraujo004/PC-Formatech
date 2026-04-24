# 🔐 Guia de Configuração - Segurança e Banco de Dados

## 📚 Índice
1. [Configuração do Firebase](#configuração-do-firebase)
2. [Implementação de Segurança](#implementação-de-segurança)
3. [Regras de Segurança do Firebase](#regras-de-segurança)
4. [Variáveis de Ambiente no Vercel](#variáveis-de-ambiente)
5. [Proteção contra Ataques](#proteção-contra-ataques)

---

## 🔥 Configuração do Firebase

### Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: **PC Formatech**
4. Desabilite Google Analytics (opcional)
5. Clique em "Criar projeto"

### Passo 2: Configurar Firestore Database

1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Selecione **"Iniciar no modo de produção"**
4. Escolha a localização: **southamerica-east1 (São Paulo)**
5. Clique em **"Ativar"**

### Passo 3: Configurar Authentication

1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Começar"**
3. Habilite **"E-mail/senha"**
4. Clique em **"Salvar"**

### Passo 4: Adicionar Usuário Administrador

1. Em **"Authentication"** > **"Users"**
2. Clique em **"Add user"**
3. Email: `admin@pcformatech.com`
4. Senha: *escolha uma senha forte*
5. Clique em **"Add user"**

### Passo 5: Obter Credenciais

1. Clique no ícone de engrenagem ⚙️ > **"Configurações do projeto"**
2. Role até **"Seus aplicativos"**
3. Clique no ícone **Web** `</>`
4. Nome do app: **PC Formatech Web**
5. Clique em **"Registrar app"**
6. **COPIE** o objeto `firebaseConfig`

### Passo 6: Adicionar Credenciais ao Projeto

Abra o arquivo `firebase-config.js` e substitua:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",          // Cole aqui
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

---

## 🛡️ Regras de Segurança do Firebase

No Firebase Console, vá em **Firestore Database** > **Regras** e cole:

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
             request.auth.token.email in ['admin@pcformatech.com'];
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
    
    // Slides - Admin para escrita, todos para leitura
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

---

## 🔐 Implementação de Segurança

### Autenticação no admin.html

Adicione no início do arquivo `admin.html`, após as tags `<script>` do Firebase:

```html
<script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="auth-system.js"></script>
<script src="database-system.js"></script>
```

### Proteger Acesso ao Painel

Adicione logo após o login no `admin.html`:

```javascript
// Verificar autenticação ao carregar página
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar Firebase
    initFirebase();
    await dbSystem.initialize();
    
    // Verificar se está autenticado
    if (!authSystem.isAuthenticated()) {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';
    } else {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('loginContainer').style.display = 'none';
    }
});

// Modificar função de login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // Tentar Firebase primeiro
        let result;
        if (isFirebaseConfigured()) {
            result = await authSystem.loginWithFirebase(username, password);
        } else {
            result = await authSystem.loginLocal(username, password);
        }
        
        if (result.success) {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadDashboard();
        }
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
}

// Modificar função de logout
function logout() {
    authSystem.logout();
}
```

---

## 🌍 Variáveis de Ambiente no Vercel

Para proteger suas credenciais Firebase:

### 1. Criar arquivo .env.local (NÃO commitar)

```bash
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 2. Adicionar ao .gitignore

```bash
.env
.env.local
.env.production
firebase-config.js
```

### 3. Configurar no Vercel

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com)
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável:
   - **Name**: `VITE_FIREBASE_API_KEY`
   - **Value**: sua chave
   - **Environment**: Production, Preview, Development
4. Clique em **Save**

### 4. Modificar firebase-config.js

```javascript
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "SUA_API_KEY_AQUI",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};
```

---

## 🛡️ Proteção contra Ataques

### 1. Proteção contra Injeção SQL/XSS

Já implementado no código com sanitização de inputs.

### 2. Rate Limiting

Implementado no `auth-system.js`:
- Máximo 3 tentativas de login
- Bloqueio de 15 minutos após 3 falhas

### 3. HTTPS Obrigatório

O Vercel já fornece HTTPS automático.

### 4. Content Security Policy (CSP)

Adicione ao `<head>` do index.html:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
    img-src 'self' data: https:;
    font-src 'self' https://cdnjs.cloudflare.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;
">
```

### 5. Ofuscação de Código (Opcional)

Para ofuscar o código JavaScript:

```bash
npm install -g javascript-obfuscator
javascript-obfuscator main.js --output main.min.js
```

---

## 📋 Checklist de Segurança

- [ ] Firebase configurado e testado
- [ ] Regras de segurança do Firestore aplicadas
- [ ] Autenticação funcionando
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] HTTPS ativo
- [ ] CSP configurado
- [ ] Rate limiting testado
- [ ] Backup dos dados configurado

---

## 🚀 Próximos Passos

1. Configure o Firebase seguindo os passos acima
2. Teste a autenticação localmente
3. Faça deploy no Vercel
4. Configure as variáveis de ambiente
5. Teste em produção

## 📞 Suporte

Se tiver dúvidas, consulte:
- [Documentação Firebase](https://firebase.google.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
