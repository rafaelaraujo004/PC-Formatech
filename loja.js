// Vitrine da Bird Tech: carrega os produtos, filtra por busca e categoria,
// abre o detalhe e leva a compra para o WhatsApp da PC Formatech.

(function () {
    'use strict';

    const API = '/api/loja';
    const RESERVA = '/loja-produtos.json';
    const ACENTOS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

    const $ = (id) => document.getElementById(id);
    const grade = $('bt-grade');
    const contagem = $('bt-contagem');
    const vazio = $('bt-vazio');
    const barraCategorias = $('bt-categorias');
    const campoBusca = $('bt-q');
    const detalhe = $('bt-detalhe');

    let produtos = [];
    let categorias = {};
    let categoriaAtiva = 'todas';
    let termo = '';
    let abertoAgora = null;

    const moeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const normalizar = (texto) => String(texto || '').normalize('NFD').replace(ACENTOS, '').toLowerCase().trim();

    function linkWhatsApp(mensagem) {
        const cfg = window.PCFT_CONFIG;
        if (cfg && typeof cfg.linkWhatsApp === 'function') return cfg.linkWhatsApp(mensagem);
        return 'https://api.whatsapp.com/send?phone=5594984305772&text=' + encodeURIComponent(mensagem);
    }

    const mensagemCompra = (p) => `Olá! Quero comprar na Bird Tech: ${p.nome} (${moeda(p.preco)}). Ainda tem disponível?`;

    // Entra no "Tempo Real" do painel, como as buscas e cliques do resto do site.
    function registrar(tipo, valor) {
        try {
            if (window.PCFTPresenceTracker) window.PCFTPresenceTracker.registrar(tipo, valor);
        } catch (e) { /* contagem é opcional */ }
    }

    async function carregar() {
        try {
            const resposta = await fetch(API, { headers: { Accept: 'application/json' } });
            const json = await resposta.json();
            if (!resposta.ok || !json.ok) throw new Error('api');
            return json;
        } catch (e) {
            // API fora do ar (ou site rodando sem as funções): mostra o catálogo base.
            const json = await (await fetch(RESERVA)).json();
            return { categorias: json.categorias, produtos: json.produtos.filter((p) => p.ativo !== false) };
        }
    }

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    }

    function iconeWhatsApp() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.6A8.4 8.4 0 1 1 21 11.5z');
        svg.appendChild(path);
        return svg;
    }

    function precoFormatado(valor) {
        const p = el('p', 'bt-preco');
        const [inteiro, centavos] = moeda(valor).replace('R$', '').trim().split(',');
        p.append(el('small', '', 'R$'), document.createTextNode(inteiro + ',' + (centavos || '00')));
        return p;
    }

    function cartao(p) {
        const card = el('article', 'bt-card');

        const foto = el('button', 'bt-card-foto');
        foto.type = 'button';
        foto.setAttribute('aria-label', 'Ver detalhes: ' + p.nome);
        const img = el('img');
        img.src = p.imagem;
        img.alt = p.nome;
        img.width = 940;
        img.height = 907;
        img.loading = 'lazy';
        img.decoding = 'async';
        foto.appendChild(img);
        foto.addEventListener('click', () => abrir(p));

        const info = el('div', 'bt-card-info');
        info.appendChild(el('p', 'bt-card-cat', categorias[p.categoria] || 'Bird Tech'));
        const titulo = el('h3');
        const tituloBotao = el('button', '', p.nome);
        tituloBotao.type = 'button';
        tituloBotao.addEventListener('click', () => abrir(p));
        titulo.appendChild(tituloBotao);
        info.appendChild(titulo);
        info.appendChild(precoFormatado(p.preco));

        const comprar = el('a', 'bt-botao bt-botao-whats');
        comprar.href = linkWhatsApp(mensagemCompra(p));
        comprar.target = '_blank';
        comprar.rel = 'noopener';
        comprar.append(iconeWhatsApp(), el('span', 'bt-botao-longo', 'Comprar pelo WhatsApp'), el('span', 'bt-botao-curto', 'Comprar'));
        comprar.addEventListener('click', () => registrar('acao', 'whatsapp:loja-' + p.id));
        info.appendChild(comprar);

        card.append(foto, info);
        return card;
    }

    function filtrados() {
        const busca = normalizar(termo);
        return produtos.filter((p) => {
            if (categoriaAtiva !== 'todas' && p.categoria !== categoriaAtiva) return false;
            if (!busca) return true;
            const texto = normalizar([p.nome, p.descricao, categorias[p.categoria]].join(' '));
            return busca.split(/\s+/).every((parte) => texto.includes(parte));
        });
    }

    function desenhar() {
        const lista = filtrados();
        grade.replaceChildren(...lista.map(cartao));
        grade.setAttribute('aria-busy', 'false');
        vazio.hidden = lista.length > 0;
        contagem.textContent = lista.length === 1 ? '1 produto' : lista.length + ' produtos';

        const perguntar = $('bt-vazio-whats');
        if (perguntar) {
            const pedido = termo ? `Olá! Vocês têm "${termo}" na Bird Tech?` : 'Olá! Quero saber os produtos da Bird Tech.';
            perguntar.href = linkWhatsApp(pedido);
        }
    }

    function desenharCategorias() {
        const presentes = [...new Set(produtos.map((p) => p.categoria))];
        // Com uma categoria só, os filtros não ajudam em nada.
        if (presentes.length < 2) { barraCategorias.hidden = true; return; }
        const botoes = [['todas', 'Todos'], ...presentes.map((c) => [c, categorias[c] || c])].map(([id, nome]) => {
            const b = el('button', '', nome);
            b.type = 'button';
            b.setAttribute('aria-pressed', String(id === categoriaAtiva));
            b.addEventListener('click', () => {
                categoriaAtiva = id;
                barraCategorias.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
                desenhar();
            });
            return b;
        });
        barraCategorias.replaceChildren(...botoes);
        barraCategorias.hidden = false;
    }

    // ── Detalhe ─────────────────────────────────────────────────────────────

    function abrir(p) {
        abertoAgora = p;
        $('bt-detalhe-img').src = p.imagem;
        $('bt-detalhe-img').alt = p.nome;
        $('bt-detalhe-cat').textContent = categorias[p.categoria] || 'Bird Tech';
        $('bt-detalhe-nome').textContent = p.nome;
        $('bt-detalhe-preco').replaceChildren(...precoFormatado(p.preco).childNodes);
        $('bt-detalhe-desc').textContent = p.descricao || '';
        $('bt-detalhe-comprar').href = linkWhatsApp(mensagemCompra(p));
        $('bt-detalhe-compartilhar').lastChild.textContent = ' Compartilhar';

        if (!detalhe.open) {
            if (typeof detalhe.showModal === 'function') detalhe.showModal(); else detalhe.setAttribute('open', '');
        }
        history.replaceState(null, '', '#' + encodeURIComponent(p.id));
        registrar('servico', 'loja:' + p.id);
    }

    function fechar() {
        if (detalhe.open) detalhe.close();
    }

    detalhe.addEventListener('close', () => {
        abertoAgora = null;
        history.replaceState(null, '', location.pathname + location.search);
    });
    // Clique fora do conteúdo (no fundo escurecido) fecha.
    detalhe.addEventListener('click', (e) => { if (e.target === detalhe) fechar(); });
    $('bt-fechar').addEventListener('click', fechar);

    $('bt-detalhe-comprar').addEventListener('click', () => {
        if (abertoAgora) registrar('acao', 'whatsapp:loja-' + abertoAgora.id);
    });

    $('bt-detalhe-compartilhar').addEventListener('click', async () => {
        if (!abertoAgora) return;
        const url = location.origin + location.pathname + '#' + encodeURIComponent(abertoAgora.id);
        const dados = { title: abertoAgora.nome + ' | Bird Tech', text: `${abertoAgora.nome} por ${moeda(abertoAgora.preco)} na Bird Tech`, url };
        const botao = $('bt-detalhe-compartilhar');
        try {
            if (navigator.share) {
                await navigator.share(dados);
            } else {
                await navigator.clipboard.writeText(url);
                botao.lastChild.textContent = ' Link copiado';
            }
        } catch (e) { /* compartilhamento cancelado */ }
    });

    // ── Busca ───────────────────────────────────────────────────────────────

    let esperaBusca;
    let esperaRegistro;
    campoBusca.addEventListener('input', () => {
        clearTimeout(esperaBusca);
        clearTimeout(esperaRegistro);
        esperaBusca = setTimeout(() => { termo = campoBusca.value.trim(); desenhar(); }, 120);
        // Só conta a busca quando a pessoa para de digitar.
        esperaRegistro = setTimeout(() => {
            const t = campoBusca.value.trim();
            if (t.length >= 2) registrar('busca', 'loja: ' + t);
        }, 1500);
    });
    $('bt-busca').addEventListener('submit', (e) => {
        e.preventDefault();
        termo = campoBusca.value.trim();
        desenhar();
        document.getElementById('vitrine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /**
     * Dados estruturados dos produtos (schema.org/Product) para o Google
     * mostrar nome, foto e preço na busca. O Google executa o JavaScript da
     * página, então o bloco montado aqui é lido junto com a vitrine.
     */
    function publicarDadosEstruturados() {
        const base = location.origin;
        const dados = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Bird Tech: periféricos e acessórios',
            itemListElement: produtos.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                    '@type': 'Product',
                    name: p.nome,
                    description: p.descricao || p.nome,
                    image: new URL(p.imagem, base).href,
                    url: base + '/loja.html#' + encodeURIComponent(p.id),
                    brand: { '@type': 'Brand', name: 'Bird Tech' },
                    offers: {
                        '@type': 'Offer',
                        price: Number(p.preco).toFixed(2),
                        priceCurrency: 'BRL',
                        availability: 'https://schema.org/InStock',
                        url: base + '/loja.html#' + encodeURIComponent(p.id),
                        seller: { '@type': 'Organization', name: 'PC Formatech' }
                    }
                }
            }))
        };
        let bloco = document.getElementById('bt-dados-estruturados');
        if (!bloco) {
            bloco = document.createElement('script');
            bloco.type = 'application/ld+json';
            bloco.id = 'bt-dados-estruturados';
            document.head.appendChild(bloco);
        }
        bloco.textContent = JSON.stringify(dados);
    }

    // ── Início ──────────────────────────────────────────────────────────────

    carregar().then((dados) => {
        categorias = dados.categorias || {};
        produtos = dados.produtos || [];
        desenharCategorias();
        desenhar();
        publicarDadosEstruturados();

        // Link compartilhado (loja.html#id-do-produto) abre direto no produto.
        const pedido = decodeURIComponent(location.hash.slice(1));
        const alvo = pedido && produtos.find((p) => p.id === pedido);
        if (alvo) abrir(alvo);
    }).catch(() => {
        grade.replaceChildren();
        grade.setAttribute('aria-busy', 'false');
        vazio.hidden = false;
        vazio.querySelector('strong').textContent = 'Não foi possível carregar os produtos agora.';
    });
})();
