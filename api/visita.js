// Notifica o celular do dono quando alguém entra no site.
//
// Chamado uma vez por sessão pelo rastreador (theme-system.js). Para ninguém
// conseguir disparar notificações chamando a rota à toa, só notifica se a
// presença daquela sessão já estiver gravada no Firestore e for recente.
// Várias chegadas em sequência viram uma notificação só ("+2 pessoas").

const {
    iniciarAdmin, enviarParaTodos, lerPreferencias, nomeDaOrigem, NOMES_DISPOSITIVO
} = require('./_push');

const JANELA_ONLINE_MS = 70 * 1000;       // mesmo critério do Dashboard Tempo Real
const INTERVALO_MINIMO_MS = 45 * 1000;    // no máximo uma notificação a cada 45 s
const PRESENCA_RECENTE_MS = 3 * 60 * 1000;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
    const sessionId = String(corpo.sessionId || '');
    if (!/^sess_\d{10,16}_[a-z0-9]{4,12}$/.test(sessionId)) {
        return res.status(400).json({ error: 'Sessão inválida' });
    }

    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        const prefs = await lerPreferencias(db);
        if (prefs.visitas === false) return res.status(200).json({ ok: true, notificado: false, motivo: 'desligado' });

        const agora = Date.now();
        const presencaRef = db.collection('presence').doc(sessionId);
        const estadoRef = db.collection('notifyState').doc('visitas');

        // Decide dentro de uma transação: evita duas chegadas simultâneas
        // gerarem duas notificações, e marca a sessão como já avisada.
        const decisao = await db.runTransaction(async (tx) => {
            const [presenca, estado] = await Promise.all([tx.get(presencaRef), tx.get(estadoRef)]);
            if (!presenca.exists) return { enviar: false, motivo: 'sem-presenca' };

            const p = presenca.data();
            if (p.avisado) return { enviar: false, motivo: 'ja-avisado' };
            if (!p.lastSeenClient || agora - p.lastSeenClient > PRESENCA_RECENTE_MS) {
                return { enviar: false, motivo: 'presenca-antiga' };
            }
            tx.update(presencaRef, { avisado: true });

            const e = estado.exists ? estado.data() : {};
            const acumulado = (e.acumulado || 0) + 1;
            if (e.ultimoEnvio && agora - e.ultimoEnvio < INTERVALO_MINIMO_MS) {
                tx.set(estadoRef, { acumulado }, { merge: true });
                return { enviar: false, motivo: 'agrupado' };
            }
            tx.set(estadoRef, { ultimoEnvio: agora, acumulado: 0 }, { merge: true });
            return { enviar: true, acumulado, presenca: p };
        });

        if (!decisao.enviar) return res.status(200).json({ ok: true, notificado: false, motivo: decisao.motivo });

        const online = await contarOnline(db, agora);
        const p = decisao.presenca;
        const aparelho = NOMES_DISPOSITIVO[p.dispositivo] || 'computador';
        const origem = nomeDaOrigem(p.origem || corpo.origem);
        const outros = decisao.acumulado - 1;

        const titulo = outros > 0
            ? '🟢 ' + decisao.acumulado + ' pessoas entraram no site'
            : '🟢 Alguém entrou no site';
        const linhas = [
            'Pelo ' + aparelho + ' · veio de ' + origem,
            online === 1 ? '1 pessoa online agora' : online + ' pessoas online agora'
        ];

        const resultado = await enviarParaTodos(db, {
            title: titulo,
            body: linhas.join('\n'),
            tag: 'visita',
            data: { url: '/admin.html#realtime' }
        });

        return res.status(200).json({ ok: true, notificado: true, online, ...resultado });
    } catch (err) {
        console.error('Erro ao notificar visita:', err);
        return res.status(500).json({ error: 'Erro interno' });
    }
};

async function contarOnline(db, agora) {
    const snap = await db.collection('presence')
        .where('lastSeenClient', '>', agora - JANELA_ONLINE_MS)
        .get();
    return snap.docs.filter((d) => d.data().status !== 'offline').length || 1;
}

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}
