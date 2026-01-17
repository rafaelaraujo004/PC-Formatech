# 📄 Sistema de Orçamentos e Laudos Técnicos - PC Formatech

## 🎯 Novos Recursos Implementados

### ✅ Funcionalidades Adicionadas

1. **Gestão de Produtos** 📦
   - Cadastro completo de produtos
   - Controle de estoque
   - Categorização
   - Preços individuais

2. **Orçamentos e Laudos Técnicos** 📋
   - Criação de orçamentos profissionais
   - Geração de laudos técnicos
   - Numeração automática sequencial
   - Exportação em PDF

3. **Geração de PDF** 📑
   - Layout profissional (modelo do anexo)
   - Serviços e produtos separados
   - Campos: Defeito, Laudo, Solução, Observações
   - Garantia configurável
   - Logo e dados da empresa

---

## 📦 GESTÃO DE PRODUTOS

### Como Cadastrar Produtos

1. Acesse a aba **"Produtos"**
2. Preencha os campos:
   - **Nome do Produto** * (obrigatório)
   - **Preço (R$)** * (obrigatório)
   - **Quantidade em Estoque** (opcional, padrão: 0)
   - **Categoria** (Hardware, Software, Periféricos, Acessórios, Outros)
   - **Descrição** (opcional)
3. Clique em **"Cadastrar Produto"**

### Buscar Produtos

Use a barra de busca para encontrar produtos por:
- Nome do produto
- Categoria

### Ações Disponíveis

- ✏️ **Editar** - Alterar dados do produto
- 🗑️ **Excluir** - Remover produto do cadastro

### Exemplos de Produtos

```
Nome: SSD Knup 128GB
Preço: R$ 207,87
Estoque: 5 unidades
Categoria: Hardware
Descrição: SSD SATA III 2.5" 128GB
```

```
Nome: Licença Office 2021
Preço: R$ 130,00
Estoque: 10 unidades
Categoria: Software
Descrição: Microsoft Office Professional Plus 2021
```

---

## 📋 ORÇAMENTOS E LAUDOS TÉCNICOS

### Como Criar um Orçamento/Laudo

1. Acesse a aba **"Orçamentos/Laudos"**
2. Clique em **"Novo Orçamento/Laudo"**
3. Preencha os dados básicos:
   - **Cliente** * - Selecione da lista
   - **Data** * - Data do orçamento/laudo
   - **Tipo** * - Orçamento ou Laudo Técnico

4. **Adicione Serviços:**
   - Clique em **"Adicionar Serviço"**
   - Selecione o tipo de serviço
   - O preço será preenchido automaticamente
   - Ajuste quantidade se necessário
   - Repita para adicionar mais serviços

5. **Adicione Produtos:**
   - Clique em **"Adicionar Produto"**
   - Selecione o produto da lista
   - O preço será preenchido automaticamente
   - Ajuste quantidade se necessário
   - Repita para adicionar mais produtos

6. **Preencha os Detalhes (Para Laudos):**
   - **Defeito Relatado** - Problema informado pelo cliente
   - **Laudo Técnico** - Diagnóstico detalhado
   - **Solução Aplicada** - O que foi feito para resolver
   - **Observações** - Informações adicionais
   - **Garantia** - Ex: "3 Meses"

7. **Salve e Gere o PDF:**
   - Clique em **"Salvar Orçamento/Laudo"**
   - Clique em **"Gerar PDF"** para baixar

### Numeração Automática

Os laudos são numerados automaticamente no formato:
- **0001-25** (primeiro laudo de 2025)
- **0002-25** (segundo laudo de 2025)
- **0013-25** (décimo terceiro laudo)

E assim sucessivamente. O número é sequencial e não se repete.

### Tipos de Documento

#### 📊 Orçamento
- Usado para apresentar preços ao cliente
- Proposta comercial
- Cliente ainda não aprovou o serviço

#### 📋 Laudo Técnico
- Serviço já realizado
- Diagnóstico completo
- Solução aplicada
- Documento final entregue ao cliente

---

## 📑 GERAÇÃO DE PDF

### Formato do Documento

O PDF gerado segue o modelo profissional com:

#### Cabeçalho
```
PC Formatech
62.712.268/0001-03
Rodovia PA-160 - Serra Dourada II
68352-193 - Canaã dos Carajas/PA

contatopcformatech@gmail.com
```

#### Dados do Cliente
```
Dados do Cliente
João Vítor                           Data: 04/12/2025
```

#### Número do Laudo
```
LAUDO TÉCNICO Nº 0013-25
```

#### Tabela de Serviços
| Nome | Quantidade | Unidade | Valor Unitário | Valor Total |
|------|-----------|---------|----------------|-------------|
| Formatação e Instalação Office | 1 | un | R$ 130,00 | R$ 130,00 |

