// ==========================================
// FORMULÁRIO DE FORMATAÇÃO DE COMPUTADOR
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const formatacaoForm = document.getElementById('formatacao-form');

    // Este script também é carregado no index.html, onde o formulário não existe.
    // Sem esta saída antecipada ele logava "Formulário encontrado: null" a cada visita.
    if (formatacaoForm) {
        
        // Controles de visibilidade condicionais
        
        // Mostrar campo "Outro problema" quando checkbox marcado
        const problemaOutroCheck = document.getElementById('problema-outro-check');
        const problemaOutroGrupo = document.getElementById('problema-outro-grupo');
        
        if (problemaOutroCheck) {
            problemaOutroCheck.addEventListener('change', function() {
                if (this.checked) {
                    problemaOutroGrupo.style.display = 'block';
                } else {
                    problemaOutroGrupo.style.display = 'none';
                    document.getElementById('problema-outro-texto').value = '';
                }
            });
        }
        
        // Mostrar campo "Outros programas" quando checkbox marcado
        const programasOutrosCheck = document.getElementById('programas-outros-check');
        const programasOutrosGrupo = document.getElementById('programas-outros-grupo');
        
        if (programasOutrosCheck) {
            programasOutrosCheck.addEventListener('change', function() {
                if (this.checked) {
                    programasOutrosGrupo.style.display = 'block';
                } else {
                    programasOutrosGrupo.style.display = 'none';
                    document.getElementById('programas-outros-texto').value = '';
                }
            });
        }
        
        // Mostrar detalhes de backup quando selecionar "Sim" em arquivos importantes
        const arquivosSim = document.getElementById('arquivos-sim');
        const arquivosNao = document.getElementById('arquivos-nao');
        const backupDetalhes = document.getElementById('backup-detalhes');
        const localBackup = document.getElementById('local-backup');
        
        if (arquivosSim && arquivosNao) {
            arquivosSim.addEventListener('change', function() {
                if (this.checked) {
                    backupDetalhes.style.display = 'block';
                    localBackup.setAttribute('required', 'required');
                }
            });
            
            arquivosNao.addEventListener('change', function() {
                if (this.checked) {
                    backupDetalhes.style.display = 'none';
                    localBackup.removeAttribute('required');
                    // Limpar seleções de backup
                    document.querySelectorAll('input[name="tipo-arquivo[]"]').forEach(cb => cb.checked = false);
                    localBackup.value = '';
                }
            });
        }
        
        // Máscara para telefone
        const clienteTelefone = document.getElementById('cliente-telefone');
        if (clienteTelefone) {
            clienteTelefone.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                
                if (value.length > 2) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                }
                if (value.length > 10) {
                    value = `${value.slice(0, 10)}-${value.slice(10)}`;
                }
                
                e.target.value = value;
            });
        }
        
        // Processar envio do formulário
        formatacaoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            
            // Coletar dados básicos
            const nome = document.getElementById('cliente-nome')?.value || '';
            const telefone = document.getElementById('cliente-telefone')?.value || '';
            const cidade = document.getElementById('cliente-cidade')?.value || '';
            
            
            // Validar campos obrigatórios básicos
            if (!nome || !telefone || !cidade) {
                alert('Por favor, preencha todos os campos obrigatórios (*)');
                return;
            }
            
            // Coletar informações do computador
            const tipoComputador = document.getElementById('tipo-computador')?.value || '';
            const pcLiga = document.getElementById('pc-liga')?.value || '';
            const sistemaAtual = document.getElementById('sistema-atual')?.value || '';
            
            // Coletar problemas
            const problemasCheckboxes = document.querySelectorAll('input[name="problema[]"]:checked');
            const problemas = Array.from(problemasCheckboxes).map(cb => cb.value);
            const problemaOutro = document.getElementById('problema-outro-texto')?.value || '';
            const tempoProblema = document.getElementById('tempo-problema')?.value || '';
            
            // Validar pelo menos um problema selecionado
            if (problemas.length === 0) {
                alert('Por favor, selecione pelo menos um problema apresentado');
                return;
            }
            
            // Backup
            const temArquivos = document.querySelector('input[name="tem-arquivos"]:checked')?.value || 'Não';
            let tiposArquivo = [];
            let localBackupValue = '';
            
            if (temArquivos === 'Sim') {
                const tiposCheckboxes = document.querySelectorAll('input[name="tipo-arquivo[]"]:checked');
                tiposArquivo = Array.from(tiposCheckboxes).map(cb => cb.value);
                localBackupValue = document.getElementById('local-backup')?.value || '';
                
                if (!localBackupValue) {
                    alert('Por favor, selecione onde deseja salvar o backup');
                    return;
                }
            }
            
            // Programas
            const programasCheckboxes = document.querySelectorAll('input[name="programa[]"]:checked');
            const programas = Array.from(programasCheckboxes).map(cb => cb.value);
            const programasOutros = document.getElementById('programas-outros-texto')?.value || '';
            
            // Senhas e expectativas
            const possuiSenhas = document.getElementById('possui-senhas')?.value || '';
            const expectativasCheckboxes = document.querySelectorAll('input[name="expectativa[]"]:checked');
            const expectativas = Array.from(expectativasCheckboxes).map(cb => cb.value);
            const autorizaAvaliacao = document.querySelector('input[name="autoriza-avaliacao"]:checked')?.value || '';
            
            // Autorização final
            const autorizacaoFinal = document.getElementById('autorizacao-final')?.checked || false;
            
            if (!autorizacaoFinal) {
                alert('Você precisa marcar a autorização final para prosseguir');
                return;
            }
            
            
            // Montar mensagem para WhatsApp
            let message = `🖥️ *SOLICITAÇÃO DE FORMATAÇÃO - PC FORMATECH*\n`;
            message += `═══════════════════════════════\n\n`;
            
            message += `👤 *DADOS DO CLIENTE*\n`;
            message += `┌─────────────────────────\n`;
            message += `│ Nome: *${nome}*\n`;
            message += `│ Telefone: ${telefone}\n`;
            message += `│ Cidade: ${cidade}\n`;
            message += `└─────────────────────────\n\n`;
            
            message += `💻 *INFORMAÇÕES DO EQUIPAMENTO*\n`;
            message += `┌─────────────────────────\n`;
            message += `│ Tipo: ${tipoComputador}\n`;
            message += `│ Liga: ${pcLiga}\n`;
            message += `│ Sistema Atual: ${sistemaAtual}\n`;
            message += `└─────────────────────────\n\n`;
            
            message += `⚠️ *PROBLEMAS IDENTIFICADOS*\n`;
            message += `┌─────────────────────────\n`;
            problemas.forEach((p, index) => {
                message += `│ ${index + 1}. ${p}\n`;
            });
            if (problemaOutro) {
                message += `│ 💬 Obs: ${problemaOutro}\n`;
            }
            message += `│ ⏱️ Tempo: ${tempoProblema}\n`;
            message += `└─────────────────────────\n\n`;
            
            message += `💾 *BACKUP DE DADOS*\n`;
            message += `┌─────────────────────────\n`;
            message += `│ Arquivos Importantes: ${temArquivos}\n`;
            if (temArquivos === 'Sim') {
                message += `│ 📁 Tipos:\n`;
                tiposArquivo.forEach(t => {
                    message += `│   • ${t}\n`;
                });
                message += `│ 📍 Local: ${localBackupValue}\n`;
            }
            message += `└─────────────────────────\n\n`;
            
            if (programas.length > 0) {
                message += `📥 *PROGRAMAS SOLICITADOS*\n`;
                message += `┌─────────────────────────\n`;
                programas.forEach((p, index) => {
                    message += `│ ${index + 1}. ${p}\n`;
                });
                if (programasOutros) {
                    message += `│ ➕ Outros: ${programasOutros}\n`;
                }
                message += `└─────────────────────────\n\n`;
            }
            
            message += `🔐 *INFORMAÇÕES ADICIONAIS*\n`;
            message += `┌─────────────────────────\n`;
            message += `│ Possui Senhas: ${possuiSenhas}\n`;
            
            if (expectativas.length > 0) {
                message += `│ 🎯 Expectativas:\n`;
                expectativas.forEach(e => {
                    message += `│   • ${e}\n`;
                });
            }
            message += `│ 🔧 Avaliação Técnica: ${autorizaAvaliacao}\n`;
            message += `└─────────────────────────\n\n`;
            
            message += `✅ *AUTORIZAÇÃO CONFIRMADA*\n`;
            message += `Cliente autorizou a formatação do equipamento conforme especificações acima.\n\n`;
            message += `═══════════════════════════════\n`;
            message += `🚀 *Aguardando atendimento!*`;
            
            // Número do WhatsApp
            const whatsappNumber = '5594984305772';
            
            // Codificar mensagem para URL
            const encodedMessage = encodeURIComponent(message);
            
            // Montar URL do WhatsApp
            const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
            
            
            // Abrir WhatsApp IMEDIATAMENTE
            const whatsappWindow = window.open(whatsappURL, '_blank');
            
            if (!whatsappWindow) {
                // Se o popup foi bloqueado, tentar redirecionamento direto
                console.warn('Popup bloqueado, tentando redirecionamento...');
                window.location.href = whatsappURL;
            }
            
            // ====== CADASTRO AUTOMÁTICO NO SISTEMA (APÓS ABRIR WHATSAPP) ======
            
            try {
                // 1. Cadastrar cliente automaticamente
                const clientes = JSON.parse(localStorage.getItem('pcformatech_clients') || '[]');
                
                // Verificar se cliente já existe (por telefone)
                const clienteExistente = clientes.find(c => c.phone === telefone);
                
                let clienteId;
            
                if (!clienteExistente) {
                    // Criar novo cliente
                    const novoCliente = {
                        id: Date.now(),
                        name: nome,
                        phone: telefone,
                        email: '',
                        address: cidade,
                        createdAt: new Date().toISOString()
                    };
                    
                    clientes.push(novoCliente);
                    localStorage.setItem('pcformatech_clients', JSON.stringify(clientes));
                    clienteId = novoCliente.id;
                } else {
                    clienteId = clienteExistente.id;
                }
            
            // 2. Criar orçamento/serviço automaticamente
            const budgets = JSON.parse(localStorage.getItem('pcformatech_budgets') || '[]');
            
            // Função para gerar número sequencial do orçamento
            function getNextBudgetNumber() {
                if (budgets.length === 0) {
                    const now = new Date();
                    const year = now.getFullYear().toString().slice(-2);
                    return `0001-${year}`;
                }
                
                const lastBudget = budgets[budgets.length - 1];
                const lastNumber = parseInt(lastBudget.budgetNumber.split('-')[0]);
                const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
                const now = new Date();
                const year = now.getFullYear().toString().slice(-2);
                
                return `${nextNumber}-${year}`;
            }
            
            // Preparar serviços para o orçamento
            const servicosParaOrcamento = [];
            
            // Adicionar formatação como serviço principal
            servicosParaOrcamento.push({
                description: 'Formatação de Computador',
                quantity: 1,
                unitPrice: 0, // Preço será definido no admin
                total: 0
            });
            
            // Adicionar outros problemas como serviços
            if (problemas.length > 0) {
                problemas.forEach(prob => {
                    servicosParaOrcamento.push({
                        description: `Reparo: ${prob}`,
                        quantity: 1,
                        unitPrice: 0,
                        total: 0
                    });
                });
            }
            
            // Calcular data de vencimento da garantia (90 dias)
            const dataAtual = new Date();
            const dataGarantia = new Date(dataAtual);
            dataGarantia.setDate(dataGarantia.getDate() + 90);
            
            const diaGarantia = String(dataGarantia.getDate()).padStart(2, '0');
            const mesGarantia = String(dataGarantia.getMonth() + 1).padStart(2, '0');
            const anoGarantia = dataGarantia.getFullYear();
            const dataGarantiaFormatada = `${diaGarantia}/${mesGarantia}/${anoGarantia}`;
            
            // Criar orçamento
            const novoOrcamento = {
                id: Date.now(),
                budgetNumber: getNextBudgetNumber(),
                clientId: clienteId,
                clientName: nome,
                date: new Date().toISOString().split('T')[0],
                services: servicosParaOrcamento,
                products: [],
                defect: problemas.join(', ') + (problemaOutro ? ` - ${problemaOutro}` : ''),
                diagnosis: 'Aguardando avaliação técnica',
                solution: programas.length > 0 ? `Instalação: ${programas.join(', ')}` : '',
                warranty: `90 dias para formatação (válido até ${dataGarantiaFormatada})`,
                observations: `Backup: ${temArquivos}${temArquivos === 'Sim' ? ` (${tiposArquivo.join(', ')})` : ''}\nExpectativas: ${expectativas.join(', ')}\nPossui senhas: ${possuiSenhas}`,
                total: 0,
                status: 'Pendente',
                createdAt: new Date().toISOString()
            };
            
            budgets.push(novoOrcamento);
            localStorage.setItem('pcformatech_budgets', JSON.stringify(budgets));
            
                // Mostrar mensagem de sucesso
                alert(String.fromCodePoint(0x2705) + ' Formulário preenchido com sucesso!\n\n' + 
                      String.fromCodePoint(0x1F4DD) + ' Cliente cadastrado no sistema!\n' +
                      String.fromCodePoint(0x1F4CB) + ' Orçamento Nº ' + novoOrcamento.budgetNumber + ' criado!');
                      
            } catch (cadastroError) {
                console.error('Erro ao cadastrar no sistema:', cadastroError);
                // Não interrompe o fluxo - WhatsApp já foi aberto
            }
            
            // ====== FIM DO CADASTRO AUTOMÁTICO ======
            
            // Limpar formulário após pequeno delay
            setTimeout(() => {
                formatacaoForm.reset();
                problemaOutroGrupo.style.display = 'none';
                programasOutrosGrupo.style.display = 'none';
                backupDetalhes.style.display = 'none';
            }, 1000);
        });
    }
});
