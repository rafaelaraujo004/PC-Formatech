/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Programação da Divulgação (Status e Stories)

   Usado em dois lugares, e por isso num arquivo só:
   • no painel (admin-agenda.js), para a "Programação de hoje";
   • no servidor (api/publicacoes.js), que manda o lembrete na hora.
   Assim a arte que o painel mostra para as 12h é a mesma da notificação.

   Cada entrada da programação: { id, arte, hora, dias, onde }
   • arte: id de uma arte da aba Divulgação, ou um rodízio (uma arte
     diferente a cada horário): "rodizio" (todas as artes),
     "rodizio-video-pcformatech" ou "rodizio-video-birdtech" (só os vídeos);
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

    /** Reels: vídeo no registro, ou a capa reels-*.jpg (o MP4 fica ao lado). */
    const temVideo = (a) => Boolean(a && (a.video || /^\/images\/divulgacao\/reels-/.test(a.imagem || '')));

    // Cada rodízio tem a sua fila e a sua contagem: um não "pula" a vez do outro.
    const RODIZIOS = {
        rodizio: { nome: '🔁 Rodízio (todas as artes)', curto: 'Rodízio', filtro: () => true },
        'rodizio-video-pcformatech': { nome: '🎬 Rodízio de vídeos PC Formatech', curto: 'Rodízio de vídeos PC Formatech', filtro: (a) => temVideo(a) && a.categoria !== 'birdtech' },
        'rodizio-video-birdtech': { nome: '🎬 Rodízio de vídeos Bird Tech', curto: 'Rodízio de vídeos Bird Tech', filtro: (a) => temVideo(a) && a.categoria === 'birdtech' }
    };
    const ehRodizio = (arte) => Object.prototype.hasOwnProperty.call(RODIZIOS, arte);

    // Pedido do Rafael (15/10/2026): todo dia de manhã, pelo menos um vídeo da
    // PC Formatech e um da Bird Tech, revezando. Se a programação salva não
    // cobre algum dia, o horário entra sozinho para os dias que faltam.
    const VIDEOS_DA_MANHA = [
        { id: 'manha-video-pcf', arte: 'rodizio-video-pcformatech', hora: 8 },
        { id: 'manha-video-bird', arte: 'rodizio-video-birdtech', hora: 10 }
    ];
    const ULTIMA_HORA_DA_MANHA = 11;
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
    function poolDoRodizio(artes, ms, tipo) {
        const filtro = (RODIZIOS[tipo] || RODIZIOS[RODIZIO]).filtro;
        const porAssunto = new Map();
        (artes || []).filter((a) => a && a.id && !a.produto && vigente(a, ms) && filtro(a)).forEach((a) => {
            const chave = limparTitulo(a.titulo).toLowerCase() || a.id;
            const atual = porAssunto.get(chave);
            if (!atual || (ehVertical(a) && !ehVertical(atual))) porAssunto.set(chave, a);
        });
        const fila = [...porAssunto.values()].sort((a, b) =>
            ((Number(a.ordem) || 0) - (Number(b.ordem) || 0)) || String(a.id).localeCompare(String(b.id)));
        // Nos rodízios de vídeo, as categorias se espalham pela fila (os vídeos
        // de apps não caem em dias seguidos no meio dos de serviço). O rodízio
        // geral fica como sempre foi.
        return tipo && tipo !== RODIZIO ? espalhar(fila) : fila;
    }

    /** Intercala por categoria: cada grupo ocupa posições igualmente espaçadas. */
    function espalhar(fila) {
        const grupos = new Map();
        fila.forEach((a) => { const g = a.categoria || ''; if (!grupos.has(g)) grupos.set(g, []); grupos.get(g).push(a); });
        const ordemDoGrupo = [...grupos.keys()].sort((x, y) => grupos.get(y).length - grupos.get(x).length);
        return ordemDoGrupo
            .flatMap((g, gi) => grupos.get(g).map((a, i) => ({ a, chave: (i + 0.5) / grupos.get(g).length, gi })))
            .sort((x, y) => (x.chave - y.chave) || (x.gi - y.gi))
            .map((x) => x.a);
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
        const lista = garantirVideosDaManha(normalizar(entradas));
        const doDia = lista.filter((e) => e.dias.includes(quando.semana))
            .sort((a, b) => (a.hora - b.hora) || a.id.localeCompare(b.id));
        const semanas = Math.floor((quando.numero + 4) / 7);
        // A fila do dia é montada ao meio-dia: promoção que vale "hoje" entra
        // no dia todo, e a fila não muda de um horário para o outro.
        const meioDia = instante(quando, 12);
        const filas = {};
        const contadores = {};
        Object.keys(RODIZIOS).forEach((tipo) => {
            const porSemana = [0, 0, 0, 0, 0, 0, 0];
            lista.filter((e) => e.arte === tipo).forEach((e) => e.dias.forEach((d) => { porSemana[d]++; }));
            const totalSemana = porSemana.reduce((a, b) => a + b, 0);
            contadores[tipo] = semanas * totalSemana + porSemana.slice(0, quando.semana).reduce((a, b) => a + b, 0);
            filas[tipo] = poolDoRodizio(artes, meioDia, tipo);
        });
        const porId = new Map((artes || []).filter((a) => a && a.id).map((a) => [a.id, a]));

        return doDia.map((e) => {
            const rodizio = ehRodizio(e.arte);
            let arte = null;
            if (rodizio) {
                const fila = filas[e.arte];
                arte = fila.length ? fila[contadores[e.arte] % fila.length] : null;
                contadores[e.arte]++;
            } else {
                arte = porId.get(e.arte) || null;
                if (arte && !vigente(arte, instante(quando, e.hora))) arte = null;
            }
            return { chave: quando.dia + '_' + e.id, entrada: e.id, hora: e.hora, onde: e.onde, rodizio, rodizioTipo: rodizio ? e.arte : null, arte };
        });
    }

    /**
     * Garante, para cada dia da semana, um vídeo da PC Formatech e um da Bird
     * Tech de manhã (até as 11h). O que a programação salva já cobre fica como
     * está; para os dias que faltam entra o horário padrão (8h e 10h, Status e
     * Instagram).
     */
    function garantirVideosDaManha(lista) {
        const saida = lista.slice();
        VIDEOS_DA_MANHA.forEach((padrao) => {
            const cobertos = new Set();
            saida.filter((e) => e.arte === padrao.arte && e.hora <= ULTIMA_HORA_DA_MANHA).forEach((e) => e.dias.forEach((d) => cobertos.add(d)));
            const faltam = [0, 1, 2, 3, 4, 5, 6].filter((d) => !cobertos.has(d));
            if (!faltam.length) return;
            let id = padrao.id;
            while (saida.some((e) => e.id === id)) id += 'x';
            saida.push({ id, arte: padrao.arte, hora: padrao.hora, dias: faltam, onde: ['status', 'instagram'] });
        });
        return saida;
    }

    /** ["status", "instagram"] → "Status do WhatsApp e Stories do Instagram". */
    function nomesOnde(onde) {
        const nomes = (onde || []).filter((o) => ONDE[o]).map((o) => ONDE[o].nome);
        return nomes.length > 1 ? nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1] : (nomes[0] || '');
    }

    const horaTexto = (h) => String(h).padStart(2, '0') + 'h';

    return { FUSO, RODIZIO, RODIZIOS, VIDEOS_DA_MANHA, MAX_ENTRADAS, ONDE, DIAS, momento, normalizar, vigente, limparTitulo, temVideo, ehRodizio, poolDoRodizio, slotsDoDia, garantirVideosDaManha, nomesOnde, horaTexto };
});
