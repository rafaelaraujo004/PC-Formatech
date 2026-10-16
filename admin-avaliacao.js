/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Pedido de avaliação no Google (painel)

   Monta a mensagem pedindo a avaliação, com o link do Perfil da Empresa que
   abre direto a tela de dar nota, e abre o WhatsApp com ela pronta. Fica no
   Início do painel (cartão "Avaliações no Google") e em cada linha da lista de
   clientes (botão "Avaliação", via pedirAvaliacao em admin-app.js).

   O Google não deixa oferecer desconto ou brinde em troca da avaliação, nem
   pedir só para quem gostou: o pedido vai para todo cliente atendido.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const LINK = 'https://g.page/r/CVRLe43KhfKfEBM/review';
    const $ = (id) => document.getElementById(id);

    function primeiroNome(nome) {
        return String(nome || '').trim().split(/\s+/)[0] || '';
    }

    function mensagem(nome) {
        const quem = primeiroNome(nome);
        return `Olá${quem ? ', ' + quem : ''}! Aqui é o Rafael, da PC Formatech. Obrigado pela confiança!\n\n`
            + 'Se puder, deixe sua avaliação no Google. Leva menos de 1 minuto e ajuda muito outras pessoas de Canaã a encontrar a gente:\n'
            + LINK;
    }

    /** Número com DDI 55; sem número, o WhatsApp pede para escolher o contato. */
    function numero(telefone) {
        const d = String(telefone || '').replace(/\D/g, '');
        if (d.length === 10 || d.length === 11) return '55' + d;
        if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
        return '';
    }

    function abrir(telefone, nome) {
        const n = numero(telefone);
        const texto = encodeURIComponent(mensagem(nome));
        const url = n
            ? `https://api.whatsapp.com/send?phone=${n}&text=${texto}`
            : `https://api.whatsapp.com/send?text=${texto}`;
        window.open(url, '_blank', 'noopener');
    }

    async function copiar(texto) {
        try { await navigator.clipboard.writeText(texto); return true; } catch (e) { return false; }
    }

    function aviso(texto, alerta) {
        const el = $('avaliar-aviso');
        if (!el) return;
        el.textContent = texto || '';
        el.classList.toggle('is-alerta', !!alerta);
        if (texto) setTimeout(() => { if (el.textContent === texto) el.textContent = ''; }, 3500);
    }

    function iniciar() {
        const nome = $('avaliar-nome');
        const fone = $('avaliar-fone');
        if (!nome || !fone) return;

        $('avaliar-zap').addEventListener('click', () => {
            if (fone.value.trim() && !numero(fone.value)) {
                aviso('Confira o número: use DDD + número, ex.: (94) 98430-5772.', true);
                fone.focus();
                return;
            }
            aviso('');
            abrir(fone.value, nome.value);
        });
        $('avaliar-copiar').addEventListener('click', async () => {
            aviso(await copiar(mensagem(nome.value)) ? 'Mensagem copiada.' : 'Não deu para copiar. Segure o texto e copie.', true);
        });
        $('avaliar-link').addEventListener('click', async () => {
            aviso(await copiar(LINK) ? 'Link copiado.' : LINK);
        });
    }

    window.PCFAvaliacao = { LINK, mensagem, abrir };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