**Total Serviços: R$ 130,00**

#### Tabela de Produtos
| Nome | Quantidade | Unidade | Valor Unitário | Valor Total |
|------|-----------|---------|----------------|-------------|
| SSD Knup 128GB | 1 | un | R$ 207,87 | R$ 207,87 |

**Total Produtos: R$ 207,87**

#### Totais
```
Subtotal: R$ 337,87
Total: R$ 337,87
```

#### Seções Detalhadas
- **Defeito** - Problema inicial
- **Laudo** - Diagnóstico
- **Solução** - Resolução aplicada
- **Observações** - Notas adicionais
- **Garantia: 3 Meses**

#### Rodapé
```
_____________________________
PC Formatech

instagram: @pcformatech
```

---

## 🔄 FLUXO DE TRABALHO COMPLETO

### Cenário 1: Criar Orçamento para Cliente

```
1. Cliente solicita orçamento via WhatsApp
   ↓
2. Cadastre o cliente (se ainda não existir)
   ↓
3. Vá em "Orçamentos/Laudos" → "Novo Orçamento/Laudo"
   ↓
4. Selecione o cliente e tipo "Orçamento"
   ↓
5. Adicione serviços e/ou produtos necessários
   ↓
6. Clique em "Gerar PDF"
   ↓
7. Envie o PDF pelo WhatsApp para o cliente
   ↓
8. Cliente aprova ou não
```

### Cenário 2: Criar Laudo Técnico Após Serviço

```
1. Serviço concluído
   ↓
2. Vá em "Orçamentos/Laudos" → "Novo Orçamento/Laudo"
   ↓
3. Selecione o cliente e tipo "Laudo Técnico"
   ↓
4. Adicione serviços realizados
   ↓
5. Adicione produtos utilizados/vendidos
   ↓
6. Preencha:
   - Defeito (o problema original)
   - Laudo (o que você diagnosticou)
   - Solução (o que foi feito)
   - Observações (informações extras)
   - Garantia (período de garantia)
   ↓
7. Clique em "Salvar" e depois "Gerar PDF"
   ↓
8. Entregue o PDF ao cliente junto com o computador
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Orçamento Simples

**Cliente:** João Silva  
**Tipo:** Orçamento  
**Data:** 03/01/2026  

**Serviços:**
- Formatação de Computadores - R$ 80,00
- Instalação de Programas - R$ 50,00

**Produtos:** (nenhum)

**Total:** R$ 130,00

---

### Exemplo 2: Laudo Técnico Completo

**Cliente:** Maria Santos  
**Tipo:** Laudo Técnico  
**Data:** 03/01/2026  
**Número:** 0014-25  

**Serviços:**
- Formatação de Computadores - R$ 80,00
- Instalação de Drivers - R$ 40,00

**Produtos:**
- SSD Kingston 240GB - R$ 250,00
- Pasta Térmica - R$ 15,00

**Defeito Relatado:**  
"Computador muito lento, travando constantemente e fazendo barulhos estranhos."

**Laudo Técnico:**  
"Após análise, constatou-se HD com setores defeituosos e processador com aquecimento excessivo devido à pasta térmica ressecada."

**Solução Aplicada:**  
"Substituição do HD por SSD, troca de pasta térmica, formatação completa do sistema e instalação de todos os drivers atualizados."

**Observações:**  
"Cliente foi orientado sobre manutenção preventiva a cada 6 meses."

**Garantia:** 3 Meses

**Total:** R$ 385,00

---

## 📊 RECURSOS AVANÇADOS

### Edição de Valores

Mesmo que o preço seja preenchido automaticamente, você pode alterá-lo manualmente:
- Descontos especiais
- Ajustes por negociação
- Valores customizados

### Múltiplos Itens

Adicione quantos serviços e produtos precisar:
- Sem limite de itens
- Cálculo automático do total
- Tabelas organizadas no PDF

### Busca de Orçamentos/Laudos

Encontre rapidamente por:
- Nome do cliente
- Número do laudo

### Ações Disponíveis

Para cada orçamento/laudo:
- 👁️ **Ver** - Visualizar/editar detalhes
- 📄 **PDF** - Gerar PDF novamente
- 🗑️ **Excluir** - Remover do sistema

---

## 💾 ARMAZENAMENTO

### Dados Salvos no localStorage

- **`pcformatech_products`** - Cadastro de produtos
- **`pcformatech_budgets`** - Orçamentos e laudos

### Backup Recomendado

Faça backup regularmente dos dados do navegador ou exporte para um arquivo JSON.

---

## 🎨 PERSONALIZAÇÃO DO PDF

### Dados da Empresa

Para alterar os dados que aparecem no PDF:

1. Abra `admin.html` em um editor de texto
2. Procure pela função `generatePDFDocument`
3. Altere as informações:

```javascript
doc.text('PC Formatech', 105, 20, { align: 'center' });
doc.text('SEU CNPJ AQUI', 105, 26, { align: 'center' });
doc.text('SEU ENDEREÇO AQUI', 105, 31, { align: 'center' });
doc.text('SEU CEP E CIDADE AQUI', 105, 36, { align: 'center' });
doc.text('SEU EMAIL AQUI', 190, 20, { align: 'right' });
```

---

## 📱 INTEGRAÇÃO COM WHATSAPP

### Enviar PDF pelo WhatsApp

1. Gere o PDF (será baixado no seu computador)
2. Abra o WhatsApp do cliente (botão na lista de clientes)
3. Anexe o PDF gerado
4. Envie ao cliente

### Mensagem Sugerida

```
Olá [Nome do Cliente]! 

