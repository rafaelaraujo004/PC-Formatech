// Vitrine da Bird Tech: carrega os produtos, filtra por busca e categoria,
// abre o detalhe, monta o carrinho e leva o pedido para o WhatsApp da
// PC Formatech.

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

        const acoes = el('div', 'bt-card-acoes');
        const vaga = el('div', 'bt-card-carrinho');
        acoesPorId.set(p.id, vaga);
        desenharAcaoCarrinho(vaga, p);

        const comprar = el('a', 'bt-botao bt-botao-whats bt-botao-icone');
        comprar.href = linkWhatsApp(mensagemCompra(p));
        comprar.target = '_blank';
        comprar.rel = 'noopener';
        comprar.title = 'Comprar só este pelo WhatsApp';
        comprar.setAttribute('aria-label', 'Comprar ' + p.nome + ' pelo WhatsApp');
        comprar.appendChild(iconeWhatsApp());
        comprar.addEventListener('click', () => registrar('acao', 'whatsapp:loja-' + p.id));
        acoes.append(vaga, comprar);
        info.appendChild(acoes);

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
        acoesPorId.clear();
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
        atualizarBotaoDetalhe();
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

    // ── Carrinho ────────────────────────────────────────────────────────────
    // Guarda só id e quantidade (no navegador do visitante): nome e preço vêm
    // sempre do catálogo atual, então um preço alterado no painel já vale.

    const CARRINHO_KEY = 'bt_carrinho';
    const MAX_QTD = 20;
    const carrinho = new Map();
    const acoesPorId = new Map();
    const dialogoCarrinho = $('bt-carrinho');
    let esperaAviso;

    function lerCarrinho() {
        try {
            const salvo = JSON.parse(localStorage.getItem(CARRINHO_KEY) || '[]');
            if (Array.isArray(salvo)) salvo.forEach(([id, q]) => { if (typeof id === 'string' && q > 0) carrinho.set(id, Math.min(MAX_QTD, Math.floor(q))); });
        } catch (e) { /* sem armazenamento: carrinho só nesta visita */ }
    }

    function salvarCarrinho() {
        try { localStorage.setItem(CARRINHO_KEY, JSON.stringify([...carrinho])); } catch (e) { /* idem */ }
    }

    const itensDoCarrinho = () => [...carrinho]
        .map(([id, qtd]) => ({ p: produtos.find((x) => x.id === id), qtd }))
        .filter((i) => i.p);
    const totalDoCarrinho = () => itensDoCarrinho().reduce((t, i) => t + i.p.preco * i.qtd, 0);
    const unidades = () => itensDoCarrinho().reduce((t, i) => t + i.qtd, 0);
    const textoItens = (n) => (n === 1 ? '1 item' : n + ' itens');

    function definirQtd(p, qtd) {
        const n = Math.max(0, Math.min(MAX_QTD, qtd));
        if (n === 0) carrinho.delete(p.id); else carrinho.set(p.id, n);
        salvarCarrinho();
        atualizarCarrinho();
    }

    function adicionar(p) {
        const antes = carrinho.get(p.id) || 0;
        if (antes >= MAX_QTD) return;
        definirQtd(p, antes + 1);
        registrar('acao', 'carrinho:loja-' + p.id);
        avisar(p.nome + ' no carrinho');
    }

    function iconeSacola() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        ['M5.5 8h13l-1.2 12H6.7L5.5 8z', 'M9 8V7a3 3 0 0 1 6 0v1'].forEach((d) => {
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', d);
            svg.appendChild(path);
        });
        return svg;
    }

    /** Seletor de quantidade: − 2 + */
    function seletorQtd(p, qtd, classe) {
        const caixa = el('div', 'bt-qtd' + (classe ? ' ' + classe : ''));
        caixa.setAttribute('role', 'group');
        caixa.setAttribute('aria-label', 'Quantidade de ' + p.nome);
        const menos = el('button', '', qtd === 1 ? '' : '\u2212');
        menos.type = 'button';
        menos.setAttribute('aria-label', qtd === 1 ? 'Tirar do carrinho' : 'Diminuir');
        if (qtd === 1) menos.appendChild(iconeLixeira());
        menos.addEventListener('click', () => definirQtd(p, qtd - 1));
        const valor = el('output', '', String(qtd));
        valor.setAttribute('aria-live', 'polite');
        const mais = el('button', '', '+');
        mais.type = 'button';
        mais.setAttribute('aria-label', 'Aumentar');
        mais.disabled = qtd >= MAX_QTD;
        mais.addEventListener('click', () => definirQtd(p, qtd + 1));
        caixa.append(menos, valor, mais);
        return caixa;
    }

    function iconeLixeira() {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12');
        svg.appendChild(path);
        return svg;
    }

    function desenharAcaoCarrinho(vaga, p) {
        const qtd = carrinho.get(p.id) || 0;
        if (qtd > 0) {
            vaga.replaceChildren(seletorQtd(p, qtd));
            return;
        }
        const botao = el('button', 'bt-botao bt-botao-azul');
        botao.type = 'button';
        botao.append(iconeSacola(), el('span', 'bt-botao-longo', 'Adicionar ao carrinho'), el('span', 'bt-botao-curto', 'Adicionar'));
        botao.addEventListener('click', () => {
            adicionar(p);
            // O foco segue para o seletor que entrou no lugar do botão.
            const mais = vaga.querySelector('.bt-qtd button:last-child');
            if (mais) mais.focus();
        });
        vaga.replaceChildren(botao);
    }

    function atualizarBotaoDetalhe() {
        if (!abertoAgora) return;
        const qtd = carrinho.get(abertoAgora.id) || 0;
        $('bt-detalhe-adicionar-texto').textContent = qtd ? `Adicionar mais um (${qtd} no carrinho)` : 'Adicionar ao carrinho';
    }

    function mensagemPedido() {
        const linhas = itensDoCarrinho().map((i) => `• ${i.qtd}x ${i.p.nome} — ${moeda(i.p.preco * i.qtd)}`);
        const entrega = (document.querySelector('input[name="bt-entrega"]:checked') || {}).value === 'entrega'
            ? 'Quero entrega em Canaã dos Carajás (combinar).'
            : 'Vou retirar com a PC Formatech.';
        const obs = $('bt-obs').value.trim();
        return ['Olá! Quero fazer este pedido na Bird Tech:', '', ...linhas, '', 'Total: ' + moeda(totalDoCarrinho()), entrega]
            .concat(obs ? ['Observação: ' + obs] : [])
            .concat(['', 'Ainda tem disponível?'])
            .join('\n');
    }

    function desenharGaveta() {
        const itens = itensDoCarrinho();
        const lista = $('bt-carrinho-lista');
        lista.replaceChildren(...itens.map(({ p, qtd }) => {
            const li = el('li', 'bt-item');
            const img = el('img');
            img.src = p.imagem;
            img.alt = '';
            img.width = 64;
            img.height = 62;
            img.loading = 'lazy';
            const meio = el('div', 'bt-item-info');
            meio.append(el('strong', '', p.nome), el('span', '', moeda(p.preco) + ' cada'));
            const fim = el('div', 'bt-item-fim');
            fim.append(el('span', 'bt-item-total', moeda(p.preco * qtd)), seletorQtd(p, qtd, 'bt-qtd-pequeno'));
            li.append(img, meio, fim);
            return li;
        }));
        const vazioGaveta = !itens.length;
        $('bt-carrinho-vazio').hidden = !vazioGaveta;
        $('bt-carrinho-form').hidden = vazioGaveta;
        dialogoCarrinho.querySelector('.bt-carrinho-rodape').hidden = vazioGaveta;
        $('bt-carrinho-total').textContent = moeda(totalDoCarrinho());
        $('bt-enviar-pedido').href = linkWhatsApp(mensagemPedido());
    }

    function atualizarCarrinho() {
        acoesPorId.forEach((vaga, id) => {
            const p = produtos.find((x) => x.id === id);
            if (p) desenharAcaoCarrinho(vaga, p);
        });
        const n = unidades();
        const conta = $('bt-sacola-conta');
        conta.textContent = String(n);
        conta.hidden = n === 0;
        $('bt-abrir-carrinho').setAttribute('aria-label', n ? `Abrir carrinho, ${textoItens(n)}` : 'Abrir carrinho, vazio');
        $('bt-barra').hidden = n === 0;
        document.body.classList.toggle('bt-com-carrinho', n > 0);
        $('bt-barra-itens').textContent = textoItens(n);
        $('bt-barra-total').textContent = moeda(totalDoCarrinho());
        atualizarBotaoDetalhe();
        desenharGaveta();
    }

    function abrirCarrinho() {
        if (detalhe.open) detalhe.close();
        desenharGaveta();
        if (!dialogoCarrinho.open) {
            if (typeof dialogoCarrinho.showModal === 'function') dialogoCarrinho.showModal(); else dialogoCarrinho.setAttribute('open', '');
        }
        registrar('acao', 'carrinho:abrir');
    }

    function avisar(texto) {
        const aviso = $('bt-aviso');
        aviso.textContent = texto;
        aviso.classList.add('is-visivel');
        clearTimeout(esperaAviso);
        esperaAviso = setTimeout(() => aviso.classList.remove('is-visivel'), 2200);
    }

    $('bt-abrir-carrinho').addEventListener('click', abrirCarrinho);
    $('bt-barra-abrir').addEventListener('click', abrirCarrinho);
    $('bt-fechar-carrinho').addEventListener('click', () => dialogoCarrinho.close());
    dialogoCarrinho.addEventListener('click', (e) => { if (e.target === dialogoCarrinho) dialogoCarrinho.close(); });
    $('bt-carrinho-form').addEventListener('input', () => { $('bt-enviar-pedido').href = linkWhatsApp(mensagemPedido()); });
    $('bt-carrinho-form').addEventListener('submit', (e) => e.preventDefault());
    $('bt-enviar-pedido').addEventListener('click', () => {
        registrar('acao', 'whatsapp:loja-pedido');
        // Depois de enviar, oferece esvaziar o carrinho (o pedido já foi).
        $('bt-limpar-carrinho').textContent = 'Pedido enviado? Esvaziar carrinho';
    });
    $('bt-limpar-carrinho').addEventListener('click', () => {
        if (!window.confirm('Tirar todos os produtos do carrinho?')) return;
        carrinho.clear();
        salvarCarrinho();
        atualizarCarrinho();
        $('bt-limpar-carrinho').textContent = 'Esvaziar carrinho';
        dialogoCarrinho.close();
    });
    $('bt-detalhe-adicionar').addEventListener('click', () => {
        if (abertoAgora) adicionar(abertoAgora);
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
        lerCarrinho();
        desenharCategorias();
        desenhar();
        atualizarCarrinho();
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
