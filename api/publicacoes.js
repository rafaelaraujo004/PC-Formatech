// Artes de divulgação (aba "Divulgação" do painel): imagens prontas da PC
// Formatech, da Bird Tech, de Apps e sistemas e de promoções de datas
// especiais (estas com período de validade), cada uma com legenda e link, para
// compartilhar direto do celular.
//
//   GET  /api/publicacoes?img=<id>&v=… → a imagem (cache longo, versionada)
//   GET  /api/publicacoes?lembrar=1    → manda os lembretes da programação que
//        venceram (GitHub Actions a cada 15 min e o painel aberto; as visitas
//        também verificam — ver api/_lembretes.js)
//   POST /api/publicacoes { acao, idToken, … } — só administrador:
//        listar         → todas as artes
//        salvar         → cria ou atualiza { publicacao }
//        remover        → apaga { id }
//        agenda         → programação e o que já foi feito hoje
//        agenda-salvar  → grava { entradas } (ver agenda-divulgacao.js)
//        agenda-marcar  → { chave, onde, estado: 'postado' | 'pulado' }
//
// As artes iniciais vêm de publicacoes-iniciais.json (imagens em
// /images/divulgacao/). Cada uma entra uma vez; se for removida no painel,
// não volta.

const { iniciarAdmin } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');
const Agenda = require('../agenda-divulgacao.js');
const { AGENDA, lembrar, _reiniciar } = require('./_lembretes');
const INICIAIS = require('../publicacoes-iniciais.json');

const COLECAO = 'publicacoes';
// Os dados da programação ficam em divulgacaoAgenda (ver api/_lembretes.js).
const CHAVE_HORARIO = /^\d{4}-\d{2}-\d{2}_[\w-]{1,30}$/;
const CATEGORIAS = ['pcformatech', 'birdtech', 'apps', 'promocoes'];
const MAX_IMAGEM = 900_000;
const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/;

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

const texto = (valor, max) => String(valor || '').trim().slice(0, max);

async function garantirIniciais(db) {
    const lista = INICIAIS.publicacoes || [];
    if (!lista.length) return;
    const marcaRef = db.collection('lojaConfig').doc('estado');
    const marca = await marcaRef.get();
    const removidas = (marca.exists && marca.data().publicacoesRemovidas) || [];
    const agora = Date.now();
    for (const [i, p] of lista.entries()) {
        if (removidas.includes(p.id)) continue;
        const ref = db.collection(COLECAO).doc(p.id);
        if ((await ref.get()).exists) continue;
        const { id, ...dados } = p;
        await ref.set({ ...dados, inicial: true, ordem: dados.ordem || i + 1, criadoEm: agora, atualizadoEm: agora });
    }
}

function paraSaida(doc) {
    const d = doc.data();
    const imagem = d.imagemDados
        ? `/api/publicacoes?img=${encodeURIComponent(doc.id)}&v=${d.atualizadoEm || 0}`
        : (d.imagem || null);
    return {
        id: doc.id,
        categoria: CATEGORIAS.includes(d.categoria) ? d.categoria : 'pcformatech',
        titulo: d.titulo || '',
        legenda: d.legenda || '',
        link: d.link || '',
        imagem,
        inicio: d.inicio || null,
        fim: d.fim || null,
        ordem: Number(d.ordem) || 0,
        criadoEm: d.criadoEm || 0
    };
}

function lerData(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) throw new ErroDeAcesso(400, 'Data inválida.');
    return Math.round(n);
}

