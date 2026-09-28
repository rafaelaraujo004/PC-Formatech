// Loja Bird Tech: vitrine pública e cadastro de produtos pelo painel.
//
//   GET  /api/loja              → produtos ativos (vitrine)
//   GET  /api/loja?img=<id>&v=… → foto do produto (cache longo, versionada)
//   POST /api/loja { acao, idToken, … } — só administrador:
//        listar   → todos os produtos, inclusive os ocultos
//        salvar   → cria ou atualiza { produto }
//        remover  → apaga { id }
//
// A leitura e a gravação passam por aqui (Firebase Admin), então a vitrine
// não depende das regras do Firestore. As fotos enviadas pelo painel já vêm
// montadas no fundo Bird Tech (loja-fundo.js) e ficam no próprio documento.

const { iniciarAdmin } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');
const CATALOGO_INICIAL = require('../loja-produtos.json');

const COLECAO = 'lojaProdutos';
const CATEGORIAS = Object.keys(CATALOGO_INICIAL.categorias);
// Tamanho dos data URLs, em caracteres. Somados cabem com folga no limite
// de 1 MB por documento do Firestore.
const MAX_IMAGEM = 700_000;
const MAX_FOTO_BASE = 300_000;
const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

/** Primeira visita: grava os produtos iniciais uma única vez. */
async function garantirCatalogoInicial(db) {
    const marcaRef = db.collection('lojaConfig').doc('estado');
    await db.runTransaction(async (tx) => {
        const marca = await tx.get(marcaRef);
        if (marca.exists && marca.data().semeado) return;
        const agora = Date.now();
        CATALOGO_INICIAL.produtos.forEach((p) => {
            const { id, ...dados } = p;
            tx.set(db.collection(COLECAO).doc(id), { ...dados, criadoEm: agora, atualizadoEm: agora });
        });
        tx.set(marcaRef, { semeado: true, semeadoEm: agora }, { merge: true });
    });
}

/**
 * Documento do Firestore → o que a página recebe (sem o data URL pesado).
 * No painel vem também a foto recortada do produto (fotoBase), que permite
 * remontar a arte quando o nome muda.
 */
function paraSaida(doc, paraPainel) {
    const d = doc.data();
    const imagem = d.imagemDados
        ? `/api/loja?img=${encodeURIComponent(doc.id)}&v=${d.atualizadoEm || 0}`
        : (d.imagem || null);
    return {
        id: doc.id,
        nome: d.nome,
        preco: d.preco,
        categoria: d.categoria,
        descricao: d.descricao || '',
        imagem,
        ativo: d.ativo !== false,
        ordem: Number(d.ordem) || 0,
        criadoEm: d.criadoEm || 0,
        ...(paraPainel ? { fotoBase: d.fotoBaseDados ? `/api/loja?img=${encodeURIComponent(doc.id)}&base=1&v=${d.atualizadoEm || 0}` : null } : {})
    };
}

function ordenar(lista) {
    return lista.sort((a, b) => (a.ordem - b.ordem) || (b.criadoEm - a.criadoEm));
}

