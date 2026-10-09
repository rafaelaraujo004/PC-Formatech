/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Resumo de visitas (aba Tempo Real)

   Lê a coleção presenceDaily (uma linha por visita por dia, gravada pelo
   rastreador do theme-system.js) e mostra o resumo calculado por
   resumo-visitas.js — o mesmo cálculo da notificação diária.

   Como o painel é usado como app no celular (TWA), esta camada:
   • guarda a última carga em localStorage e mostra ela na abertura, para o
     app não ficar em branco quando a rede está lenta;
   • ouve o Firestore em tempo real e atualiza a tela sozinha;
   • deixa um botão de atualizar manual, para dar segurança de que os números
     são de agora;
   • detecta "permission-denied" e mostra as regras corrigidas em um card, com
     um botão que copia — a pessoa cola no console do Firebase e resolve.

   Tudo que vem de visitante (texto da busca, nome de origem) entra na página
   como texto, nunca como HTML: a coleção aceita escrita pública.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const CACHE_KEY = 'pcft_resumo_cache_v1';

    let dias = 1;
    let cancelarEscuta = null;
    let iniciado = false;
    let ultimaLeituraOk = 0;
    let carregando = false;
    let pedidoInstalacao = null;

    function db() {
        try { return typeof getFirebaseDB === 'function' ? getFirebaseDB() : null; } catch (e) { return null; }
    }

    // ── Cache local ─────────────────────────────────────────────────────────

    function guardarNoCache(dias, registros) {
        try {
            const bruto = registros.map((r) => ({
                sessionId: r.sessionId, visitorId: r.visitorId, dayKey: r.dayKey,
                dispositivo: r.dispositivo, origem: r.origem,
                entrouClient: r.entrouClient,
                lastSeenClient: r.lastSeenClient || (r.lastSeen && r.lastSeen.toMillis && r.lastSeen.toMillis()),
                servicos: r.servicos, buscas: r.buscas, acoes: r.acoes
            }));
            const atual = safeJSON(localStorage.getItem(CACHE_KEY)) || {};
            atual[dias] = { salvoEm: Date.now(), registros: bruto };
            localStorage.setItem(CACHE_KEY, JSON.stringify(atual));
        } catch (e) { /* sem espaço: segue sem guardar */ }
    }

    function lerDoCache(dias) {
        try {
            const atual = safeJSON(localStorage.getItem(CACHE_KEY));
            return atual && atual[dias] ? atual[dias] : null;
        } catch (e) { return null; }
    }

    function safeJSON(t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } }

    // ── Escuta do Firestore em tempo real ────────────────────────────────────

    function escutarPeriodo(motivo) {
        if (cancelarEscuta) { cancelarEscuta(); cancelarEscuta = null; }
        const banco = db();
        if (!banco || !window.PCFTResumo) {
            // Sem banco (não logou): tenta mostrar o cache; se não tem, avisa.
            const cache = lerDoCache(dias);
            if (cache) {
                renderizar(cache.registros, { deCache: true, salvoEm: cache.salvoEm });
                nota('Mostrando o que este aparelho guardou. Entre no painel para atualizar.');
            } else {
                nota('Sem conexão com o banco. Entre no painel para carregar as visitas.');
                mostrarEsqueleto();
            }
            return;
        }

        // Mostra imediatamente o que estava no cache do período, se houver,
        // enquanto o Firebase responde. O app não fica em branco.
        const cache = lerDoCache(dias);
        if (cache && motivo === 'inicio') {
            renderizar(cache.registros, { deCache: true, salvoEm: cache.salvoEm });
        } else if (motivo !== 'atualizar-manual') {
            mostrarEsqueleto();
        }

        marcarCarregando(true, motivo === 'atualizar-manual' ? 'Atualizando…' : 'Carregando…');

        const desde = PCFTResumo.chaveDoDia(new Date(Date.now() - (dias - 1) * 86400000));
        cancelarEscuta = banco.collection('presenceDaily')
            .where('dayKey', '>=', desde)
            .onSnapshot(
                (snap) => {
                    const registros = snap.docs.map((d) => d.data());
                    guardarNoCache(dias, registros);
                    ultimaLeituraOk = Date.now();
                    $('av-alerta').hidden = true;
                    renderizar(registros, {});
                    marcarCarregando(false);
                },
                (erro) => {
                    console.warn('Resumo de visitas:', erro);
                    marcarCarregando(false);
                    tratarErroDeLeitura(erro);
                }
            );
    }

    function tratarErroDeLeitura(erro) {
        const cache = lerDoCache(dias);
        if (cache) {
            renderizar(cache.registros, { deCache: true, salvoEm: cache.salvoEm });
        }
        if (erro && erro.code === 'permission-denied') {
            $('av-alerta').hidden = false;
            nota(cache
                ? 'Sem permissão. Mostrando o último carregamento salvo aqui.'
                : 'Sem permissão para ler as visitas. Veja abaixo como resolver.');
        } else {
            nota(cache
                ? 'Não consegui atualizar agora. Mostrando o último carregamento salvo.'
                : 'Não foi possível carregar as visitas agora.');
        }
    }

    // ── Estados de tela ──────────────────────────────────────────────────────

    function nota(texto) {
        const el = $('av-nota');
        if (el) el.textContent = texto;
    }

    function marcarCarregando(estaCarregando, texto) {
        carregando = estaCarregando;
        const botao = $('av-refresh');
        if (botao) {
            botao.classList.toggle('is-carregando', estaCarregando);
            botao.disabled = estaCarregando;
        }
        if (texto) nota(texto);
    }

    function mostrarEsqueleto() {
        document.querySelector('.av-kpis-grandes').classList.add('av-esqueleto');
        document.querySelector('.av-kpis-mini').classList.add('av-esqueleto');
    }

    function ocultarEsqueleto() {
        document.querySelector('.av-kpis-grandes').classList.remove('av-esqueleto');
        document.querySelector('.av-kpis-mini').classList.remove('av-esqueleto');
    }

    // ── Formatadores ─────────────────────────────────────────────────────────

    function formatarDuracao(ms) {
        if (!ms) return '—';
        const min = Math.round(ms / 60000);
        if (min < 1) return '<1 min';
        if (min < 60) return min + ' min';
        return Math.floor(min / 60) + 'h ' + String(min % 60).padStart(2, '0');
    }

    function formatarHora(ms) {
        return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function formatarDia(chave) {
        const d = new Date(+chave.slice(0, 4), +chave.slice(4, 6) - 1, +chave.slice(6, 8));
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
    }

    function tempoRelativo(ms) {
        if (!ms) return '';
        const seg = Math.round((Date.now() - ms) / 1000);
        if (seg < 30) return 'agora mesmo';
        if (seg < 60) return 'há ' + seg + ' s';
        const min = Math.round(seg / 60);
        if (min < 60) return 'há ' + min + ' min';
        const h = Math.round(min / 60);
        if (h < 24) return 'há ' + h + ' h';
        return 'em ' + new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    // ── Renderização ─────────────────────────────────────────────────────────

    let ultimoRender = null;
    let pediuArtes = false;

    function icone(classes) {
        const i = document.createElement('i');
        i.className = classes;
        i.setAttribute('aria-hidden', 'true');
        return i;
    }

    /**
     * "De onde vieram": primeiro o total por canal (WhatsApp, Instagram…,
     * somando quem veio pelo app e quem clicou num link marcado), depois o
     * detalhe de cada origem com a cor do canal.
     */
    function desenharOrigens(r, periodo) {
        const box = $('av-canais');
        if (box) {
            box.textContent = '';
            (r.canais || []).forEach((c) => {
                const item = document.createElement('div');
                item.className = 'av-canal';
                item.style.setProperty('--av-cor', c.cor);
                item.style.setProperty('--av-pct', Math.max(3, c.pct) + '%');
                item.title = c.nome + ': ' + c.total + (c.total === 1 ? ' visita' : ' visitas') + ' ' + periodo;
                const marca = document.createElement('span');
                marca.className = 'av-canal-icone';
                marca.appendChild(icone(c.icone));
                const nome = document.createElement('span');
                nome.className = 'av-canal-nome';
                nome.textContent = c.nome;
                const total = document.createElement('strong');
                total.className = 'av-canal-total';
                total.textContent = c.total;
                const pct = document.createElement('span');
                pct.className = 'av-canal-pct';
                pct.textContent = c.pct + '%';
                item.append(marca, nome, total, pct);
                box.appendChild(item);
            });
        }

        const ol = $('av-origens');
        if (ol) {
            ol.textContent = '';
            if (!r.origens.length) {
                const li = document.createElement('li');
                li.className = 'av-vazio';
                li.textContent = 'Sem visitas no período.';
                ol.appendChild(li);
            } else {
                const maior = r.origens[0].total || 1;
                const canal = (id) => (PCFTResumo.CANAIS || []).find((c) => c.id === id) || {};
                r.origens.forEach((o) => {
                    const c = canal(o.canal);
                    const li = document.createElement('li');
                    li.className = 'av-origem';
                    li.style.setProperty('--av-largura', Math.max(4, Math.round((o.total / maior) * 100)) + '%');
                    if (c.cor) li.style.setProperty('--av-cor', c.cor);
                    const nome = document.createElement('span');
                    nome.className = 'av-barra-nome';
                    if (c.icone) nome.appendChild(icone(c.icone));
                    nome.appendChild(document.createTextNode(' ' + o.nome));
                    const total = document.createElement('span');
                    total.className = 'av-barra-total';
                    total.textContent = o.total;
                    li.append(nome, total);
                    ol.appendChild(li);
                });
            }
        }

        // Muita gente em "Acesso direto" quase sempre é WhatsApp sem link marcado.
        const dica = $('av-dica-direto');
        if (dica) {
            const direto = (r.canais || []).find((c) => c.id === 'direto');
            dica.hidden = !(direto && direto.pct >= 30 && r.visitas >= 5);
        }
    }

    /** Ranking das artes da Divulgação que trouxeram visitas (somando os canais). */
    function desenharArtes(r) {
        const cartao = $('av-artes-cartao');
        const ol = $('av-artes');
        if (!cartao || !ol) return;
        const artes = r.artes || [];
        cartao.hidden = !artes.length;
        if (!artes.length) return;
        // Sem os títulos ainda (aba Divulgação não aberta): busca uma vez.
        if (artes.some((a) => !a.nome) && !pediuArtes && window.PCFTDivulgacao && window.PCFTDivulgacao.obterArtes) {
            pediuArtes = true;
            window.PCFTDivulgacao.obterArtes().then(() => { if (ultimoRender) renderizar(ultimoRender[0], ultimoRender[1]); }).catch(() => {});
        }
        ol.textContent = '';
        const maior = artes[0].total || 1;
        artes.slice(0, 8).forEach((a, i) => {
            const li = document.createElement('li');
            li.className = 'av-arte';
            li.style.setProperty('--av-largura', Math.max(4, Math.round((a.total / maior) * 100)) + '%');
            const pos = document.createElement('span');
            pos.className = 'av-arte-pos';
            pos.textContent = (i + 1) + 'º';
            const corpo = document.createElement('div');
            corpo.className = 'av-arte-corpo';
            const nome = document.createElement('strong');
            nome.textContent = a.nome || 'Arte ' + a.codigo;
            const canais = document.createElement('span');
            canais.className = 'av-arte-canais';
            a.canais.forEach((c) => {
                const chip = document.createElement('span');
                chip.className = 'av-arte-canal';
                chip.style.setProperty('--av-cor', c.cor);
                chip.title = c.nome;
                chip.append(icone(c.icone), document.createTextNode(' ' + c.total));
                canais.appendChild(chip);
            });
            corpo.append(nome, canais);
            const total = document.createElement('span');
            total.className = 'av-arte-total';
            total.textContent = a.total;
            li.append(pos, corpo, total);
            ol.appendChild(li);
        });
    }

    function barras(lista, idLista, vazio) {
        const ol = $(idLista);
        if (!ol) return;
        ol.textContent = '';
        if (!lista.length) {
            const li = document.createElement('li');
            li.className = 'av-vazio';
            li.textContent = vazio;
            ol.appendChild(li);
            return;
        }
        const maior = lista[0].total || 1;
        lista.forEach((item) => {
            const li = document.createElement('li');
            li.style.setProperty('--av-largura', Math.max(4, Math.round((item.total / maior) * 100)) + '%');
            const nome = document.createElement('span');
            nome.className = 'av-barra-nome';
            nome.textContent = item.nome;
            const total = document.createElement('span');
            total.className = 'av-barra-total';
            total.textContent = item.total;
            li.append(nome, total);
            ol.appendChild(li);
        });
    }

    function renderizar(registros, opcoes) {
        const r = PCFTResumo.calcular(registros);
        const periodo = dias === 1 ? 'hoje' : 'nos últimos ' + dias + ' dias';
        opcoes = opcoes || {};

        ocultarEsqueleto();

        let linhaEstado;
        if (opcoes.deCache && opcoes.salvoEm) {
            linhaEstado = 'Salvo neste aparelho ' + tempoRelativo(opcoes.salvoEm) + ' · ' + (r.visitas ? 'visitas ' + periodo : 'sem visitas ' + periodo);
        } else if (ultimaLeituraOk) {
            linhaEstado = 'Atualizado ' + tempoRelativo(ultimaLeituraOk) + (r.visitas ? ' · em tempo real' : ' · sem visitas ' + periodo);
        } else {
            linhaEstado = r.visitas ? 'Visitas ' + periodo : 'Nenhuma visita ' + periodo;
        }
        nota(linhaEstado);

        $('av-visitantes').textContent = r.visitantes || 0;
        $('av-visitas').textContent = r.visitas || 0;
        $('av-pico').textContent = r.pico || 0;
        $('av-pico-quando').textContent = r.picoQuando
            ? 'Pico online · ' + (dias === 1 ? '' : new Date(r.picoQuando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ') + 'às ' + formatarHora(r.picoQuando)
            : 'Pico de pessoas online';
        $('av-duracao').textContent = r.duracaoMediaMs ? formatarDuracao(r.duracaoMediaMs) : '—';
        $('av-whatsapp').textContent = r.whatsapp || 0;
        $('av-agendamentos').textContent = r.agendamentos || 0;

        barras(r.servicos, 'av-servicos', 'Ainda ninguém procurou um serviço neste período.');
        desenharOrigens(r, periodo);
        desenharArtes(r);
        ultimoRender = [registros, opcoes];
        if (window.PCFTLinks) window.PCFTLinks.atualizarContagens(r.origensMapa, periodo);
        barras(r.buscas, 'av-buscas', 'Nenhuma busca na página de entrada ainda.');

        const horas = $('av-horas');
        if (horas) {
            horas.textContent = '';
            const maior = Math.max(1, ...r.porHora);
            r.porHora.forEach((qtd, h) => {
                const barra = document.createElement('span');
                barra.style.setProperty('--av-altura', Math.round((qtd / maior) * 100) + '%');
                barra.title = h + 'h: ' + qtd + (qtd === 1 ? ' visita' : ' visitas');
                if (qtd === maior && qtd > 0) barra.className = 'is-maior';
                horas.appendChild(barra);
            });
        }

        const cartaoDias = $('av-dias-cartao');
        const corpo = $('av-dias');
        if (cartaoDias && corpo) {
            cartaoDias.hidden = dias === 1;
            corpo.textContent = '';
            r.dias.slice().reverse().forEach((d) => {
                const tr = document.createElement('tr');
                [
                    formatarDia(d.dia),
                    d.visitantes,
                    d.visitas,
                    d.pico ? d.pico + (d.picoQuando ? ' às ' + formatarHora(d.picoQuando) : '') : '—'
                ].forEach((valor) => {
                    const td = document.createElement('td');
                    td.textContent = valor;
                    tr.appendChild(td);
                });
                corpo.appendChild(tr);
            });
        }
    }

    // ── Preferências de aviso ───────────────────────────────────────────────

    async function carregarPreferencias() {
        const visitas = $('av-pref-visitas');
        const resumo = $('av-pref-resumo');
        const banco = db();
        if (!visitas || !resumo) return;
        visitas.checked = true;
        resumo.checked = true;
        if (!banco) { visitas.disabled = resumo.disabled = true; return; }
        try {
            const doc = await banco.collection('siteSettings').doc('notificacoes').get();
            const dados = doc.exists ? doc.data() : {};
            visitas.checked = dados.visitas !== false;
            resumo.checked = dados.resumoDiario !== false;
        } catch (e) { /* mantém o padrão: ligados */ }

        const salvar = async (campo, valor, caixa) => {
            caixa.disabled = true;
            try {
                await banco.collection('siteSettings').doc('notificacoes').set({ [campo]: valor }, { merge: true });
                status(valor ? 'Aviso ligado.' : 'Aviso desligado.');
            } catch (e) {
                caixa.checked = !valor;
                status('Não consegui salvar. Confira a conexão e tente de novo.');
            } finally {
                caixa.disabled = false;
            }
        };
        visitas.addEventListener('change', () => salvar('visitas', visitas.checked, visitas));
        resumo.addEventListener('change', () => salvar('resumoDiario', resumo.checked, resumo));
    }

    function ligarAparelhoDoDono() {
        const caixa = $('av-dono');
        if (!caixa) return;
        let atual = '1';
        try { atual = localStorage.getItem('pcft_dono') || '1'; } catch (e) { /* padrão */ }
        caixa.checked = atual !== '0';
        caixa.addEventListener('change', () => {
            try { localStorage.setItem('pcft_dono', caixa.checked ? '1' : '0'); } catch (e) { /* bloqueado */ }
            status(caixa.checked
                ? 'Pronto: as visitas deste aparelho não serão contadas.'
                : 'As visitas deste aparelho voltarão a ser contadas.');
        });
    }

    function status(texto) {
        const el = $('av-push-status');
        if (el) el.textContent = texto;
    }

    async function mostrarEstadoDoPush() {
        if (!('Notification' in window)) { status('Este navegador não recebe notificações.'); return; }
        if (Notification.permission === 'denied') {
            status('Avisos bloqueados neste aparelho. Libere em Configurações do site → Notificações.');
            return;
        }
        if (Notification.permission !== 'granted') {
            status('Toque em "Ativar avisos neste aparelho" para receber as notificações.');
            return;
        }
        try {
            const reg = await navigator.serviceWorker.getRegistration('/');
            const inscricao = reg && reg.pushManager ? await reg.pushManager.getSubscription() : null;
            status(inscricao
                ? '✅ Este aparelho recebe os avisos, mesmo com o painel fechado.'
                : 'Permissão concedida, mas o aparelho ainda não foi inscrito. Toque em "Ativar avisos".');
        } catch (e) {
            status('✅ Permissão de aviso concedida.');
        }
    }

    // ── Regras Firebase (copiar para colar no console) ───────────────────────

    // O texto é o mesmo do arquivo firestore.rules (mantenha os dois iguais);
    // só o e-mail do administrador vem de quem está logado agora.
    function regrasFirebasePara(email) {
        return `rules_version = '2';

// Regras do Firestore da PC Formatech.
//
// Como aplicar: Firebase Console → Firestore Database → Regras → colar este
// arquivo inteiro → Publicar. (O botão "Copiar regras corrigidas", na aba
// Visitas do painel, copia este mesmo texto com o e-mail de quem está logado.)
//
// O servidor (pasta api/) usa a credencial de administrador do Firebase, que
// não passa por estas regras: pedidos, loja, anúncios, publicações, biometria
// e inscrições de notificação são gravados só por ele.

service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == '${email}';
    }

    // ── Dados do painel (clientes, orçamentos, produtos, serviços) ─────────
    match /data/{id}              { allow read, write: if isAdmin(); }
    match /clients/{id}           { allow read, write: if isAdmin(); }
    match /budgets/{id}           { allow read, write: if isAdmin(); }
    match /products/{id}          { allow read, write: if isAdmin(); }
    match /services/{id}          { allow read, write: if isAdmin(); }
    match /pushSubscriptions/{id} { allow read, write: if isAdmin(); }
    match /notifyState/{id}       { allow read, write: if isAdmin(); }

    // ── Públicos para leitura (tema do site e slides) ──────────────────────
    match /siteSettings/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /hero_slides/{id}       { allow read: if true; allow write: if isAdmin(); }

    // ── Presença dos visitantes (aba Tempo Real e Visitas) ─────────────────
    // Qualquer visitante grava a própria visita, mas só com os campos que o
    // site manda, em tamanhos razoáveis, e no documento da própria sessão.
    // Só o administrador lê e apaga (antes qualquer um podia apagar o
    // histórico de visitas).

    function texto(d, campo, max) {
      return !(campo in d) || (d[campo] is string && d[campo].size() <= max);
    }

    function numero(d, campo) {
      return !(campo in d) || d[campo] is number;
    }

    function lista(d, campo) {
      return !(campo in d) || (d[campo] is list && d[campo].size() <= 20);
    }

    function sessaoValida(d) {
      return d.sessionId is string
        && d.sessionId.matches('^sess_[0-9]{10,16}_[a-z0-9]{1,12}$')
        && d.lastSeenClient is number;
    }

    function camposComuns(d) {
      return texto(d, 'visitorId', 16)
        && texto(d, 'page', 200)
        && texto(d, 'pagina', 200)
        && (!('dispositivo' in d) || d.dispositivo in ['desktop', 'mobile', 'tablet'])
        && texto(d, 'origem', 40)
        && numero(d, 'entrouClient')
        && (!('lastSeen' in d) || d.lastSeen is timestamp)
        && (!('avisado' in d) || d.avisado is bool);
    }

    match /presence/{sessao} {
      function presencaValida() {
        let d = request.resource.data;
        return d.keys().hasOnly([
            'sessionId', 'visitorId', 'visitorLabel', 'page', 'pagina', 'pageTitle',
            'dispositivo', 'idioma', 'timezone', 'referrer', 'origem', 'status',
            'entrouClient', 'entrou', 'lastSeen', 'lastSeenClient', 'avisado'
          ])
          && sessaoValida(d)
          && d.sessionId == sessao
          && camposComuns(d)
          && texto(d, 'visitorLabel', 40)
          && texto(d, 'pageTitle', 160)
          && texto(d, 'idioma', 40)
          && texto(d, 'timezone', 64)
          && texto(d, 'referrer', 220)
          && (!('status' in d) || d.status in ['online', 'away', 'offline'])
          && (!('entrou' in d) || d.entrou is timestamp);
      }
      allow read, delete: if isAdmin();
      allow create, update: if presencaValida();
    }

    match /presenceDaily/{registro} {
      function visitaDoDiaValida() {
        let d = request.resource.data;
        return d.keys().hasOnly([
            'sessionId', 'dayKey', 'visitorId', 'page', 'pagina', 'dispositivo',
            'origem', 'entrouClient', 'lastSeen', 'lastSeenClient', 'avisado',
            'servicos', 'buscas', 'acoes'
          ])
          && sessaoValida(d)
          && d.dayKey is string && d.dayKey.matches('^[0-9]{8}$')
          && registro == d.sessionId + '_' + d.dayKey
          && camposComuns(d)
          && lista(d, 'servicos')
          && lista(d, 'buscas')
          && lista(d, 'acoes');
      }
      allow read, delete: if isAdmin();
      allow create, update: if visitaDoDiaValida();
    }

    // ── Todo o resto: fechado ───────────────────────────────────────────────
    match /{document=**} { allow read, write: if false; }
  }
}`;
    }

    function ligarBotaoRegras() {
        const botao = $('av-copiar-regras');
        if (!botao) return;
        botao.addEventListener('click', async () => {
            let email = 'rafaelaraujo004@gmail.com';
            try {
                if (typeof firebase !== 'undefined' && firebase.auth) {
                    const user = firebase.auth().currentUser;
                    if (user && user.email) email = user.email;
                }
            } catch (e) { /* usa o padrão */ }
            const texto = regrasFirebasePara(email);
            try {
                await navigator.clipboard.writeText(texto);
                botao.innerHTML = '<i class="fas fa-check"></i> Copiado — cole no Firebase';
            } catch (e) {
                // Aparelhos sem clipboard: mostra o texto em uma área editável
                const bloco = document.createElement('textarea');
                bloco.value = texto;
                bloco.style.cssText = 'width:100%;height:200px;margin-top:0.5rem;';
                botao.parentElement.appendChild(bloco);
                bloco.select();
            }
            setTimeout(() => { botao.innerHTML = '<i class="fas fa-copy"></i> Copiar regras corrigidas'; }, 3500);
        });
    }

    // ── Atualização manual e instalar como app ───────────────────────────────

    function ligarBotoes() {
        const ativar = $('av-ativar-push');
        if (ativar) {
            ativar.addEventListener('click', async () => {
                if (typeof solicitarPermissaoNotificacao === 'function') await solicitarPermissaoNotificacao();
                mostrarEstadoDoPush();
            });
        }

        const instalar = $('av-instalar');
        window.addEventListener('beforeinstallprompt', (evento) => {
            evento.preventDefault();
            pedidoInstalacao = evento;
            if (instalar) instalar.hidden = false;
        });
        window.addEventListener('appinstalled', () => {
            if (instalar) instalar.hidden = true;
            status('✅ Painel instalado. Abra pelo ícone "PCF Painel" na tela do celular.');
        });
        if (instalar) {
            instalar.addEventListener('click', async () => {
                if (!pedidoInstalacao) return;
                pedidoInstalacao.prompt();
                await pedidoInstalacao.userChoice;
                pedidoInstalacao = null;
                instalar.hidden = true;
            });
        }

        document.querySelectorAll('.av-periodo').forEach((botao) => {
            botao.addEventListener('click', () => {
                if (Number(botao.dataset.dias) === dias) return;
                document.querySelectorAll('.av-periodo').forEach((b) => b.classList.toggle('is-ativo', b === botao));
                dias = Number(botao.dataset.dias) || 1;
                escutarPeriodo('inicio');
            });
        });

        const refresh = $('av-refresh');
        if (refresh) {
            refresh.addEventListener('click', () => {
                if (carregando) return;
                escutarPeriodo('atualizar-manual');
            });
        }

        // Voltar do 2º plano (quando o app estava em segundo plano no Android):
        // reconecta a escuta para o número aparecer atualizado ao voltar.
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && iniciado) escutarPeriodo('reconectar');
        });
    }

    // ── Integração com o painel ─────────────────────────────────────────────

    function iniciar() {
        if (iniciado) return;
        iniciado = true;
        ligarBotoes();
        ligarBotaoRegras();
        ligarAparelhoDoDono();
        carregarPreferencias();
        mostrarEstadoDoPush();
        escutarPeriodo('inicio');

        // Timestamp de "atualizado há X" se atualiza a cada 20s, mesmo sem
        // dados novos, para "há 2 min" virar "há 3 min" naturalmente.
        setInterval(() => {
            if (!ultimaLeituraOk) return;
            const el = $('av-nota');
            if (!el || carregando) return;
            const texto = el.textContent;
            if (texto.indexOf('Atualizado ') === 0) {
                el.textContent = 'Atualizado ' + tempoRelativo(ultimaLeituraOk) + texto.slice(texto.indexOf(' · '));
            }
        }, 20000);
    }

    // A aba Tempo Real chama initRealtimeDashboard() ao abrir; o resumo começa
    // junto, sem mexer no admin-app.js.
    if (typeof window.initRealtimeDashboard === 'function') {
        const original = window.initRealtimeDashboard;
        window.initRealtimeDashboard = function () {
            const resultado = original.apply(this, arguments);
            iniciar();
            return resultado;
        };
    }

    // Toque numa notificação com o painel já aberto: o service worker pede a aba.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (evento) => {
            const dados = evento.data || {};
            if (dados.type === 'ABRIR_ABA' && dados.aba && document.getElementById('tab-' + dados.aba) && typeof switchTab === 'function') {
                switchTab(dados.aba);
            }
        });
    }

    // Para conferência local com dados de exemplo (sem login não há leitura).
    window.PCFTVisitas = {
        renderizar: (registros) => { iniciado = true; renderizar(registros, {}); },
        alertaPermissao: () => { $('av-alerta').hidden = false; }
    };
})();
