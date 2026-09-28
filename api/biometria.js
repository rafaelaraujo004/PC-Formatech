// Entrada no painel com biometria (passkey / WebAuthn).
//
// A digital ou o rosto nunca saem do celular: o aparelho guarda uma chave
// privada que só é liberada pela biometria, e aqui fica só a chave pública.
// No login o aparelho assina um desafio; se a assinatura confere, esta rota
// devolve um token do Firebase para aquele usuário e o painel entra como se
// a senha tivesse sido digitada.
//
// Ações (POST, JSON com "acao"):
//   cadastro-opcoes / cadastro  — exigem o idToken de quem já está logado
//   login-opcoes / login        — públicas; só entra quem tem passkey cadastrada
//   listar / remover            — exigem o idToken
//
// Os desafios não são gravados: vão assinados (HMAC) com validade de 2 min,
// e cada um só serve uma vez (passkeyUsados).

const crypto = require('crypto');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');
const { iniciarAdmin } = require('./_push');
const { EMAILS_ADMIN, ErroDeAcesso, exigirAdmin: exigirAdminBase } = require('./_admin');

const ORIGENS = (process.env.PASSKEY_ORIGINS || 'https://pcformatech.vercel.app')
    .split(',').map((o) => o.trim()).filter(Boolean);
const VALIDADE_DESAFIO_MS = 2 * 60 * 1000;
const COLECAO = 'adminPasskeys';
const COLECAO_USADOS = 'passkeyUsados';

function segredo() {
    if (process.env.PASSKEY_SECRET) return process.env.PASSKEY_SECRET;
    // Sem variável própria, deriva da chave da conta de serviço, que já é secreta.
    const conta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (!conta.private_key) throw new Error('Sem segredo para assinar desafios');
    return crypto.createHash('sha256').update('passkey:' + conta.private_key).digest();
}

function assinar(texto) {
    return crypto.createHmac('sha256', segredo()).update(texto).digest('base64url');
}

/** "finalidade.uid.expira.aleatorio.assinatura" — só letras, números, - e _. */
function criarDesafio(finalidade, uid) {
    const corpo = [finalidade, uid || '-', Date.now() + VALIDADE_DESAFIO_MS, crypto.randomBytes(18).toString('base64url')].join('.');
    return corpo + '.' + assinar(corpo);
}

/**
 * Confere o desafio que voltou dentro da resposta do aparelho. A biblioteca
 * entrega o desafio em base64url (é assim que ele vai no clientDataJSON).
 */
function lerDesafio(desafioB64, finalidade, uid) {
    const texto = Buffer.from(String(desafioB64 || ''), 'base64url').toString('utf8');
    const partes = texto.split('.');
    if (partes.length !== 5) return null;
    const [fin, dono, expira, aleatorio, assinatura] = partes;
    const esperado = Buffer.from(assinar(partes.slice(0, 4).join('.')));
    const recebido = Buffer.from(assinatura);
    if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return null;
    if (fin !== finalidade || dono !== (uid || '-') || Number(expira) < Date.now()) return null;
    return { aleatorio, expira: Number(expira) };
}

/** Cada desafio vale uma vez só: impede reaproveitar uma resposta capturada. */
async function gastarDesafio(db, desafio) {
    try {
        await db.collection(COLECAO_USADOS).doc(desafio.aleatorio).create({ expira: desafio.expira });
    } catch (erro) {
        throw new ErroDeAcesso(401, 'Esta tentativa já foi usada. Tente de novo.');
    }
}

function exigirAdmin(admin, idToken) {
    return exigirAdminBase(admin, idToken, 'Entre com e-mail e senha antes de cadastrar a biometria.');
}

