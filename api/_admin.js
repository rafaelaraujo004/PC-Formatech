// Quem é administrador, compartilhado pelas rotas que exigem login no painel.
// O prefixo "_" faz a Vercel não publicar este arquivo como rota.

const EMAILS_ADMIN = (process.env.ADMIN_EMAILS || 'rafaelaraujo004@gmail.com')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

class ErroDeAcesso extends Error {
    constructor(status, mensagem) {
        super(mensagem);
        this.status = status;
    }
}

/** Confere o idToken do Firebase e se o e-mail é de administrador. */
async function exigirAdmin(admin, idToken, mensagemSemLogin) {
    if (!idToken) throw new ErroDeAcesso(401, mensagemSemLogin || 'Entre no painel com e-mail e senha.');
    let decodificado;
    try {
        decodificado = await admin.auth().verifyIdToken(String(idToken));
    } catch (erro) {
        throw new ErroDeAcesso(401, 'Sessão expirada. Entre de novo com e-mail e senha.');
    }
    const email = String(decodificado.email || '').toLowerCase();
    if (!EMAILS_ADMIN.includes(email)) throw new ErroDeAcesso(403, 'Usuário sem permissão de administrador.');
    return { uid: decodificado.uid, email };
}

module.exports = { EMAILS_ADMIN, ErroDeAcesso, exigirAdmin };
