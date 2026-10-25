// Resumo das visitas por notificação, uma vez por dia (cron da Vercel, 21h de
// Belém). Aos domingos manda também o resumo da semana.
//
// O cálculo vem de resumo-visitas.js — o mesmo arquivo que o painel usa —
// para o número da notificação ser o mesmo que aparece no painel.

const { iniciarAdmin, enviarParaTodos, lerPreferencias, autorizadoComoCron } = require('./_push');
const Resumo = require('../resumo-visitas.js');

const FUSO = 'America/Belem';

module.exports = async function handler(req, res) {
    if (!autorizadoComoCron(req)) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const admin = iniciarAdmin();
        const db = admin.firestore();

        const prefs = await lerPreferencias(db);
        if (prefs.resumoDiario === false) return res.status(200).json({ ok: true, enviado: false, motivo: 'desligado' });

        const agora = new Date();
        const hoje = Resumo.chaveDoDia(agora, FUSO);
        const ehDomingo = new Intl.DateTimeFormat('en-US', { timeZone: FUSO, weekday: 'short' }).format(agora) === 'Sun';
        const inicioSemana = Resumo.chaveDoDia(new Date(agora.getTime() - 6 * 86400000), FUSO);

        const snap = await db.collection('presenceDaily')
            .where('dayKey', '>=', ehDomingo ? inicioSemana : hoje)
            .get();
        const registros = snap.docs.map((d) => d.data());

        const doDia = Resumo.calcular(registros.filter((r) => r.dayKey === hoje));
        const notificacoes = [montar('Resumo de hoje', doDia)];
        if (ehDomingo) notificacoes.push(montar('Resumo da semana', Resumo.calcular(registros)));

        const resultados = [];
        for (const n of notificacoes) resultados.push(await enviarParaTodos(db, n));

        return res.status(200).json({ ok: true, dia: hoje, visitas: doDia.visitas, resultados });
    } catch (err) {
        console.error('Erro no resumo diário:', err);
        return res.status(500).json({ error: err.message });
    }
};

function montar(titulo, r) {
    if (!r.visitas) {
        return {
            title: '📊 ' + titulo,
            body: 'Nenhuma visita registrada.',
            tag: 'resumo-' + titulo,
            data: { url: '/admin.html#realtime' }
        };
    }

    const hora = r.picoQuando
        ? new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' }).format(new Date(r.picoQuando))
        : null;
    const linhas = [
        plural(r.visitantes, 'visitante', 'visitantes') + ' · ' + plural(r.visitas, 'visita', 'visitas'),
        'Pico: ' + plural(r.pico, 'pessoa', 'pessoas') + ' ao mesmo tempo' + (hora ? ' às ' + hora : '')
    ];
    if (r.servicos.length) linhas.push('Mais procurado: ' + r.servicos[0].nome);
    if (r.whatsapp || r.agendamentos) {
        linhas.push(plural(r.whatsapp, 'clique', 'cliques') + ' no WhatsApp · ' + plural(r.agendamentos, 'agendamento', 'agendamentos'));
    }

    return {
        title: '📊 ' + titulo,
        body: linhas.join('\n'),
        tag: 'resumo-' + titulo,
        data: { url: '/admin.html#realtime' }
    };
}

function plural(n, um, varios) {
    return n + ' ' + (n === 1 ? um : varios);
}