function validarProduto(entrada) {
    const nome = String(entrada.nome || '').trim().replace(/\s+/g, ' ');
    if (nome.length < 2 || nome.length > 80) throw new ErroDeAcesso(400, 'O nome precisa ter entre 2 e 80 caracteres.');

    const preco = Math.round(Number(entrada.preco) * 100) / 100;
    if (!Number.isFinite(preco) || preco <= 0 || preco > 100000) throw new ErroDeAcesso(400, 'Preço inválido.');

    const categoria = CATEGORIAS.includes(entrada.categoria) ? entrada.categoria : 'outros';
    const descricao = String(entrada.descricao || '').trim().slice(0, 600);
    const ordem = Math.max(0, Math.min(9999, parseInt(entrada.ordem, 10) || 0));

    const saida = { nome, preco, categoria, descricao, ordem, ativo: entrada.ativo !== false };

    if (entrada.imagem !== undefined && entrada.imagem !== null) {
        const imagem = String(entrada.imagem);
        if (DATA_URL.test(imagem)) {
            if (imagem.length > MAX_IMAGEM) throw new ErroDeAcesso(413, 'A foto ficou grande demais. Tente outra imagem.');
            saida.imagemDados = imagem;
            saida.imagem = null;
        } else if (/^\/images\/loja\/[\w.-]+\.(webp|png|jpe?g)$/.test(imagem)) {
            saida.imagem = imagem;
            saida.imagemDados = null;
        } else if (!imagem.startsWith('/api/loja?img=')) {
            // Uma URL /api/loja?img= é a foto atual voltando sem mudança: mantém.
            throw new ErroDeAcesso(400, 'Imagem inválida.');
        }
    }

    // Foto do produto já recortada, sem o fundo Bird Tech.
    if (entrada.fotoBase !== undefined) {
        const base = entrada.fotoBase === null ? null : String(entrada.fotoBase);
        if (base && (!DATA_URL.test(base) || base.length > MAX_FOTO_BASE)) throw new ErroDeAcesso(400, 'Foto base inválida.');
        saida.fotoBaseDados = base;
    }
    return saida;
}

async function servirImagem(db, id, base, res) {
    const doc = await db.collection(COLECAO).doc(String(id)).get();
    const dados = doc.exists ? doc.data()[base ? 'fotoBaseDados' : 'imagemDados'] : null;
    const partes = dados && /^data:(image\/[a-z]+);base64,(.+)$/.exec(dados);
    if (!partes) return res.status(404).end();
    res.setHeader('Content-Type', partes[1]);
    // A URL carrega a versão (?v=atualizadoEm): trocar a foto muda a URL.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(Buffer.from(partes[2], 'base64'));
}

module.exports = async function handler(req, res) {
    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        if (req.method === 'GET') {
            if (req.query && req.query.img) return servirImagem(db, req.query.img, req.query.base === '1', res);

            await garantirCatalogoInicial(db);
            const snap = await db.collection(COLECAO).get();
            const produtos = ordenar(snap.docs.map((d) => paraSaida(d, false)).filter((p) => p.ativo));
            res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=120');
            return res.status(200).json({ ok: true, categorias: CATALOGO_INICIAL.categorias, produtos });
        }

        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
        await exigirAdmin(admin, corpo.idToken);

        if (corpo.acao === 'listar') {
            await garantirCatalogoInicial(db);
            const snap = await db.collection(COLECAO).get();
            return res.status(200).json({ ok: true, categorias: CATALOGO_INICIAL.categorias, produtos: ordenar(snap.docs.map((d) => paraSaida(d, true))) });
        }

        if (corpo.acao === 'salvar') {
            const entrada = corpo.produto || {};
            const dados = validarProduto(entrada);
            const agora = Date.now();
            let ref;
            if (entrada.id) {
                ref = db.collection(COLECAO).doc(String(entrada.id));
                const atual = await ref.get();
                if (!atual.exists) throw new ErroDeAcesso(404, 'Produto não encontrado.');
                await ref.set({ ...dados, atualizadoEm: agora }, { merge: true });
            } else {
                if (!dados.imagemDados && !dados.imagem) throw new ErroDeAcesso(400, 'Escolha uma foto para o produto.');
                ref = db.collection(COLECAO).doc();
                await ref.set({ ...dados, criadoEm: agora, atualizadoEm: agora });
            }
            return res.status(200).json({ ok: true, produto: paraSaida(await ref.get(), true) });
        }

        if (corpo.acao === 'remover') {
            const ref = db.collection(COLECAO).doc(String(corpo.id || '-'));
            if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Produto não encontrado.');
            await ref.delete();
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (erro) {
        if (erro instanceof ErroDeAcesso) return res.status(erro.status).json({ error: erro.message });
        console.error('loja:', erro);
        return res.status(500).json({ error: 'Não foi possível concluir. Tente de novo.' });
    }
};
