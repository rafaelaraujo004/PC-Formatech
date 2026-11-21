// ==========================================================================
// PC FORMATECH — peças do padrão neumórfico que precisam de JavaScript
// (desde 21/11/2026). Carregado nas páginas públicas, ANTES do
// theme-system.js: ele precisa ler o navegador antes que o tema grave nele.
//
// 1. Estreia do visual novo: na primeira visita depois da mudança, os cartões
//    "levantam" até o relevo (classe nm-estreia no <html>, ver neumorfismo.css).
//    Quem já tinha visitado o site antes vê também um aviso discreto, uma vez.
// 2. Barra fixa no celular: Início, Serviços, Loja e WhatsApp.
// ==========================================================================
(function () {
    'use strict';

    var CHAVE_VISUAL = 'pcft-visual';
    var VERSAO_VISUAL = 'neumorfico-1';
    var WHATSAPP = 'https://api.whatsapp.com/send?phone=5594984305772&text=' +
        encodeURIComponent('Olá! Vim pelo site da PC Formatech.');

    function ler(chave) {
        try { return localStorage.getItem(chave); } catch (e) { return null; }
    }
    function gravar(chave, valor) {
        try { localStorage.setItem(chave, valor); } catch (e) { /* sem storage */ }
    }

    // ── 1. Estreia ─────────────────────────────────────────────────────────
    // Chaves que o site grava em qualquer visita desde antes da mudança: se
    // existe alguma, a pessoa já conhecia o visual antigo.
    var jaVisitou = ['pcft-theme', 'pcformatech-theme', 'pcft_modo_visitante_migrado', 'pcformatech_theme_settings']
        .some(function (chave) { return ler(chave) !== null; });
    var primeiraVezNoVisual = ler(CHAVE_VISUAL) !== VERSAO_VISUAL;
    var poucoMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (primeiraVezNoVisual) {
        gravar(CHAVE_VISUAL, VERSAO_VISUAL);
        if (!poucoMovimento) {
            document.documentElement.classList.add('nm-estreia');
            setTimeout(function () { document.documentElement.classList.remove('nm-estreia'); }, 2200);
        }
        if (jaVisitou) {
            quandoPronto(function () { setTimeout(mostrarAviso, 1200); });
        }
    }

    function mostrarAviso() {
        var aviso = document.createElement('div');
        aviso.className = 'nm-aviso';
        aviso.setAttribute('role', 'status');
        aviso.innerHTML =
            '<span class="nm-aviso-ico" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg></span>' +
            '<span class="nm-aviso-texto"><strong>O site está de cara nova</strong>' +
            'Mais limpo e mais fácil de usar no celular.</span>' +
            '<button type="button" class="nm-aviso-fechar" aria-label="Fechar aviso">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
        document.body.appendChild(aviso);
        requestAnimationFrame(function () { aviso.classList.add('is-visivel'); });

        var fechar = function () {
            aviso.classList.remove('is-visivel');
            setTimeout(function () { if (aviso.parentNode) aviso.parentNode.removeChild(aviso); }, 400);
        };
        aviso.querySelector('button').addEventListener('click', fechar);
        setTimeout(fechar, 7000);
    }

    // ── 2. Barra fixa no celular ───────────────────────────────────────────
    var ICONES = {
        inicio: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
        servicos: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        loja: '<path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
        whatsapp: '<path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c.3 1.8 2.6 4.1 4.5 4.6l1.3-1.2 2 .9c-.2 1.2-1.2 2-2.4 1.9C11 15.4 8.6 13 8.3 9.6 8.2 8.4 9 7.4 10.2 7.2l.9 2z"/>'
    };

    function itemAtivo() {
        var caminho = (location.pathname || '/').toLowerCase();
        if (caminho === '/' || caminho === '/index.html') return 'inicio';
        if (caminho.indexOf('/servicos') === 0) return 'servicos';
        if (caminho.indexOf('/loja') === 0) return 'loja';
        return '';
    }

    function criarBarra() {
        if (document.querySelector('.nm-barra')) return;
        var ativo = itemAtivo();
        var itens = [
            ['inicio', 'Início', '/'],
            ['servicos', 'Serviços', '/servicos/'],
            ['loja', 'Loja', '/loja.html'],
            ['whatsapp', 'WhatsApp', WHATSAPP]
        ];
        var nav = document.createElement('nav');
        nav.className = 'nm-barra';
        nav.setAttribute('aria-label', 'Atalhos');
        nav.innerHTML = itens.map(function (item) {
            var externo = item[0] === 'whatsapp';
            return '<a href="' + item[2] + '" class="nm-barra-item' + (item[0] === 'whatsapp' ? ' nm-barra-zap' : '') + '"' +
                (item[0] === ativo ? ' aria-current="page"' : '') +
                (externo ? ' target="_blank" rel="noopener"' : '') + '>' +
                '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONES[item[0]] + '</svg>' +
                '<span>' + item[1] + '</span></a>';
        }).join('');
        document.body.appendChild(nav);
        document.body.classList.add('nm-com-barra');
    }

    function quandoPronto(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    quandoPronto(criarBarra);
})();
