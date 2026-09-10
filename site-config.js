/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Configuração do site
   FONTE ÚNICA de preços e contato.

   Antes deste arquivo, o preço de cada serviço vivia em 4 lugares (o
   data-price do card, a etiqueta visível, a opção do formulário de agendamento
   e o modal de detalhes) e o número de WhatsApp em 14 — 8 no index.html e 6 no
   main.js. Mudar um preço exigia lembrar dos quatro pontos, e qualquer
   esquecimento virava divergência entre o valor anunciado e o do orçamento.

   Agora: mude aqui e a página inteira acompanha. O HTML mantém os valores como
   estavam para quem chega sem JS; ao carregar, aplicarConfiguracao() reescreve
   todos os pontos a partir daqui.

   ─── Como mexer ───────────────────────────────────────────────────────────
   • Preço de um serviço  → campo "preco" do item em SERVICOS
   • Nome/descrição       → campos "nome" e "descricao"
   • Número de WhatsApp   → CONTATO.whatsapp (só dígitos, com DDI 55)
   • Novo serviço         → acrescente um item em SERVICOS e crie o card e o
                            modal correspondentes no index.html com o mesmo id
   ═══════════════════════════════════════════════════════════════════════════ */

window.PCFT_CONFIG = (function () {
    'use strict';

    const CONTATO = {
        // Só dígitos, com código do país. Usado para montar todos os links.
        whatsapp: '5594984305772',
        // Formato de exibição, para os textos visíveis.
        whatsappExibicao: '(94) 98430-5772',
        instagram: 'pcformatech',
        cidade: 'Canaã dos Carajás, PA'
    };

    /**
     * Catálogo de serviços.
     *
     * id        — casa com data-service no card e com id="modal-<id>" no modal
     * nome      — rótulo curto, usado no formulário de agendamento
     * nomeCard  — título do card (às vezes mais longo que o do formulário)
     * preco     — número em reais; 0 significa "sob consulta"
     * noCard    — false para serviços que só existem no formulário
     */
    const SERVICOS = [
        { id: 'formatacao', nome: 'Formatação de Computador',  nomeCard: 'Formatação de Computadores', preco: 80 },
        { id: 'programas',  nome: 'Instalação de Programas',   nomeCard: 'Instalação de Programas',    preco: 50 },
        { id: 'seguranca',  nome: 'Proteção e Segurança',      nomeCard: 'Proteção e Segurança',       preco: 60 },
        { id: 'manutencao', nome: 'Manutenção Preventiva',     nomeCard: 'Manutenção Preventiva',      preco: 70 },
        { id: 'drivers',    nome: 'Instalação de Drivers',     nomeCard: 'Instalação de Drivers',      preco: 40 },
        { id: 'backup',     nome: 'Backup de Dados',           nomeCard: 'Backup de Dados',            preco: 45 },
        { id: 'remoto',     nome: 'Atendimento Remoto',        nomeCard: 'Atendimento Remoto',         preco: 0 },

        // Só no formulário de agendamento, sem card na vitrine.
        { id: 'limpeza-simples',  nome: 'Limpeza Simples',  preco: 25, noCard: false },
        { id: 'limpeza-completa', nome: 'Limpeza Completa', preco: 45, noCard: false }
    ];

    /** "R$ 80,00" — ou "Sob consulta" quando o preço é 0. */
    function formatarPreco(valor) {
        if (!valor) return 'Sob consulta';
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        });
    }

    /** Link do WhatsApp já com a mensagem codificada. */
    function linkWhatsApp(mensagem) {
        const base = 'https://api.whatsapp.com/send?phone=' + CONTATO.whatsapp;
        if (!mensagem) return base;
        return base + '&text=' + encodeURIComponent(mensagem);
    }

    function servicoPorId(id) {
        return SERVICOS.find((s) => s.id === id) || null;
    }

    function servicoPorNome(nome) {
        const alvo = String(nome || '').trim().toLowerCase();
        return SERVICOS.find((s) => s.nome.toLowerCase() === alvo) || null;
    }

    return {
        CONTATO,
        SERVICOS,
        formatarPreco,
        linkWhatsApp,
        servicoPorId,
        servicoPorNome
    };
})();

/**
 * Reescreve, a partir da configuração acima, todos os pontos da página que
 * repetem preço ou telefone. Roda uma vez no carregamento.
 *
 * Os valores continuam escritos no HTML para que a página faça sentido sem JS;
 * esta função é quem garante que os quatro pontos nunca divirjam entre si.
 */
(function aplicarConfiguracao() {
    'use strict';

    const cfg = window.PCFT_CONFIG;

    function aplicar() {
        let cards = 0;
        let modais = 0;
        let opcoes = 0;
        let links = 0;

        cfg.SERVICOS.forEach((servico) => {
            const precoTexto = cfg.formatarPreco(servico.preco);
            const rotulo = servico.preco ? 'A partir de ' : '';

            // 1 · Card da vitrine: data-price e etiqueta visível.
            const checkbox = document.querySelector('.service-checkbox[data-service="' + servico.id + '"]');
            if (checkbox) {
                checkbox.dataset.price = String(servico.preco);
                const card = checkbox.closest('.service-card');
                const etiqueta = card && card.querySelector('.price-tag span:last-child');
                if (etiqueta) { etiqueta.textContent = precoTexto; cards++; }
            }

            // 2 · Modal de detalhes.
            const modal = document.getElementById('modal-' + servico.id);
            const precoModal = modal && modal.querySelector('.price');
            if (precoModal) { precoModal.textContent = rotulo + precoTexto; modais++; }

            // 3 · Opção do formulário de agendamento.
            const opcao = document.querySelector('.services-checkbox-group input[value="' + servico.nome + '"]');
            if (opcao) {
                opcao.dataset.price = String(servico.preco);
                const texto = opcao.parentElement && opcao.parentElement.querySelector('span');
                if (texto) { texto.textContent = servico.nome + ' - ' + precoTexto; opcoes++; }
            }
        });

        // 4 · Todo link de WhatsApp passa a apontar para o número da config,
        //     preservando a mensagem que já estava em cada link.
        document.querySelectorAll('a[href*="api.whatsapp.com"], a[href*="wa.me/"]').forEach((link) => {
            try {
                const url = new URL(link.href);
                const mensagem = url.searchParams.get('text') || '';
                link.href = cfg.linkWhatsApp(mensagem);
                links++;
            } catch (e) {
                /* href malformado: deixa como está */
            }
        });

        // 5 · Números de telefone exibidos como texto.
        document.querySelectorAll('[data-contato="whatsapp"]').forEach((el) => {
            el.textContent = cfg.CONTATO.whatsappExibicao;
        });

        return { cards, modais, opcoes, links };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar);
    } else {
        aplicar();
    }
})();
