/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Resumo de visitas, avisos e links rastreáveis (aba Tempo Real)

   Lê a coleção presenceDaily (uma linha por visita por dia, gravada pelo
   rastreador do theme-system.js) e mostra o resumo calculado por
   resumo-visitas.js — o mesmo cálculo da notificação diária.

   Tudo que vem de visitante (texto da busca, nome de origem) entra na página
   como texto, nunca como HTML: a coleção aceita escrita pública.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    let dias = 1;
    let cancelarEscuta = null;
    let iniciado = false;
    let pedidoInstalacao = null;

    function db() {
        try { return typeof getFirebaseDB === 'function' ? getFirebaseDB() : null; } catch (e) { return null; }
    }

    // ── Resumo ────────────────────────────────────────────────────────────────

    function escutarPeriodo() {
        if (cancelarEscuta) { cancelarEscuta(); cancelarEscuta = null; }
        const banco = db();
        if (!banco || !window.PCFTResumo) {
            nota('Sem conexão com o banco de dados. Entre no painel com sua conta para ver as visitas.');
            return;
        }
        const desde = PCFTResumo.chaveDoDia(new Date(Date.now() - (dias - 1) * 86400000));
        nota('Carregando…');
        cancelarEscuta = banco.collection('presenceDaily')
            .where('dayKey', '>=', desde)
            .onSnapshot(
                (snap) => renderizar(snap.docs.map((d) => d.data())),
                (erro) => {
                    console.warn('Resumo de visitas:', erro);
                    nota(erro && erro.code === 'permission-denied'
                        ? 'Sem permissão para ler as visitas. Confira se você entrou com a conta de administrador.'
                        : 'Não foi possível carregar as visitas agora.');
                }
            );
    }

    function nota(texto) {
        const el = $('av-nota');
        if (el) el.textContent = texto;
    }

    function formatarDuracao(ms) {
        if (!ms) return '—';
        const min = Math.round(ms / 60000);
        if (min < 1) return 'menos de 1 min';
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

    function renderizar(registros) {
        const r = PCFTResumo.calcular(registros);
        const periodo = dias === 1 ? 'hoje' : 'nos últimos ' + dias + ' dias';

        nota(r.visitas
            ? 'Visitas ' + periodo + '. Suas próprias visitas não entram na conta. Atualiza sozinho.'
            : 'Nenhuma visita registrada ' + periodo + '.');

        $('av-visitantes').textContent = r.visitantes;
        $('av-visitas').textContent = r.visitas;
        $('av-pico').textContent = r.pico;
        $('av-pico-quando').textContent = r.picoQuando
            ? 'Pico online · ' + (dias === 1 ? '' : new Date(r.picoQuando).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ') + 'às ' + formatarHora(r.picoQuando)
            : 'Pico de pessoas online';
        $('av-duracao').textContent = formatarDuracao(r.duracaoMediaMs);
        $('av-whatsapp').textContent = r.whatsapp;
        $('av-agendamentos').textContent = r.agendamentos;

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
                document.querySelectorAll('.av-periodo').forEach((b) => b.classList.toggle('is-ativo', b === botao));
                dias = Number(botao.dataset.dias) || 1;
                escutarPeriodo();
            });
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
        ligarLinks();
        ligarAparelhoDoDono();
        carregarPreferencias();
        mostrarEstadoDoPush();
        escutarPeriodo();
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
    window.PCFTVisitas = { renderizar: (registros) => { iniciado = true; renderizar(registros); } };
})();