function validar(entrada) {
    const link = texto(entrada.link, 400);
    if (link && !/^https:\/\//.test(link)) throw new ErroDeAcesso(400, 'O link precisa começar com https://');
    const saida = {
        categoria: CATEGORIAS.includes(entrada.categoria) ? entrada.categoria : 'pcformatech',
        titulo: texto(entrada.titulo, 80),
        legenda: texto(entrada.legenda, 1000),
        link,
        inicio: lerData(entrada.inicio),
        fim: lerData(entrada.fim)
    };
    if (saida.inicio && saida.fim && saida.fim < saida.inicio) throw new ErroDeAcesso(400, 'O fim precisa ser depois do início.');
    if (entrada.imagem !== undefined && entrada.imagem !== null) {
        const imagem = String(entrada.imagem);
        if (DATA_URL.test(imagem)) {
            if (imagem.length > MAX_IMAGEM) throw new ErroDeAcesso(413, 'A imagem ficou grande demais. Tente outra.');
            saida.imagemDados = imagem;
            saida.imagem = null;
        } else if (!/^\/(api\/publicacoes\?img=|images\/divulgacao\/)/.test(imagem)) {
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

// ── Programação (Status e Stories) ──────────────────────────────────────

async function lerAgenda(db) {
    const quando = Agenda.momento(Date.now());
    const [config, dia, inscritos] = await Promise.all([
        db.collection(AGENDA).doc('config').get(),
        db.collection(AGENDA).doc('dia-' + quando.dia).get(),
        db.collection('pushSubscriptions').count().get().then((s) => s.data().count).catch(() => null)
    ]);
    return {
        entradas: (config.exists && config.data().entradas) || [],
        hoje: { dia: quando.dia, registros: (dia.exists && dia.data().registros) || {} },
        inscritos
    };
}

async function salvarAgenda(db, lista) {
    if (!Array.isArray(lista)) throw new ErroDeAcesso(400, 'Programação inválida.');
    if (lista.length > Agenda.MAX_ENTRADAS) throw new ErroDeAcesso(400, `No máximo ${Agenda.MAX_ENTRADAS} horários.`);
    const entradas = Agenda.normalizar(lista);
    if (entradas.length !== lista.length) throw new ErroDeAcesso(400, 'Cada horário precisa de pelo menos um dia e um lugar para postar.');
    const fixas = [...new Set(entradas.filter((e) => e.arte !== Agenda.RODIZIO).map((e) => e.arte))];
    const docs = await Promise.all(fixas.map((id) => db.collection(COLECAO).doc(id).get()));
    if (docs.some((d) => !d.exists)) throw new ErroDeAcesso(400, 'Uma das artes escolhidas não existe mais. Escolha outra.');
    await db.collection(AGENDA).doc('config').set({ entradas, atualizadoEm: Date.now() });
    return entradas;
}

async function marcarNaAgenda(db, corpo) {
    const chave = String(corpo.chave || '');
    if (!CHAVE_HORARIO.test(chave)) throw new ErroDeAcesso(400, 'Horário inválido.');
    const agora = Date.now();
    const marca = {};
    if (corpo.estado === 'pulado') marca.pulado = agora;
    else if (corpo.estado === 'postado' && Agenda.ONDE[corpo.onde]) marca.postados = { [corpo.onde]: agora };
    else throw new ErroDeAcesso(400, 'Marcação inválida.');
    // Postado antes do lembrete (pelo botão do painel): guarda o que era.
    if (corpo.arteId) marca.arteId = String(corpo.arteId).slice(0, 120);
    if (corpo.titulo) marca.titulo = String(corpo.titulo).slice(0, 80);
    if (Number.isInteger(corpo.hora) && corpo.hora >= 0 && corpo.hora <= 23) marca.hora = corpo.hora;
    if (Array.isArray(corpo.ondeTodos)) marca.onde = corpo.ondeTodos.filter((o) => Agenda.ONDE[o]);
    const dia = chave.slice(0, 10);
    const ref = db.collection(AGENDA).doc('dia-' + dia);
    await ref.set({ dia, registros: { [chave]: marca } }, { merge: true });
    const doc = await ref.get();
    return doc.data().registros[chave];
}

module.exports = async function handler(req, res) {
    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        if (req.method === 'GET') {
            if (req.query && req.query.lembrar !== undefined) {
                res.setHeader('Cache-Control', 'no-store');
                return res.status(200).json({ ok: true, ...(await lembrar(db)) });
            }
            if (req.query && req.query.img) return servirImagem(db, req.query.img, res);
            return res.status(400).json({ error: 'Informe a imagem.' });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
        await exigirAdmin(admin, corpo.idToken);

        if (corpo.acao === 'listar') {
            await garantirIniciais(db);
            const snap = await db.collection(COLECAO).get();
            const lista = snap.docs.map(paraSaida).sort((a, b) => (a.ordem - b.ordem) || (b.criadoEm - a.criadoEm));
            return res.status(200).json({ ok: true, publicacoes: lista });
        }

        if (corpo.acao === 'salvar') {
            const entrada = corpo.publicacao || {};
            const dados = validar(entrada);
            const agora = Date.now();
            let ref;
            if (entrada.id) {
                ref = db.collection(COLECAO).doc(String(entrada.id));
                if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Publicação não encontrada.');
                await ref.set({ ...dados, atualizadoEm: agora }, { merge: true });
            } else {
                if (!dados.imagemDados) throw new ErroDeAcesso(400, 'Escolha a imagem.');
                ref = db.collection(COLECAO).doc();
                await ref.set({ ...dados, ordem: 0, criadoEm: agora, atualizadoEm: agora });
            }
            return res.status(200).json({ ok: true, publicacao: paraSaida(await ref.get()) });
        }

        if (corpo.acao === 'remover') {
            const ref = db.collection(COLECAO).doc(String(corpo.id || '-'));
            const doc = await ref.get();
            if (!doc.exists) throw new ErroDeAcesso(404, 'Publicação não encontrada.');
            if (doc.data().inicial) {
                const marcaRef = db.collection('lojaConfig').doc('estado');
                const marca = await marcaRef.get();
                const removidas = (marca.exists && marca.data().publicacoesRemovidas) || [];
                await marcaRef.set({ publicacoesRemovidas: [...new Set([...removidas, ref.id])] }, { merge: true });
            }
            await ref.delete();
            return res.status(200).json({ ok: true });
        }

        if (corpo.acao === 'agenda') return res.status(200).json({ ok: true, ...(await lerAgenda(db)) });
        if (corpo.acao === 'agenda-salvar') return res.status(200).json({ ok: true, entradas: await salvarAgenda(db, corpo.entradas) });
        if (corpo.acao === 'agenda-marcar') return res.status(200).json({ ok: true, registro: await marcarNaAgenda(db, corpo) });

        return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (erro) {
        if (erro instanceof ErroDeAcesso) return res.status(erro.status).json({ error: erro.message });
        console.error('publicacoes:', erro);
        return res.status(500).json({ error: 'Não foi possível concluir. Tente de novo.' });
    }
};

// Para os testes.
module.exports.lembrar = lembrar;
module.exports._reiniciar = _reiniciar;
