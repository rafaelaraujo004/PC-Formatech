// Anúncios do banner da página principal (carrossel de imagens).
//
//   GET  /api/anuncios               → anúncios no ar agora, já com os dados do produto
//   GET  /api/anuncios?img=<id>&v=…  → arte enviada para um anúncio de imagem própria
//   POST /api/anuncios { acao: 'metrica', id, tipo: 'visto'|'clique' } — público
//   POST /api/anuncios { acao, idToken, … } — só administrador:
//        listar   → todos os anúncios, com visualizações e cliques
//        salvar   → cria ou atualiza { anuncio }
//        remover  → apaga { id }
//        ordenar  → { ids: [...] } na ordem em que devem aparecer
//
// Há dois tipos: "produto" (um produto da loja Bird Tech, com nome, preço e foto
// puxados do cadastro da loja) e "imagem" (uma arte própria, ex.: promoção).

const { iniciarAdmin } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');
const loja = require('./loja');

const COLECAO = 'anuncios';
const PRODUTOS = 'lojaProdutos';
const ESTILOS = ['bird', 'noite', 'ouro'];
const MAX_IMAGEM = 900_000;
const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

const texto = (valor, max) => String(valor || '').trim().replace(/\s+/g, ' ').slice(0, max);

/** Primeira vez: cada produto da loja ganha um anúncio, para o banner já nascer com a loja. */
async function garantirAnunciosIniciais(db) {
    const marcaRef = db.collection('lojaConfig').doc('estado');
    const marca = await marcaRef.get();
    if (marca.exists && marca.data().anunciosSemeados) return;

    await loja.garantirCatalogoInicial(db);
    const produtos = (await db.collection(PRODUTOS).get()).docs
        .filter((d) => d.data().ativo !== false)
        .sort((a, b) => (Number(a.data().ordem) || 0) - (Number(b.data().ordem) || 0));

    await db.runTransaction(async (tx) => {
        const atual = await tx.get(marcaRef);
        if (atual.exists && atual.data().anunciosSemeados) return;
        const agora = Date.now();
        produtos.forEach((p, i) => {
            tx.set(db.collection(COLECAO).doc(), {
                tipo: 'produto',
                produtoId: p.id,
                selo: i === 0 ? 'Novidade' : 'Pronta entrega',
                titulo: '',
                chamada: '',
                precoAntigo: null,
                botaoTexto: '',
                link: '',
                estilo: 'bird',
                ativo: true,
                ordem: i + 1,
                inicio: null,
                fim: null,
                vistos: 0,
                cliques: 0,
                criadoEm: agora,
                atualizadoEm: agora
            });
        });
        tx.set(marcaRef, { anunciosSemeados: true }, { merge: true });
    });
}

function situacao(d, agora) {
    if (d.ativo === false) return 'pausado';
    if (d.inicio && agora < d.inicio) return 'agendado';
    if (d.fim && agora > d.fim) return 'encerrado';
    return 'no-ar';
}

/** Documento → o que a página recebe. Anúncio de produto oculto ou apagado devolve null. */
function paraSaida(doc, produtosPorId, paraPainel, agora) {
    const d = doc.data();
    const base = {
        id: doc.id,
        tipo: d.tipo === 'imagem' ? 'imagem' : 'produto',
        selo: d.selo || '',
        titulo: d.titulo || '',
        chamada: d.chamada || '',
        botaoTexto: d.botaoTexto || '',
        link: d.link || '',
        estilo: ESTILOS.includes(d.estilo) ? d.estilo : 'bird',
        precoAntigo: d.precoAntigo || null,
        fim: d.fim || null
    };

    if (base.tipo === 'produto') {
        const p = produtosPorId.get(d.produtoId);
        if (!p && !paraPainel) return null;
        if (p && !p.ativo && !paraPainel) return null;
        base.produto = p ? { id: p.id, nome: p.nome, preco: p.preco, descricao: p.descricao, imagem: p.imagem, ativo: p.ativo } : null;
    } else {
        base.imagem = d.imagemDados ? `/api/anuncios?img=${encodeURIComponent(doc.id)}&v=${d.atualizadoEm || 0}` : null;
        if (!base.imagem && !paraPainel) return null;
    }

    if (paraPainel) {
        Object.assign(base, {
            produtoId: d.produtoId || null,
            ativo: d.ativo !== false,
            ordem: Number(d.ordem) || 0,
            inicio: d.inicio || null,
            vistos: Number(d.vistos) || 0,
            cliques: Number(d.cliques) || 0,
            situacao: situacao(d, agora),
            criadoEm: d.criadoEm || 0
        });
    }
    return base;
}

