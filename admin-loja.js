// Aba "Loja Bird Tech" do painel: cadastro dos produtos da loja (loja.html).
//
// A foto enviada passa por loja-fundo.js: o fundo claro é recortado e o
// produto é montado no fundo azul Bird Tech com o nome na etiqueta. A prévia
// mostra exatamente a imagem que vai para a loja. Tudo é gravado por
// /api/loja com o login do administrador.

(function () {
    'use strict';

    const ROTA = '/api/loja';
    const $ = (id) => document.getElementById(id);

    let produtos = [];
    let categorias = {};
    let carregado = false;

    // Estado do editor.
    let editando = null;      // produto em edição (ou null para novo)
    let fotoBase = null;      // canvas/imagem do produto já recortado
    let fotoMudou = false;    // o usuário escolheu uma foto nova
    let imagemPronta = null;  // imagem enviada sem aplicar o fundo

    function status(texto, erro) {
        const el = $('bl-status');
        el.textContent = texto || '';
        el.classList.toggle('is-erro', Boolean(erro));
    }

    async function chamar(acao, dados) {
        const usuario = window.firebase && firebase.auth && firebase.auth().currentUser;
        if (!usuario) throw new Error('Para mexer na loja, entre no painel com e-mail e senha (ou biometria).');
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

    const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /** "14,99", "14.99", "R$ 1.299,90" → número. */
    function lerPreco(texto) {
        const limpo = String(texto || '').replace(/[^\d,.]/g, '');
        if (!limpo) return NaN;
        const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
        return Math.round(parseFloat(normal) * 100) / 100;
    }

    // ── Prévia ──────────────────────────────────────────────────────────────

    const tela = () => $('bl-previa');

    function limparPrevia(mensagem) {
        tela().parentElement.classList.add('is-vazia');
        const c = tela();
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#e4e4e4';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#6b7280';
        ctx.font = '600 30px Manrope, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mensagem || 'Escolha a foto do produto', c.width / 2, c.height / 2);
    }

    function desenharNaPrevia(imagem) {
        tela().parentElement.classList.remove('is-vazia');
        const c = tela();
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        const escala = Math.min(c.width / imagem.width, c.height / imagem.height);
        const w = imagem.width * escala;
        const h = imagem.height * escala;
        ctx.fillStyle = '#e4e4e4';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(imagem, (c.width - w) / 2, (c.height - h) / 2, w, h);
    }

    let pedidoPrevia = 0;
    async function atualizarPrevia() {
        const aviso = $('bl-aviso-nome');
        aviso.hidden = true;

        if (!$('bl-aplicar-fundo').checked) {
            if (imagemPronta) desenharNaPrevia(imagemPronta);
            else if (editando && editando.imagem) desenharNaPrevia(await window.BirdTechFundo.carregarImagem(editando.imagem));
            else limparPrevia();
            return;
        }

        if (fotoBase) {
            const meu = ++pedidoPrevia;
            const { canvas } = await window.BirdTechFundo.montar(fotoBase, $('bl-nome').value, { recortarFundo: false });
            if (meu !== pedidoPrevia) return; // chegou um pedido mais novo
            tela().parentElement.classList.remove('is-vazia');
            tela().getContext('2d').drawImage(canvas, 0, 0);
            return;
        }

        if (editando && editando.imagem) {
            // Arte pronta sem foto base (ex.: os produtos iniciais): a etiqueta
            // não acompanha o nome novo sem uma foto nova.
            desenharNaPrevia(await window.BirdTechFundo.carregarImagem(editando.imagem));
            aviso.hidden = $('bl-nome').value.trim() === editando.nome;
            return;
        }
        limparPrevia();
    }

    let esperaNome;
    function aoMudarNome() {
        clearTimeout(esperaNome);
        esperaNome = setTimeout(atualizarPrevia, 220);
    }

    async function aoEscolherFoto() {
        const arquivo = $('bl-foto').files[0];
        if (!arquivo) return;
        status('Preparando a imagem…');
        try {
            const img = await window.BirdTechFundo.carregarImagem(arquivo);
            fotoMudou = true;
            imagemPronta = img;
            await prepararFotoBase(img);
            await atualizarPrevia();
            status('');
            // No celular a prévia fica abaixo do formulário: leva até ela.
            if (window.matchMedia('(max-width: 860px)').matches) tela().scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (erro) {
            status(erro.message || 'Não foi possível abrir a foto.', true);
        }
    }

    async function prepararFotoBase(img) {
        if ($('bl-recortar').checked) {
            const r = window.BirdTechFundo.recortar(img);
            fotoBase = r.imagem;
            $('bl-recorte-info').textContent = r.recortado
                ? 'Fundo claro recortado automaticamente.'
                : 'O fundo da foto não é liso e claro: o produto entra com o fundo original.';
        } else {
            fotoBase = img;
            $('bl-recorte-info').textContent = '';
        }
    }

    // ── Editor ──────────────────────────────────────────────────────────────

    function preencherCategorias() {
        const select = $('bl-categoria');
        const atual = select.value;
        select.replaceChildren(...Object.entries(categorias).map(([id, nome]) => {
            const o = document.createElement('option');
            o.value = id;
            o.textContent = nome;
            return o;
        }));
        if (atual) select.value = atual;
    }

    function novo() {
        editando = null;
        fotoBase = null;
        fotoMudou = false;
        imagemPronta = null;
        $('bl-form').reset();
        $('bl-aplicar-fundo').checked = true;
        $('bl-recortar').checked = true;
        $('bl-ativo').checked = true;
        $('bl-recorte-info').textContent = '';
        $('bl-salvar').innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Cadastrar produto';
        $('bl-cancelar').hidden = true;
        $('bl-titulo-editor').textContent = 'Novo produto';
        limparPrevia();
        $('bl-aviso-nome').hidden = true;
    }

    async function editar(p) {
        novo();
        editando = p;
        $('bl-nome').value = p.nome;
        $('bl-preco').value = Number(p.preco).toFixed(2).replace('.', ',');
        $('bl-categoria').value = p.categoria;
        $('bl-descricao').value = p.descricao || '';
        $('bl-ativo').checked = p.ativo !== false;
        $('bl-salvar').innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Salvar alterações';
        $('bl-cancelar').hidden = false;
        $('bl-titulo-editor').textContent = 'Editando: ' + p.nome;
        status('');
        if (p.fotoBase) {
            try { fotoBase = await window.BirdTechFundo.carregarImagem(p.fotoBase); } catch (e) { fotoBase = null; }
        }
        await atualizarPrevia();
        $('bl-editor-inicio').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function salvar(evento) {
        evento.preventDefault();
        const nome = $('bl-nome').value.trim();
        const preco = lerPreco($('bl-preco').value);
        if (nome.length < 2) { status('Escreva o nome do produto.', true); $('bl-nome').focus(); return; }
        if (!(preco > 0)) { status('Preço inválido. Use, por exemplo, 14,99.', true); $('bl-preco').focus(); return; }
        if (!editando && !fotoMudou) { status('Escolha a foto do produto.', true); $('bl-foto').focus(); return; }

        const produto = {
            id: editando ? editando.id : undefined,
            nome,
            preco,
            categoria: $('bl-categoria').value,
            descricao: $('bl-descricao').value.trim(),
            ativo: $('bl-ativo').checked,
            ordem: editando ? editando.ordem : 0
        };

        const aplicarFundo = $('bl-aplicar-fundo').checked;
        const nomeMudou = editando && nome !== editando.nome;
        // A arte só é refeita quando precisa: foto nova, ou nome novo com foto base.
        if (fotoMudou || (aplicarFundo && nomeMudou && fotoBase)) {
            if (aplicarFundo) {
                const { canvas } = await window.BirdTechFundo.montar(fotoBase, nome, { recortarFundo: false });
                produto.imagem = window.BirdTechFundo.exportar(canvas);
                produto.fotoBase = window.BirdTechFundo.exportarBase(fotoBase);
            } else {
                const c = document.createElement('canvas');
                const escala = Math.min(1, 940 / imagemPronta.width);
                c.width = Math.round(imagemPronta.width * escala);
                c.height = Math.round(imagemPronta.height * escala);
                c.getContext('2d').drawImage(imagemPronta, 0, 0, c.width, c.height);
                produto.imagem = window.BirdTechFundo.exportar(c);
                produto.fotoBase = null;
            }
        }

        const botao = $('bl-salvar');
        botao.disabled = true;
        status('Salvando…');
        try {
            await chamar('salvar', { produto });
            status(editando ? 'Produto atualizado. Já aparece na loja.' : 'Produto cadastrado. Já aparece na loja.');
            novo();
            await listar();
        } catch (erro) {
            status(erro.message, true);
        } finally {
            botao.disabled = false;
        }
    }

    // ── Lista ───────────────────────────────────────────────────────────────

    function botao(icone, texto, classe, acao) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'av-botao ' + (classe || 'av-botao-secundario');
        b.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i> `;
        b.append(texto);
        b.addEventListener('click', acao);
        return b;
    }

    function desenharLista() {
        const lista = $('bl-lista');
        $('bl-total').textContent = produtos.length === 1 ? '1 produto' : produtos.length + ' produtos';
        if (!produtos.length) {
            const vazio = document.createElement('p');
            vazio.className = 'av-texto';
            vazio.textContent = 'Nenhum produto cadastrado ainda.';
            lista.replaceChildren(vazio);
            return;
        }
        lista.replaceChildren(...produtos.map((p) => {
            const item = document.createElement('article');
            item.className = 'bl-item' + (p.ativo ? '' : ' is-oculto');

            const img = document.createElement('img');
            img.src = p.imagem;
            img.alt = '';
            img.loading = 'lazy';
            img.width = 94;
            img.height = 91;

            const info = document.createElement('div');
            info.className = 'bl-item-info';
            const nome = document.createElement('strong');
            nome.textContent = p.nome;
            const detalhes = document.createElement('small');
            detalhes.textContent = `${moeda(p.preco)} · ${categorias[p.categoria] || p.categoria}${p.ativo ? '' : ' · oculto na loja'}`;
            info.append(nome, detalhes);

            const acoes = document.createElement('div');
            acoes.className = 'bl-item-acoes';
            acoes.append(
                botao('fa-pen', 'Editar', null, () => editar(p)),
                botao(p.ativo ? 'fa-eye-slash' : 'fa-eye', p.ativo ? 'Ocultar' : 'Mostrar', null, () => alternar(p)),
                botao('fa-trash-alt', 'Remover', 'av-botao-secundario bl-remover', () => remover(p))
            );

            item.append(img, info, acoes);
            return item;
        }));
    }

    async function listar() {
        try {
            const json = await chamar('listar');
            categorias = json.categorias || {};
            produtos = json.produtos || [];
            preencherCategorias();
            desenharLista();
            carregado = true;
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function alternar(p) {
        try {
            await chamar('salvar', { produto: { id: p.id, nome: p.nome, preco: p.preco, categoria: p.categoria, descricao: p.descricao, ordem: p.ordem, ativo: !p.ativo } });
            await listar();
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function remover(p) {
        if (!window.confirm(`Remover "${p.nome}" da loja? Isso não pode ser desfeito.`)) return;
        try {
            await chamar('remover', { id: p.id });
            if (editando && editando.id === p.id) novo();
            await listar();
            status('Produto removido.');
        } catch (erro) {
            status(erro.message, true);
        }
    }

    // ── Início ──────────────────────────────────────────────────────────────

    function iniciar() {
        const form = $('bl-form');
        if (!form || !window.BirdTechFundo) return;
        form.addEventListener('submit', salvar);
        $('bl-nome').addEventListener('input', aoMudarNome);
        $('bl-foto').addEventListener('change', aoEscolherFoto);
        $('bl-aplicar-fundo').addEventListener('change', atualizarPrevia);
        $('bl-recortar').addEventListener('change', async () => {
            if (imagemPronta) { await prepararFotoBase(imagemPronta); await atualizarPrevia(); }
        });
        $('bl-cancelar').addEventListener('click', () => { novo(); status(''); });
        novo();
    }

    // A lista carrega na primeira vez que a aba abre (inclusive quando o
    // painel volta direto para ela depois de recarregar).
    const trocarAbaOriginal = window.switchTab;
    if (typeof trocarAbaOriginal === 'function') {
        window.switchTab = function (aba) {
            const resultado = trocarAbaOriginal.apply(this, arguments);
            if (aba === 'loja' && !carregado) listar();
            return resultado;
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    window.PCFTLojaAdmin = { listar, novo };
})();
