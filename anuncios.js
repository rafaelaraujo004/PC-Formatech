// Anúncios no banner da página principal.
//
// Monta os slides de anúncio (produto da loja Bird Tech ou arte própria) e os
// intercala com as fotos do carrossel. Os anúncios chegam de /api/anuncios
// depois que a página já apareceu, para não atrasar a primeira foto.
// O painel (admin-anuncios.js) usa o mesmo montar() na prévia, então o que
// aparece lá é exatamente o que vai para o site.

(function () {
    'use strict';

    const API = '/api/anuncios';
    const LOGO = '/images/loja/bird-tech-icone-176.webp';
    const VISTOS_KEY = 'pcft_anuncios_vistos';
    const CSS = '/anuncios.css?v=2';

    const moeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined && texto !== null) e.textContent = texto;
        return e;
    }

    function icone(classes) {
        const i = el('i', classes);
        i.setAttribute('aria-hidden', 'true');
        return i;
    }

    function linkWhatsApp(mensagem) {
        const cfg = window.PCFT_CONFIG;
        if (cfg && typeof cfg.linkWhatsApp === 'function') return cfg.linkWhatsApp(mensagem);
        return 'https://api.whatsapp.com/send?phone=5594984305772&text=' + encodeURIComponent(mensagem);
    }

    function dataCurta(ms) {
        return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    /** "Só até 05/10" quando a campanha acaba nos próximos 7 dias. */
    function textoPrazo(fim) {
        if (!fim) return '';
        const falta = fim - Date.now();
        if (falta <= 0 || falta > 7 * 864e5) return '';
        if (falta < 864e5) return 'Termina hoje';
        return 'Só até ' + dataCurta(fim);
    }

    /** Preço grande com os centavos menores: R$ 14,99 */
    function blocoPreco(valor) {
        const p = el('p', 'an-preco');
        const [inteiro, centavos] = moeda(valor).replace(/^R\$\s?/, '').split(',');
        p.setAttribute('aria-label', moeda(valor));
        p.append(el('small', 'an-preco-moeda', 'R$'), el('span', 'an-preco-inteiro', inteiro), el('span', 'an-preco-centavos', ',' + (centavos || '00')));
        return p;
    }

    function marca() {
        const topo = el('div', 'an-topo');
        const logo = el('span', 'an-marca');
        const img = el('img');
        img.src = LOGO;
        img.alt = '';
        img.width = 28;
        img.height = 28;
        img.decoding = 'async';
        logo.append(img, el('span', 'an-marca-nome', 'Bird Tech'));
        topo.append(logo);
        return topo;
    }

    /** Foto com carregamento controlado pelo carrossel (data-src) ou imediato (prévia). */
    function foto(src, alt, imediato) {
        const img = el('img');
        img.alt = alt || '';
        img.decoding = 'async';
        if (imediato) img.src = src;
        else img.dataset.src = src;
        return img;
    }

    function montarProduto(a, slide, imediato) {
        const p = a.produto;
        const titulo = a.titulo || p.nome;
        const chamada = a.chamada || p.descricao || '';

        slide.setAttribute('aria-label', 'Anúncio: ' + titulo + ', ' + moeda(p.preco));

        const fundo = el('div', 'an-fundo');
        fundo.setAttribute('aria-hidden', 'true');
        fundo.append(el('span', 'an-brilho'), el('span', 'an-grade'), el('span', 'an-feixe'));

        const palco = el('div', 'an-palco');

        const topo = marca();
        if (a.selo) topo.append(el('span', 'an-selo', a.selo));

        const nome = el('p', 'an-titulo', titulo);
        const texto = el('p', 'an-chamada', chamada);

        const precos = el('div', 'an-precos');
        if (a.precoAntigo && a.precoAntigo > p.preco) {
            const linha = el('p', 'an-preco-de');
            const riscado = el('s', '', moeda(a.precoAntigo));
            riscado.setAttribute('aria-label', 'De ' + moeda(a.precoAntigo));
            const desconto = Math.round((1 - p.preco / a.precoAntigo) * 100);
            linha.append(riscado, el('span', 'an-desconto', '-' + desconto + '%'));
            precos.append(linha);
        }
        precos.append(blocoPreco(p.preco));
        const prazo = textoPrazo(a.fim);
        if (prazo) {
            const aviso = el('p', 'an-prazo');
            aviso.append(icone('fas fa-clock'), document.createTextNode(' ' + prazo));
            precos.append(aviso);
        }

        const acoes = el('div', 'an-acoes');
        const comprar = el('a', 'an-cta');
        comprar.href = a.link || linkWhatsApp(`Olá! Vi no site e quero comprar na Bird Tech: ${p.nome} (${moeda(p.preco)}). Ainda tem disponível?`);
        if (/^https?:/.test(comprar.href) && !comprar.href.startsWith(location.origin)) {
            comprar.target = '_blank';
            comprar.rel = 'noopener';
        }
        comprar.append(icone(a.link ? 'fas fa-arrow-right' : 'fab fa-whatsapp'), el('span', '', a.botaoTexto || 'Comprar agora'));
        const verLoja = el('a', 'an-cta-sec');
        verLoja.href = '/loja.html#' + encodeURIComponent(p.id);
        verLoja.append(el('span', '', 'Ver na loja'), icone('fas fa-arrow-right'));
        acoes.append(comprar, verLoja);

        const vitrine = el('figure', 'an-vitrine');
        const moldura = el('div', 'an-vitrine-moldura');
        moldura.append(foto(p.imagem, p.nome, imediato));
        vitrine.append(el('span', 'an-pedestal'), moldura);

        palco.append(topo, nome, texto, precos, acoes, vitrine);
        slide.append(fundo, palco);
    }

    function montarImagem(a, slide, imediato) {
        slide.setAttribute('aria-label', 'Anúncio: ' + (a.titulo || 'promoção'));

        // A arte aparece inteira (contain) sobre uma cópia desfocada dela mesma:
        // nada é cortado, e as sobras da moldura ficam com as cores da arte.
        const fundo = el('div', 'an-arte-fundo');
        fundo.setAttribute('aria-hidden', 'true');
        fundo.append(foto(a.imagem, '', imediato));
        const arte = el('div', 'an-arte');
        arte.append(foto(a.imagem, a.titulo || '', imediato));
        slide.append(fundo, arte);

        if (a.titulo || a.chamada || a.link) {
            const painel = el('div', 'an-painel');
            if (a.selo) painel.append(el('span', 'an-selo', a.selo));
            if (a.titulo) painel.append(el('p', 'an-titulo', a.titulo));
            if (a.chamada) painel.append(el('p', 'an-chamada', a.chamada));
            const prazo = textoPrazo(a.fim);
            if (prazo) {
                const aviso = el('p', 'an-prazo');
                aviso.append(icone('fas fa-clock'), document.createTextNode(' ' + prazo));
                painel.append(aviso);
            }
            if (a.link) {
                const cta = el('a', 'an-cta');
                cta.href = a.link;
                if (/^https?:/.test(a.link) && !a.link.startsWith(location.origin)) {
                    cta.target = '_blank';
                    cta.rel = 'noopener';
                }
                cta.append(icone(/whatsapp|wa\.me/.test(a.link) ? 'fab fa-whatsapp' : 'fas fa-arrow-right'), el('span', '', a.botaoTexto || 'Saiba mais'));
                painel.append(cta);
            }
            slide.append(painel);
        }
    }

    /**
     * Cria o slide de um anúncio. opcoes.previa: carrega a imagem na hora (o
     * carrossel do site carrega só quando o slide está chegando).
     */
    function montar(a, opcoes) {
        const imediato = Boolean(opcoes && opcoes.previa);
        const slide = el('div', 'hero-slide hero-anuncio an-estilo-' + (a.estilo || 'bird'));
        slide.classList.add(a.tipo === 'imagem' ? 'an-tipo-imagem' : 'an-tipo-produto');
        slide.dataset.anuncio = a.id || '';
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'anúncio');
        if (!imediato) slide.setAttribute('data-lazy-slide', '');

        if (a.tipo === 'imagem') montarImagem(a, slide, imediato);
        else if (a.produto) montarProduto(a, slide, imediato);
        else return null;
        return slide;
    }

    // ── Site ────────────────────────────────────────────────────────────────

    const ehDono = () => {
        try { return localStorage.getItem('pcft_dono') === '1'; } catch (e) { return false; }
    };

    function metrica(id, tipo) {
        if (!id || ehDono()) return;
        const corpo = JSON.stringify({ acao: 'metrica', id, tipo });
        try {
            if (navigator.sendBeacon && navigator.sendBeacon(API, new Blob([corpo], { type: 'application/json' }))) return;
        } catch (e) { /* cai no fetch */ }
        fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true }).catch(() => {});
    }

    // Uma visualização por anúncio por sessão: o carrossel dá várias voltas.
    function marcarVisto(id) {
        let vistos = [];
        try { vistos = JSON.parse(sessionStorage.getItem(VISTOS_KEY) || '[]'); } catch (e) { vistos = []; }
        if (vistos.includes(id)) return;
        vistos.push(id);
        try { sessionStorage.setItem(VISTOS_KEY, JSON.stringify(vistos)); } catch (e) { /* sem sessão */ }
        metrica(id, 'visto');
    }

    /** Anúncio no 2º lugar e depois a cada duas fotos: a primeira foto continua sendo a do carregamento. */
    function intercalar(slider, slides) {
        const fotos = Array.from(slider.querySelectorAll('.hero-slide:not(.hero-anuncio)'));
        if (!fotos.length) {
            slides.forEach((s) => slider.appendChild(s));
            return;
        }
        let posicao = 1;
        slides.forEach((s) => {
            const referencia = fotos[posicao];
            if (referencia) slider.insertBefore(s, referencia);
            else slider.appendChild(s);
            posicao += 2;
        });
    }

    function carregarCss() {
        if (document.querySelector('link[data-anuncios]')) return Promise.resolve();
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CSS;
            link.dataset.anuncios = '';
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
        });
    }

    async function iniciarNoSite() {
        const hero = document.getElementById('home');
        const slider = hero && hero.querySelector('.hero-slider');
        if (!slider) return;

        let anuncios = [];
        try {
            const resposta = await fetch(API, { headers: { Accept: 'application/json' } });
            const json = await resposta.json();
            if (resposta.ok && json.ok) anuncios = json.anuncios || [];
        } catch (e) {
            return; // sem anúncios, o carrossel segue só com as fotos
        }

        const slides = anuncios.map((a) => montar(a)).filter(Boolean);
        if (!slides.length) return;
        await carregarCss();

        intercalar(slider, slides);
        if (typeof window.initHeroCarousel === 'function') window.initHeroCarousel({ manter: true });

        slider.addEventListener('click', (evento) => {
            const link = evento.target.closest('.hero-anuncio a');
            if (!link) return;
            const slide = link.closest('.hero-anuncio');
            metrica(slide.dataset.anuncio, 'clique');
            try {
                if (window.PCFTPresenceTracker) window.PCFTPresenceTracker.registrar('anuncio', slide.getAttribute('aria-label') || '');
            } catch (e) { /* contagem é opcional */ }
        });

        document.addEventListener('pcft:hero-slide', (evento) => {
            const slide = evento.detail && evento.detail.slide;
            if (slide && slide.classList.contains('hero-anuncio') && document.visibilityState === 'visible') marcarVisto(slide.dataset.anuncio);
        });
    }

    function quandoOcioso(fn) {
        const rodar = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 300));
        if (document.readyState === 'complete') rodar();
        else window.addEventListener('load', rodar, { once: true });
    }

    window.PCFTAnuncios = { montar, moeda };

    if (document.getElementById('home')) quandoOcioso(iniciarNoSite);
})();
