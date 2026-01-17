# 📋 Sistema de Gestão de Serviços - PC Formatech

## 🎯 Visão Geral

Sistema completo de gerenciamento de clientes e serviços integrado ao painel administrativo da PC Formatech. Permite cadastro de clientes, registro de serviços, acompanhamento de status e integração direta com WhatsApp.

---

## 🔑 Acesso ao Sistema

**URL:** `admin.html`
**Senha padrão:** `pcformatech2026`

---

## 📊 Dashboard

Ao fazer login, você verá 4 indicadores principais:

- **Total de Clientes** - Quantidade de clientes cadastrados
- **Serviços Realizados** - Total de serviços registrados
- **Serviços Pendentes** - Serviços em andamento ou pendentes
- **Receita Total** - Soma dos serviços concluídos

---

## 👥 Gestão de Clientes

### Cadastrar Novo Cliente

1. Clique na aba **"Clientes"**
2. Preencha o formulário com os dados:
   - **Nome Completo** * (obrigatório)
   - **WhatsApp** * (obrigatório) - formato: (00) 00000-0000
   - **E-mail** (opcional)
   - **CPF** (opcional) - formato automático: 000.000.000-00
   - **Endereço** (opcional)
   - **Cidade** (opcional)
3. Clique em **"Cadastrar Cliente"**

### Buscar Cliente

Use a barra de pesquisa para localizar clientes por:
- Nome
- Telefone
- CPF

### Ações Disponíveis

Para cada cliente você pode:

- 👁️ **Ver** - Visualizar detalhes completos e histórico de serviços
- ✏️ **Editar** - Modificar dados cadastrais
- 💬 **WhatsApp** - Abrir conversa direta no WhatsApp (com mensagem pré-formatada)
- 🗑️ **Excluir** - Remover cliente e todo seu histórico

---

## 🛠️ Gestão de Serviços

### Adicionar Serviço a um Cliente

**Método 1 - Via Detalhes do Cliente:**
1. Clique em **"Ver"** no cliente desejado
2. Clique em **"Adicionar Novo Serviço"**
3. Preencha:
   - **Tipo de Serviço** - Escolha da lista configurada
   - **Descrição/Observações** - Detalhes específicos
   - **Valor** - Preço sugerido automaticamente (pode alterar)
   - **Status** - Pendente, Em Andamento, Concluído ou Cancelado
4. Clique em **"Adicionar Serviço"**

**Método 2 - Via Aba Serviços:**
1. Clique na aba **"Serviços"**
2. Busque o cliente
3. Clique em **"Ver Detalhes Completos"**
4. Siga os mesmos passos acima

### Status de Serviços

- 🟡 **Pendente** - Serviço aguardando início
- 🔵 **Em Andamento** - Serviço sendo executado
- 🟢 **Concluído** - Serviço finalizado (conta na receita)
- 🔴 **Cancelado** - Serviço cancelado

### Editar Status de Serviço

1. Abra os detalhes do cliente
2. Localize o serviço no histórico
3. Clique em **"Editar Status"**
4. Escolha o novo status:
   - 1 - Pendente
   - 2 - Em Andamento
   - 3 - Concluído
   - 4 - Cancelado

### Remover Serviço

1. Abra os detalhes do cliente
2. Localize o serviço no histórico
3. Clique em **"Remover"**
4. Confirme a exclusão

---

## 💰 Configuração de Preços

Na aba **"Preços"**, você pode ajustar:

### Para cada serviço:
- Nome do Serviço
- Preço padrão (R$)
- Descrição

### Serviços Disponíveis:
1. Formatação de Computadores
2. Instalação de Programas
3. Proteção e Segurança
4. Manutenção Preventiva
5. Instalação de Drivers
6. Backup de Dados
7. Atendimento Remoto (desconto configurável)

**Importante:** As alterações de preço afetam apenas novos serviços. Serviços já registrados mantêm o valor original.

---

## 💬 Integração com WhatsApp

### Envio Automático

