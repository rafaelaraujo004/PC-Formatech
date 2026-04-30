// Vercel Cron Job / Serverless Function
// Verifica parcelas vencendo hoje ou amanhã e envia Web Push para todos os dispositivos inscritos.
// Chamado via cron (vercel.json) e protegido por CRON_SECRET.

const webpush = require('web-push');
const admin   = require('firebase-admin');

// ---------- helpers ----------
function initAdmin() {
    if (admin.apps.length) return;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definida');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}

function initWebPush() {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:rafaelaraujo004@gmail.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// Retorna string 'YYYY-MM-DD' no fuso horário de SP
function dateStrSP(date) {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(date);
}

// ---------- handler ----------
module.exports = async function handler(req, res) {
    // Proteção: aceita GET (cron do Vercel) ou POST
    const secret = req.headers['x-cron-secret'] || req.query.secret;
    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        initAdmin();
        initWebPush();
        const db = admin.firestore();

        // ---- 1. Buscar todas as subscriptions ----
        const subsSnap = await db.collection('pushSubscriptions').get();
        if (subsSnap.empty) return res.status(200).json({ sent: 0, msg: 'Sem inscrições' });
        const subscriptions = subsSnap.docs.map(d => d.data().subscription);

        // ---- 2. Buscar clientes ----
        const clientsDoc = await db.collection('data').doc('clients').get();
        const clients = clientsDoc.exists ? (clientsDoc.data().data || []) : [];
        if (!clients.length) return res.status(200).json({ sent: 0, msg: 'Sem clientes' });

        // ---- 3. Calcular datas ----
        const hoje  = new Date();
        const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
        const hojeStr   = dateStrSP(hoje);
        const amanhaStr = dateStrSP(amanha);

        // ---- 4. Coletar parcelas urgentes ----
        const notifs = [];
        clients.forEach(client => {
            if (!client.services) return;
            client.services.forEach(service => {
                if (!service.parcelamento?.ativo) return;
                service.parcelamento.parcelas.forEach(parcela => {
                    if (parcela.pago) return;
                    const venc = parcela.dataVencimento;
                    if (venc === hojeStr || venc === amanhaStr) {
                        const tipo = parcela.tipo === 'entrada'
                            ? 'Entrada'
                            : `${parcela.numero}ª parcela`;
                        const isHoje = venc === hojeStr;
                        notifs.push({
                            title: isHoje
                                ? '⚠️ Parcela vence HOJE — PC Formatech'
                                : '🔔 Parcela vence amanhã — PC Formatech',
                            body: `${client.name} · ${service.type}\n${tipo} · R$ ${Number(parcela.valor).toFixed(2).replace('.', ',')}`,
                            tag: `parc-${client.id}-${venc}`
                        });
                    }
                });
            });
        });

        if (!notifs.length) return res.status(200).json({ sent: 0, msg: 'Nenhum vencimento' });

        // ---- 5. Enviar push para cada subscription ----
        let sent = 0, failed = 0;
        const staleIds = [];

        for (const sub of subscriptions) {
            for (const notif of notifs) {
                const payload = JSON.stringify({
                    title: notif.title,
                    body:  notif.body,
                    tag:   notif.tag,
                    icon:  '/icon-192.png',
                    badge: '/favicon-32x32.png'
                });
                try {
                    await webpush.sendNotification(sub, payload);
                    sent++;
                } catch (err) {
                    // 404/410 = subscription expirada, remover
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        const id = Buffer.from(sub.endpoint).toString('base64url').slice(-40);
                        staleIds.push(id);
                    }
                    failed++;
                }
            }
        }

        // Limpar subscriptions expiradas
        if (staleIds.length) {
            const batch = db.batch();
            [...new Set(staleIds)].forEach(id => {
                batch.delete(db.collection('pushSubscriptions').doc(id));
            });
            await batch.commit();
        }

        return res.status(200).json({ sent, failed, notifs: notifs.length, staleRemoved: staleIds.length });
    } catch (err) {
        console.error('Erro no cron de notificações:', err);
        return res.status(500).json({ error: err.message });
    }
};
