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
        
        // "O computador liga?" = Não: aviso de que peça não é com a gente.
        const pcLigaSelect = document.getElementById('pc-liga');
        const avisoNaoLiga = document.getElementById('aviso-nao-liga');
        if (pcLigaSelect && avisoNaoLiga) {
            pcLigaSelect.addEventListener('change', () => {
                avisoNaoLiga.hidden = pcLigaSelect.value !== 'Não';
            });
        }

        // Ao limpar o formulário, some também o que dependia das respostas.
        formatacaoForm.addEventListener('reset', () => {
            if (avisoNaoLiga) avisoNaoLiga.hidden = true;
            const enviado = document.getElementById('form-enviado');
            if (enviado) enviado.hidden = true;
            problemaOutroGrupo.style.display = 'none';
            programasOutrosGrupo.style.display = 'none';
            backupDetalhes.style.display = 'none';
        });

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
            
            
            // Abre o WhatsApp com as respostas e mostra a confirmação na página.
            const enviado = document.getElementById('form-enviado');
            const linkEnviado = document.getElementById('form-enviado-link');
            if (linkEnviado) linkEnviado.href = whatsappURL;
            if (enviado) {
                enviado.hidden = false;
                enviado.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            const whatsappWindow = window.open(whatsappURL, '_blank');
            if (!whatsappWindow) {
                // Janela bloqueada pelo navegador: vai direto para o WhatsApp.
                window.location.href = whatsappURL;
            }
        });
    }
});
