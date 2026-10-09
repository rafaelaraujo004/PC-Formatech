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
        tiktok: 'TikTok',
        email: 'E-mail',
        telegram: 'Telegram'
    };

    /*
     * Canais: toda origem cai num deles, inclusive os links marcados
     * (?origem=whatsapp-status). Assim o painel soma "WhatsApp" de verdade:
     * quem chegou pelo app (referência) + quem clicou num link marcado.
     * "palavras" são os pedaços de nome de link que indicam o canal (vale
     * para os links antigos também, como "status-whatsapp").
     */
    const CANAIS = [
        { id: 'whatsapp', nome: 'WhatsApp', cor: '#25D366', icone: 'fab fa-whatsapp', palavras: ['whatsapp', 'wpp', 'zap', 'wa'] },
        { id: 'instagram', nome: 'Instagram', cor: '#E1306C', icone: 'fab fa-instagram', palavras: ['instagram', 'insta', 'ig'] },
        { id: 'facebook', nome: 'Facebook', cor: '#1877F2', icone: 'fab fa-facebook', palavras: ['facebook', 'face', 'fb', 'messenger'] },
        { id: 'google', nome: 'Google', cor: '#4285F4', icone: 'fab fa-google', palavras: ['google', 'gmn', 'maps'] },
        { id: 'impresso', nome: 'Impresso e QR', cor: '#8D6E63', icone: 'fas fa-qrcode', palavras: ['impresso', 'panfleto', 'cartao', 'qr', 'qrcode', 'adesivo', 'folder', 'flyer', 'banner'] },
        { id: 'indicacao', nome: 'Indicações', cor: '#F59E0B', icone: 'fas fa-share-alt', palavras: ['indicacao', 'indicou', 'compartilhado'] },
        { id: 'direto', nome: 'Acesso direto', cor: '#90A4AE', icone: 'fas fa-keyboard', palavras: [] },
        { id: 'outros', nome: 'Outros', cor: '#7E57C2', icone: 'fas fa-globe', palavras: [] }
    ];
    const CANAL_POR_ID = {};
    CANAIS.forEach((c) => { CANAL_POR_ID[c.id] = c; });

    // Nome legível do "lugar" dentro do canal (o pedaço depois do canal no link).
    const LUGARES = {
        status: 'Status', grupo: 'Grupos', grupos: 'Grupos', conversa: 'Conversas', conversas: 'Conversas',
        privado: 'Conversas', lista: 'Lista de transmissão', transmissao: 'Lista de transmissão',
        bio: 'Link da bio', stories: 'Stories', story: 'Stories', direct: 'Direct', dm: 'Direct',
        post: 'Post', feed: 'Post', reels: 'Reels', pagina: 'Página', marketplace: 'Marketplace',
        perfil: 'Perfil da Empresa', postagem: 'Postagem', maps: 'Maps', panfleto: 'Panfleto',
        cartao: 'Cartão de visita', balcao: 'QR no balcão', loja: 'QR na loja', adesivo: 'Adesivo',
        divulgacao: 'Artes da Divulgação', produto: 'Produto da loja', anuncio: 'Anúncio', bairro: 'Grupo do bairro',
        arte: 'Arte'
    };

    /*
     * Artes da aba Divulgação: cada uma tem um código curto e fixo (6 letras),
     * calculado do id dela. O link compartilhado leva "<canal>-arte-<código>",
     * e o painel troca o código pelo título da arte (registrarArtes).
     */
    function codigoDaArte(id) {
        let h = 0x811c9dc5;
        const t = String(id || '');
        for (let i = 0; i < t.length; i++) {
            h ^= t.charCodeAt(i);
            h = Math.imul(h, 0x01000193) >>> 0;
        }
        return ('000000' + h.toString(36)).slice(-6);
    }

    const NOMES_ARTES = {};
    /** { código: título } — o painel chama ao carregar a Divulgação. */
    function registrarArtes(mapa) {
        Object.keys(mapa || {}).forEach((k) => { if (mapa[k]) NOMES_ARTES[k] = String(mapa[k]); });
    }

    function nomeDaArte(codigo) {
        return NOMES_ARTES[codigo] ? 'Arte “' + NOMES_ARTES[codigo] + '”' : 'Arte ' + codigo;
    }

    function pedacosDoLink(slug) {
        return String(slug || '').split(/[-_]+/).filter(Boolean);
    }

    /** Canal (id) de uma origem gravada: "whatsapp", "link:whatsapp-status", "site:x"… */
    function canalDaOrigem(origem) {
        const o = String(origem || 'direto');
        if (o === 'direto') return 'direto';
        if (o === 'busca') return 'google';
        if (CANAL_POR_ID[o]) return o;
        if (o.indexOf('link:') === 0) {
            const pedacos = pedacosDoLink(o.slice(5));
            const canal = CANAIS.find((c) => c.palavras.some((p) => pedacos.indexOf(p) >= 0));
            return canal ? canal.id : 'outros';
        }
        return 'outros';
    }

    /** "link:whatsapp-status-promo-outubro" → "WhatsApp · Status · promo outubro". */
    function nomeDoLink(slug) {
        const pedacos = pedacosDoLink(slug);
        const canal = CANAIS.find((c) => c.palavras.some((p) => pedacos.indexOf(p) >= 0));
        if (!canal) return 'Link “' + slug + '”';
        // Tira só o pedaço que disse o canal; o resto é o lugar e a campanha.
        const marca = pedacos.findIndex((p) => canal.palavras.indexOf(p) >= 0);
        const resto = pedacos.filter((p, i) => i !== marca);
        // "panfleto", "cartao"… dizem o canal (Impresso) e o lugar ao mesmo tempo.
        if (!resto.length) return canal.nome + ' · ' + (LUGARES[pedacos[marca]] || 'link marcado');
        // "whatsapp-arte-x7k2pq": o código vira o título da arte.
        if (resto[0] === 'arte' && resto[1]) return [canal.nome, nomeDaArte(resto[1])].concat(resto.slice(2)).join(' · ');
        const lugar = LUGARES[resto[0]];
        const partes = [canal.nome];
        if (lugar) partes.push(lugar);
        const campanha = (lugar ? resto.slice(1) : resto).join(' ');
        if (campanha) partes.push(campanha);
        return partes.join(' · ');
    }

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
        if (o.indexOf('link:') === 0) return nomeDoLink(o.slice(5));
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

    /** Como ordenar(), mas chaves com o mesmo nome viram uma linha só. */
    function ordenarPorNome(mapa, nomear, limite) {
        const porNome = {};
        Object.keys(mapa).forEach((chave) => {
            const nome = nomear(chave);
            if (!porNome[nome]) porNome[nome] = { chave, nome, canal: canalDaOrigem(chave), total: 0 };
            porNome[nome].total += mapa[chave];
        });
        return Object.keys(porNome).map((n) => porNome[n])
            .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
            .slice(0, limite || 10);
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
            origens: ordenarPorNome(origens, nomeOrigem, 8),
            origensMapa: origens,
            canais: somarCanais(origens),
            artes: somarArtes(origens),
            servicos: ordenar(servicos, nomeServico, 10),
            buscas: ordenar(buscas, null, 10),
            porHora,
            dias
        };
    }

    /** Visitas por arte da Divulgação, somando os canais (WhatsApp, Instagram…). */
    function somarArtes(origens) {
        const porArte = {};
        Object.keys(origens).forEach((k) => {
            if (k.indexOf('link:') !== 0) return;
            const pedacos = pedacosDoLink(k.slice(5));
            const i = pedacos.indexOf('arte');
            if (i < 0 || !pedacos[i + 1]) return;
            const codigo = pedacos[i + 1];
            const canal = canalDaOrigem(k);
            const a = porArte[codigo] || (porArte[codigo] = { codigo, total: 0, canais: {} });
            a.total += origens[k];
            a.canais[canal] = (a.canais[canal] || 0) + origens[k];
        });
        return Object.keys(porArte).map((c) => Object.assign(porArte[c], {
            nome: NOMES_ARTES[c] || null,
            canais: CANAIS.filter((x) => porArte[c].canais[x.id]).map((x) => ({ id: x.id, nome: x.nome, cor: x.cor, icone: x.icone, total: porArte[c].canais[x.id] }))
        })).sort((a, b) => b.total - a.total);
    }

    /** Total de visitas por canal, do maior para o menor (só canais com visita). */
    function somarCanais(origens) {
        const total = Object.keys(origens).reduce((t, k) => t + origens[k], 0);
        const porCanal = {};
        Object.keys(origens).forEach((k) => {
            const id = canalDaOrigem(k);
            porCanal[id] = (porCanal[id] || 0) + origens[k];
        });
        return CANAIS.filter((c) => porCanal[c.id])
            .map((c) => ({ id: c.id, nome: c.nome, cor: c.cor, icone: c.icone, total: porCanal[c.id], pct: total ? Math.round((porCanal[c.id] / total) * 100) : 0 }))
            .sort((a, b) => b.total - a.total);
    }

    /** "20260923" no fuso informado (padrão: horário de Belém, o da loja). */
    function chaveDoDia(data, fuso) {
        const partes = new Intl.DateTimeFormat('en-CA', {
            timeZone: fuso || 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(data || new Date());
        return partes.replace(/-/g, '');
    }

    return { calcular, chaveDoDia, nomeServico, nomeOrigem, calcularPico, canalDaOrigem, nomeDoLink, codigoDaArte, registrarArtes, CANAIS, LUGARES };
});
