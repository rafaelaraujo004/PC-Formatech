// Envia uma resposta ao cliente pela Cloud API do WhatsApp Business.
//
//   POST /api/whatsapp-enviar { idToken, para, texto }
//
// Só o administrador logado (token do Firebase) pode enviar. O navegador não
// fala direto com a Meta: o token de acesso fica só no servidor (variável de
// ambiente), nunca no front.
//
// Observação da Meta: fora da janela de 24 h desde a última mensagem do
// cliente, só é permitido enviar "templates" aprovados, não texto livre. Se
// for esse o caso, a Meta recusa e a mensagem de erro é repassada ao painel.

const { iniciarAdmin } = require('./_push');
const { ErroDeAcesso, exigirAdmin } = require('./_admin');
const { enviarTexto, soDigitos } = require('./_whatsapp');

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
    const para = soDigitos(corpo.para);
    const texto = String(corpo.texto || '').trim();
    if (!para) return res.status(400).json({ error: 'Número de destino inválido.' });
    if (!texto) return res.status(400).json({ error: 'Escreva uma mensagem.' });
    if (texto.length > 4096) return res.status(400).json({ error: 'Mensagem muito longa (máx. 4096).' });

    try {
        const admin = iniciarAdmin();
        const usuario = await exigirAdmin(admin, corpo.idToken, 'Entre no painel para responder.');
        const db = admin.firestore();

        const envio = await enviarTexto(para, texto);
        if (!envio.ok) return res.status(502).json({ error: envio.erro || 'Falha ao enviar.' });

        // Guarda a resposta na mesma conversa, para aparecer no histórico.
        const conversaRef = db.collection('whatsappConversations').doc(para);
        const id = envio.id || ('local_' + Date.now());
        await conversaRef.collection('mensagens').doc(id).set({
            direcao: 'enviada',
            tipo: 'text',
            texto,
            autor: usuario.email,
            waMessageId: envio.id || null,
            status: 'enviada',
            criadoEm: admin.firestore.FieldValue.serverTimestamp()
        });
        await conversaRef.set({
            telefone: para,
            ultimoTexto: texto.slice(0, 160),
            ultimaDirecao: 'enviada',
            atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
            naoLidas: 0
        }, { merge: true });

        return res.status(200).json({ ok: true, id: envio.id || null });
    } catch (err) {
        if (err instanceof ErroDeAcesso) return res.status(err.status).json({ error: err.message });
        console.error('whatsapp-enviar:', err);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
