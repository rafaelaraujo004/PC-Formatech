// Pedidos da loja Bird Tech: cada carrinho que chega ao fechamento (tela do
// Pix ou "combinar no WhatsApp") vira um pedido, com as etapas que o cliente
// percorreu, para o dono acompanhar na aba Pedidos do painel.
//
//   POST /api/pedidos { acao: 'registrar', pedido } — público (a loja chama)
//        pedido: { codigo, itens: [{ id, qtd }], etapa, entrega, obs, nome, telefone, teste }
//        O preço e o total são calculados aqui, pelo cadastro da loja.
//   POST /api/pedidos { acao, idToken, … } — só administrador:
//        listar   → últimos pedidos
//        situacao → { codigo, situacao: aguardando|pago|entregue|cancelado }
//        remover  → { codigo }

const { iniciarAdmin, enviarParaTodos } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');
const { dentroDoLimite } = require('./_limite');

const COLECAO = 'pedidos';
const PRODUTOS = 'lojaProdutos';
const ETAPAS = ['pix', 'copiou', 'comprovante', 'whatsapp'];
const SITUACOES = ['aguardando', 'pago', 'entregue', 'cancelado'];
const CODIGO = /^BT[0-9A-Z]{4,12}$/;
const moeda = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

const texto = (valor, max) => String(valor || '').trim().replace(/\s+/g, ' ').slice(0, max);

async function registrar(admin, db, entrada, req, res) {
    const codigo = String(entrada.codigo || '');
    if (!CODIGO.test(codigo)) return res.status(400).json({ error: 'Código inválido.' });
    const etapa = ETAPAS.includes(entrada.etapa) ? entrada.etapa : null;
    if (!etapa) return res.status(400).json({ error: 'Etapa inválida.' });

    // Itens conferidos com o cadastro: preço e nome nunca vêm do navegador.
    const pedidos = Array.isArray(entrada.itens) ? entrada.itens.slice(0, 30) : [];
    const ids = [...new Set(pedidos.map((i) => String(i && i.id || '')).filter((id) => /^[\w-]{1,80}$/.test(id)))];
    const docs = await Promise.all(ids.map((id) => db.collection(PRODUTOS).doc(id).get()));
    const porId = new Map(docs.filter((d) => d.exists).map((d) => [d.id, d.data()]));
    const itens = pedidos
        .map((i) => ({ id: String(i.id), qtd: Math.max(1, Math.min(20, parseInt(i.qtd, 10) || 1)) }))
        .filter((i) => porId.has(i.id))
        .map((i) => ({ id: i.id, nome: porId.get(i.id).nome, preco: Number(porId.get(i.id).preco), qtd: i.qtd }));
    if (!itens.length) return res.status(400).json({ error: 'Pedido sem produtos.' });
    const total = Math.round(itens.reduce((t, i) => t + i.preco * i.qtd, 0) * 100) / 100;

    const ref = db.collection(COLECAO).doc(codigo);
    const agora = Date.now();
    const atual = await ref.get();
    const novo = !atual.exists;
    if (!novo && agora - (atual.data().criadoEm || 0) > 3 * 864e5) return res.status(409).json({ error: 'Pedido antigo.' });

    // Pedido novo: no máximo 10 por hora do mesmo endereço. Sem isso, alguém
    // podia criar centenas de pedidos falsos e lotar o celular de avisos.
    // (O cliente de verdade não é afetado: o pedido segue pelo WhatsApp.)
    if (novo && !(await dentroDoLimite(db, req, 'pedido', 10, 3600 * 1000))) {
        return res.status(429).json({ error: 'Muitos pedidos em pouco tempo. Chame a gente no WhatsApp.' });
    }

    const dados = {
        itens,
        total,
        entrega: entrada.entrega === 'entrega' ? 'entrega' : 'retirada',
        obs: texto(entrada.obs, 300),
        nome: texto(entrada.nome, 80),
        telefone: String(entrada.telefone || '').replace(/\D/g, '').slice(0, 13),
        teste: Boolean(entrada.teste),
        [`etapas.${etapa}`]: agora,
        ultimaEtapa: etapa,
        atualizadoEm: agora
    };
    if (novo) {
        await ref.set({
            codigo,
            situacao: 'aguardando',
            criadoEm: agora,
            etapas: { [etapa]: agora },
            ...Object.fromEntries(Object.entries(dados).filter(([k]) => !k.startsWith('etapas.')))
        });
    } else {
        // Situação marcada pelo dono (pago, entregue…) não volta atrás.
        await ref.update(dados);
    }

    // Avisa no celular do dono quando um pedido chega ao Pix ou o comprovante é enviado.
    const avisar = !dados.teste && (etapa === 'comprovante' || (novo && (etapa === 'pix' || etapa === 'whatsapp')));
    if (avisar) {
        const itensTexto = itens.map((i) => i.qtd + 'x ' + i.nome).join(', ');
        const titulos = {
            pix: '🛒 Pedido na Bird Tech: ' + moeda(total),
            whatsapp: '🛒 Pedido na Bird Tech: ' + moeda(total),
            comprovante: '💸 Comprovante de Pix: ' + moeda(total)
        };
        const corpos = {
            pix: 'Abriu o Pix · ' + itensTexto,
            whatsapp: 'Vai combinar no WhatsApp · ' + itensTexto,
            comprovante: 'Pedido ' + codigo + ' · confira o Pix no app do banco'
        };
        try {
            await enviarParaTodos(db, { title: titulos[etapa], body: corpos[etapa], tag: 'pedido-' + codigo, data: { url: '/admin.html#pedidos' } });
        } catch (e) {
            console.error('pedidos: aviso não enviado', e);
        }
    }
    return res.status(200).json({ ok: true, total });
}

