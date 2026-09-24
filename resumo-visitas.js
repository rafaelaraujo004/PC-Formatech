/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Cálculo do resumo de visitas

   Usado em dois lugares, e por isso num arquivo só:
   • no painel (admin.html), para a seção "Resumo de visitas";
   • no servidor (api/resumo-diario.js), para a notificação das 21h.
   Assim o número que chega no celular é o mesmo que aparece no painel.

   Entrada: registros da coleção presenceDaily — um por visita (sessão) por dia,
   gravados pelo rastreador do theme-system.js.
   ═══════════════════════════════════════════════════════════════════════════ */

(function (raiz, fabrica) {
    if (typeof module === 'object' && module.exports) module.exports = fabrica();
    else raiz.PCFTResumo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NOMES_SERVICO = {
        formatacao: 'Formatação',
        manutencao: 'Computador lento / manutenção',
        seguranca: 'Vírus e segurança',
        programas: 'Instalar programas',
        drivers: 'Drivers (som, Wi-Fi, vídeo)',
        backup: 'Backup de arquivos',
        remoto: 'Atendimento remoto',
        ajuda: 'Não sabe o problema',
        'limpeza-simples': 'Limpeza simples',
        'limpeza-completa': 'Limpeza completa'
    };

    const NOMES_ORIGEM = {
        direto: 'Acesso direto',
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        facebook: 'Facebook',
        google: 'Google',
        busca: 'Outros buscadores',
        youtube: 'YouTube',
        tiktok: 'TikTok'
    };

    // Uma visita sem batida nova por mais que isto é considerada encerrada.
    // O histórico é gravado no máximo a cada 60 s, então a última batida pode
    // estar até 60 s atrás do momento real em que a pessoa saiu.
    const FOLGA_FIM_MS = 60 * 1000;
    const DURACAO_MAXIMA_MS = 3 * 60 * 60 * 1000;

    function nomeServico(id) {
        return NOMES_SERVICO[id] || id;
    }

    function nomeOrigem(origem) {
        const o = String(origem || 'direto');
        if (NOMES_ORIGEM[o]) return NOMES_ORIGEM[o];
        if (o.indexOf('link:') === 0) return 'Link “' + o.slice(5) + '”';
        if (o.indexOf('site:') === 0) return o.slice(5);
        return o;
    }

    function numero(v) {
        if (typeof v === 'number' && isFinite(v)) return v;
        if (v && typeof v.toMillis === 'function') return v.toMillis();
        if (v && typeof v.seconds === 'number') return v.seconds * 1000;
        return 0;
    }

    function contar(mapa, chave, quanto) {
        if (!chave) return;
        mapa[chave] = (mapa[chave] || 0) + (quanto || 1);
    }

    function ordenar(mapa, nomear, limite) {
        return Object.keys(mapa)
            .map((chave) => ({ chave, nome: nomear ? nomear(chave) : chave, total: mapa[chave] }))
            .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
            .slice(0, limite || 10);
    }

    /** Intervalo [início, fim] em ms de uma visita. */
    function intervalo(r) {
        const fimBruto = numero(r.lastSeenClient) || numero(r.lastSeen);
        if (!fimBruto) return null;
        let inicio = numero(r.entrouClient) || fimBruto;
        if (inicio > fimBruto) inicio = fimBruto;
        if (fimBruto - inicio > DURACAO_MAXIMA_MS) inicio = fimBruto - DURACAO_MAXIMA_MS;
        return { inicio, fim: fimBruto + FOLGA_FIM_MS / 2, duracao: fimBruto - inicio };
    }

    /**
     * Maior número de visitas simultâneas e o momento em que aconteceu.
     * Varre os começos e fins em ordem; empate fim/início conta o fim primeiro,
     * para duas visitas que só se tocam não parecerem simultâneas.
     */
    function calcularPico(intervalos) {
        const marcos = [];
        intervalos.forEach((i) => {
            marcos.push([i.inicio, 1]);
            marcos.push([i.fim, -1]);
        });
        marcos.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let atual = 0;
        let pico = 0;
        let quando = null;
        marcos.forEach(([t, delta]) => {
            atual += delta;
            if (atual > pico) { pico = atual; quando = t; }
        });
        return { pico, quando };
    }

    /**
     * @param {Array<Object>} registros  documentos de presenceDaily (data())
     * @returns resumo pronto para exibir
     */
    function calcular(registros) {
        const lista = (registros || []).filter(Boolean);
        const visitantes = new Set();
        const dispositivos = {};
        const origens = {};
        const servicos = {};
        const buscas = {};
        const porHora = new Array(24).fill(0);
        const porDia = {};
        const intervalos = [];
        let whatsapp = 0;
        let agendamentos = 0;
        let somaDuracao = 0;
        let comDuracao = 0;

        lista.forEach((r) => {
            if (r.visitorId) visitantes.add(r.visitorId);
            contar(dispositivos, r.dispositivo || 'desktop');
            contar(origens, r.origem || 'direto');

            // Serviço conta uma vez por visita, venha da busca, do card ou do
            // formulário — o que interessa é quantas pessoas se interessaram.
            const doVisitante = new Set((r.servicos || []).map(String));
            (r.acoes || []).forEach((a) => {
                const partes = String(a).split(':');
                if (partes[1] && partes[1] !== 'sem-resultado') doVisitante.add(partes[1]);
            });
            doVisitante.forEach((id) => contar(servicos, id));

            (r.buscas || []).forEach((b) => contar(buscas, String(b)));

            const acoes = (r.acoes || []).map(String);
            if (acoes.some((a) => a.indexOf('whatsapp') === 0)) whatsapp++;
            if (acoes.some((a) => a.indexOf('agendou') === 0)) agendamentos++;

            const i = intervalo(r);
            if (i) {
                intervalos.push(i);
                if (i.duracao > 0) { somaDuracao += i.duracao; comDuracao++; }
                porHora[new Date(i.inicio).getHours()]++;
            }

            const dia = r.dayKey || '';
            if (dia) {
                porDia[dia] = porDia[dia] || { visitas: 0, visitantes: new Set(), intervalos: [] };
                porDia[dia].visitas++;
                if (r.visitorId) porDia[dia].visitantes.add(r.visitorId);
                if (i) porDia[dia].intervalos.push(i);
            }
        });

        const pico = calcularPico(intervalos);

        const dias = Object.keys(porDia).sort().map((dia) => {
            const d = porDia[dia];
            const p = calcularPico(d.intervalos);
            return { dia, visitas: d.visitas, visitantes: d.visitantes.size, pico: p.pico, picoQuando: p.quando };
        });

        return {
            visitas: lista.length,
            visitantes: visitantes.size,
            pico: pico.pico,
            picoQuando: pico.quando,
            duracaoMediaMs: comDuracao ? Math.round(somaDuracao / comDuracao) : 0,
            whatsapp,
            agendamentos,
            dispositivos,
            origens: ordenar(origens, nomeOrigem, 8),
            servicos: ordenar(servicos, nomeServico, 10),
            buscas: ordenar(buscas, null, 10),
            porHora,
            dias
        };
    }

    /** "20260923" no fuso informado (padrão: horário de Belém, o da loja). */
    function chaveDoDia(data, fuso) {
        const partes = new Intl.DateTimeFormat('en-CA', {
            timeZone: fuso || 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(data || new Date());
        return partes.replace(/-/g, '');
    }

    return { calcular, chaveDoDia, nomeServico, nomeOrigem, calcularPico };
});
