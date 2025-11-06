document.addEventListener('DOMContentLoaded', function() {
    // Botões para abrir os modais
    const serviceButtons = document.querySelectorAll('.service-details-btn');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Mensagens personalizadas para cada serviço
    const serviceMessages = {
        'formatacao': `Olá! Gostaria de solicitar uma formatação do meu computador. 
• Preciso de um serviço completo com backup dos meus arquivos
• Instalação do Windows atualizado
• Pacote Office e programas essenciais
Podem me ajudar?`,
        
        'programas': `Olá! Gostaria de fazer a instalação de programas no meu computador.
• Preciso dos programas essenciais
• Pacote Office atualizado
• Programas específicos para meu trabalho
Podem me auxiliar com isso?`,
        
        'seguranca': `Olá! Gostaria de melhorar a segurança do meu computador.
• Instalação de antivírus
• Proteção contra ameaças
• Configuração do firewall
Podem me ajudar com a proteção do meu PC?`,
        
        'manutencao': `Olá! Gostaria de fazer uma manutenção preventiva no meu computador.
• Limpeza do sistema
• Otimização do Windows
• Verificação geral
Quando podem realizar o serviço?`,
        
        'drivers': `Olá! Preciso atualizar/instalar os drivers do meu computador.
• Drivers do sistema
• Correção de problemas
• Otimização de desempenho
Podem me ajudar com isso?`,
        
        'backup': `Olá! Preciso fazer um backup dos meus arquivos.
• Backup completo dos dados
• Verificação de integridade
• Armazenamento seguro
Podem me auxiliar com esse serviço?`
    };

    // Abrir modal quando clicar em "Ver Detalhes"
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const service = this.closest('.service-card').dataset.modal;
            const modal = document.getElementById(`modal-${service}`);
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Fechar modal quando clicar no X
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    // Fechar modal quando clicar fora dele
    window.addEventListener('click', function(event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Manipular cliques nos botões do WhatsApp
    const whatsappButtons = document.querySelectorAll('.whatsapp-btn');
    whatsappButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            const serviceType = modalId.replace('modal-', '');
            const message = serviceMessages[serviceType] || 'Olá! Gostaria de mais informações sobre seus serviços.';
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://api.whatsapp.com/send?phone=5594984305772&text=${encodedMessage}`, '_blank');
        });
    });
});