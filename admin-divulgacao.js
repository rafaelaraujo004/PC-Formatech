// Aba "Divulgação" do painel: artes prontas da PC Formatech, da Bird Tech,
// de Apps e sistemas e de promoções de datas especiais (com período). "Compartilhar" abre o menu do celular (WhatsApp,
// Instagram, Status…) com a imagem, a legenda e o link de cada uma.
// As artes ficam em /api/publicacoes.

(function () {
    'use strict';

    const ROTA = '/api/publicacoes';
    const SITE = 'https://www.pcformatech.com.br';
    const $ = (id) => document.getElementById(id);

    const MARCAS = {
        pcformatech: {
            nome: 'PC Formatech',
            link: SITE + '/site.html',
            legenda: 'Computador lento, com vírus ou precisando formatar? A PC Formatech resolve, presencial em Canaã dos Carajás ou à distância. Diagnóstico grátis pelo WhatsApp.'
        },
        birdtech: {
            nome: 'Bird Tech',
            link: SITE + '/loja.html',
            legenda: 'Fones, mouses, cabos e acessórios com preço justo na Bird Tech, a loja da PC Formatech. Escolha e peça pelo WhatsApp.'
        },
        apps: {
            nome: 'Apps e sistemas',
            link: SITE + '/apps.html',
            legenda: 'Ainda controla o seu negócio em planilha? A PC Formatech cria um sistema sob medida, que funciona no celular. Mande sua planilha e veja como ficaria.'
        },
        promocoes: {
            nome: 'Promoção',
            link: SITE + '/site.html',
            legenda: 'Promoção especial na PC Formatech! Chame no WhatsApp e garanta a sua.'
        }
    };

    // Datas das promoções: o campo date guarda o dia; o fim vale até 23h59.
    const DIA = 864e5;
    const paraCampo = (ms) => {
        if (!ms) return '';
        const d = new Date(ms);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    const lerCampo = (id, fimDoDia) => {
        const v = $(id).value;
        if (!v) return null;
        const [a, m, d] = v.split('-').map(Number);
        return new Date(a, m - 1, d, fimDoDia ? 23 : 0, fimDoDia ? 59 : 0).getTime();
    };
    const dataCurta = (ms) => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    /** Situação de uma promoção: em vigor, agendada ou encerrada. */
    function situacao(p) {
        const agora = Date.now();
        if (p.fim && agora > p.fim) return { classe: 'is-encerrada', texto: 'Encerrada em ' + dataCurta(p.fim), ordem: 2 };
        if (p.inicio && agora < p.inicio) return { classe: 'is-agendada', texto: 'Começa em ' + dataCurta(p.inicio), ordem: 1 };
        if (p.fim) return { classe: 'is-vigente', texto: (p.fim - agora < DIA ? 'Termina hoje' : 'Válida até ' + dataCurta(p.fim)), ordem: 0 };
        if (p.inicio) return { classe: 'is-vigente', texto: 'Em vigor desde ' + dataCurta(p.inicio), ordem: 0 };
        return null;
    }

    let publicacoes = [];
    // Produtos da loja: entram sozinhos no filtro Bird Tech, prontos para
    // compartilhar (não ficam salvos como arte; mudam junto com o cadastro).
    let produtosLoja = [];

    const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    function comoArte(p) {
        return {
            id: 'loja-' + p.id,
            produto: true,
            categoria: 'birdtech',
            titulo: p.nome,
            legenda: `${p.nome} por apenas ${moeda(p.preco)} na Bird Tech, a loja de periféricos da PC Formatech em Canaã dos Carajás. Peça pelo WhatsApp ou veja na loja:`,
            link: SITE + '/loja.html#' + encodeURIComponent(p.id),
            imagem: p.imagem,
            ordem: 100 + (Number(p.ordem) || 0)
        };
    }
    let filtro = 'todas';
    let carregado = false;
    let editando = null;
    let imagemNova = null;

    function status(texto, erro, id) {
        const el = $(id || 'dv-status');
        el.textContent = texto || '';
        el.classList.toggle('is-erro', Boolean(erro));
    }

    async function chamar(acao, dados) {
        const usuario = window.firebase && firebase.auth && firebase.auth().currentUser;
        if (!usuario) throw new Error('Entre no painel com e-mail e senha (ou biometria).');
        const idToken = await usuario.getIdToken();
        const resposta = await fetch(ROTA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ acao, idToken, ...(dados || {}) })
        });
        let json = {};
        try { json = await resposta.json(); } catch (e) { /* corpo vazio */ }
        if (!resposta.ok || !json.ok) throw new Error(json.error || 'Sem resposta do servidor (' + resposta.status + ').');
        return json;
    }

    // ── Link rastreado de cada arte ─────────────────────────────────────────
    // O link que vai junto com a arte é curto, /a/<canal>-<código> (api/arte.js):
    // a prévia no WhatsApp/Instagram mostra a própria arte, e quem toca vai
    // para o link da arte com ?origem=<canal>-arte-<código>. Na aba Visitas
    // aparece como "WhatsApp · Arte “título”", e dá para ver qual publicação
    // trouxe cada cliente. O canal é o que o Rafael escolhe no topo da aba
    // (onde vai postar), e fica lembrado.
    const CANAIS_POST = ['whatsapp', 'instagram', 'facebook'];
    let canalPost = 'whatsapp';
    try { if (CANAIS_POST.includes(localStorage.getItem('pcft_dv_canal'))) canalPost = localStorage.getItem('pcft_dv_canal'); } catch (e) { /* sem armazenamento */ }

    const codigoDaArte = (id) => (window.PCFTResumo && window.PCFTResumo.codigoDaArte ? window.PCFTResumo.codigoDaArte(id) : '');

    function linkDaArte(p) {
        if (!p.link) return '';
        const codigo = codigoDaArte(p.id);
        if (!codigo) return p.link;
        try {
            const url = new URL(p.link, SITE);
            // Só marca links do próprio site (um link de fora não registra visita).
            if (!/(^|\.)pcformatech\.com\.br$/.test(url.hostname)) return p.link;
            return SITE + '/a/' + canalPost + '-' + codigo;
        } catch (e) { return p.link; }
    }

    /** Títulos das artes para o painel de Visitas trocar o código pelo nome. */
    function registrarNomes() {
        if (!window.PCFTResumo || !window.PCFTResumo.registrarArtes) return;
        const mapa = {};
        publicacoes.concat(produtosLoja).forEach((p) => { mapa[codigoDaArte(p.id)] = p.titulo || MARCAS[p.categoria].nome; });
        window.PCFTResumo.registrarArtes(mapa);
    }

    const textoParaCompartilhar = (p) => [p.legenda, linkDaArte(p)].filter(Boolean).join('\n\n');

    /**
     * A imagem vai como JPEG: WebP é recusado por alguns apps (o Instagram,
     * por exemplo) na hora de receber um compartilhamento.
     */
    async function arquivoDaImagem(p) {
        const blob = await (await fetch(p.imagem)).blob();
        const bitmap = await createImageBitmap(blob);
        const tela = document.createElement('canvas');
        tela.width = bitmap.width;
        tela.height = bitmap.height;
        const ctx = tela.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, tela.width, tela.height);
        ctx.drawImage(bitmap, 0, 0);
        const jpeg = await new Promise((r) => tela.toBlob(r, 'image/jpeg', 0.92));
        const nome = (p.titulo || MARCAS[p.categoria].nome).toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'arte';
        return new File([jpeg], nome + '.jpg', { type: 'image/jpeg' });
    }

    async function copiar(texto) {
        try { await navigator.clipboard.writeText(texto); return true; } catch (e) { return false; }
    }

    async function compartilhar(p, botao) {
        const texto = textoParaCompartilhar(p);
        botao.disabled = true;
        try {
            const arquivo = await arquivoDaImagem(p);
            // Alguns apps ignoram o texto junto com a imagem: a legenda já fica
            // copiada para colar, se precisar.
            const copiou = await copiar(texto);
            if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
                await navigator.share({ files: [arquivo], text: texto, title: p.titulo || MARCAS[p.categoria].nome });
                status(copiou ? 'Compartilhado. A legenda também ficou copiada, caso o app não a tenha colado.' : 'Compartilhado.');
            } else {
                baixarArquivo(arquivo);
                status(copiou
                    ? 'Este navegador não compartilha imagens direto: a imagem foi baixada e a legenda com o link foi copiada. É só colar ao postar.'
                    : 'A imagem foi baixada. Use "Copiar legenda" para levar o texto junto.');
            }
        } catch (erro) {
            if (erro && erro.name === 'AbortError') status('');
            else status('Não foi possível compartilhar: ' + (erro.message || erro), true);
        } finally {
            botao.disabled = false;
        }
    }

    function baixarArquivo(arquivo) {
        const url = URL.createObjectURL(arquivo);
        const a = document.createElement('a');
        a.href = url;
        a.download = arquivo.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ── Lista ───────────────────────────────────────────────────────────────

    function botao(icone, texto, classe, acao) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'av-botao ' + (classe || 'av-botao-secundario');
        b.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i> `;
        b.append(texto);
        b.addEventListener('click', () => acao(b));
        return b;
    }

    function desenhar() {
        const grade = $('dv-grade');
        const todas = publicacoes.concat(produtosLoja);
        const lista = todas.filter((p) => filtro === 'todas' || p.categoria === filtro);
        // Promoções em vigor no topo (o que mais vale divulgar agora), depois as
        // artes fixas, as promoções agendadas e por último as encerradas.
        const peso = (p) => {
            if (p.categoria !== 'promocoes') return 1;
            const sit = situacao(p);
            return sit ? [0, 2, 3][sit.ordem] : 0;
        };
        lista.sort((a, b) => (peso(a) - peso(b)) || (a.ordem - b.ordem) || ((a.fim || Infinity) - (b.fim || Infinity)));
        if (!lista.length) {
            const vazio = document.createElement('div');
            vazio.className = 'dv-vazio';
            vazio.innerHTML = '<i class="fas fa-images" aria-hidden="true"></i>';
            const t = document.createElement('p');
            t.textContent = todas.length ? 'Nenhuma arte nesta categoria ainda.' : 'Nenhuma arte ainda. Toque em "Nova arte" para adicionar.';
            vazio.appendChild(t);
            grade.replaceChildren(vazio);
            return;
        }
        grade.replaceChildren(...lista.map((p) => {
            const card = document.createElement('article');
            card.className = 'dv-card dv-' + p.categoria;

            const foto = document.createElement('div');
            foto.className = 'dv-foto';
            const img = document.createElement('img');
            img.src = p.imagem;
            img.alt = p.titulo || '';
            img.loading = 'lazy';
            foto.appendChild(img);

            const info = document.createElement('div');
            info.className = 'dv-info';
            const marca = document.createElement('span');
            marca.className = 'dv-marca';
            marca.textContent = p.produto ? 'Bird Tech · produto' : MARCAS[p.categoria].nome;
            const titulo = document.createElement('strong');
            titulo.textContent = p.titulo || 'Arte sem nome';
            const legenda = document.createElement('p');
            legenda.className = 'dv-legenda';
            legenda.textContent = p.legenda;
            const link = document.createElement('a');
            link.className = 'dv-link';
            const rastreado = linkDaArte(p);
            link.href = rastreado;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = rastreado.replace(/^https:\/\//, '');
            link.title = rastreado === p.link
                ? 'Link de fora do site: não aparece em Visitas'
                : 'Mostra esta arte na prévia e leva para ' + p.link.replace(/^https:\/\/(www\.)?/, '') + '. Quem entrar aparece em Visitas com o nome desta arte.';
            info.append(marca, titulo);
            const sit = p.categoria === 'promocoes' ? situacao(p) : null;
            if (sit) {
                const chip = document.createElement('span');
                chip.className = 'dv-periodo-chip ' + sit.classe;
                chip.textContent = sit.texto;
                info.appendChild(chip);
                if (sit.classe === 'is-encerrada') card.classList.add('is-encerrada');
            }
            info.append(legenda, link);

            const acoes = document.createElement('div');
            acoes.className = 'dv-acoes';
            acoes.append(
                botao('fa-share-alt', 'Compartilhar', 'dv-compartilhar', (b) => compartilhar(p, b)),
                botao('fa-copy', 'Copiar legenda', null, async () => status(await copiar(textoParaCompartilhar(p)) ? 'Legenda e link copiados.' : 'Não foi possível copiar.')),
                botao('fa-download', 'Baixar', null, async () => { baixarArquivo(await arquivoDaImagem(p)); status('Imagem baixada.'); }),
                ...(p.produto
                    ? [botao('fa-store', 'Editar na Loja', 'av-botao-secundario dv-largo', () => window.switchTab('loja'))]
                    : [botao('fa-pen', 'Editar', null, () => abrirEditor(p)), botao('fa-trash-alt', 'Remover', 'av-botao-secundario bl-remover', () => remover(p))])
            );

            card.append(foto, info, acoes);
            return card;
        }));
    }

    async function listar() {
        status('Carregando…');
        try {
            const [json, loja] = await Promise.all([
                chamar('listar'),
                fetch('/api/loja', { headers: { Accept: 'application/json' } }).then((r) => r.json()).catch(() => ({}))
            ]);
            publicacoes = json.publicacoes || [];
            produtosLoja = (loja.produtos || []).map(comoArte);
            carregado = true;
            registrarNomes();
            status('');
            desenhar();
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function remover(p) {
        if (!window.confirm(`Remover a arte "${p.titulo || MARCAS[p.categoria].nome}"?`)) return;
        try {
            await chamar('remover', { id: p.id });
            await listar();
            status('Arte removida.');
        } catch (erro) {
            status(erro.message, true);
        }
    }

    // ── Editor ──────────────────────────────────────────────────────────────

    const dialogo = () => $('dv-dialogo');

    function abrirEditor(p) {
        editando = p || null;
        imagemNova = null;
        $('dv-form').reset();
        $('dv-dialogo-titulo').textContent = p ? 'Editar arte' : 'Nova arte';
        const categoria = p ? p.categoria : (filtro !== 'todas' ? filtro : 'pcformatech');
        $('dv-categoria').value = categoria;
        $('dv-titulo').value = p ? p.titulo : '';
        $('dv-legenda').value = p ? p.legenda : MARCAS[categoria].legenda;
        $('dv-link').value = p ? p.link : MARCAS[categoria].link;
        $('dv-inicio').value = p ? paraCampo(p.inicio) : '';
        $('dv-fim').value = p ? paraCampo(p.fim) : '';
        $('dv-periodo').hidden = categoria !== 'promocoes';
        const previa = $('dv-previa');
        previa.hidden = !p;
        if (p) previa.src = p.imagem;
        status('', false, 'dv-form-status');
        if (typeof dialogo().showModal === 'function') dialogo().showModal(); else dialogo().setAttribute('open', '');
    }

    // Trocar a categoria troca a legenda e o link padrão, se ainda não foram mexidos.
    function aoTrocarCategoria() {
        const nova = MARCAS[$('dv-categoria').value];
        $('dv-periodo').hidden = $('dv-categoria').value !== 'promocoes';
        const padroes = Object.values(MARCAS);
        if (!$('dv-legenda').value.trim() || padroes.some((m) => m.legenda === $('dv-legenda').value)) $('dv-legenda').value = nova.legenda;
        if (!$('dv-link').value.trim() || padroes.some((m) => m.link === $('dv-link').value)) $('dv-link').value = nova.link;
    }

    async function aoEscolherImagem() {
        const arquivo = $('dv-imagem').files[0];
        if (!arquivo) return;
        status('Preparando a imagem…', false, 'dv-form-status');
        try {
            const img = await window.BirdTechFundo.carregarImagem(arquivo);
            const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
            const tela = document.createElement('canvas');
            tela.width = Math.round(img.width * escala);
            tela.height = Math.round(img.height * escala);
            tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
            let url = window.BirdTechFundo.exportar(tela, 880000);
            if (url.length > 880000) {
                const menor = document.createElement('canvas');
                menor.width = Math.round(tela.width * 0.7);
                menor.height = Math.round(tela.height * 0.7);
                menor.getContext('2d').drawImage(tela, 0, 0, menor.width, menor.height);
                url = window.BirdTechFundo.exportar(menor, 880000);
            }
            imagemNova = url;
            $('dv-previa').src = url;
            $('dv-previa').hidden = false;
            status('', false, 'dv-form-status');
        } catch (erro) {
            status(erro.message || 'Não foi possível abrir a imagem.', true, 'dv-form-status');
        }
    }

    async function salvar(evento) {
        evento.preventDefault();
        if (!editando && !imagemNova) { status('Escolha a imagem.', true, 'dv-form-status'); return; }
        const link = $('dv-link').value.trim();
        if (link && !/^https:\/\//.test(link)) { status('O link precisa começar com https://', true, 'dv-form-status'); return; }
        const promocao = $('dv-categoria').value === 'promocoes';
        const inicio = promocao ? lerCampo('dv-inicio', false) : null;
        const fim = promocao ? lerCampo('dv-fim', true) : null;
        if (inicio && fim && fim < inicio) { status('O fim precisa ser depois do início.', true, 'dv-form-status'); return; }
        const publicacao = {
            id: editando ? editando.id : undefined,
            categoria: $('dv-categoria').value,
            titulo: $('dv-titulo').value.trim(),
            legenda: $('dv-legenda').value.trim(),
            link,
            inicio,
            fim,
            imagem: imagemNova || (editando ? editando.imagem : undefined)
        };
        const b = $('dv-salvar');
        b.disabled = true;
        status('Salvando…', false, 'dv-form-status');
        try {
            await chamar('salvar', { publicacao });
            dialogo().close();
            await listar();
            status(editando ? 'Arte atualizada.' : 'Arte adicionada.');
        } catch (erro) {
            status(erro.message, true, 'dv-form-status');
        } finally {
            b.disabled = false;
        }
    }

    // ── Início ──────────────────────────────────────────────────────────────

    function iniciar() {
        if (!$('tab-divulgacao')) return;
        $('dv-nova').addEventListener('click', () => abrirEditor(null));
        $('dv-fechar').addEventListener('click', () => dialogo().close());
        dialogo().addEventListener('click', (e) => { if (e.target === dialogo()) dialogo().close(); });
        $('dv-form').addEventListener('submit', salvar);
        $('dv-categoria').addEventListener('change', aoTrocarCategoria);
        $('dv-imagem').addEventListener('change', aoEscolherImagem);
        // "Vou postar no": define o canal que vai nos links das artes.
        const marcarCanal = () => document.querySelectorAll('[data-dv-canal]').forEach((x) => {
            x.classList.toggle('is-ativo', x.dataset.dvCanal === canalPost);
            x.setAttribute('aria-checked', String(x.dataset.dvCanal === canalPost));
        });
        document.querySelectorAll('[data-dv-canal]').forEach((b) => b.addEventListener('click', () => {
            canalPost = b.dataset.dvCanal;
            try { localStorage.setItem('pcft_dv_canal', canalPost); } catch (e) { /* sem armazenamento */ }
            marcarCanal();
            desenhar();
        }));
        marcarCanal();

        document.querySelectorAll('[data-dv-filtro]').forEach((b) => b.addEventListener('click', () => {
            filtro = b.dataset.dvFiltro;
            document.querySelectorAll('[data-dv-filtro]').forEach((x) => {
                x.classList.toggle('is-ativo', x === b);
                x.setAttribute('aria-pressed', String(x === b));
            });
            desenhar();
        }));
    }

    const trocarAbaOriginal = window.switchTab;
    if (typeof trocarAbaOriginal === 'function') {
        window.switchTab = function (aba) {
            const resultado = trocarAbaOriginal.apply(this, arguments);
            if (aba === 'divulgacao' && !carregado) listar();
            return resultado;
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    /** Para a aba Visitas: carrega as artes (se ainda não) e registra os nomes. */
    async function obterArtes() {
        if (!carregado) {
            const [json, loja] = await Promise.all([
                chamar('listar'),
                fetch('/api/loja', { headers: { Accept: 'application/json' } }).then((r) => r.json()).catch(() => ({}))
            ]);
            publicacoes = json.publicacoes || [];
            produtosLoja = (loja.produtos || []).map(comoArte);
            carregado = true;
            if ($('dv-grade')) desenhar();
        }
        registrarNomes();
        return publicacoes.concat(produtosLoja);
    }

    window.PCFTDivulgacao = { listar, obterArtes, linkDaArte };
})();