Ao clicar no botão **WhatsApp** de um cliente:
1. Abre automaticamente o WhatsApp Web/App
2. Seleciona o contato do cliente
3. Pré-preenche mensagem: 
   > "Olá [Nome]! Aqui é da PC Formatech. Como posso ajudá-lo(a) hoje?"

### Uso Recomendado

- **Confirmação de Agendamento** - Após cadastrar serviço
- **Atualização de Status** - Informar início/conclusão
- **Solicitação de Informações** - Dados faltantes
- **Follow-up** - Pós-atendimento

---

## 📈 Fluxo de Trabalho Recomendado

### 1. Cliente Solicita Serviço (WhatsApp/Telefone)
   - Anote: Nome, telefone e serviço desejado

### 2. Cadastre no Sistema
   - Vá em "Clientes"
   - Preencha dados básicos
   - Cadastre o cliente

### 3. Registre o Serviço
   - Abra detalhes do cliente
   - Adicione o serviço solicitado
   - Status: **Pendente**

### 4. Confirme pelo WhatsApp
   - Clique no botão WhatsApp
   - Envie confirmação de agendamento

### 5. Atualize o Status
   - Ao iniciar: mude para **Em Andamento**
   - Ao concluir: mude para **Concluído**

### 6. Acompanhe no Dashboard
   - Visualize estatísticas atualizadas
   - Monitore serviços pendentes

---

## 💾 Armazenamento de Dados

Todos os dados são salvos no **localStorage** do navegador:

- **Clientes:** `pcformatech_clients`
- **Serviços/Preços:** `pcformatech_services`

### Backup Manual

Para fazer backup dos dados:

```javascript
// Abra o Console do navegador (F12) e execute:

// Exportar dados
const backup = {
  clients: localStorage.getItem('pcformatech_clients'),
  services: localStorage.getItem('pcformatech_services')
};
console.log(JSON.stringify(backup));
// Copie e salve o resultado em um arquivo .txt

// Importar dados (cole o JSON no lugar de 'SEU_BACKUP_AQUI')
const restore = SEU_BACKUP_AQUI;
localStorage.setItem('pcformatech_clients', restore.clients);
localStorage.setItem('pcformatech_services', restore.services);
location.reload();
```

---

## 🔒 Segurança

### Alterar Senha de Acesso

1. Abra o arquivo `admin.html` em um editor de texto
2. Localize a linha (aproximadamente linha 205):
   ```javascript
   const ADMIN_PASSWORD = 'pcformatech2026';
   ```
3. Altere `'pcformatech2026'` para sua nova senha
4. Salve o arquivo

### Recomendações:
- Não compartilhe a senha do painel admin
- Faça backups regulares dos dados
- Use uma senha forte e única

---

## 📱 Responsividade

O sistema é otimizado para:
- 💻 Desktop
- 📱 Tablets
- 📱 Smartphones

Você pode gerenciar clientes e serviços de qualquer dispositivo!

---

## 🆘 Suporte e Dúvidas

### Problemas Comuns

**Dados não aparecem após cadastro:**
- Verifique se está logado
- Recarregue a página (F5)

**WhatsApp não abre:**
- Verifique se o número está correto
- Certifique-se que tem WhatsApp instalado

**Perdeu os dados:**
- Verifique se não limpou o cache do navegador
- Restaure de um backup (se tiver)

---

## 🚀 Próximas Funcionalidades (Futuro)

- [ ] Exportação de relatórios em PDF
- [ ] Gráficos de desempenho
- [ ] Sistema de agendamento
- [ ] Notificações automáticas
- [ ] Integração com banco de dados externo

---

## 📝 Changelog

### Versão 2.0 (Janeiro 2026)
- ✅ Sistema completo de gestão de clientes
- ✅ Registro de serviços por cliente
- ✅ Controle de status de serviços
- ✅ Integração com WhatsApp
- ✅ Dashboard com estatísticas
- ✅ Sistema de busca avançada
- ✅ Histórico completo de atendimentos

### Versão 1.0
- Gestão básica de preços de serviços

---

**Desenvolvido para PC Formatech** 🖥️✨
*Gestão profissional de serviços de informática*
