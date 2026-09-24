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
        barras(r.origens, 'av-origens', 'Sem visitas no período.');
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

    // O e-mail do dono muda de instalação para instalação. Este JS lê o
    // e-mail autenticado agora e cola no bloco de regras copiado.
    function regrasFirebasePara(email) {
        return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.email == '${email}';
    }

    // Coleções administradas
    match /clients/{id}          { allow read, write: if isAdmin(); }
    match /budgets/{id}          { allow read, write: if isAdmin(); }
    match /products/{id}         { allow read, write: if isAdmin(); }
    match /services/{id}         { allow read, write: if isAdmin(); }
    match /data/{id}             { allow read, write: if isAdmin(); }
    match /pushSubscriptions/{id}{ allow read, write: if isAdmin(); }
    match /notifyState/{id}      { allow read, write: if isAdmin(); }
    match /hero_slides/{id}      { allow read: if true;  allow write: if isAdmin(); }
    match /siteSettings/{id}     { allow read: if true;  allow write: if isAdmin(); }

    // Presença — leitura só admin, escrita pública validada
    function shapePresenca() {
      let d = request.resource.data;
      return d.keys().hasAll(['sessionId','lastSeenClient'])
        && d.sessionId is string && d.sessionId.size() <= 64
        && d.lastSeenClient is number;
    }
    match /presence/{id} {
      allow read:   if isAdmin();
      allow create: if shapePresenca();
      allow update: if shapePresenca();
      allow delete: if true;
    }
    match /presenceDaily/{id} {
      allow read:   if isAdmin();
      allow create: if shapePresenca();
      allow update: if shapePresenca();
      allow delete: if true;
    }

    // Tudo o mais fica proibido
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

    // ── Links rastreáveis ─────────────────────────────────────────────────────

    function ligarLinks() {
        const nome = $('av-link-nome');
        const gerar = $('av-link-gerar');
        if (!nome || !gerar) return;

        const montar = () => {
            const slug = nome.value.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
            if (!slug) { nome.focus(); return; }
            nome.value = slug;
            const base = /localhost|127\.0\.0\.1/.test(location.hostname) ? 'https://pcformatech.vercel.app' : location.origin;
            const url = base + '/?origem=' + slug;
            $('av-link-url').textContent = url;
            $('av-link-whatsapp').href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(url);
            $('av-link-resultado').hidden = false;
        };

        gerar.addEventListener('click', montar);
        nome.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); montar(); } });
        document.querySelectorAll('.av-link-sugestoes [data-link]').forEach((b) => {
            b.addEventListener('click', () => { nome.value = b.dataset.link; montar(); });
        });

        $('av-link-copiar').addEventListener('click', async () => {
            const texto = $('av-link-url').textContent;
            try {
                await navigator.clipboard.writeText(texto);
                $('av-link-copiar').innerHTML = '<i class="fas fa-check"></i> Copiado';
            } catch (e) {
                const faixa = document.createRange();
                faixa.selectNodeContents($('av-link-url'));
                const sel = getSelection();
                sel.removeAllRanges();
                sel.addRange(faixa);
            }
            setTimeout(() => { $('av-link-copiar').innerHTML = '<i class="fas fa-copy"></i> Copiar'; }, 2000);
        });
    }

    // ── Integração com o painel ─────────────────────────────────────────────

    function iniciar() {
        if (iniciado) return;
        iniciado = true;
        ligarBotoes();
        ligarBotaoRegras();
        ligarLinks();
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
