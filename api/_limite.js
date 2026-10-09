// Limite de tentativas por endereço de internet (IP), para rotas públicas.
// O prefixo "_" faz a Vercel não publicar este arquivo como rota.
//
// O IP não é guardado: vira um código embaralhado (hash com sal), que só
// serve para contar quantas vezes o mesmo endereço chamou a rota na janela.
// Cada endereço ocupa um documento pequeno na coleção "limites".

const crypto = require('crypto');

function ipDe(req) {
    const encaminhado = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return encaminhado || String(req.headers['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || 'desconhecido';
}

/**
 * true se ainda cabe mais uma chamada desse endereço na janela; false se
 * passou do limite. Se o Firestore falhar, deixa passar: o limite protege
 * contra abuso, não pode derrubar um pedido de verdade.
 */
async function dentroDoLimite(db, req, nome, maximo, janelaMs) {
    const sal = process.env.LIMITE_SAL || process.env.CRON_SECRET || 'pcformatech';
    const chave = crypto.createHash('sha256').update(sal + ':' + nome + ':' + ipDe(req)).digest('hex').slice(0, 32);
    const ref = db.collection('limites').doc(nome + '_' + chave);
    const agora = Date.now();
    try {
        return await db.runTransaction(async (tx) => {
            const doc = await tx.get(ref);
            const d = doc.exists ? doc.data() : null;
            if (!d || agora - (d.inicio || 0) > janelaMs) {
                tx.set(ref, { inicio: agora, conta: 1, expiraEm: new Date(agora + janelaMs) });
                return true;
            }
            if ((d.conta || 0) >= maximo) return false;
            tx.update(ref, { conta: (d.conta || 0) + 1 });
            return true;
        });
    } catch (erro) {
        console.error('limite: não conferido', erro);
        return true;
    }
}

module.exports = { dentroDoLimite, ipDe };