async function carregar(db, paraPainel) {
    const [anuncios, produtos] = await Promise.all([
        db.collection(COLECAO).get(),
        db.collection(PRODUTOS).get()
    ]);
    const produtosPorId = new Map(produtos.docs.map((d) => [d.id, loja.paraSaida(d, false)]));
    const agora = Date.now();
    const docs = anuncios.docs
        .filter((d) => paraPainel || situacao(d.data(), agora) === 'no-ar')
        .sort((a, b) => ((Number(a.data().ordem) || 0) - (Number(b.data().ordem) || 0)) || ((b.data().criadoEm || 0) - (a.data().criadoEm || 0)));
    return {
        anuncios: docs.map((d) => paraSaida(d, produtosPorId, paraPainel, agora)).filter(Boolean),
        produtos: paraPainel ? [...produtosPorId.values()] : undefined
    };
}

function lerData(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) throw new ErroDeAcesso(400, 'Data inválida.');
    return Math.round(n);
}

function validarLink(valor) {
    const link = String(valor || '').trim().slice(0, 400);
    if (!link) return '';
    if (/^(https:\/\/|\/(?!\/)|#)/.test(link)) return link;
    throw new ErroDeAcesso(400, 'O link precisa começar com https://, / ou #.');
}

async function validarAnuncio(db, entrada) {
    const tipo = entrada.tipo === 'imagem' ? 'imagem' : 'produto';
    const saida = {
        tipo,
        selo: texto(entrada.selo, 24),
        titulo: texto(entrada.titulo, 70),
        chamada: texto(entrada.chamada, 150),
        botaoTexto: texto(entrada.botaoTexto, 28),
        link: validarLink(entrada.link),
        estilo: ESTILOS.includes(entrada.estilo) ? entrada.estilo : 'bird',
        ativo: entrada.ativo !== false,
        inicio: lerData(entrada.inicio),
        fim: lerData(entrada.fim),
        produtoId: null,
        precoAntigo: null
    };
    if (saida.inicio && saida.fim && saida.fim <= saida.inicio) throw new ErroDeAcesso(400, 'O fim precisa ser depois do início.');

    if (tipo === 'produto') {
        const produto = await db.collection(PRODUTOS).doc(String(entrada.produtoId || '-')).get();
        if (!produto.exists) throw new ErroDeAcesso(400, 'Escolha um produto da loja.');
        saida.produtoId = produto.id;
        if (entrada.precoAntigo !== null && entrada.precoAntigo !== undefined && entrada.precoAntigo !== '') {
            const antigo = Math.round(Number(entrada.precoAntigo) * 100) / 100;
            if (!Number.isFinite(antigo) || antigo <= 0 || antigo > 100000) throw new ErroDeAcesso(400, 'Preço antigo inválido.');
            if (antigo <= Number(produto.data().preco)) throw new ErroDeAcesso(400, 'O preço antigo precisa ser maior que o preço atual do produto.');
            saida.precoAntigo = antigo;
        }
        saida.imagemDados = null;
    } else if (entrada.imagem !== undefined && entrada.imagem !== null) {
        const imagem = String(entrada.imagem);
        if (DATA_URL.test(imagem)) {
            if (imagem.length > MAX_IMAGEM) throw new ErroDeAcesso(413, 'A imagem ficou grande demais. Tente outra.');
            saida.imagemDados = imagem;
        } else if (!imagem.startsWith('/api/anuncios?img=')) {
            // A URL /api/anuncios?img= é a arte atual voltando sem mudança: mantém.
            throw new ErroDeAcesso(400, 'Imagem inválida.');
        }
    }
    return saida;
}

async function servirImagem(db, id, res) {
    const doc = await db.collection(COLECAO).doc(String(id)).get();
    const dados = doc.exists ? doc.data().imagemDados : null;
    const partes = dados && /^data:(image\/[a-z]+);base64,(.+)$/.exec(dados);
    if (!partes) return res.status(404).end();
    res.setHeader('Content-Type', partes[1]);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(Buffer.from(partes[2], 'base64'));
}

async function registrarMetrica(admin, db, corpo, res) {
    const campo = corpo.tipo === 'clique' ? 'cliques' : (corpo.tipo === 'visto' ? 'vistos' : null);
    const id = String(corpo.id || '');
    if (!campo || !/^[\w-]{1,64}$/.test(id)) return res.status(400).json({ error: 'Métrica inválida.' });
    try {
        await db.collection(COLECAO).doc(id).update({ [campo]: admin.firestore.FieldValue.increment(1) });
    } catch (erro) {
        return res.status(404).json({ error: 'Anúncio não encontrado.' });
    }
    return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        if (req.method === 'GET') {
            if (req.query && req.query.img) return servirImagem(db, req.query.img, res);
            await garantirAnunciosIniciais(db);
            const { anuncios } = await carregar(db, false);
            res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
            return res.status(200).json({ ok: true, anuncios });
        }

        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
        if (corpo.acao === 'metrica') return registrarMetrica(admin, db, corpo, res);

        await exigirAdmin(admin, corpo.idToken);

        if (corpo.acao === 'listar') {
            await garantirAnunciosIniciais(db);
            return res.status(200).json({ ok: true, ...(await carregar(db, true)) });
        }

        if (corpo.acao === 'salvar') {
            const entrada = corpo.anuncio || {};
            const dados = await validarAnuncio(db, entrada);
            const agora = Date.now();
            let ref;
            if (entrada.id) {
                ref = db.collection(COLECAO).doc(String(entrada.id));
                if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Anúncio não encontrado.');
                await ref.set({ ...dados, atualizadoEm: agora }, { merge: true });
            } else {
                if (dados.tipo === 'imagem' && !dados.imagemDados) throw new ErroDeAcesso(400, 'Escolha a imagem do anúncio.');
                const ultimos = await db.collection(COLECAO).orderBy('ordem', 'desc').limit(1).get();
                const ordem = ultimos.empty ? 1 : (Number(ultimos.docs[0].data().ordem) || 0) + 1;
                ref = db.collection(COLECAO).doc();
                await ref.set({ ...dados, ordem, vistos: 0, cliques: 0, criadoEm: agora, atualizadoEm: agora });
            }
            return res.status(200).json({ ok: true, id: ref.id });
        }

        if (corpo.acao === 'ordenar') {
            const ids = Array.isArray(corpo.ids) ? corpo.ids.map(String).slice(0, 200) : [];
            const lote = db.batch();
            ids.forEach((id, i) => lote.update(db.collection(COLECAO).doc(id), { ordem: i + 1 }));
            await lote.commit();
            return res.status(200).json({ ok: true });
        }

        if (corpo.acao === 'remover') {
            const ref = db.collection(COLECAO).doc(String(corpo.id || '-'));
            if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Anúncio não encontrado.');
            await ref.delete();
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (erro) {
        if (erro instanceof ErroDeAcesso) return res.status(erro.status).json({ error: erro.message });
        console.error('anuncios:', erro);
        return res.status(500).json({ error: 'Não foi possível concluir. Tente de novo.' });
    }
};
