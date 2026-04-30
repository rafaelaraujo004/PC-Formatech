// Vercel Serverless Function — salva push subscription no Firestore
const admin = require('firebase-admin');

function initAdmin() {
    if (admin.apps.length) return;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var não definida');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

module.exports = async function handler(req, res) {
    // CORS básico (admin.html no mesmo domínio, mas pode haver variações)
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription inválida' });
    }

    try {
        initAdmin();
        const db = admin.firestore();

        // Usa os últimos 40 chars do endpoint como ID para evitar duplicatas
        const id = Buffer.from(subscription.endpoint).toString('base64url').slice(-40);

        await db.collection('pushSubscriptions').doc(id).set({
            subscription,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Erro ao salvar subscription:', err);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
