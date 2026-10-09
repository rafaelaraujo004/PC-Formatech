// Inscreve um aparelho para receber as notificações do painel (pedidos,
// comprovantes, visitas, resumo do dia).
//
// Só o administrador logado pode inscrever um aparelho: antes a rota era
// aberta, e qualquer pessoa conseguiria cadastrar o próprio celular e passar a
// receber os avisos de pedidos, com nome do cliente e valor.
//
//   POST /api/subscribe { idToken, subscription } — idToken do Firebase Auth

const { iniciarAdmin } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

/** Só aceita o formato de inscrição que o navegador gera (Web Push). */
function inscricaoValida(sub) {
    if (!sub || typeof sub !== 'object') return null;
    const endpoint = String(sub.endpoint || '');
    const chaves = sub.keys || {};
    if (!/^https:\/\/[^\s]{10,800}$/.test(endpoint)) return null;
    if (typeof chaves.p256dh !== 'string' || chaves.p256dh.length > 200) return null;
    if (typeof chaves.auth !== 'string' || chaves.auth.length > 100) return null;
    return {
        endpoint,
        expirationTime: typeof sub.expirationTime === 'number' ? sub.expirationTime : null,
        keys: { p256dh: chaves.p256dh, auth: chaves.auth }
    };
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
    const subscription = inscricaoValida(corpo.subscription);
    if (!subscription) return res.status(400).json({ error: 'Inscrição inválida.' });

    try {
        const admin = iniciarAdmin();
        const usuario = await exigirAdmin(admin, corpo.idToken, 'Entre no painel para ativar os avisos.');
        const db = admin.firestore();

        // Os últimos 40 caracteres do endpoint viram o id: evita duplicatas.
        const id = Buffer.from(subscription.endpoint).toString('base64url').slice(-40);
        await db.collection('pushSubscriptions').doc(id).set({
            subscription,
            email: usuario.email,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(200).json({ ok: true });
    } catch (err) {
        if (err instanceof ErroDeAcesso) return res.status(err.status).json({ error: err.message });
        console.error('Erro ao salvar inscrição:', err);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
