# 📸 Guia de Gerenciamento de Imagens da Tela Inicial

## Como Gerenciar as Imagens do Carrossel

O sistema agora permite que você gerencie as imagens que aparecem no carrossel da tela inicial do site através do painel administrativo.

### 🔐 Acessando o Gerenciador

1. Acesse o painel administrativo: `admin.html`
2. Faça login com sua senha
3. Clique na aba **"Imagens da Tela Inicial"** (ícone de imagens)

### ➕ Adicionar Nova Imagem

1. Clique no botão **"Adicionar Nova Imagem"**
2. Cole a URL da imagem quando solicitado
3. Digite um texto alternativo (descrição) para a imagem
4. A imagem será adicionada ao carrossel automaticamente

### ✏️ Editar Imagem Existente

1. Localize o card da imagem que deseja editar
2. Altere a URL ou o texto alternativo nos campos
3. Clique em **"Salvar"**
4. As alterações serão aplicadas imediatamente

### 🗑️ Remover Imagem

1. Localize o card da imagem que deseja remover
2. Clique em **"Remover"**
3. Confirme a exclusão
4. **Observação:** É necessário ter pelo menos 1 imagem no carrossel

### 🖼️ Onde Encontrar Imagens de Qualidade

**Bancos de Imagens Gratuitos Recomendados:**

- **Unsplash** (https://unsplash.com) - Imagens de alta qualidade
- **Pexels** (https://pexels.com) - Fotos e vídeos gratuitos
- **Pixabay** (https://pixabay.com) - Imagens e ilustrações

**Como obter a URL da imagem:**

1. Escolha uma imagem no site
2. Clique com botão direito na imagem
3. Selecione "Copiar endereço da imagem" ou "Copiar link da imagem"
4. Cole no campo URL do gerenciador

### 💡 Dicas Importantes

- **Tamanho Recomendado:** Imagens com pelo menos 1920x1080 pixels
- **Formato:** JPG ou PNG
- **Tema:** Escolha imagens relacionadas a tecnologia, computadores, workspaces
- **Qualidade:** Prefira imagens de alta resolução para melhor visualização
- **Quantidade:** O carrossel funciona melhor com 5-10 imagens

### ⚡ Aplicando as Mudanças

As alterações são salvas automaticamente e aplicadas na próxima vez que a página inicial for carregada. Não é necessário editar o código HTML manualmente!

**Para ver as mudanças:**
1. Salve as alterações no painel admin
2. Abra o site em uma nova aba ou atualize a página (F5)
3. As novas imagens aparecerão no carrossel automaticamente

### 🔄 Restaurar Imagens Padrão

Se quiser voltar às imagens originais do sistema:

1. Acesse o Console do navegador (F12 → Console)
2. Digite: `localStorage.removeItem('pcformatech_hero_slides')`
3. Pressione Enter
4. Recarregue a página (F5)

---

## Suporte Técnico

Se tiver dúvidas ou problemas, entre em contato pelo WhatsApp: (94) 98430-5772
