/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Programação da Divulgação (Status e Stories)

   Usado em dois lugares, e por isso num arquivo só:
   • no painel (admin-agenda.js), para a "Programação de hoje";
   • no servidor (api/publicacoes.js), que manda o lembrete na hora.
   Assim a arte que o painel mostra para as 12h é a mesma da notificação.

   Cada entrada da programação: { id, arte, hora, dias, onde }
   • arte: id de uma arte da aba Divulgação, ou "rodizio" (uma arte
     diferente a cada horário);
   • hora: 0 a 23, no horário de Canaã dos Carajás (UTC−3);
   • dias: 0 (domingo) a 6 (sábado);
   • onde: "status", "instagram" e/ou "facebook".
   ═══════════════════════════════════════════════════════════════════════════ */

(function (raiz, fabrica) {
    if (typeof module === 'object' && module.exports) module.exports = fabrica();
    else raiz.PCFTAgenda = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Canaã dos Carajás e São Paulo: UTC−3, sem horário de verão.
    const FUSO = 'America/Sao_Paulo';
    const RODIZIO = 'rodizio';
    const MAX_ENTRADAS = 30;
    const ONDE = {
        status: { nome: 'Status do WhatsApp', curto: 'Status', canal: 'whatsapp' },
        instagram: { nome: 'Stories do Instagram', curto: 'Instagram', canal: 'instagram' },
        facebook: { nome: 'Stories do Facebook', curto: 'Facebook', canal: 'facebook' }
    };
    const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    /** Dia e hora em Canaã: { dia: '2026-10-09', semana: 0–6, hora: 0–23, numero }. */
    function momento(ms) {
        const p = {};
        new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
            .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
        const numero = Math.floor(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / 864e5);
        // 01/01/1970 foi uma quinta-feira (4).
        return { dia: `${p.year}-${p.month}-${p.day}`, semana: (numero + 4) % 7, hora: Number(p.hour) % 24, numero };
    }

    /** Instante (ms) de uma hora do dia em Canaã. */
    const instante = (quando, hora) => quando.numero * 864e5 + (hora + 3) * 3600e3;

    /** Entradas vindas do painel ou do banco, limpas e sem repetição de id. */
    function normalizar(lista) {
        const vistos = new Set();
        return (Array.isArray(lista) ? lista : []).slice(0, MAX_ENTRADAS).map((e, i) => {
            const x = e || {};
            const dias = [...new Set((Array.isArray(x.dias) ? x.dias : []).map(Number))]
                .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b);
            const onde = Object.keys(ONDE).filter((o) => Array.isArray(x.onde) && x.onde.includes(o));
            let id = String(x.id || '').replace(/[^\w-]/g, '').slice(0, 24) || 'h' + i;
            while (vistos.has(id)) id += 'x';
            vistos.add(id);
            return { id, arte: String(x.arte || RODIZIO).slice(0, 120), hora: Math.trunc(Number(x.hora)), dias, onde };
        }).filter((e) => e.hora >= 0 && e.hora <= 23 && e.dias.length && e.onde.length);
    }

    /** Promoção fora do período não entra (nem no rodízio, nem fixa). */
    function vigente(arte, ms) {
        if (!arte) return false;
        if (arte.fim && ms > arte.fim) return false;
        if (arte.inicio && ms < arte.inicio) return false;
        return true;
    }

    /** "Criação de apps (feed)" → "Criação de apps": o formato é só para o painel. */
    function limparTitulo(titulo) {
        return String(titulo || '').replace(/\s*\((feed|status[^)]*|stor[^)]*)\)\s*$/i, '').trim();
    }

    const ehVertical = (arte) => /status|stor/i.test(arte.titulo || '');

    /**
     * Artes do rodízio: as da aba (sem os produtos da loja), só promoções em
     * vigor, e uma por assunto — se a mesma arte tem versão de feed e de
     * Status/Stories, fica a vertical, que é a do formato certo.
     */
    function poolDoRodizio(artes, ms) {
        const porAssunto = new Map();
        (artes || []).filter((a) => a && a.id && !a.produto && vigente(a, ms)).forEach((a) => {
            const chave = limparTitulo(a.titulo).toLowerCase() || a.id;
            const atual = porAssunto.get(chave);
            if (!atual || (ehVertical(a) && !ehVertical(atual))) porAssunto.set(chave, a);
        });
        return [...porAssunto.values()].sort((a, b) =>
            ((Number(a.ordem) || 0) - (Number(b.ordem) || 0)) || String(a.id).localeCompare(String(b.id)));
    }

    /**
     * Horários de um dia, em ordem, já com a arte de cada um.
     *
     * Rodízio sem memória: cada horário de rodízio pega a próxima arte da
     * fila, e a contagem continua de um dia para o outro (conta os horários
     * de rodízio de todas as semanas anteriores). Painel e servidor chegam
     * na mesma arte sem precisar guardar "qual foi a última".
     */
    function slotsDoDia(entradas, quando, artes) {
        const lista = normalizar(entradas);
        const doDia = lista.filter((e) => e.dias.includes(quando.semana))
            .sort((a, b) => (a.hora - b.hora) || a.id.localeCompare(b.id));

        const porSemana = [0, 0, 0, 0, 0, 0, 0];
        lista.filter((e) => e.arte === RODIZIO).forEach((e) => e.dias.forEach((d) => { porSemana[d]++; }));
        const totalSemana = porSemana.reduce((a, b) => a + b, 0);
        const semanas = Math.floor((quando.numero + 4) / 7);
        let contador = semanas * totalSemana + porSemana.slice(0, quando.semana).reduce((a, b) => a + b, 0);
        // A fila do dia é montada ao meio-dia: promoção que vale "hoje" entra
        // no dia todo, e a fila não muda de um horário para o outro.
        const fila = poolDoRodizio(artes, instante(quando, 12));
        const porId = new Map((artes || []).filter((a) => a && a.id).map((a) => [a.id, a]));

        return doDia.map((e) => {
            const rodizio = e.arte === RODIZIO;
            let arte = null;
            if (rodizio) {
                arte = fila.length ? fila[contador % fila.length] : null;
                contador++;
            } else {
                arte = porId.get(e.arte) || null;
                if (arte && !vigente(arte, instante(quando, e.hora))) arte = null;
            }
            return { chave: quando.dia + '_' + e.id, entrada: e.id, hora: e.hora, onde: e.onde, rodizio, arte };
        });
    }

    /** ["status", "instagram"] → "Status do WhatsApp e Stories do Instagram". */
    function nomesOnde(onde) {
        const nomes = (onde || []).filter((o) => ONDE[o]).map((o) => ONDE[o].nome);
        return nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1] : (nomes[0] || '');
    }

    const horaTexto = (h) => String(h).padStart(2, '0') + 'h';

    return { FUSO, RODIZIO, MAX_ENTRADAS, ONDE, DIAS, momento, normalizar, vigente, limparTitulo, poolDoRodizio, slotsDoDia, nomesOnde, horaTexto };
});
