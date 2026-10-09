// Lembretes da programação de Status e Stories (aba Divulgação).
// O prefixo "_" faz a Vercel não publicar este arquivo como rota.
//
// Quem chama lembrar() — qualquer um dos três já basta, e juntos cobrem as
// falhas uns dos outros (o lembrete nunca sai duas vezes):
//   • GitHub Actions, a cada 15 min (.github/workflows/lembretes-divulgacao.yml),
//     via GET /api/publicacoes?lembrar=1;
//   • cada visita ao site (api/visita.js);
//   • o painel aberto, a cada 5 min (admin-agenda.js).
// O agendamento do GitHub atrasa e às vezes pula execuções; por isso não é o
// único gatilho.

const push = require('./_push');
const Agenda = require('../agenda-divulgacao.js');

// divulgacaoAgenda/config        → { entradas, atualizadoEm }
// divulgacaoAgenda/dia-AAAA-MM-DD → { registros: { <chave>: { arteId, titulo,
//                                    hora, onde, lembradoEm, postados, pulado } } }
const AGENDA = 'divulgacaoAgenda';

/** Artes no formato que a regra da programação usa (sem a imagem pesada). */
async function artesDaAgenda(db) {
    const snap = await db.collection('publicacoes').select('titulo', 'categoria', 'inicio', 'fim', 'ordem').get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

const registroFeito = (r, onde) => r && (r.pulado || (onde || []).every((o) => r.postados && r.postados[o]));

let ultimaVerificacao = 0;

/**
 * Manda o lembrete de cada horário que já chegou (até 2 h de atraso, se uma
 * chamada falhar) e ainda não foi lembrado, feito ou pulado. Pode ser chamada
 * por qualquer um: só lembra o que já está na hora, e uma vez só — a marca de
 * "lembrado" é gravada numa transação antes do envio. Chamadas seguidas na
 * mesma instância (menos de 30 s) nem consultam o banco.
 */
async function lembrar(db, agora = Date.now()) {
    if (agora - ultimaVerificacao < 30_000) return { lembretes: 0, cedo: true };
    ultimaVerificacao = agora;

    const config = await db.collection(AGENDA).doc('config').get();
    const entradas = (config.exists && config.data().entradas) || [];
    if (!entradas.length) return { lembretes: 0 };

    const quando = Agenda.momento(agora);
    const vencidos = Agenda.slotsDoDia(entradas, quando, await artesDaAgenda(db))
        .filter((s) => s.arte && s.hora <= quando.hora && s.hora >= quando.hora - 2);
    if (!vencidos.length) return { lembretes: 0 };

    const ref = db.collection(AGENDA).doc('dia-' + quando.dia);
    const novos = await db.runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        const registros = (doc.exists && doc.data().registros) || {};
        const lista = vencidos.filter((s) => !(registros[s.chave] && registros[s.chave].lembradoEm) && !registroFeito(registros[s.chave], s.onde));
        if (!lista.length) return [];
        const marcas = {};
        lista.forEach((s) => {
            marcas[s.chave] = { arteId: s.arte.id, titulo: Agenda.limparTitulo(s.arte.titulo).slice(0, 80), hora: s.hora, onde: s.onde, lembradoEm: agora };
        });
        tx.set(ref, { dia: quando.dia, registros: marcas }, { merge: true });
        return lista;
    });

    let enviados = 0;
    for (const s of novos) {
        const titulo = Agenda.limparTitulo(s.arte.titulo) || 'Arte da Divulgação';
        const r = await push.enviarParaTodos(db, {
            title: '📣 Hora de postar',
            body: `${titulo} · ${Agenda.nomesOnde(s.onde)}. Toque para postar.`,
            tag: 'dv-' + s.chave,
            data: { url: '/admin.html?postar=' + encodeURIComponent(s.chave) + '#divulgacao' }
        });
        enviados += r.enviados;
    }
    return { lembretes: novos.length, enviados };
}

/** Para as visitas: nunca derruba quem chamou. */
async function lembrarSemFalhar(db) {
    try { return await lembrar(db); } catch (erro) { console.error('lembretes:', erro); return { lembretes: 0, erro: true }; }
}

module.exports = { AGENDA, lembrar, lembrarSemFalhar, _reiniciar: () => { ultimaVerificacao = 0; } };
