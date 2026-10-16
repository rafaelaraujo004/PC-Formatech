// "Postar 3 de uma vez", na aba Divulgação: 1 vídeo e 2 fotos no mesmo envio.
//   • abre com uma sugestão do dia (muda todo dia e mistura PC Formatech,
//     Bird Tech e Apps; promoção em vigor entra primeiro nas fotos);
//   • tocar numa das três abre a lista para trocar;
//   • "Postar as 3" abre o menu do celular com os três arquivos de uma vez,
//     já na versão de Status e Stories (1080×1920). Se o app aceitar só um,
//     os botões de baixo mandam um por vez.
// Os arquivos vêm de admin-divulgacao.js (prepararStory), preparados assim que
// a escolha muda: o celular só abre o menu logo depois do toque.

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const D = () => window.PCFTDivulgacao;
    if (!$('dv-trio') || !$('dv-trio-abrir')) return;

    const DESTINOS = [
        { id: 'whatsapp', icone: 'fab fa-whatsapp', cor: '#25D366', botao: 'Postar as 3 no Status', dica: 'No menu, escolha WhatsApp e depois "Meu status". Os 3 entram em sequência.' },
        { id: 'instagram', icone: 'fab fa-instagram', cor: '#E1306C', botao: 'Postar as 3 no Instagram', dica: 'No menu, escolha Instagram. Se ele pegar só um, use os botões de baixo.' },
        { id: 'facebook', icone: 'fab fa-facebook', cor: '#1877F2', botao: 'Postar as 3 no Facebook', dica: 'No menu, escolha Facebook → Story.' }
    ];
    const VAGAS = [
        { nome: 'Vídeo', tipo: 'video' },
        { nome: 'Foto 1', tipo: 'foto' },
        { nome: 'Foto 2', tipo: 'foto' }
    ];

    let escolha = [null, null, null];
    let trocando = null;   // índice da vaga sendo trocada
    let preparo = null;    // Promise dos 3 arquivos da escolha atual
    let prontos = false;
    const previas = new Map(); // id da arte → versão de Status já preparada (para a miniatura)

    const el = (tag, classe, texto) => {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto != null) e.textContent = texto;
        return e;
    };
    const icone = (classe) => { const i = el('i', classe); i.setAttribute('aria-hidden', 'true'); return i; };
    const nomeDaArte = (a) => {
        const limpo = window.PCFTAgenda && window.PCFTAgenda.limparTitulo ? window.PCFTAgenda.limparTitulo(a.titulo) : a.titulo;
        return limpo || D().marca(a.categoria);
    };
    const status = (texto, erro) => {
        const s = $('dv-trio-status');
        s.textContent = texto || '';
        s.classList.toggle('is-erro', Boolean(erro));
    };

    // ── Sugestão do dia ───────────────────────────────────────────────────────

    /** Promoção só vale dentro do período; as outras artes valem sempre. */
    function valeAgora(a, agora) {
        if (!a.imagem) return false;
        if (a.categoria !== 'promocoes') return true;
        return (!a.inicio || agora >= a.inicio) && (!a.fim || agora <= a.fim);
    }

    function candidatas(tipo, agora) {
        const lista = D().artes()
            .filter((a) => valeAgora(a, agora) && (tipo === 'video' ? Boolean(a.video) : !a.video))
            .sort((a, b) => ((a.ordem || 0) - (b.ordem || 0)) || String(a.id).localeCompare(String(b.id)));
        // A mesma arte em dois formatos ("Criação de apps (feed)" e "(Status/Stories)")
        // conta uma vez só, ficando a de Status, que é o formato que vai.
        const chave = (a) => a.categoria + '|' + nomeDaArte(a).toLowerCase();
        const porArte = new Map();
        lista.forEach((a) => {
            const atual = porArte.get(chave(a));
            if (!atual || (/stories/i.test(a.titulo || '') && !/stories/i.test(atual.titulo || ''))) porArte.set(chave(a), a);
        });
        return lista.filter((a) => porArte.get(chave(a)) === a);
    }

    /** A lista começando de um ponto que anda todo dia. */
    const girar = (lista, passo) => (lista.length ? lista.slice(passo % lista.length).concat(lista.slice(0, passo % lista.length)) : []);

    function sugestao(agora) {
        const dia = Math.floor((agora - 3 * 3600e3) / 864e5); // dia em Canaã (UTC−3)
        const video = girar(candidatas('video', agora), dia)[0] || null;
        const fotos = girar(candidatas('foto', agora), dia * 2);
        const usadas = new Set([video && video.categoria]);
        const escolhidas = [];
        const proxima = (filtro) => fotos.find((f) => !escolhidas.includes(f) && filtro(f));
        // 1ª foto: promoção em vigor, se houver; senão, outra marca que não a do vídeo.
        const f1 = proxima((f) => f.categoria === 'promocoes') || proxima((f) => !usadas.has(f.categoria)) || proxima(() => true) || null;
        if (f1) { escolhidas.push(f1); usadas.add(f1.categoria); }
        // 2ª foto: a marca que ainda não apareceu.
        const f2 = proxima((f) => !usadas.has(f.categoria)) || proxima((f) => f.categoria !== (f1 && f1.categoria)) || proxima(() => true) || null;
        return [video, f1, f2];
    }

    // ── Arquivos ─────────────────────────────────────────────────────────────

    function preparar() {
        prontos = false;
        const atual = escolha.slice();
        desenharBotoes();
        if (atual.some((a) => !a)) { preparo = null; return; }
        const p = Promise.all(atual.map((a) => D().prepararStory(a)));
        preparo = p;
        p.then((arquivos) => {
            if (preparo !== p) return;
            prontos = true;
            desenharBotoes();
            // Mostra nas fotos a versão de Status que vai ser enviada.
            arquivos.forEach((arquivo, i) => {
                if (!arquivo || !String(arquivo.type).startsWith('image/')) return;
                if (!previas.has(atual[i].id)) previas.set(atual[i].id, URL.createObjectURL(arquivo));
                const img = document.querySelector(`#dv-trio-vagas [data-vaga="${i}"] img`);
                if (img) img.src = previas.get(atual[i].id);
            });
        }).catch((erro) => {
            if (preparo !== p) return;
            preparo = null;
            desenharBotoes();
            status('Não foi possível preparar os arquivos: ' + ((erro && erro.message) || erro) + '. Toque em um botão para tentar de novo.', true);
        });
    }

    async function postarTodas(destino, botao) {
        botao.disabled = true;
        try {
            if (!preparo) preparar();
            if (!preparo) { status('Escolha o vídeo e as duas fotos.', true); return; }
            const arquivos = await preparo;
            const texto = D().textoParaCompartilhar(escolha[0], destino.id);
            const copiou = await D().copiar(texto);
            if (navigator.canShare && navigator.canShare({ files: arquivos })) {
                await navigator.share({ files: arquivos, text: texto, title: 'PC Formatech' });
                status(copiou ? 'Enviado. A legenda do vídeo, com o link, também ficou copiada.' : 'Enviado.');
            } else if (navigator.canShare && navigator.canShare({ files: arquivos.slice(0, 1) })) {
                status('Este aparelho não manda 3 arquivos juntos. Use os botões "um por vez" logo abaixo.', true);
            } else {
                arquivos.forEach((a) => D().baixarArquivo(a));
                status(copiou
                    ? 'Este navegador não abre o menu de compartilhar: os 3 arquivos foram baixados e a legenda copiada.'
                    : 'Os 3 arquivos foram baixados.');
            }
        } catch (erro) {
            if (erro && erro.name === 'NotAllowedError') status('Os arquivos ficaram prontos. Toque de novo no botão para postar.');
            else if (!erro || erro.name !== 'AbortError') status('Não foi possível compartilhar: ' + ((erro && erro.message) || erro), true);
        } finally {
            botao.disabled = false;
        }
    }

    async function postarUma(i, botao) {
        botao.disabled = true;
        try {
            const canal = document.querySelector('[data-dv-canal].is-ativo');
            const r = await D().enviarArte(escolha[i], { story: true, canal: canal ? canal.dataset.dvCanal : undefined });
            status(r.como === 'compartilhado'
                ? `${VAGAS[i].nome} enviado.`
                : `${VAGAS[i].nome} baixado, com a legenda copiada.`);
        } catch (erro) {
            if (erro && erro.name === 'NotAllowedError') status('Ficou pronto. Toque de novo para enviar.');
            else if (!erro || erro.name !== 'AbortError') status('Não foi possível compartilhar: ' + ((erro && erro.message) || erro), true);
        } finally {
            botao.disabled = false;
        }
    }

    // ── Tela ─────────────────────────────────────────────────────────────────

    function miniatura(a, classe) {
        const caixa = el('span', classe);
        const img = el('img');
        img.src = previas.get(a.id) || a.imagem;
        img.alt = '';
        img.loading = 'lazy';
        caixa.appendChild(img);
        if (a.video) caixa.appendChild(icone('fas fa-play dv-trio-play'));
        return caixa;
    }

    function desenharVagas() {
        $('dv-trio-vagas').replaceChildren(...VAGAS.map((vaga, i) => {
            const a = escolha[i];
            const b = el('button', 'dv-trio-vaga' + (trocando === i ? ' is-trocando' : ''));
            b.type = 'button';
            b.dataset.vaga = String(i);
            b.setAttribute('aria-label', a ? `${vaga.nome}: ${nomeDaArte(a)}. Toque para trocar.` : `${vaga.nome}: escolher`);
            if (a) b.appendChild(miniatura(a, 'dv-trio-mini'));
            else b.appendChild(el('span', 'dv-trio-mini dv-trio-vazia', 'Nenhum'));
            const info = el('span', 'dv-trio-info');
            info.append(el('span', 'dv-trio-tipo', vaga.nome));
            if (a) info.append(el('span', 'dv-trio-nome', nomeDaArte(a)), el('span', 'dv-trio-marca', a.produto ? 'Bird Tech · produto' : D().marca(a.categoria)));
            const trocar = el('span', 'dv-trio-trocar');
            trocar.append(icone('fas fa-sync-alt'), ' Trocar');
            info.append(trocar);
            b.appendChild(info);
            b.addEventListener('click', () => abrirEscolha(i));
            return b;
        }));
    }

    function abrirEscolha(i) {
        trocando = trocando === i ? null : i;
        desenharVagas();
        const caixa = $('dv-trio-escolha');
        caixa.hidden = trocando === null;
        if (trocando === null) return;
        const vaga = VAGAS[i];
        $('dv-trio-escolha-titulo').textContent = vaga.tipo === 'video' ? 'Escolha o vídeo' : `Escolha a ${vaga.nome.toLowerCase()}`;
        // Compara pelo id: a lista de artes pode ter sido recarregada desde a sugestão.
        const outras = escolha.filter((a, j) => a && j !== i).map((a) => a.id);
        const atual = escolha[i] && escolha[i].id;
        const lista = candidatas(vaga.tipo, Date.now()).filter((a) => !outras.includes(a.id));
        $('dv-trio-opcoes').replaceChildren(...lista.map((a) => {
            const b = el('button', 'dv-trio-opcao' + (a.id === atual ? ' is-atual' : ''));
            b.type = 'button';
            b.setAttribute('aria-pressed', String(a.id === atual));
            b.append(miniatura(a, 'dv-trio-mini'), el('span', 'dv-trio-nome', nomeDaArte(a)));
            b.addEventListener('click', () => {
                escolha[i] = a;
                trocando = null;
                caixa.hidden = true;
                status('');
                desenharVagas();
                preparar();
            });
            return b;
        }));
        caixa.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function desenharBotoes() {
        const completa = escolha.every(Boolean);
        $('dv-trio-botoes').replaceChildren(...DESTINOS.map((d) => {
            const b = el('button', 'dv-postar-botao');
            b.type = 'button';
            b.style.setProperty('--c', d.cor);
            b.disabled = !completa;
            const texto = el('span', 'dv-postar-texto');
            texto.append(el('b', '', d.botao), el('small', '', completa && !prontos ? 'Preparando os 3 arquivos…' : d.dica));
            b.append(icone(d.icone + ' dv-postar-rede'), texto, icone(completa && !prontos ? 'fas fa-spinner fa-spin dv-postar-ok' : 'fas fa-chevron-right dv-postar-ok'));
            b.addEventListener('click', () => postarTodas(d, b));
            return b;
        }));
        $('dv-trio-uma-botoes').replaceChildren(...VAGAS.map((vaga, i) => {
            const b = el('button', 'av-botao av-botao-secundario');
            b.type = 'button';
            b.disabled = !escolha[i];
            b.append(icone(vaga.tipo === 'video' ? 'fas fa-film' : 'fas fa-image'), ' ' + vaga.nome);
            b.addEventListener('click', () => postarUma(i, b));
            return b;
        }));
    }

    async function abrir() {
        const botao = $('dv-trio-abrir');
        botao.disabled = true;
        try {
            await D().obterArtes();
            escolha = sugestao(Date.now());
            trocando = null;
            $('dv-trio-escolha').hidden = true;
            status(escolha.every(Boolean) ? '' : 'Faltam artes: é preciso ter pelo menos 1 vídeo e 2 fotos na Divulgação.', !escolha.every(Boolean));
            desenharVagas();
            preparar();
            const d = $('dv-trio');
            if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
        } catch (erro) {
            const s = $('dv-status');
            if (s) { s.textContent = (erro && erro.message) || String(erro); s.classList.add('is-erro'); }
        } finally {
            botao.disabled = false;
        }
    }

    function iniciar() {
        $('dv-trio-abrir').addEventListener('click', abrir);
        const d = $('dv-trio');
        d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
        d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
        $('dv-trio-escolha-fechar').addEventListener('click', () => abrirEscolha(trocando));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    window.PCFTPostar3 = { sugestao };
})();