Segue em anexo o orçamento/laudo técnico do seu computador.

Número do documento: [Número do Laudo]
Total: R$ [Valor]

Qualquer dúvida, estou à disposição!

PC Formatech
```

---

## 🔒 CONTROLE DE ESTOQUE

### Atualização Automática

**IMPORTANTE:** O sistema NÃO atualiza o estoque automaticamente quando você usa produtos em orçamentos/laudos.

### Atualização Manual

Quando vender/usar um produto:
1. Vá na aba "Produtos"
2. Clique em "Editar" no produto
3. Ajuste a "Quantidade em Estoque"
4. Salve

**Exemplo:**
- SSD tinha 10 unidades
- Usou 1 no laudo do cliente
- Edite e coloque 9 unidades

---

## 📈 RELATÓRIOS E ESTATÍSTICAS

### Dashboard

O dashboard mostra:
- Total de clientes
- Total de serviços
- Serviços pendentes
- Receita total

**Nota:** Os orçamentos/laudos NÃO afetam automaticamente essas estatísticas. São dados separados.

---

## 🆘 PERGUNTAS FREQUENTES

### Como criar um orçamento sem produtos?

Simples! Adicione apenas serviços e não clique em "Adicionar Produto".

### Como criar um laudo sem serviços?

Adicione apenas produtos. Você pode deixar a seção de serviços vazia.

### Posso editar um orçamento/laudo depois de criado?

Sim! Clique em "Ver" na lista e faça as alterações. Depois clique em "Salvar".

### O número do laudo pode ser alterado?

Não. A numeração é automática e sequencial para evitar duplicidades.

### Posso ter mais de um orçamento para o mesmo cliente?

Sim! Pode criar quantos quiser para cada cliente.

### Como imprimir o PDF?

Após gerar o PDF, abra o arquivo e use Ctrl+P (Windows) ou Cmd+P (Mac).

---

## 🎯 DICAS DE USO

### ✅ Boas Práticas

1. **Seja Detalhado nos Laudos**
   - Descreva bem o defeito
   - Explique o diagnóstico
   - Detalhe a solução

2. **Mantenha Produtos Atualizados**
   - Cadastre novos produtos quando adquirir
   - Atualize preços regularmente
   - Monitore o estoque

3. **Use Garantia Padrão**
   - Defina um período de garantia consistente
   - Ex: "3 Meses" para todos os serviços

4. **Organize por Tipo**
   - Use "Orçamento" para propostas
   - Use "Laudo" para trabalhos concluídos

5. **Backup Regular**
   - Exporte seus dados periodicamente
   - Salve os PDFs gerados

### ⚠️ Evite

- ❌ Criar orçamento sem selecionar cliente
- ❌ Deixar campos importantes em branco nos laudos
- ❌ Esquecer de gerar o PDF antes de fechar
- ❌ Deletar orçamentos antigos (mantenha histórico)

---

## 🚀 PRÓXIMOS PASSOS

Após dominar o sistema básico:

1. ✅ Configure seus produtos principais
2. ✅ Crie templates de serviços comuns
3. ✅ Defina padrões de garantia
4. ✅ Personalize os dados da empresa no PDF
5. ✅ Faça backup dos dados

---

## 📝 ATALHOS RÁPIDOS

| Ação | Caminho |
|------|---------|
| Novo Produto | Produtos → Preencher Form → Cadastrar |
| Novo Orçamento | Orçamentos/Laudos → Novo → Preencher → Salvar |
| Gerar PDF | Abrir Orçamento → Gerar PDF |
| Buscar Laudo | Orçamentos/Laudos → Buscar |
| Editar Produto | Produtos → Editar → Modificar → Salvar |

---

**Desenvolvido para PC Formatech** 🖥️📄  
*Sistema Profissional de Orçamentos e Laudos Técnicos*

Versão 2.1 - Janeiro 2026
