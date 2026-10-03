// Aba "Anúncios" do painel: anúncios do banner da página principal.
//
// A prévia usa o mesmo montar() do site (anuncios.js) e o mesmo CSS
// (anuncios.css), dentro de uma moldura do tamanho da do site no computador
// (3:2) ou no celular (quadrada). Tudo é gravado por /api/anuncios.

(function () {
    'use strict';

    const ROTA = '/api/anuncios';
    const WHATSAPP = '5594984305772';
    const $ = (id) => document.getElementById(id);

    let anuncios = [];
    let produtos = [];
    let carregado = false;

    let editando = null;   // anúncio em edição (ou null para novo)
    let arte = null;       // data URL da arte nova escolhida
    let animar = false;

    const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const numero = (v) => Number(v || 0).toLocaleString('pt-BR');

    function status(texto, erro) {
        const el = $('ad-status');
        el.textContent = texto || '';
        el.classList.toggle('is-erro', Boolean(erro));
    }

    async function chamar(acao, dados) {
        const usuario = window.firebase && firebase.auth && firebase.auth().currentUser;
        if (!usuario) throw new Error('Para mexer nos anúncios, entre no painel com e-mail e senha (ou biometria).');
        const idToken = await usuario.getIdToken();
        const resposta = await fetch(ROTA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao, idToken, ...(dados || {}) })
        });
        let json = {};
        try { json = await resposta.json(); } catch (e) { /* corpo vazio */ }
        if (!resposta.ok || !json.ok) throw new Error(json.error || 'Sem resposta do servidor (' + resposta.status + ').');
        return json;
    }

    function lerPreco(texto) {
        const limpo = String(texto || '').replace(/[^\d,.]/g, '');
        if (!limpo) return null;
        const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
        const n = Math.round(parseFloat(normal) * 100) / 100;
        return Number.isFinite(n) ? n : NaN;
    }

    // datetime-local ↔ milissegundos (hora local do navegador).
    function paraCampoData(ms) {
        if (!ms) return '';
        const d = new Date(ms);
        const dois = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
    }

    function lerCampoData(id) {
        const v = $(id).value;
        return v ? new Date(v).getTime() : null;
    }

    const tipoAtual = () => document.querySelector('input[name="ad-tipo"]:checked').value;
    const estiloAtual = () => document.querySelector('input[name="ad-estilo"]:checked').value;
    const produtoPorId = (id) => produtos.find((p) => p.id === id) || null;

    // ── Formulário → anúncio ────────────────────────────────────────────────

    function lerFormulario() {
        const tipo = tipoAtual();
        const a = {
            id: editando ? editando.id : undefined,
            tipo,
            selo: $('ad-selo').value.trim(),
            titulo: $('ad-titulo').value.trim(),
            chamada: $('ad-chamada').value.trim(),
            botaoTexto: $('ad-botao-texto').value.trim(),
            link: $('ad-link').value.trim(),
            estilo: estiloAtual(),
            ativo: $('ad-ativo').checked,
            inicio: lerCampoData('ad-inicio'),
            fim: lerCampoData('ad-fim')
        };
        if (tipo === 'produto') {
            a.produtoId = $('ad-produto').value;
            a.produto = produtoPorId(a.produtoId);
            a.precoAntigo = lerPreco($('ad-preco-antigo').value);
        } else {
            a.imagem = arte || (editando && editando.tipo === 'imagem' ? editando.imagem : null);
        }
        return a;
    }

    function ajustarCampos() {
        const tipo = tipoAtual();
        document.querySelectorAll('[data-ad-so]').forEach((el) => { el.hidden = el.dataset.adSo !== tipo; });
        const p = produtoPorId($('ad-produto').value);
        if (tipo === 'produto') {
            $('ad-titulo').placeholder = p ? p.nome : 'Nome do produto';
            $('ad-titulo-dica').textContent = 'Vazio: usa o nome do produto.';
            $('ad-chamada').placeholder = p && p.descricao ? p.descricao.slice(0, 90) + '…' : 'Vazio: usa a descrição do produto.';
            $('ad-botao-texto').placeholder = 'Comprar agora';
            $('ad-link-dica').textContent = 'Vazio: o botão abre o WhatsApp já com o nome e o preço do produto.';
        } else {
            $('ad-titulo').placeholder = 'Ex.: 10% de desconto no suporte remoto';
            $('ad-titulo-dica').textContent = 'Opcional. Se a arte já tem o texto, deixe vazio: só a arte aparece.';
            $('ad-chamada').placeholder = 'Opcional';
            $('ad-botao-texto').placeholder = 'Saiba mais';
            $('ad-link-dica').textContent = 'Vazio: o anúncio fica sem botão.';
        }
    }

    // ── Prévia ──────────────────────────────────────────────────────────────

    function desenharPrevia() {
        const moldura = $('ad-moldura');
        const a = lerFormulario();
        const pronto = a.tipo === 'produto' ? Boolean(a.produto) : Boolean(a.imagem);
        if (!pronto) {
            const vazio = document.createElement('div');
            vazio.className = 'ad-moldura-vazia';
            vazio.textContent = a.tipo === 'produto' ? 'Escolha um produto da loja.' : 'Envie a arte do anúncio.';
            moldura.replaceChildren(vazio);
            return;
        }
        if (!(a.precoAntigo > 0)) a.precoAntigo = null;
        const slide = window.PCFTAnuncios.montar(a, { previa: true });
        slide.classList.add('active');
        if (!animar) slide.classList.add('an-estatico');
        // Os botões da prévia não navegam.
        slide.querySelectorAll('a').forEach((link) => link.addEventListener('click', (e) => e.preventDefault()));

        const pontos = document.createElement('div');
        pontos.className = 'ad-moldura-pontos';
        pontos.setAttribute('aria-hidden', 'true');
        for (let i = 0; i < 5; i++) pontos.appendChild(document.createElement('span'));
        const palco = document.createElement('div');
        palco.className = 'ad-palco';
        palco.append(slide, pontos);
        moldura.replaceChildren(palco);
        escalar();
        animar = false;
    }

    // O palco tem o tamanho real da moldura do site (720×480 no computador,
    // 390×390 no celular) e é reduzido para caber: assim a prévia mostra o
    // mesmo arranjo do site, e não o arranjo de uma moldura pequena.
    const TAMANHOS = { computador: [720, 480], celular: [390, 390] };
    function escalar() {
        const moldura = $('ad-moldura');
        const palco = moldura.querySelector('.ad-palco');
        if (!palco) return;
        const [w, h] = TAMANHOS[moldura.dataset.tela] || TAMANHOS.computador;
        palco.style.width = w + 'px';
        palco.style.height = h + 'px';
        palco.style.transform = 'scale(' + (moldura.clientWidth / w) + ')';
    }

    let espera;
    function aoMudar() {
        clearTimeout(espera);
        espera = setTimeout(() => { ajustarCampos(); desenharPrevia(); }, 160);
    }

    function trocarTela(tela) {
        $('ad-moldura').dataset.tela = tela;
        document.querySelectorAll('[data-ad-tela]').forEach((b) => {
            const ativo = b.dataset.adTela === tela;
            b.classList.toggle('is-ativo', ativo);
            b.setAttribute('aria-pressed', String(ativo));
        });
    }

    /** Arte grande vira WebP de no máximo 1600 px no lado maior. */
    async function aoEscolherArte() {
        const arquivo = $('ad-arte').files[0];
        if (!arquivo) return;
        status('Preparando a arte…');
        try {
            const img = await window.BirdTechFundo.carregarImagem(arquivo);
            const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
            const tela = document.createElement('canvas');
            tela.width = Math.round(img.width * escala);
            tela.height = Math.round(img.height * escala);
            tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
            let url = window.BirdTechFundo.exportar(tela, 880000);
            if (url.length > 880000) {
                // Arte muito detalhada: reduz mais um pouco.
                const menor = document.createElement('canvas');
                menor.width = Math.round(tela.width * 0.7);
                menor.height = Math.round(tela.height * 0.7);
                menor.getContext('2d').drawImage(tela, 0, 0, menor.width, menor.height);
                url = window.BirdTechFundo.exportar(menor, 880000);
            }
            arte = url;
            status('');
            animar = true;
            desenharPrevia();
        } catch (erro) {
            status(erro.message || 'Não foi possível abrir a imagem.', true);
        }
    }

    function atalhoLink(qual) {
        const a = lerFormulario();
        if (qual === 'whatsapp') {
            const assunto = a.titulo || (a.produto && a.produto.nome) || 'o anúncio do site';
            $('ad-link').value = `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=` + encodeURIComponent(`Olá! Vi no site: ${assunto}. Quero saber mais.`);
            if (!$('ad-botao-texto').value) $('ad-botao-texto').value = a.tipo === 'produto' ? 'Comprar agora' : 'Chamar no WhatsApp';
        } else if (qual === 'loja') {
            $('ad-link').value = a.tipo === 'produto' && a.produtoId ? '/loja.html#' + a.produtoId : '/loja.html';
            if (!$('ad-botao-texto').value) $('ad-botao-texto').value = 'Ver na loja';
        } else {
            $('ad-link').value = '';
        }
        aoMudar();
    }

    // ── Editor ──────────────────────────────────────────────────────────────

    function preencherProdutos() {
        const select = $('ad-produto');
        const atual = select.value;
        const opcoes = produtos.map((p) => {
            const o = document.createElement('option');
            o.value = p.id;
            o.textContent = `${p.nome} — ${moeda(p.preco)}${p.ativo ? '' : ' (oculto na loja)'}`;
            return o;
        });
        if (!opcoes.length) {
            const o = document.createElement('option');
            o.value = '';
            o.textContent = 'Nenhum produto na loja ainda';
            opcoes.push(o);
        }
        select.replaceChildren(...opcoes);
        if (atual && produtoPorId(atual)) select.value = atual;
    }

    function marcarRadio(nome, valor) {
        const r = document.querySelector(`input[name="${nome}"][value="${valor}"]`);
        if (r) r.checked = true;
    }

    function novo() {
        editando = null;
        arte = null;
        $('ad-form').reset();
        marcarRadio('ad-tipo', 'produto');
        marcarRadio('ad-estilo', 'bird');
        $('ad-ativo').checked = true;
        if (produtos[0]) $('ad-produto').value = produtos[0].id;
        $('ad-salvar').innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Publicar anúncio';
        $('ad-cancelar').hidden = true;
        $('ad-titulo-editor').textContent = 'Novo anúncio';
        ajustarCampos();
        desenharPrevia();
    }

    function editar(a) {
        novo();
        editando = a;
        marcarRadio('ad-tipo', a.tipo);
        marcarRadio('ad-estilo', a.estilo || 'bird');
        if (a.produtoId) $('ad-produto').value = a.produtoId;
        $('ad-selo').value = a.selo || '';
        $('ad-titulo').value = a.titulo || '';
        $('ad-chamada').value = a.chamada || '';
        $('ad-botao-texto').value = a.botaoTexto || '';
        $('ad-link').value = a.link || '';
        $('ad-preco-antigo').value = a.precoAntigo ? Number(a.precoAntigo).toFixed(2).replace('.', ',') : '';
        $('ad-inicio').value = paraCampoData(a.inicio);
        $('ad-fim').value = paraCampoData(a.fim);
        $('ad-ativo').checked = a.ativo !== false;
        $('ad-salvar').innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Salvar alterações';
        $('ad-cancelar').hidden = false;
        $('ad-titulo-editor').textContent = 'Editando anúncio';
        status('');
        ajustarCampos();
        animar = true;
        desenharPrevia();
        $('ad-editor-inicio').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function paraEnvio(a) {
        return {
            id: a.id,
            tipo: a.tipo,
            produtoId: a.produtoId,
            selo: a.selo,
            titulo: a.titulo,
            chamada: a.chamada,
            botaoTexto: a.botaoTexto,
            link: a.link,
            estilo: a.estilo,
            ativo: a.ativo,
            inicio: a.inicio,
            fim: a.fim,
            precoAntigo: a.precoAntigo,
            imagem: a.imagem
        };
    }

    async function salvar(evento) {
        evento.preventDefault();
        const a = lerFormulario();
        if (a.tipo === 'produto' && !a.produto) { status('Escolha um produto da loja.', true); return; }
        if (a.tipo === 'imagem' && !a.imagem) { status('Envie a arte do anúncio.', true); $('ad-arte').focus(); return; }
        if (Number.isNaN(a.precoAntigo)) { status('Preço antigo inválido. Use, por exemplo, 19,99.', true); return; }
        if (a.precoAntigo && a.produto && a.precoAntigo <= a.produto.preco) {
            status(`O preço antigo precisa ser maior que o preço atual (${moeda(a.produto.preco)}).`, true);
            return;
        }
        if (a.inicio && a.fim && a.fim <= a.inicio) { status('O fim precisa ser depois do início.', true); return; }

        const botao = $('ad-salvar');
        botao.disabled = true;
        status('Salvando…');
        try {
            await chamar('salvar', { anuncio: paraEnvio(a) });
            const noAr = a.ativo && (!a.inicio || a.inicio <= Date.now()) && (!a.fim || a.fim > Date.now());
            status(noAr ? 'Pronto. O anúncio entra no site em até 1 minuto.' : 'Anúncio salvo. Ele não está no ar agora (pausado ou fora do período).');
            novo();
            await listar();
        } catch (erro) {
            status(erro.message, true);
        } finally {
            botao.disabled = false;
        }
    }

    // ── Lista ───────────────────────────────────────────────────────────────

    const SITUACOES = {
        'no-ar': ['No ar', 'is-ok'],
        agendado: ['Agendado', 'is-info'],
        encerrado: ['Encerrado', 'is-neutro'],
        pausado: ['Pausado', 'is-alerta']
    };

    function botao(icone, texto, classe, acao, rotulo) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'av-botao ' + (classe || 'av-botao-secundario');
        b.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i>`;
        if (texto) b.append(' ' + texto);
        if (rotulo) {
            b.setAttribute('aria-label', rotulo);
            b.title = rotulo;
        }
        b.addEventListener('click', acao);
        return b;
    }

    function miniatura(a) {
        const caixa = document.createElement('div');
        caixa.className = 'ad-mini';
        const palco = document.createElement('div');
        palco.className = 'ad-mini-palco';
        const slide = a.tipo === 'produto' && !a.produto ? null : window.PCFTAnuncios.montar(a, { previa: true });
        if (slide) {
            slide.classList.add('an-estatico');
            slide.querySelectorAll('a').forEach((l) => { l.tabIndex = -1; l.addEventListener('click', (e) => e.preventDefault()); });
            slide.setAttribute('aria-hidden', 'true');
            palco.appendChild(slide);
        }
        caixa.appendChild(palco);
        return caixa;
    }

    function desenharResumo() {
        const noAr = anuncios.filter((a) => a.situacao === 'no-ar').length;
        const vistos = anuncios.reduce((t, a) => t + a.vistos, 0);
        const cliques = anuncios.reduce((t, a) => t + a.cliques, 0);
        const taxa = vistos ? (cliques / vistos * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—';
        const itens = [
            ['fa-broadcast-tower', numero(noAr), noAr === 1 ? 'anúncio no ar' : 'anúncios no ar'],
            ['fa-eye', numero(vistos), 'visualizações'],
            ['fa-hand-pointer', numero(cliques), 'cliques'],
            ['fa-percentage', taxa, 'taxa de clique']
        ];
        $('ad-resumo').replaceChildren(...itens.map(([icone, valor, rotulo]) => {
            const card = document.createElement('div');
            card.className = 'ad-kpi';
            card.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i>`;
            const v = document.createElement('strong');
            v.textContent = valor;
            const r = document.createElement('span');
            r.textContent = rotulo;
            card.append(v, r);
            return card;
        }));
    }

    function desenharLista() {
        const lista = $('ad-lista');
        $('ad-total').textContent = anuncios.length === 1 ? '1 anúncio' : anuncios.length + ' anúncios';
        desenharResumo();
        if (!anuncios.length) {
            const vazio = document.createElement('p');
            vazio.className = 'av-texto';
            vazio.textContent = 'Nenhum anúncio ainda. Crie o primeiro acima.';
            lista.replaceChildren(vazio);
            return;
        }
        lista.replaceChildren(...anuncios.map((a, i) => {
            const item = document.createElement('article');
            item.className = 'ad-item' + (a.situacao === 'no-ar' ? '' : ' is-fora');

            const info = document.createElement('div');
            info.className = 'ad-item-info';

            const topo = document.createElement('div');
            topo.className = 'ad-item-topo';
            const [texto, classe] = SITUACOES[a.situacao] || SITUACOES.pausado;
            const chip = document.createElement('span');
            chip.className = 'ad-situacao ' + classe;
            chip.textContent = texto;
            const tipo = document.createElement('span');
            tipo.className = 'ad-tipo';
            tipo.textContent = a.tipo === 'produto' ? 'Produto' : 'Arte própria';
            topo.append(chip, tipo);
            if (a.tipo === 'produto' && (!a.produto || !a.produto.ativo)) {
                const aviso = document.createElement('span');
                aviso.className = 'ad-situacao is-alerta';
                aviso.textContent = a.produto ? 'Produto oculto na loja' : 'Produto apagado';
                topo.append(aviso);
            }

            const nome = document.createElement('strong');
            nome.textContent = a.titulo || (a.produto ? a.produto.nome : 'Arte sem título');

            const periodo = document.createElement('small');
            const partes = [];
            if (a.inicio) partes.push('de ' + new Date(a.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
            if (a.fim) partes.push('até ' + new Date(a.fim).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
            periodo.textContent = partes.length ? partes.join(' ') : 'Sem data para acabar';

            const numeros = document.createElement('div');
            numeros.className = 'ad-numeros';
            const taxa = a.vistos ? (a.cliques / a.vistos * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—';
            [['fa-eye', numero(a.vistos), 'visualizações'], ['fa-hand-pointer', numero(a.cliques), 'cliques'], ['fa-percentage', taxa, 'taxa']].forEach(([icone, valor, rotulo]) => {
                const n = document.createElement('span');
                n.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i> `;
                const b = document.createElement('b');
                b.textContent = valor;
                n.append(b, ' ' + rotulo);
                numeros.append(n);
            });

            info.append(topo, nome, periodo, numeros);

            const acoes = document.createElement('div');
            acoes.className = 'ad-item-acoes';
            const subir = botao('fa-arrow-up', '', null, () => mover(i, -1), 'Mostrar antes');
            const descer = botao('fa-arrow-down', '', null, () => mover(i, 1), 'Mostrar depois');
            subir.disabled = i === 0;
            descer.disabled = i === anuncios.length - 1;
            acoes.append(
                subir,
                descer,
                botao('fa-pen', 'Editar', null, () => editar(a)),
                botao(a.ativo ? 'fa-pause' : 'fa-play', a.ativo ? 'Pausar' : 'Ativar', null, () => alternar(a)),
                botao('fa-trash-alt', 'Remover', 'av-botao-secundario bl-remover', () => remover(a))
            );

            item.append(miniatura(a), info, acoes);
            return item;
        }));
    }

    async function listar() {
        try {
            const json = await chamar('listar');
            anuncios = json.anuncios || [];
            produtos = (json.produtos || []).sort((a, b) => (a.ordem - b.ordem));
            preencherProdutos();
            desenharLista();
            if (!carregado && !editando) novo();
            carregado = true;
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function alternar(a) {
        try {
            await chamar('salvar', { anuncio: paraEnvio({ ...a, ativo: !a.ativo, imagem: a.tipo === 'imagem' ? a.imagem : undefined }) });
            await listar();
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function mover(i, direcao) {
        const j = i + direcao;
        if (j < 0 || j >= anuncios.length) return;
        const ordem = anuncios.slice();
        [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
        anuncios = ordem;
        desenharLista();
        try {
            await chamar('ordenar', { ids: ordem.map((a) => a.id) });
        } catch (erro) {
            status(erro.message, true);
            await listar();
        }
    }

    async function remover(a) {
        const nome = a.titulo || (a.produto ? a.produto.nome : 'este anúncio');
        if (!window.confirm(`Remover o anúncio "${nome}"? Isso não pode ser desfeito.`)) return;
        try {
            await chamar('remover', { id: a.id });
            if (editando && editando.id === a.id) novo();
            await listar();
            status('Anúncio removido.');
        } catch (erro) {
            status(erro.message, true);
        }
    }

    // ── Início ──────────────────────────────────────────────────────────────

    function iniciar() {
        const form = $('ad-form');
        if (!form || !window.PCFTAnuncios) return;
        form.addEventListener('submit', salvar);
        form.addEventListener('input', (e) => { if (e.target.id !== 'ad-arte') aoMudar(); });
        form.addEventListener('change', (e) => {
            if (e.target.id === 'ad-arte') aoEscolherArte();
            else { animar = e.target.name === 'ad-tipo' || e.target.id === 'ad-produto' || e.target.name === 'ad-estilo'; aoMudar(); }
        });
        document.querySelectorAll('[data-ad-link]').forEach((b) => b.addEventListener('click', () => atalhoLink(b.dataset.adLink)));
        document.querySelectorAll('[data-ad-tela]').forEach((b) => b.addEventListener('click', () => { trocarTela(b.dataset.adTela); animar = true; desenharPrevia(); }));
        $('ad-animar').addEventListener('click', () => { animar = true; desenharPrevia(); });
        $('ad-cancelar').addEventListener('click', () => { novo(); status(''); });
        if ('ResizeObserver' in window) new ResizeObserver(escalar).observe($('ad-moldura'));
        ajustarCampos();
    }

    const trocarAbaOriginal = window.switchTab;
    if (typeof trocarAbaOriginal === 'function') {
        window.switchTab = function (aba) {
            const resultado = trocarAbaOriginal.apply(this, arguments);
            if (aba === 'anuncios' && !carregado) listar();
            return resultado;
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    window.PCFTAnunciosAdmin = { listar, novo };
})();