function paraSaida(doc) {
    const d = doc.data();
    return {
        codigo: doc.id,
        itens: d.itens || [],
        total: d.total || 0,
        entrega: d.entrega || 'retirada',
        obs: d.obs || '',
        nome: d.nome || '',
        telefone: d.telefone || '',
        teste: Boolean(d.teste),
        etapas: d.etapas || {},
        ultimaEtapa: d.ultimaEtapa || '',
        situacao: SITUACOES.includes(d.situacao) ? d.situacao : 'aguardando',
        criadoEm: d.criadoEm || 0,
        atualizadoEm: d.atualizadoEm || 0
    };
}

module.exports = async function handler(req, res) {
    try {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        const admin = iniciarAdmin();
        const db = admin.firestore();
        const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});

        if (corpo.acao === 'registrar') return registrar(admin, db, corpo.pedido || {}, req, res);

        await exigirAdmin(admin, corpo.idToken);

        if (corpo.acao === 'listar') {
            const snap = await db.collection(COLECAO).orderBy('criadoEm', 'desc').limit(300).get();
            return res.status(200).json({ ok: true, pedidos: snap.docs.map(paraSaida) });
        }

        if (corpo.acao === 'situacao') {
            if (!SITUACOES.includes(corpo.situacao)) throw new ErroDeAcesso(400, 'Situação inválida.');
            const ref = db.collection(COLECAO).doc(String(corpo.codigo || '-'));
            if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Pedido não encontrado.');
            await ref.update({ situacao: corpo.situacao, [`situacaoEm.${corpo.situacao}`]: Date.now() });
            return res.status(200).json({ ok: true });
        }

        if (corpo.acao === 'remover') {
            const ref = db.collection(COLECAO).doc(String(corpo.codigo || '-'));
            if (!(await ref.get()).exists) throw new ErroDeAcesso(404, 'Pedido não encontrado.');
            await ref.delete();
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (erro) {
        if (erro instanceof ErroDeAcesso) return res.status(erro.status).json({ error: erro.message });
        console.error('pedidos:', erro);
        return res.status(500).json({ error: 'Não foi possível concluir. Tente de novo.' });
    }
};
