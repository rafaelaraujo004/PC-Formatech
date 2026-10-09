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
   • Promoção com data    → acrescente um item em PROMOCOES (serviço, preço,
                            início e fim); fora do período ela some sozinha
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

    /**
     * Promoções com data marcada. Durante o período, o preço promocional entra
     * no lugar do normal em todo o site (cartões, detalhes, formulário de
     * agendamento e página inicial), com o normal riscado ao lado. Antes do
     * início e depois do fim, nada muda: não precisa lembrar de tirar.
     *
     * servico — id em SERVICOS
     * preco   — preço promocional em reais
     * inicio, fim — data e hora no horário de Brasília (-03:00)
     */
    const PROMOCOES = [
        // Formatação por R$ 50 (arte "promo-formatacao" da aba Divulgação).
        { servico: 'formatacao', preco: 50, inicio: '2026-10-08T00:00:00-03:00', fim: '2026-10-10T23:59:59-03:00' }
    ];

    /** Promoção em vigor para o serviço agora, ou null. */
    function promocaoDe(id, agora) {
        const t = (agora || new Date()).getTime();
        return PROMOCOES.find((p) => p.servico === id && t >= Date.parse(p.inicio) && t <= Date.parse(p.fim)) || null;
    }

    /** "até 10/10": último dia da promoção, no horário de Brasília. */
    function textoFimPromocao(promocao) {
        const d = new Date(Date.parse(promocao.fim) - 3 * 3600 * 1000);
        return 'até ' + String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0');
    }

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
        PROMOCOES,
        promocaoDe,
        textoFimPromocao,
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
            const promocao = cfg.promocaoDe(servico.id);
            const preco = promocao ? promocao.preco : servico.preco;
            const precoTexto = cfg.formatarPreco(preco);
            const rotulo = servico.preco ? 'A partir de ' : '';
            const fimPromocao = promocao ? cfg.textoFimPromocao(promocao) : '';

            // Preço normal riscado, antes do promocional.
            function riscado(el) {
                const antigo = document.createElement('span');
                antigo.className = 'preco-antigo';
                antigo.textContent = cfg.formatarPreco(servico.preco);
                el.textContent = '';
                el.append(antigo, document.createTextNode(precoTexto));
            }

            // 1 · Card da vitrine: data-price e etiqueta visível.
            const checkbox = document.querySelector('.service-checkbox[data-service="' + servico.id + '"]');
            if (checkbox) {
                checkbox.dataset.price = String(preco);
                const card = checkbox.closest('.service-card');
                const tag = card && card.querySelector('.price-tag');
                const etiqueta = tag && tag.querySelector('span:last-child');
                if (etiqueta) { etiqueta.textContent = precoTexto; cards++; }
                if (promocao && tag) {
                    // Na etiqueta só "Promoção" (cabe no canto); o preço antigo e
                    // o prazo vão numa linha própria, antes do botão do card.
                    tag.classList.add('em-promocao');
                    const legenda = tag.querySelector('span:first-child');
                    if (legenda && legenda !== etiqueta) legenda.textContent = 'Promoção';
                    if (!card.querySelector('.promo-prazo')) {
                        const prazo = document.createElement('p');
                        prazo.className = 'promo-prazo';
                        riscado(prazo);
                        prazo.lastChild.textContent = 'só ' + fimPromocao;
                        const botao = card.querySelector('.service-details-btn');
                        card.insertBefore(prazo, botao || null);
                    }
                }
            }

            // 2 · Modal de detalhes.
            const modal = document.getElementById('modal-' + servico.id);
            const precoModal = modal && modal.querySelector('.price');
            if (precoModal) {
                if (promocao) {
                    riscado(precoModal);
                    precoModal.append(document.createTextNode(' · promoção ' + fimPromocao));
                } else {
                    precoModal.textContent = rotulo + precoTexto;
                }
                modais++;
            }

            // 3 · Opção do formulário de agendamento.
            const opcao = document.querySelector('.services-checkbox-group input[value="' + servico.nome + '"]');
            if (opcao) {
                opcao.dataset.price = String(preco);
                const texto = opcao.parentElement && opcao.parentElement.querySelector('span');
                if (texto) {
                    texto.textContent = servico.nome + ' - ' + precoTexto + (promocao ? ' (promoção ' + fimPromocao + ')' : '');
                    opcoes++;
                }
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

        // Ano do rodapé sempre o atual (estava fixo em 2025).
        document.querySelectorAll('[data-ano-atual]').forEach((el) => {
            el.textContent = String(new Date().getFullYear());
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
