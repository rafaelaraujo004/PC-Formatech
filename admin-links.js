/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Links rastreáveis (aba Visitas do painel)

   Monta o link certo para cada lugar onde o Rafael divulga: escolhe o canal
   (WhatsApp, Instagram…), o lugar (Status, bio, panfleto…) e a página. O link
   leva ?origem=<canal>-<lugar>[-campanha]; o site guarda essa origem na visita
   (theme-system.js) e o painel mostra "WhatsApp · Status" em "De onde vieram"
   (resumo-visitas.js, que dá os nomes e soma por canal).

   Os links criados ficam salvos no banco (data/linksRastreaveis, só o dono lê
   e grava) e mostram quantas visitas cada um trouxe no período escolhido.
   Para impressos, sai também o QR code pronto para baixar.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const SITE = 'https://www.pcformatech.com.br';
    const LIMITE_SLUG = 30; // o site corta a origem em 30 caracteres
    const $ = (id) => document.getElementById(id);

    const CANAIS = [
        { id: 'whatsapp', nome: 'WhatsApp', icone: 'fab fa-whatsapp', cor: '#25D366',
          lugares: [['status', 'Status', 'fas fa-circle-notch'], ['grupo', 'Grupos', 'fas fa-users'], ['conversa', 'Conversas', 'fas fa-comment'], ['lista', 'Lista de transmissão', 'fas fa-bullhorn']] },
        { id: 'instagram', nome: 'Instagram', icone: 'fab fa-instagram', cor: '#E1306C',
          lugares: [['bio', 'Link da bio', 'fas fa-id-badge'], ['stories', 'Stories', 'fas fa-circle-notch'], ['direct', 'Direct', 'fas fa-paper-plane'], ['post', 'Post', 'fas fa-image']] },
        { id: 'facebook', nome: 'Facebook', icone: 'fab fa-facebook', cor: '#1877F2',
          lugares: [['pagina', 'Página', 'fas fa-flag'], ['grupo', 'Grupos', 'fas fa-users'], ['marketplace', 'Marketplace', 'fas fa-store'], ['post', 'Post', 'fas fa-image']] },
        { id: 'google', nome: 'Google', icone: 'fab fa-google', cor: '#4285F4',
          lugares: [['perfil', 'Perfil da Empresa', 'fas fa-store-alt'], ['postagem', 'Postagem', 'fas fa-newspaper'], ['maps', 'Maps', 'fas fa-map-marker-alt']] },
        { id: 'impresso', nome: 'Impresso e QR', icone: 'fas fa-qrcode', cor: '#8D6E63',
          lugares: [['panfleto', 'Panfleto', 'fas fa-file-alt'], ['cartao', 'Cartão de visita', 'fas fa-address-card'], ['balcao', 'QR no balcão', 'fas fa-cash-register'], ['adesivo', 'Adesivo', 'fas fa-sticky-note']] }
    ];

    const PAGINAS = [
        ['/', 'Página inicial (busca simples)'],
        ['/site.html', 'Site completo'],
        ['/loja.html', 'Loja Bird Tech'],
        ['/apps.html', 'Criação de apps'],
        ['/servicos/', 'Serviços e preços'],
        ['/servicos/formatacao-de-computador/', 'Formatação'],
        ['/servicos/suporte-remoto/', 'Atendimento remoto'],
        ['/formulario-formatacao.html', 'Formulário de formatação'],
        ['/dicas/', 'Dicas']
    ];

    const estado = { canal: 'whatsapp', lugar: 'status', pagina: '/', campanha: '' };
    let salvos = [];
    let contagens = {};
    let periodo = 'hoje';

    // ── Utilidades ─────────────────────────────────────────────────────────

    function slugificar(texto) {
        return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    function canalPorId(id) { return CANAIS.find((c) => c.id === id) || CANAIS[0]; }

    /** Origem do link: "whatsapp-status" + campanha, sem passar de 30 caracteres. */
    function slugAtual() {
        const base = estado.canal + '-' + estado.lugar;
        const campanha = slugificar(estado.campanha).slice(0, Math.max(0, LIMITE_SLUG - base.length - 1)).replace(/-+$/, '');
        return campanha ? base + '-' + campanha : base;
    }

    function montarUrl(pagina, slug) {
        return SITE + pagina + '?origem=' + encodeURIComponent(slug);
    }

    /** Nome que vai aparecer no painel (o mesmo cálculo de resumo-visitas.js). */
    function nomeNoPainel(slug) {
        return window.PCFTResumo && window.PCFTResumo.nomeOrigem ? window.PCFTResumo.nomeOrigem('link:' + slug) : slug;
    }

    function banco() {
        try {
            return window.firebase && firebase.apps && firebase.apps.length && firebase.auth().currentUser ? firebase.firestore() : null;
        } catch (e) { return null; }
    }

    function aviso(texto) {
        const el = $('lr-aviso');
        if (!el) return;
        el.textContent = texto || '';
        if (texto) setTimeout(() => { if (el.textContent === texto) el.textContent = ''; }, 3500);
    }

    async function copiar(texto) {
        try { await navigator.clipboard.writeText(texto); return true; } catch (e) { return false; }
    }

    function el(tag, classe, texto) {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto != null) e.textContent = texto;
        return e;
    }

    function icone(classes) {
        const i = el('i', classes);
        i.setAttribute('aria-hidden', 'true');
        return i;
    }

    // ── QR code (impressos) ───────────────────────────────────────────────

    /** QR grande, com margem branca e o endereço embaixo: pronto para imprimir. */
    function desenharQr(canvas, url, legenda) {
        if (typeof window.qrcode !== 'function') return false;
        const qr = window.qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        const n = qr.getModuleCount();
        const modulo = Math.floor(560 / (n + 8));
        const lado = modulo * (n + 8);
        const rodape = 70;
        canvas.width = lado;
        canvas.height = lado + rodape;
        const c = canvas.getContext('2d');
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = '#0b2b2c';
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                if (qr.isDark(y, x)) c.fillRect((x + 4) * modulo, (y + 4) * modulo, modulo, modulo);
            }
        }
        c.textAlign = 'center';
        c.fillStyle = '#0b2b2c';
        c.font = '700 26px Sora, Manrope, sans-serif';
        c.fillText('Aponte a câmera do celular', lado / 2, lado + 18);
        c.fillStyle = '#4a6664';
        c.font = '600 20px Manrope, sans-serif';
        c.fillText(legenda, lado / 2, lado + 50);
        return true;
    }

    function mostrarQr(url, slug) {
        const caixa = $('lr-qr');
        const canvas = $('lr-qr-canvas');
        if (!caixa || !canvas) return;
        const ok = desenharQr(canvas, url, 'pcformatech.com.br');
        caixa.hidden = !ok;
        if (!ok) { aviso('Não foi possível gerar o QR code.'); return; }
        const baixar = $('lr-qr-baixar');
        baixar.href = canvas.toDataURL('image/png');
        baixar.download = 'qr-' + slug + '.png';
    }

    // ── Desenho do gerador ─────────────────────────────────────────────────

    function desenharCanais() {
        const box = $('lr-canais');
        box.textContent = '';
        CANAIS.forEach((c) => {
            const b = el('button', 'lr-canal' + (c.id === estado.canal ? ' is-ativo' : ''));
            b.type = 'button';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', String(c.id === estado.canal));
            b.style.setProperty('--lr-cor', c.cor);
            b.append(icone(c.icone), el('span', '', c.nome));
            b.addEventListener('click', () => {
                estado.canal = c.id;
                estado.lugar = c.lugares[0][0];
                // QR de impresso costuma levar para a página inicial.
                desenharTudo();
            });
            box.appendChild(b);
        });
    }

    function desenharLugares() {
        const box = $('lr-lugares');
        box.textContent = '';
        const c = canalPorId(estado.canal);
        box.style.setProperty('--lr-cor', c.cor);
        c.lugares.forEach(([id, nome, ic]) => {
            const b = el('button', 'lr-lugar' + (id === estado.lugar ? ' is-ativo' : ''));
            b.type = 'button';
            b.setAttribute('role', 'radio');
            b.setAttribute('aria-checked', String(id === estado.lugar));
            b.append(icone(ic), el('span', '', nome));
            b.addEventListener('click', () => { estado.lugar = id; desenharTudo(); });
            box.appendChild(b);
        });
    }

    function desenharResultado() {
        const c = canalPorId(estado.canal);
        const slug = slugAtual();
        const url = montarUrl(estado.pagina, slug);
        $('lr-url').textContent = url;
        $('lr-nome').textContent = nomeNoPainel(slug);
        const marca = $('lr-previa-icone');
        marca.style.setProperty('--lr-cor', c.cor);
        marca.textContent = '';
        marca.appendChild(icone(c.icone));
        const resto = LIMITE_SLUG - (estado.canal + '-' + estado.lugar).length - 1;
        $('lr-campanha-conta').textContent = resto > 0 ? 'até ' + resto + ' letras' : 'sem espaço para campanha';
        // Impresso: QR aparece direto; nos outros, só se pedir.
        if (estado.canal === 'impresso') mostrarQr(url, slug);
        else $('lr-qr').hidden = true;
        const jaSalvo = salvos.some((l) => l.slug === slug && l.pagina === estado.pagina);
        const botaoSalvar = $('lr-salvar');
        botaoSalvar.disabled = jaSalvo;
        botaoSalvar.lastChild.textContent = jaSalvo ? ' Já está na lista' : ' Salvar na lista';
    }

    function desenharTudo() {
        desenharCanais();
        desenharLugares();
        desenharResultado();
    }

    // ── Lista de links salvos, com visitas do período ─────────────────────

    function desenharSalvos() {
        const ul = $('lr-lista');
        if (!ul) return;
        ul.textContent = '';
        $('lr-salvos-periodo').textContent = periodo;
        if (!salvos.length) {
            ul.appendChild(el('li', 'lr-vazio', 'Nenhum link salvo ainda. Monte um acima e toque em "Salvar na lista" para acompanhar quantas pessoas ele traz.'));
            return;
        }
        const ordenados = salvos.slice().sort((a, b) => (contagens['link:' + b.slug] || 0) - (contagens['link:' + a.slug] || 0) || b.criadoEm - a.criadoEm);
        const maior = Math.max(1, ...ordenados.map((l) => contagens['link:' + l.slug] || 0));
        ordenados.forEach((l) => {
            const c = canalPorId(l.canal);
            const total = contagens['link:' + l.slug] || 0;
            const li = el('li', 'lr-item');
            li.style.setProperty('--lr-cor', c.cor);
            li.style.setProperty('--lr-largura', Math.max(3, Math.round((total / maior) * 100)) + '%');
            const marca = el('span', 'lr-item-icone');
            marca.appendChild(icone(c.icone));
            const corpo = el('div', 'lr-item-corpo');
            const pagina = (PAGINAS.find((p) => p[0] === l.pagina) || [l.pagina, l.pagina])[1];
            corpo.append(el('strong', '', nomeNoPainel(l.slug)), el('small', '', '→ ' + pagina));
            const numero = el('span', 'lr-item-total');
            numero.append(el('b', '', String(total)), el('small', '', total === 1 ? 'visita' : 'visitas'));
            const acoes = el('div', 'lr-item-acoes');
            const url = montarUrl(l.pagina, l.slug);
            const bCopiar = el('button', 'lr-mini');
            bCopiar.type = 'button';
            bCopiar.title = 'Copiar link';
            bCopiar.setAttribute('aria-label', 'Copiar link ' + nomeNoPainel(l.slug));
            bCopiar.appendChild(icone('fas fa-copy'));
            bCopiar.addEventListener('click', async () => aviso(await copiar(url) ? 'Link copiado: ' + url : url));
            const bUsar = el('button', 'lr-mini');
            bUsar.type = 'button';
            bUsar.title = 'Abrir no gerador (QR, compartilhar)';
            bUsar.setAttribute('aria-label', 'Abrir no gerador ' + nomeNoPainel(l.slug));
            bUsar.appendChild(icone('fas fa-qrcode'));
            bUsar.addEventListener('click', () => {
                Object.assign(estado, { canal: l.canal, lugar: l.lugar, pagina: l.pagina, campanha: l.campanha || '' });
                $('lr-pagina').value = l.pagina;
                $('lr-campanha').value = l.campanha || '';
                desenharTudo();
                mostrarQr(url, l.slug);
                $('lr-cartao').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            const bApagar = el('button', 'lr-mini lr-mini-perigo');
            bApagar.type = 'button';
            bApagar.title = 'Tirar da lista';
            bApagar.setAttribute('aria-label', 'Tirar da lista ' + nomeNoPainel(l.slug));
            bApagar.appendChild(icone('fas fa-trash-alt'));
            bApagar.addEventListener('click', async () => {
                if (!confirm('Tirar "' + nomeNoPainel(l.slug) + '" da lista? O link continua funcionando; só sai daqui.')) return;
                salvos = salvos.filter((x) => x !== l);
                await gravar();
                desenharSalvos();
                desenharResultado();
            });
            acoes.append(bCopiar, bUsar, bApagar);
            li.append(marca, corpo, numero, acoes);
            ul.appendChild(li);
        });
    }

    async function carregar() {
        try {
            const cache = JSON.parse(localStorage.getItem('pcft_links_rastreaveis') || '[]');
            if (Array.isArray(cache)) salvos = cache;
        } catch (e) { /* sem cache */ }
        desenharSalvos();
        const b = banco();
        if (!b) return;
        try {
            const doc = await b.collection('data').doc('linksRastreaveis').get();
            if (doc.exists && Array.isArray(doc.data().links)) {
                salvos = doc.data().links;
                try { localStorage.setItem('pcft_links_rastreaveis', JSON.stringify(salvos)); } catch (e) { /* cheio */ }
                desenharSalvos();
                desenharResultado();
            }
        } catch (e) { /* fica com o que está no aparelho */ }
    }

    async function gravar() {
        try { localStorage.setItem('pcft_links_rastreaveis', JSON.stringify(salvos)); } catch (e) { /* cheio */ }
        const b = banco();
        if (!b) { aviso('Salvo neste aparelho. Entre no painel para guardar no banco.'); return; }
        try {
            await b.collection('data').doc('linksRastreaveis').set({ links: salvos, atualizadoEm: Date.now() });
        } catch (e) {
            aviso('Salvo só neste aparelho (sem permissão no banco).');
        }
    }

    // ── Ligação com a tela ─────────────────────────────────────────────────

    function ligar() {
        if (!$('lr-cartao')) return;

        const sel = $('lr-pagina');
        PAGINAS.forEach(([valor, nome]) => {
            const o = el('option', '', nome);
            o.value = valor;
            sel.appendChild(o);
        });
        sel.addEventListener('change', () => { estado.pagina = sel.value; desenharResultado(); });

        const campanha = $('lr-campanha');
        campanha.addEventListener('input', () => { estado.campanha = campanha.value; desenharResultado(); });

        $('lr-copiar').addEventListener('click', async () => {
            const url = $('lr-url').textContent;
            aviso(await copiar(url) ? 'Link copiado. É só colar onde vai divulgar.' : 'Não deu para copiar: segure o dedo no link para copiar.');
        });
        $('lr-compartilhar').addEventListener('click', async () => {
            const url = $('lr-url').textContent;
            if (navigator.share) {
                try { await navigator.share({ url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
            }
            window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(url), '_blank', 'noopener');
        });
        $('lr-ver-qr').addEventListener('click', () => mostrarQr($('lr-url').textContent, slugAtual()));
        $('lr-salvar').addEventListener('click', async () => {
            const slug = slugAtual();
            if (salvos.some((l) => l.slug === slug && l.pagina === estado.pagina)) return;
            salvos.push({ slug, canal: estado.canal, lugar: estado.lugar, pagina: estado.pagina, campanha: estado.campanha.trim(), criadoEm: Date.now() });
            await gravar();
            desenharSalvos();
            desenharResultado();
            aviso('Salvo na lista. As visitas dele aparecem logo abaixo.');
        });

        desenharTudo();
        carregar();
        // O login pode terminar depois: aí busca a lista do banco.
        try { firebase.auth().onAuthStateChanged((u) => { if (u) carregar(); }); } catch (e) { /* sem auth */ }
    }

    /** Chamado pelo resumo de visitas (admin-visitas.js) a cada atualização. */
    function atualizarContagens(origensMapa, textoPeriodo) {
        contagens = origensMapa || {};
        if (textoPeriodo) periodo = textoPeriodo;
        desenharSalvos();
    }

    window.PCFTLinks = { atualizarContagens, slugificar, montarUrl, CANAIS, PAGINAS };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar);
    else ligar();
})();