async function passkeysDo(db, uid) {
    const snap = await db.collection(COLECAO).where('uid', '==', uid).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * A biblioteca lança erro para qualquer resposta que não confere (desafio
 * vencido, contador que não avançou, assinatura errada): isso é recusa, não
 * falha do servidor.
 */
async function confirmar(verificar) {
    try {
        return await verificar();
    } catch (erro) {
        throw new ErroDeAcesso(401, 'Biometria não confirmada. Tente de novo.');
    }
}

function safeJson(texto) {
    try { return JSON.parse(texto); } catch (e) { return {}; }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // O navegador sempre manda Origin num POST com fetch; é também a origem
    // que a biometria vai assinar, então as duas precisam bater.
    const origem = String(req.headers.origin || '');
    if (!ORIGENS.includes(origem)) return res.status(403).json({ error: 'Origem não permitida' });
    const rpID = new URL(origem).hostname;

    const corpo = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
    const acao = String(corpo.acao || '');

    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        if (acao === 'cadastro-opcoes') {
            const usuario = await exigirAdmin(admin, corpo.idToken);
            const existentes = await passkeysDo(db, usuario.uid);
            const opcoes = await generateRegistrationOptions({
                rpName: 'PC Formatech · Painel',
                rpID,
                userID: new TextEncoder().encode(usuario.uid),
                userName: usuario.email,
                userDisplayName: 'Administrador PC Formatech',
                challenge: criarDesafio('cadastro', usuario.uid),
                attestationType: 'none',
                excludeCredentials: existentes.map((c) => ({ id: c.id, transports: c.transports || [] })),
                authenticatorSelection: {
                    residentKey: 'required',
                    userVerification: 'required',
                    authenticatorAttachment: 'platform'
                }
            });
            return res.status(200).json({ ok: true, opcoes });
        }

        if (acao === 'cadastro') {
            const usuario = await exigirAdmin(admin, corpo.idToken);
            let desafio = null;
            const verificacao = await confirmar(() => verifyRegistrationResponse({
                response: corpo.resposta,
                expectedChallenge: (recebido) => Boolean(desafio = lerDesafio(recebido, 'cadastro', usuario.uid)),
                expectedOrigin: ORIGENS,
                expectedRPID: rpID,
                requireUserVerification: true
            }));
            if (!verificacao.verified || !verificacao.registrationInfo || !desafio) {
                throw new ErroDeAcesso(400, 'Não foi possível confirmar a biometria.');
            }
            await gastarDesafio(db, desafio);

            const { credential, credentialDeviceType, credentialBackedUp } = verificacao.registrationInfo;
            await db.collection(COLECAO).doc(credential.id).set({
                uid: usuario.uid,
                email: usuario.email,
                publicKey: Buffer.from(credential.publicKey).toString('base64url'),
                counter: credential.counter || 0,
                transports: credential.transports || (corpo.resposta && corpo.resposta.response && corpo.resposta.response.transports) || [],
                tipo: credentialDeviceType,
                sincronizada: Boolean(credentialBackedUp),
                aparelho: String(corpo.aparelho || 'Aparelho').slice(0, 80),
                criadoEm: Date.now(),
                usadoEm: null
            });
            return res.status(200).json({ ok: true, id: credential.id });
        }

        if (acao === 'login-opcoes') {
            const opcoes = await generateAuthenticationOptions({
                rpID,
                challenge: criarDesafio('login'),
                userVerification: 'required',
                allowCredentials: []
            });
            return res.status(200).json({ ok: true, opcoes });
        }

        if (acao === 'login') {
            const resposta = corpo.resposta || {};
            const id = String(resposta.id || '');
            if (!id || id.length > 1400) throw new ErroDeAcesso(400, 'Resposta inválida.');

            const doc = await db.collection(COLECAO).doc(id).get();
            if (!doc.exists) throw new ErroDeAcesso(401, 'Esta biometria não está cadastrada. Entre com a senha e cadastre de novo.');
            const salvo = doc.data();

            let desafio = null;
            const verificacao = await confirmar(() => verifyAuthenticationResponse({
                response: resposta,
                expectedChallenge: (recebido) => Boolean(desafio = lerDesafio(recebido, 'login')),
                expectedOrigin: ORIGENS,
                expectedRPID: rpID,
                requireUserVerification: true,
                credential: {
                    id,
                    publicKey: new Uint8Array(Buffer.from(salvo.publicKey, 'base64url')),
                    counter: salvo.counter || 0,
                    transports: salvo.transports || []
                }
            }));
            if (!verificacao.verified || !desafio) throw new ErroDeAcesso(401, 'Biometria não confirmada.');
            await gastarDesafio(db, desafio);

            // O dono da passkey ainda precisa ser administrador hoje.
            const usuario = await admin.auth().getUser(salvo.uid);
            if (usuario.disabled || !EMAILS_ADMIN.includes(String(usuario.email || '').toLowerCase())) {
                throw new ErroDeAcesso(403, 'Usuário sem permissão de administrador.');
            }

            await doc.ref.update({
                counter: verificacao.authenticationInfo.newCounter,
                usadoEm: Date.now()
            });
            const token = await admin.auth().createCustomToken(salvo.uid, { biometria: true });
            return res.status(200).json({ ok: true, token });
        }

        if (acao === 'listar') {
            const usuario = await exigirAdmin(admin, corpo.idToken);
            const lista = (await passkeysDo(db, usuario.uid))
                .map((c) => ({ id: c.id, aparelho: c.aparelho, criadoEm: c.criadoEm, usadoEm: c.usadoEm, sincronizada: c.sincronizada }))
                .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
            return res.status(200).json({ ok: true, lista });
        }

        if (acao === 'remover') {
            const usuario = await exigirAdmin(admin, corpo.idToken);
            const ref = db.collection(COLECAO).doc(String(corpo.id || '-'));
            const doc = await ref.get();
            if (!doc.exists || doc.data().uid !== usuario.uid) throw new ErroDeAcesso(404, 'Biometria não encontrada.');
            await ref.delete();
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Ação desconhecida' });
    } catch (erro) {
        if (erro instanceof ErroDeAcesso) return res.status(erro.status).json({ error: erro.message });
        console.error('biometria:', acao, erro);
        return res.status(500).json({ error: 'Não foi possível concluir. Tente de novo.' });
    }
};
