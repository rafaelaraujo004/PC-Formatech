# PC Formatech 🖥️

Sistema completo de gerenciamento para serviços de formatação e manutenção de computadores.

## 🌟 Funcionalidades

### Site Principal
- ✅ Landing page moderna e responsiva
- ✅ Carrossel de imagens automático
- ✅ Widget de WhatsApp integrado
- ✅ Formulário de contato
- ✅ Catálogo de serviços
- ✅ Informações sobre pagamento via Alelo

### Painel Administrativo
- ✅ Dashboard com métricas e gráficos
- ✅ Gestão de clientes
- ✅ Gestão de serviços
- ✅ Orçamentos e laudos técnicos em PDF
- ✅ Controle de produtos e estoque
- ✅ Configuração de preços
- ✅ Gerenciamento de imagens da tela inicial
- ✅ Conversão de orçamentos em serviços
- ✅ Relatórios mensais com gráficos

## 🚀 Tecnologias

- HTML5, CSS3, JavaScript
- Firebase (Firestore + Authentication)
- Chart.js para gráficos
- jsPDF para geração de PDFs
- Font Awesome para ícones

## 📦 Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/pc-formatech.git
cd pc-formatech
```

2. Copie o arquivo de exemplo das variáveis de ambiente:
```bash
cp .env.example .env.local
```

3. Edite `.env.local` e adicione suas credenciais do Firebase

4. Abra `index.html` no navegador ou use um servidor local:
```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx serve
```

5. Acesse: `http://localhost:8000`

## 🔐 Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Firestore Database
3. Ative o Authentication (Email/Senha)
4. Crie um usuário admin
5. Copie as credenciais para `.env.local`

Veja instruções detalhadas em [DEPLOY-INSTRUCOES.md](DEPLOY-INSTRUCOES.md)

## 🌐 Deploy no Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SEU_USUARIO/pc-formatech)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente (ver `.env.example`)
3. Deploy automático!

## 📱 URLs

- **Site:** https://seu-projeto.vercel.app
- **Admin:** https://seu-projeto.vercel.app/admin.html

## 🔒 Segurança

- ✅ Autenticação via Firebase
- ✅ Regras de segurança no Firestore
- ✅ Variáveis de ambiente para credenciais
- ✅ Rate limiting no login
- ✅ HTTPS obrigatório

## 📝 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Autor

PC Formatech - Serviços de Informática

## 📞 Suporte

- WhatsApp: (seu número)
- Instagram: [@pcformatech](https://instagram.com/pcformatech)
- Email: contato@pcformatech.com
