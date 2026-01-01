// ==========================================
// FORMULÁRIO DE FORMATAÇÃO DE COMPUTADOR
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const formatacaoForm = document.getElementById('formatacao-form');
    
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
            const nome = document.getElementById('cliente-nome').value;
            const telefone = document.getElementById('cliente-telefone').value;
            const cidade = document.getElementById('cliente-cidade').value;
            
            // Validar campos obrigatórios básicos
            if (!nome || !telefone || !cidade) {
                alert('Por favor, preencha todos os campos obrigatórios (*)');
                return;
            }
            
            // Coletar informações do computador
            const tipoComputador = document.getElementById('tipo-computador').value;
            const pcLiga = document.getElementById('pc-liga').value;
            const sistemaAtual = document.getElementById('sistema-atual').value;
            
            // Coletar problemas
            const problemasCheckboxes = document.querySelectorAll('input[name="problema[]"]:checked');
            const problemas = Array.from(problemasCheckboxes).map(cb => cb.value);
            const problemaOutro = document.getElementById('problema-outro-texto').value;
            const tempoProblema = document.getElementById('tempo-problema').value;
            
            // Validar pelo menos um problema selecionado
            if (problemas.length === 0) {
                alert('Por favor, selecione pelo menos um problema apresentado');
                return;
            }
            
            // Backup
            const temArquivos = document.querySelector('input[name="tem-arquivos"]:checked')?.value;
            let tiposArquivo = [];
            let localBackupValue = '';
            
            if (temArquivos === 'Sim') {
                const tiposCheckboxes = document.querySelectorAll('input[name="tipo-arquivo[]"]:checked');
                tiposArquivo = Array.from(tiposCheckboxes).map(cb => cb.value);
                localBackupValue = document.getElementById('local-backup').value;
                
                if (!localBackupValue) {
                    alert('Por favor, selecione onde deseja salvar o backup');
                    return;
                }
            }
            
            // Programas
            const programasCheckboxes = document.querySelectorAll('input[name="programa[]"]:checked');
            const programas = Array.from(programasCheckboxes).map(cb => cb.value);
            const programasOutros = document.getElementById('programas-outros-texto').value;
            
            // Senhas e expectativas
            const possuiSenhas = document.getElementById('possui-senhas').value;
            const expectativasCheckboxes = document.querySelectorAll('input[name="expectativa[]"]:checked');
            const expectativas = Array.from(expectativasCheckboxes).map(cb => cb.value);
            const autorizaAvaliacao = document.querySelector('input[name="autoriza-avaliacao"]:checked')?.value;
            
            // Autorização final
            const autorizacaoFinal = document.getElementById('autorizacao-final').checked;
            
            if (!autorizacaoFinal) {
                alert('Você precisa marcar a autorização final para prosseguir');
                return;
            }
            
            // Montar mensagem para WhatsApp
            let message = `🖥️ *FORMULÁRIO DE FORMATAÇÃO*\n\n`;
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `👤 *1. DADOS DO CLIENTE*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Nome: ${nome}\n`;
            message += `• Telefone: ${telefone}\n`;
            message += `• Cidade: ${cidade}\n\n`;
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `💻 *2. INFORMAÇÕES DO COMPUTADOR*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Tipo: ${tipoComputador}\n`;
            message += `• Liga normalmente: ${pcLiga}\n`;
            message += `• Sistema atual: ${sistemaAtual}\n\n`;
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `⚠️ *3. MOTIVO DA FORMATAÇÃO*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Problemas:\n`;
            problemas.forEach(p => {
                message += `  - ${p}\n`;
            });
            if (problemaOutro) {
                message += `  Detalhes: ${problemaOutro}\n`;
            }
            message += `• Tempo do problema: ${tempoProblema}\n\n`;
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `💾 *4. BACKUP DE ARQUIVOS*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Tem arquivos importantes: ${temArquivos}\n`;
            if (temArquivos === 'Sim') {
                message += `• Tipos de arquivos:\n`;
                tiposArquivo.forEach(t => {
                    message += `  - ${t}\n`;
                });
                message += `• Local do backup: ${localBackupValue}\n`;
            }
            message += `\n`;
            
            if (programas.length > 0) {
                message += `━━━━━━━━━━━━━━━━━━━━\n`;
                message += `📥 *5. PROGRAMAS DESEJADOS*\n`;
                message += `━━━━━━━━━━━━━━━━━━━━\n`;
                programas.forEach(p => {
                    message += `• ${p}\n`;
                });
                if (programasOutros) {
                    message += `• Outros: ${programasOutros}\n`;
                }
                message += `\n`;
            }
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `🔐 *6. SENHAS E ACESSOS*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Possui senhas: ${possuiSenhas}\n\n`;
            
            if (expectativas.length > 0) {
                message += `━━━━━━━━━━━━━━━━━━━━\n`;
                message += `🎯 *7. EXPECTATIVAS*\n`;
                message += `━━━━━━━━━━━━━━━━━━━━\n`;
                expectativas.forEach(e => {
                    message += `• ${e}\n`;
                });
                message += `\n`;
            }
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `🔧 *8. AVALIAÇÃO TÉCNICA*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `• Autoriza avaliação: ${autorizaAvaliacao}\n\n`;
            
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `✅ *9. AUTORIZAÇÃO*\n`;
            message += `━━━━━━━━━━━━━━━━━━━━\n`;
            message += `Cliente AUTORIZOU a formatação conforme informações fornecidas.\n`;
            
            // Número do WhatsApp
            const whatsappNumber = '5594984305772';
            
            // Codificar mensagem para URL
            const encodedMessage = encodeURIComponent(message);
            
            // Montar URL do WhatsApp
            const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
            
            // Abrir WhatsApp em nova aba
            window.open(whatsappURL, '_blank');
            
            // Mostrar mensagem de sucesso
            alert('✅ Formulário preenchido com sucesso!\n\nVocê será redirecionado para o WhatsApp para enviar as informações.');
            
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
