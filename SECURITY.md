# 🔒 Guia de Segurança - PC Formatech

## ⚠️ ALERTA: Chave de API Exposta Detectada

### Problema Identificado
Uma chave de API do Google Firebase foi detectada no arquivo `firebase-config.js` (commit 7d94cc22).

### ✅ Ações Necessárias (URGENTE)

#### 1. **Rotacionar a Chave de API do Firebase**

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto "pc-formatech"
3. Vá em **Configurações do Projeto** (ícone de engrenagem) > **Geral**
4. Na seção **Seus apps**, encontre seu Web App
5. Role até **Chaves de API** e clique em **Gerenciar chaves de API no Google Cloud Console**
6. **DELETE** a chave antiga: `AIzaSyAIKqmS_Mj4fOP9j8SSugosV5Hahm48J5M`
7. Crie uma nova chave e configure as restrições adequadas

#### 2. **Configurar Restrições da Nova Chave**

No Google Cloud Console:
- **Restrições de aplicativo**: Selecione "Referenciadores HTTP (sites)"
- **Restrições de referenciador de site**: Adicione:
  ```
  seudominio.com/*
  localhost:*
  127.0.0.1:*
  ```
- **Restrições de API**: Selecione apenas as APIs necessárias:
  - Cloud Firestore API
  - Firebase Authentication API
  - (outras APIs que você usa)

#### 3. **Remover o Arquivo do Histórico do Git**

Execute os seguintes comandos no terminal:

```bash
# Remover o arquivo do histórico do Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch firebase-config.js" \
  --prune-empty --tag-name-filter cat -- --all

# Ou use o BFG Repo-Cleaner (mais rápido):
# Baixe: https://rtyley.github.io/bfg-repo-cleaner/
bfg --delete-files firebase-config.js

# Force push para o repositório remoto
git push origin --force --all
git push origin --force --tags
```

#### 4. **Reconfigurar o Projeto Localmente**

```bash
# 1. Copie o arquivo de exemplo
cp firebase-config.example.js firebase-config.js

# 2. Edite firebase-config.js e adicione suas NOVAS credenciais
# 3. Verifique se está no .gitignore
git status  # firebase-config.js NÃO deve aparecer

# 4. Commit das mudanças de segurança
git add .gitignore firebase-config.example.js SECURITY.md
git commit -m "🔒 Segurança: Remove credenciais e adiciona .gitignore"
git push
```

#### 5. **Configurar Regras de Segurança do Firestore**

No Firebase Console > Firestore Database > Regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura pública apenas para dados não sensíveis
    match /clients/{clientId} {
      allow read: if request.auth != null;  // Apenas usuários autenticados
      allow write: if request.auth != null;
    }
    
    match /services/{serviceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Negar acesso a tudo por padrão
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🛡️ Melhores Práticas de Segurança

### ✅ O QUE FAZER

1. **Nunca commitar**:
   - Chaves de API privadas
   - Senhas
   - Tokens de autenticação
   - Arquivos `.env`
   - Credenciais de banco de dados

2. **Sempre usar**:
   - Variáveis de ambiente (`.env`)
   - Arquivos `.example` para templates
   - `.gitignore` configurado corretamente
   - Regras de segurança do Firestore/Firebase

3. **Rotacionar credenciais**:
   - Imediatamente após exposição
   - Periodicamente (a cada 90 dias)
   - Ao remover membros da equipe

### ❌ O QUE EVITAR

- ❌ Hardcoded credentials no código
- ❌ Commits de arquivos de configuração
- ❌ Regras de Firestore permissivas (allow read, write: if true)
- ❌ API keys sem restrições

## 📋 Checklist de Segurança

- [ ] Chave antiga do Firebase deletada
- [ ] Nova chave criada com restrições adequadas
- [ ] `firebase-config.js` removido do histórico do Git
- [ ] `.gitignore` atualizado e funcionando
- [ ] Regras do Firestore configuradas (sem allow all)
- [ ] Autenticação do Firebase implementada
- [ ] Variáveis de ambiente configuradas (se aplicável)
- [ ] Teste local funcionando com nova chave
- [ ] Push forçado para remover credenciais do repositório remoto

## 🆘 Suporte

Se precisar de ajuda:
1. [Documentação de Segurança do Firebase](https://firebase.google.com/docs/projects/api-keys)
2. [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
3. [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

---
**Última atualização**: 11 de janeiro de 2026
