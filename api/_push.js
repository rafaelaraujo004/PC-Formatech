// Utilitários compartilhados pelas funções que enviam notificação.
// O prefixo "_" faz a Vercel não publicar este arquivo como rota.

const webpush = require('web-push');
const admin = require('firebase-admin');

function iniciarAdmin() {
    if (admin.apps.length) return admin;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT não definida');
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
    return admin;
}

function iniciarWebPush() {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:rafaelaraujo004@gmail.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

function idDaInscricao(endpoint) {
    return Buffer.from(endpoint).toString('base64url').slice(-40);
}

/**
 * Envia uma notificação para todos os aparelhos inscritos no painel e apaga
 * as inscrições que o navegador já invalidou (404/410).
 */
async function enviarParaTodos(db, notificacao) {
    iniciarWebPush();
    const snap = await db.collection('pushSubscriptions').get();
    if (snap.empty) return { enviados: 0, falhas: 0, removidos: 0 };

    const payload = JSON.stringify({
        icon: '/icon-192.png',
        badge: '/favicon-32x32.png',
        ...notificacao
    });

    let enviados = 0;
    let falhas = 0;
    const vencidas = [];

    await Promise.all(snap.docs.map(async (doc) => {
        const inscricao = doc.data().subscription;
        if (!inscricao || !inscricao.endpoint) return;
        try {
            await webpush.sendNotification(inscricao, payload, { TTL: 60 * 60 });
            enviados++;
        } catch (err) {
            falhas++;
            if (err.statusCode === 404 || err.statusCode === 410) vencidas.push(doc.id);
        }
    }));

    if (vencidas.length) {
        const lote = db.batch();
        vencidas.forEach((id) => lote.delete(db.collection('pushSubscriptions').doc(id)));
        await lote.commit();
    }

    return { enviados, falhas, removidos: vencidas.length };
}

/** Preferências de notificação salvas pelo painel (siteSettings/notificacoes). */
async function lerPreferencias(db) {
    const padrao = { visitas: true, resumoDiario: true };
    try {
        const doc = await db.collection('siteSettings').doc('notificacoes').get();
        return doc.exists ? { ...padrao, ...doc.data() } : padrao;
    } catch (e) {
        return padrao;
    }
}

/** Aceita o cabeçalho que a própria Vercel manda no cron e os formatos antigos. */
function autorizadoComoCron(req) {
    const segredo = process.env.CRON_SECRET;
    if (!segredo) return false;
    const auth = req.headers.authorization || '';
    return auth === 'Bearer ' + segredo
        || req.headers['x-cron-secret'] === segredo
        || (req.query && req.query.secret === segredo);
}

const NOMES_ORIGEM = {
    direto: 'acesso direto',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    google: 'Google',
    busca: 'buscador',
    youtube: 'YouTube',
    tiktok: 'TikTok'
};

function nomeDaOrigem(origem) {
    const o = String(origem || 'direto');
    if (NOMES_ORIGEM[o]) return NOMES_ORIGEM[o];
    if (o.startsWith('link:')) return 'link "' + o.slice(5) + '"';
    if (o.startsWith('site:')) return o.slice(5);
    return o;
}

const NOMES_DISPOSITIVO = { mobile: 'celular', tablet: 'tablet', desktop: 'computador' };

module.exports = {
    iniciarAdmin,
    enviarParaTodos,
    lerPreferencias,
    autorizadoComoCron,
    nomeDaOrigem,
    NOMES_DISPOSITIVO,
    idDaInscricao
};
