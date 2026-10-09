// Programação de Status e Stories, na aba Divulgação:
//   • "Programação de hoje": os horários do dia, com o que já foi postado;
//   • editor dos horários (hora, dias, onde e qual arte — ou rodízio);
//   • "Hora de postar": aberta pelo lembrete no celular
//     (admin.html?postar=<chave>#divulgacao) ou tocando num horário.
// Quem escolhe a arte de cada horário é agenda-divulgacao.js, o mesmo
// arquivo que o servidor usa para mandar o lembrete (api/publicacoes.js).

(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const A = window.PCFTAgenda;
    const D = () => window.PCFTDivulgacao;
    if (!A || !$('dv-agenda')) return;

    const VISUAL = {
        status: { icone: 'fab fa-whatsapp', cor: '#25D366', botao: 'Postar no Status', dica: 'No menu, escolha WhatsApp e depois "Meu status". A legenda com o link vai junto.' },
        instagram: { icone: 'fab fa-instagram', cor: '#E1306C', botao: 'Postar no Story do Instagram', dica: 'No menu, escolha Instagram → Story. A legenda fica copiada: cole num adesivo de link.' },
        facebook: { icone: 'fab fa-facebook', cor: '#1877F2', botao: 'Postar no Story do Facebook', dica: 'No menu, escolha Facebook → Story. A legenda fica copiada.' }
    };
    const DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0]; // a semana do editor começa na segunda
    const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];

    let entradas = [];
    let registros = {};
    let diaDosRegistros = '';
    let inscritos = null;
    let carregada = false;
    let carregando = null;
    let ultimaCarga = 0;
    let erroCarga = '';
    let rascunho = [];
    let aberto = null; // horário na tela "Hora de postar"
    let pendente = new URLSearchParams(window.location.search).get('postar');

    const el = (tag, classe, texto) => {
        const e = document.createElement(tag);
        if (classe) e.className = classe;
        if (texto !== undefined) e.textContent = texto;
        return e;
    };
    const icone = (classe) => { const i = el('i', classe); i.setAttribute('aria-hidden', 'true'); return i; };
    const titulo = (arte) => A.limparTitulo(arte && arte.titulo) || (arte ? D().marca(arte.categoria) : 'Arte removida');
    const horaMinuto = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: A.FUSO });

    function status(id, texto, erro) {
        const e = $(id);
        if (!e) return;
        e.textContent = texto || '';
        e.classList.toggle('is-erro', Boolean(erro));
    }

    // ── Dados ───────────────────────────────────────────────────────────────

    async function carregar() {
        if (carregando) return carregando;
        carregando = (async () => {
            try {
                const r = await D().chamar('agenda');
                entradas = r.entradas || [];
                registros = (r.hoje && r.hoje.registros) || {};
                diaDosRegistros = (r.hoje && r.hoje.dia) || '';
                inscritos = typeof r.inscritos === 'number' ? r.inscritos : null;
                carregada = true;
                erroCarga = '';
                ultimaCarga = Date.now();
            } catch (erro) {
                erroCarga = erro.message || 'Não foi possível carregar a programação.';
            }
            desenhar();
            abrirPendente();
        })();
        try { await carregando; } finally { carregando = null; }
    }

    /** Horários de hoje, com a situação de cada um. */
    function slotsDeHoje() {
        const quando = A.momento(Date.now());
        const artes = D().artes();
        return A.slotsDoDia(entradas, quando, artes).map((s) => {
            const r = registros[s.chave] || null;
            // O que o lembrete mandou vale mais que a conta de agora (a lista
            // de artes pode ter mudado depois).
            if (r && r.arteId) {
                const doLembrete = artes.find((a) => a.id === r.arteId);
                if (doLembrete) s.arte = doLembrete;
            }
            const postados = (r && r.postados) || {};
            s.registro = r;
            s.postados = postados;
            if (r && r.pulado) s.estado = 'pulado';
            else if (s.onde.every((o) => postados[o])) s.estado = 'postado';
            else if (!s.arte) s.estado = 'sem-arte';
            else if (s.hora < quando.hora) s.estado = 'atrasado';
            else if (s.hora === quando.hora) s.estado = 'agora';
            else s.estado = 'depois';
            return s;
        });
    }

    /** Próximo dia com horário (para "nada hoje; próximo: …"). */
    function proximoDia() {
        const agora = Date.now();
        for (let d = 1; d <= 7; d++) {
            const quando = A.momento(agora + d * 864e5);
            const slots = A.slotsDoDia(entradas, quando, D().artes());
            if (slots.length) {
                const nome = d === 1 ? 'amanhã' : ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][quando.semana];
                return `${nome} às ${A.horaTexto(slots[0].hora)}`;
            }
        }
        return '';
    }

    // ── "Programação de hoje" ──────────────────────────────────────────────

    function desenhar() {
        const lista = $('dv-hoje');
        const resumo = $('dv-agenda-resumo');
        desenharAviso();
        if (!carregada) {
            lista.replaceChildren(el('li', 'dv-hoje-vazio', erroCarga || 'Carregando a programação…'));
            return;
        }
        // Virou o dia com o painel aberto: busca o registro do dia novo.
        if (A.momento(Date.now()).dia !== diaDosRegistros && !carregando && Date.now() - ultimaCarga > 60e3) { carregar(); return; }

        if (!entradas.length) {
            resumo.textContent = 'Programe os horários e receba um lembrete no celular na hora de postar no Status e nos Stories.';
            const vazio = el('li', 'dv-hoje-vazio');
            vazio.append(el('p', '', 'Nenhum horário programado ainda.'));
            const acoes = el('div', 'dv-hoje-vazio-acoes');
            const sugestao = el('button', 'av-botao');
            sugestao.type = 'button';
            sugestao.append(icone('fas fa-magic'), ' Começar com a sugestão');
            sugestao.addEventListener('click', () => abrirEditor(sugestaoPadrao()));
            const programar = el('button', 'av-botao av-botao-secundario');
            programar.type = 'button';
            programar.append(icone('fas fa-clock'), ' Programar do meu jeito');
            programar.addEventListener('click', () => abrirEditor());
            acoes.append(sugestao, programar);
            vazio.append(acoes, el('small', '', 'Sugestão: 9h, 12h e 19h, todo dia, no Status e no Instagram, com rodízio das artes.'));
            lista.replaceChildren(vazio);
            return;
        }

        const slots = slotsDeHoje();
        if (!slots.length) {
            const proximo = proximoDia();
            resumo.textContent = 'Nada programado para hoje.' + (proximo ? ` Próximo: ${proximo}.` : '');
            lista.replaceChildren(el('li', 'dv-hoje-vazio', 'Hoje é dia de folga na programação.'));
            return;
        }

        const feitos = slots.filter((s) => s.estado === 'postado').length;
        const faltam = slots.filter((s) => s.estado === 'agora' || s.estado === 'atrasado').length;
        resumo.textContent = `${slots.length} ${slots.length === 1 ? 'horário' : 'horários'} hoje · ${feitos} ${feitos === 1 ? 'postado' : 'postados'}`
            + (faltam ? ` · ${faltam} para postar agora` : '');
        lista.replaceChildren(...slots.map(itemDoHorario));
    }

    function itemDoHorario(s) {
        const li = el('li', 'dv-slot is-' + s.estado);
        const hora = el('span', 'dv-slot-hora', A.horaTexto(s.hora));

        const foto = el('span', 'dv-slot-foto');
        if (s.arte && s.arte.imagem) {
            const img = el('img');
            img.src = s.arte.imagem;
            img.alt = '';
            img.loading = 'lazy';
            foto.append(img);
        } else {
            foto.append(icone('fas fa-image'));
        }

        const info = el('span', 'dv-slot-info');
        info.append(el('strong', '', titulo(s.arte)));
        const onde = el('span', 'dv-slot-onde');
        s.onde.forEach((o) => {
            const chip = el('span', 'dv-slot-chip' + (s.postados[o] ? ' is-feito' : ''));
            chip.style.setProperty('--c', VISUAL[o].cor);
            chip.append(icone(VISUAL[o].icone), ' ' + A.ONDE[o].curto);
            if (s.postados[o]) chip.append(' ', icone('fas fa-check'));
            onde.append(chip);
        });
        info.append(onde);
        const detalhes = [];
        if (s.rodizio) detalhes.push('Rodízio');
        if (s.registro && s.registro.lembradoEm) detalhes.push('lembrete às ' + horaMinuto(s.registro.lembradoEm));
        if (s.estado === 'sem-arte') detalhes.push(s.rodizio ? 'nenhuma arte no rodízio' : 'arte removida ou fora do período');
        if (detalhes.length) info.append(el('small', '', detalhes.join(' · ')));

        let acao;
        if (s.estado === 'postado' || s.estado === 'pulado') {
            acao = el('span', 'dv-slot-feito');
            acao.append(icone(s.estado === 'postado' ? 'fas fa-check-circle' : 'fas fa-forward'), s.estado === 'postado' ? ' Postado' : ' Pulado');
        } else if (s.estado === 'sem-arte') {
            acao = el('span', 'dv-slot-feito', '—');
        } else {
            acao = el('button', 'av-botao dv-slot-botao' + (s.estado === 'depois' ? ' av-botao-secundario' : ''));
            acao.type = 'button';
            acao.append(icone('fas fa-paper-plane'), s.estado === 'depois' ? ' Adiantar' : ' Postar');
            acao.addEventListener('click', () => abrirPostar(s));
        }
        li.append(hora, foto, info, acao);
        return li;
    }

    function desenharAviso() {
        const caixa = $('dv-agenda-aviso');
        caixa.replaceChildren();
        let texto = '';
        let comBotao = false;
        if (!('Notification' in window)) texto = 'Este navegador não recebe notificações: abra o painel pelo app no celular para receber os lembretes.';
        else if (Notification.permission !== 'granted') { texto = 'Ative as notificações neste aparelho para receber os lembretes na hora de postar.'; comBotao = true; }
        else if (carregada && inscritos === 0) { texto = 'Nenhum aparelho recebe as notificações do painel ainda. Ative neste celular para receber os lembretes.'; comBotao = true; }
        caixa.hidden = !texto || !entradas.length;
        if (caixa.hidden) return;
        caixa.append(icone('fas fa-bell'), el('span', '', texto));
        if (comBotao && typeof window.solicitarPermissaoNotificacao === 'function') {
            const b = el('button', 'av-botao');
            b.type = 'button';
            b.textContent = 'Ativar';
            b.addEventListener('click', async () => {
                b.disabled = true;
                try { await window.solicitarPermissaoNotificacao(); } finally { b.disabled = false; }
                setTimeout(carregar, 2500);
            });
            caixa.append(b);
        }
    }

    // ── "Hora de postar" ───────────────────────────────────────────────────

    const dialogoPostar = () => $('dv-postar');

    function abrirPostar(s) {
        if (!s.arte) { status('dv-status', 'A arte deste horário não está mais disponível.', true); return; }
        aberto = s;
        $('dv-postar-titulo').textContent = s.estado === 'depois' ? 'Postar agora' : 'Hora de postar';
        $('dv-postar-hora').textContent = `${A.horaTexto(s.hora)} · ${A.nomesOnde(s.onde)}`;
        $('dv-postar-arte').textContent = titulo(s.arte);
        $('dv-postar-origem').textContent = s.rodizio ? 'Escolhida pelo rodízio de hoje' : '';
        const img = $('dv-postar-img');
        img.src = s.arte.imagem || '';
        // Mostra a versão de Story que vai ser compartilhada, assim que fica pronta.
        D().prepararStory(s.arte).then((arquivo) => {
            if (aberto !== s || !arquivo) return;
            const url = URL.createObjectURL(arquivo);
            img.onload = () => URL.revokeObjectURL(url);
            img.src = url;
        }).catch(() => {});
        desenharBotoesPostar();
        status('dv-postar-status', '');
        const d = dialogoPostar();
        if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    }

    function desenharBotoesPostar() {
        const s = aberto;
        $('dv-postar-botoes').replaceChildren(...s.onde.map((o) => {
            const b = el('button', 'dv-postar-botao' + (s.postados[o] ? ' is-feito' : ''));
            b.type = 'button';
            b.style.setProperty('--c', VISUAL[o].cor);
            const texto = el('span', 'dv-postar-texto');
            texto.append(el('b', '', VISUAL[o].botao), el('small', '', s.postados[o] ? 'Já postado hoje. Toque para postar de novo.' : VISUAL[o].dica));
            b.append(icone(VISUAL[o].icone + ' dv-postar-rede'), texto, icone(s.postados[o] ? 'fas fa-check-circle dv-postar-ok' : 'fas fa-chevron-right dv-postar-ok'));
            b.addEventListener('click', () => postar(o, b));
            return b;
        }));
    }

    async function postar(onde, botao) {
        const s = aberto;
        botao.disabled = true;
        try {
            const r = await D().enviarArte(s.arte, { story: true, canal: A.ONDE[onde].canal });
            if (r.como === 'compartilhado') {
                await marcar(s, onde, 'postado');
                const falta = s.onde.filter((o) => !s.postados[o]);
                status('dv-postar-status', falta.length
                    ? `Pronto no ${A.ONDE[onde].curto}. Falta: ${falta.map((o) => A.ONDE[o].curto).join(' e ')}.`
                    : 'Tudo postado neste horário. 👏');
                desenharBotoesPostar();
                if (!falta.length) setTimeout(() => { if (aberto === s) dialogoPostar().close(); }, 1600);
            } else {
                status('dv-postar-status', 'Neste aparelho não abre o menu de compartilhar: a imagem foi baixada e a legenda copiada. Depois de postar, toque em "Já postei".');
            }
        } catch (erro) {
            if (!erro || erro.name !== 'AbortError') status('dv-postar-status', 'Não foi possível compartilhar: ' + ((erro && erro.message) || erro), true);
        } finally {
            botao.disabled = false;
        }
    }

    async function marcar(s, onde, estado) {
        const r = await D().chamar('agenda-marcar', {
            chave: s.chave, onde, estado, arteId: s.arte && s.arte.id, titulo: titulo(s.arte), hora: s.hora, ondeTodos: s.onde
        });
        registros[s.chave] = r.registro || registros[s.chave];
        s.registro = registros[s.chave];
        s.postados = (s.registro && s.registro.postados) || {};
        desenhar();
    }

    async function marcarTudo(estado) {
        const s = aberto;
        if (!s) return;
        const botoes = [$('dv-postar-pular'), $('dv-postar-feito')];
        botoes.forEach((b) => { b.disabled = true; });
        try {
            if (estado === 'pulado') await marcar(s, null, 'pulado');
            else for (const o of s.onde.filter((x) => !s.postados[x])) await marcar(s, o, 'postado');
            dialogoPostar().close();
            status('dv-status', estado === 'pulado' ? `Horário das ${A.horaTexto(s.hora)} pulado.` : `Horário das ${A.horaTexto(s.hora)} marcado como postado.`);
        } catch (erro) {
            status('dv-postar-status', erro.message, true);
        } finally {
            botoes.forEach((b) => { b.disabled = false; });
        }
    }

    /** Veio pelo lembrete (?postar=<chave>): abre a tela daquele horário. */
    function abrirPendente() {
        if (!pendente || !carregada || !D().carregado()) return;
        const chave = pendente;
        pendente = null;
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('postar');
            window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        } catch (e) { /* sem history */ }
        const s = slotsDeHoje().find((x) => x.chave === chave);
        if (s && s.arte) abrirPostar(s);
        else status('dv-status', 'Esse lembrete não é de hoje ou a arte saiu da programação.', true);
    }

    // ── Editor ─────────────────────────────────────────────────────────────

    const dialogoEditor = () => $('dv-agenda-dialogo');
    let sequencia = 0;
    const novoId = () => 'h' + Date.now().toString(36) + (sequencia++).toString(36);

    function sugestaoPadrao() {
        return [9, 12, 19].map((hora) => ({ id: novoId(), arte: A.RODIZIO, hora, dias: TODOS_OS_DIAS.slice(), onde: ['status', 'instagram'] }));
    }

    function abrirEditor(inicial) {
        rascunho = (inicial || entradas).map((e) => ({ ...e, dias: e.dias.slice(), onde: e.onde.slice() }));
        if (!rascunho.length) rascunho = [novaEntrada()];
        desenharEditor();
        status('dv-agenda-status', inicial && inicial !== entradas ? 'Sugestão pronta: ajuste se quiser e toque em Salvar.' : '');
        const d = dialogoEditor();
        if (!d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', ''); }
    }

    function novaEntrada() {
        const ultima = rascunho[rascunho.length - 1];
        const hora = ultima ? Math.min(22, ultima.hora + 3) : 9;
        return { id: novoId(), arte: A.RODIZIO, hora, dias: TODOS_OS_DIAS.slice(), onde: ['status'] };
    }

    function opcoesDeArte(selecionada) {
        const select = el('select');
        select.dataset.campo = 'arte';
        const rodizio = el('option', '', '🔁 Rodízio');
        rodizio.value = A.RODIZIO;
        select.append(rodizio);
        const artes = D().artes().filter((a) => !a.produto);
        const grupos = {};
        artes.forEach((a) => { (grupos[a.categoria] = grupos[a.categoria] || []).push(a); });
        Object.keys(grupos).forEach((categoria) => {
            const grupo = el('optgroup');
            grupo.label = D().marca(categoria);
            grupos[categoria].forEach((a) => {
                const o = el('option', '', a.titulo || titulo(a));
                o.value = a.id;
                grupo.append(o);
            });
            select.append(grupo);
        });
        if (selecionada !== A.RODIZIO && !artes.some((a) => a.id === selecionada)) {
            const sumida = el('option', '', '⚠ Arte removida: escolha outra');
            sumida.value = selecionada;
            select.append(sumida);
        }
        select.value = selecionada;
        return select;
    }

    function desenharEditor() {
        const caixa = $('dv-entradas');
        caixa.replaceChildren(...rascunho.map((e, i) => {
            const card = el('div', 'dv-entrada');
            card.dataset.i = String(i);

            const topo = el('div', 'dv-entrada-topo');
            const campoHora = el('label', 'dv-campo dv-campo-hora');
            const hora = el('select');
            hora.dataset.campo = 'hora';
            for (let h = 0; h < 24; h++) {
                const o = el('option', '', A.horaTexto(h));
                o.value = String(h);
                hora.append(o);
            }
            hora.value = String(e.hora);
            campoHora.append(el('span', '', 'Horário'), hora);

            const campoArte = el('label', 'dv-campo dv-campo-arte');
            campoArte.append(el('span', '', 'Arte'), opcoesDeArte(e.arte));

            const remover = el('button', 'dv-entrada-remover');
            remover.type = 'button';
            remover.dataset.acao = 'remover';
            remover.setAttribute('aria-label', `Remover o horário das ${A.horaTexto(e.hora)}`);
            remover.append(icone('fas fa-trash-alt'));
            topo.append(campoHora, campoArte, remover);

            const dias = el('div', 'dv-chips');
            dias.setAttribute('role', 'group');
            dias.setAttribute('aria-label', 'Dias da semana');
            DIAS_ORDEM.forEach((d) => {
                const b = el('button', '', A.DIAS[d]);
                b.type = 'button';
                b.dataset.dia = String(d);
                b.setAttribute('aria-pressed', String(e.dias.includes(d)));
                dias.append(b);
            });
            const todos = el('button', 'dv-chip-todos', e.dias.length === 7 ? 'Todo dia ✓' : 'Todo dia');
            todos.type = 'button';
            todos.dataset.acao = 'todos';
            dias.append(todos);

            const onde = el('div', 'dv-chips dv-chips-onde');
            onde.setAttribute('role', 'group');
            onde.setAttribute('aria-label', 'Onde postar');
            Object.keys(A.ONDE).forEach((o) => {
                const b = el('button');
                b.type = 'button';
                b.dataset.onde = o;
                b.style.setProperty('--c', VISUAL[o].cor);
                b.setAttribute('aria-pressed', String(e.onde.includes(o)));
                b.setAttribute('aria-label', A.ONDE[o].nome);
                b.append(icone(VISUAL[o].icone), ' ' + A.ONDE[o].curto);
                onde.append(b);
            });

            card.append(topo, el('span', 'dv-entrada-rotulo', 'Dias'), dias, el('span', 'dv-entrada-rotulo', 'Onde'), onde);
            if (!e.dias.length || !e.onde.length) card.classList.add('is-incompleta');
            return card;
        }));
        $('dv-agenda-adicionar').disabled = rascunho.length >= A.MAX_ENTRADAS;
    }

    function aoMexerNoEditor(evento) {
        const card = evento.target.closest('.dv-entrada');
        if (!card) return;
        const e = rascunho[Number(card.dataset.i)];
        const alvo = evento.target.closest('button, select');
        if (!alvo || !e) return;
        if (evento.type === 'change' && alvo.dataset.campo === 'hora') e.hora = Number(alvo.value);
        else if (evento.type === 'change' && alvo.dataset.campo === 'arte') e.arte = alvo.value;
        else if (evento.type !== 'click') return;
        else if (alvo.dataset.acao === 'remover') rascunho.splice(Number(card.dataset.i), 1);
        else if (alvo.dataset.acao === 'todos') e.dias = e.dias.length === 7 ? [] : TODOS_OS_DIAS.slice();
        else if (alvo.dataset.dia) {
            const d = Number(alvo.dataset.dia);
            e.dias = e.dias.includes(d) ? e.dias.filter((x) => x !== d) : e.dias.concat(d).sort((a, b) => a - b);
        } else if (alvo.dataset.onde) {
            const o = alvo.dataset.onde;
            e.onde = e.onde.includes(o) ? e.onde.filter((x) => x !== o) : Object.keys(A.ONDE).filter((x) => x === o || e.onde.includes(x));
        } else return;
        desenharEditor();
        status('dv-agenda-status', '');
    }

    async function salvarEditor(evento) {
        evento.preventDefault();
        const incompleta = rascunho.findIndex((e) => !e.dias.length || !e.onde.length);
        if (incompleta >= 0) {
            status('dv-agenda-status', `O horário das ${A.horaTexto(rascunho[incompleta].hora)} precisa de pelo menos um dia e um lugar para postar.`, true);
            return;
        }
        const b = $('dv-agenda-salvar');
        b.disabled = true;
        status('dv-agenda-status', 'Salvando…');
        try {
            const r = await D().chamar('agenda-salvar', { entradas: rascunho });
            entradas = r.entradas || [];
            dialogoEditor().close();
            desenhar();
            status('dv-status', entradas.length
                ? `Programação salva: ${entradas.length} ${entradas.length === 1 ? 'horário' : 'horários'}. O lembrete chega no celular na hora.`
                : 'Programação apagada: nenhum lembrete será enviado.');
        } catch (erro) {
            status('dv-agenda-status', erro.message, true);
        } finally {
            b.disabled = false;
        }
    }

    // ── Início ─────────────────────────────────────────────────────────────

    function iniciar() {
        $('dv-agenda-editar').addEventListener('click', () => abrirEditor());
        $('dv-agenda-adicionar').addEventListener('click', () => { rascunho.push(novaEntrada()); desenharEditor(); });
        $('dv-agenda-sugestao').addEventListener('click', () => {
            rascunho = sugestaoPadrao();
            desenharEditor();
            status('dv-agenda-status', 'Sugestão pronta: ajuste se quiser e toque em Salvar.');
        });
        $('dv-agenda-form').addEventListener('submit', salvarEditor);
        $('dv-entradas').addEventListener('click', aoMexerNoEditor);
        $('dv-entradas').addEventListener('change', aoMexerNoEditor);
        $('dv-postar-pular').addEventListener('click', () => marcarTudo('pulado'));
        $('dv-postar-feito').addEventListener('click', () => marcarTudo('postado'));
        [dialogoPostar(), dialogoEditor()].forEach((d) => {
            d.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => d.close()));
            d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
        });
        dialogoPostar().addEventListener('close', () => { aberto = null; });

        // A lista de artes chegou (ou mudou): carrega a programação junto.
        document.addEventListener('pcft:artes', () => {
            if (!carregada || Date.now() - ultimaCarga > 30e3) carregar();
            else { desenhar(); abrirPendente(); }
        });

        // Lembrete tocado com o painel já aberto (sw-notifications.js).
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (evento) => {
                const dados = evento.data || {};
                if (dados.type !== 'ABRIR_ABA' || !dados.url) return;
                try {
                    const chave = new URL(dados.url, window.location.origin).searchParams.get('postar');
                    if (chave) { pendente = chave; carregar(); }
                } catch (e) { /* endereço estranho: ignora */ }
            });
        }

        // De minuto em minuto, com a aba aberta: "Depois" vira "Postar" na hora.
        setInterval(() => {
            const aba = $('tab-divulgacao');
            if (carregada && aba && aba.classList.contains('active') && !document.hidden) desenhar();
        }, 60e3);

        // Com o painel aberto, ele mesmo confere os lembretes a cada 5 min — um
        // gatilho a mais além do GitHub e das visitas (o lembrete nunca sai
        // duas vezes). Se mandou algum, atualiza a lista do dia.
        const cutucar = () => {
            if (document.hidden) return;
            fetch('/api/publicacoes?lembrar=1', { cache: 'no-store' })
                .then((r) => (r.ok ? r.json() : {}))
                .then((r) => { if (r && r.lembretes > 0 && carregada) carregar(); })
                .catch(() => {});
        };
        cutucar();
        setInterval(cutucar, 5 * 60e3);
        desenhar();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
