// Webhook do WhatsApp Business Platform (Cloud API).
//
//   GET  /api/whatsapp  — a Meta chama uma vez para verificar o webhook.
//   POST /api/whatsapp  — a Meta chama a cada mensagem que o cliente manda
//                         para o número comercial, e a cada mudança de status.
//
// A rota só RECEBE o que a Meta entrega oficialmente (mensagens dirigidas ao
// número da empresa). Guarda cada conversa e mensagem no Firestore para o
// atendente ver no painel. A assinatura de cada chamada é conferida com o
// App Secret, então o navegador não consegue injetar eventos aqui.

const { iniciarAdmin } = require('./_push');
const { assinaturaConfere, lerCorpoBruto, soDigitos } = require('./_whatsapp');

// Tipos de mensagem que a Cloud API pode entregar. Para mídia guardamos só o
// aviso de que chegou um anexo (o download exige outra chamada autenticada);
// o texto em si é o que o cliente escreveu para a empresa.
const RESUMO_POR_TIPO = {
    image: '📷 Imagem',
    video: '🎬 Vídeo',
    audio: '🎧 Áudio',
    document: '📄 Documento',
    sticker: '🙂 Figurinha',
    location: '📍 Localização',
    contacts: '👤 Contato'
};

function textoDaMensagem(msg) {
    if (msg.type === 'text') return { tipo: 'text', texto: String(msg.text?.body || '') };
    if (msg.type === 'button') return { tipo: 'text', texto: String(msg.button?.text || '') };
    if (msg.type === 'interactive') {
        const i = msg.interactive || {};
        const t = i.button_reply?.title || i.list_reply?.title || '';
        return { tipo: 'text', texto: String(t) };
    }
    const resumo = RESUMO_POR_TIPO[msg.type];
    if (resumo) {
        const legenda = msg[msg.type]?.caption;
        return { tipo: msg.type, texto: legenda ? `${resumo}: ${legenda}` : resumo };
    }
    return { tipo: 'unknown', texto: 'Mensagem não suportada' };
}

async function gravarRecebidas(db, admin, valor) {
    const mensagens = Array.isArray(valor.messages) ? valor.messages : [];
    if (!mensagens.length) return;

    // Nome do contato, quando a Meta manda.
    const contato = Array.isArray(valor.contacts) ? valor.contacts[0] : null;
    const nome = contato && contato.profile ? String(contato.profile.name || '') : '';

    for (const msg of mensagens) {
        const de = soDigitos(msg.from);
        if (!de || !msg.id) continue;
        const { tipo, texto } = textoDaMensagem(msg);
        const criadoEm = msg.timestamp
            ? admin.firestore.Timestamp.fromMillis(Number(msg.timestamp) * 1000)
            : admin.firestore.FieldValue.serverTimestamp();

        const conversaRef = db.collection('whatsappConversations').doc(de);
        // O id do documento é o id da mensagem na Meta: se o webhook repetir
        // (a Meta reenvia quando não recebe 200 a tempo), não duplica.
        const msgRef = conversaRef.collection('mensagens').doc(msg.id);

        const jaExiste = await msgRef.get();
        if (jaExiste.exists) continue;

        await msgRef.set({
            direcao: 'recebida',
            tipo,
            texto,
            waMessageId: msg.id,
            criadoEm
        });

        await conversaRef.set({
            telefone: de,
            nome: nome || admin.firestore.FieldValue.delete(),
            ultimoTexto: texto.slice(0, 160),
            ultimaDirecao: 'recebida',
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
            naoLidas: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
    }
}

async function atualizarStatus(db, valor) {
    const statuses = Array.isArray(valor.statuses) ? valor.statuses : [];
    for (const s of statuses) {
        if (!s.id || !s.recipient_id) continue;
        const ref = db.collection('whatsappConversations')
            .doc(soDigitos(s.recipient_id)).collection('mensagens').doc(s.id);
        const doc = await ref.get();
        if (doc.exists) await ref.set({ status: String(s.status || '') }, { merge: true });
    }
}

async function handler(req, res) {
    // ── Verificação do webhook (a Meta faz uma vez, ao configurar) ──────────
    if (req.method === 'GET') {
        const modo = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
        if (modo === 'subscribe' && esperado && token === esperado) {
            return res.status(200).send(String(challenge || ''));
        }
        return res.status(403).send('Verificação falhou');
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // ── Recebimento das mensagens ───────────────────────────────────────────
    let bruto;
    try {
        bruto = await lerCorpoBruto(req);
    } catch (e) {
        return res.status(400).json({ error: 'Corpo inválido' });
    }

    if (!assinaturaConfere(bruto, req.headers['x-hub-signature-256'])) {
        return res.status(401).json({ error: 'Assinatura inválida' });
    }

    let corpo;
    try {
        corpo = JSON.parse(bruto.toString('utf8') || '{}');
    } catch (e) {
        return res.status(400).json({ error: 'JSON inválido' });
    }

    // Responde 200 rápido e processa; a Meta reenvia se demorar, mas o id da
    // mensagem evita gravação duplicada.
    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();
        const entradas = Array.isArray(corpo.entry) ? corpo.entry : [];
        for (const entrada of entradas) {
            const mudancas = Array.isArray(entrada.changes) ? entrada.changes : [];
            for (const mudanca of mudancas) {
                const valor = mudanca.value || {};
                await gravarRecebidas(db, admin, valor);
                await atualizarStatus(db, valor);
            }
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('whatsapp webhook:', err);
        // 200 mesmo em erro interno: evita a Meta reenviar em loop por falha
        // nossa. O erro fica no log para investigar.
        return res.status(200).json({ ok: false });
    }
}

module.exports = handler;
// Desliga o parser automático da Vercel: precisamos do corpo bruto para
// conferir a assinatura HMAC da Meta.
module.exports.config = { api: { bodyParser: false } };
