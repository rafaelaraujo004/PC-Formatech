// Perguntas rápidas antes do WhatsApp (apps.html e páginas de serviço): uma
// pergunta por vez e, no fim, a mensagem pronta — o Rafael recebe já sabendo
// o que a pessoa precisa. O HTML vem de blocoPedido() em
// ferramentas/gerar-seo.js. Sem JavaScript, as perguntas aparecem todas e o
// botão do WhatsApp funciona com uma mensagem simples.

(function () {
    'use strict';

    const form = document.querySelector('form.pr-form');
    if (!form) return;

    const passos = [...form.querySelectorAll('[data-passo]')];
    const perguntas = passos.filter((p) => p.matches('fieldset'));
    const ultimo = perguntas.length + 1; // o resultado
    const progresso = [...form.querySelectorAll('.pr-progresso li')];
    const enviar = form.querySelector('.pr-enviar');
    const telefone = (enviar.href.match(/phone=(\d+)/) || [])[1] || '5594984305772';
    const reais = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    let atual = 1;

    form.classList.add('is-js');

    const nomeDe = (fs) => fs.querySelector('input').name;
    const marcados = (nome) => [...form.querySelectorAll(`input[name="${nome}"]:checked`)];
    const rotulo = (input) => input.closest('label').textContent.trim().replace(/\s+/g, ' ');
    const pergunta = (n) => perguntas[n - 1];

    function irPara(n, focar) {
        atual = n;
        passos.forEach((p) => p.classList.toggle('is-atual', Number(p.dataset.passo) === n));
        progresso.forEach((li, i) => {
            li.classList.toggle('is-feito', i + 1 < n);
            li.classList.toggle('is-atual', i + 1 === n);
        });
        if (n === ultimo) montarResultado();
        if (focar) {
            const alvo = passos.find((p) => Number(p.dataset.passo) === n);
            const titulo = alvo.querySelector('legend, h3');
            titulo.setAttribute('tabindex', '-1');
            titulo.focus({ preventScroll: true });
            // No celular, a pergunta nova pode ficar fora da tela.
            const topo = form.getBoundingClientRect().top;
            if (topo < 0 || topo > window.innerHeight * 0.6) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /** Texto com partes em negrito, sem montar HTML na mão. */
    function escrever(el, partes) {
        el.replaceChildren(...partes.map((p) => {
            if (typeof p === 'string') return document.createTextNode(p);
            const b = document.createElement('strong');
            b.textContent = p.forte;
            return b;
        }));
    }

    function montarResultado() {
        const linhas = [form.dataset.intro, ''];
        const extras = [];
        perguntas.forEach((fs, i) => {
            const nome = nomeDe(fs);
            const escolhidos = marcados(nome);
            const texto = escolhidos.map(rotulo).join(', ') || '-';
            const dd = form.querySelector(`[data-resumo="${nome}"]`);
            if (dd) dd.textContent = texto;
            linhas.push(`${i + 1}. ${fs.dataset.rotulo}: ${texto}`);
            escolhidos.forEach((x) => { if (x.dataset.extra) extras.push(x.dataset.extra); });
        });
        if (extras.length) linhas.push('', ...extras);
        enviar.href = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(linhas.join('\n'))}`;

        // Valor: o preço da página (serviço) ou o maior entre os marcados
        // (apps, "a partir de"), a menor mensalidade e as notas das respostas
        // (ex.: desconto à distância).
        const estimativa = form.querySelector('[data-estimativa]');
        if (!estimativa) return;
        const todos = [...form.querySelectorAll('input:checked')];
        const precos = todos.map((x) => Number(x.dataset.preco)).filter((v) => v > 0);
        const base = Number(form.dataset.precoBase) || (precos.length ? Math.max(...precos) : 0);
        const mensais = todos.map((x) => Number(x.dataset.mensal)).filter((v) => v > 0);
        const notas = todos.map((x) => x.dataset.nota).filter(Boolean);
        const partes = [];
        if (base) {
            partes.push((form.dataset.precoRotulo || 'A partir de') + ' ', { forte: reais(base) });
            if (mensais.length) partes.push(' + mensalidade a partir de ', { forte: reais(Math.min(...mensais)) }, '/mês');
            partes.push('.');
            if (precos.length > 1) partes.push(' Juntando mais de um, o valor fecha na conversa.');
        } else if (form.dataset.precoTexto) {
            partes.push(form.dataset.precoTexto);
        } else {
            partes.push(form.dataset.semPreco || 'O valor você recebe pelo WhatsApp, antes de qualquer serviço.');
        }
        notas.forEach((n) => partes.push(' ' + n));
        escrever(estimativa, partes);
        estimativa.hidden = false;
    }

    // "Próxima": nas perguntas de marcar vários, sempre; nas de uma resposta,
    // aparece quando já há resposta (por exemplo, ao voltar para mudar outra).
    form.querySelectorAll('.pr-avancar').forEach((b) => b.addEventListener('click', () => {
        const fs = b.closest('fieldset');
        const respondeu = marcados(nomeDe(fs)).length > 0;
        fs.querySelector('.pr-aviso').hidden = respondeu;
        if (respondeu) irPara(Number(fs.dataset.passo) + 1, true);
    }));
    const mostrarProxima = () => perguntas.forEach((fs) => {
        if (fs.querySelector('input').type === 'radio') fs.querySelector('.pr-avancar').hidden = !marcados(nomeDe(fs)).length;
    });

    // Uma resposta só: um toque já responde e passa para a próxima — inclusive
    // tocar de novo na que já estava marcada. Pelo teclado (setas), só marca,
    // para não pular pergunta sem querer; aí segue pelo "Próxima".
    let ultimoToque = 0;
    form.addEventListener('pointerdown', () => { ultimoToque = Date.now(); });
    form.addEventListener('click', (e) => {
        const r = e.target;
        if (r.type !== 'radio' || Date.now() - ultimoToque > 800) return;
        const fs = r.closest('fieldset');
        if (Number(fs.dataset.passo) === atual) setTimeout(() => irPara(atual + 1, true), 180);
    });
    form.addEventListener('change', (e) => {
        const fs = e.target.closest('fieldset');
        if (fs) fs.querySelector('.pr-aviso').hidden = true;
        mostrarProxima();
    });
    form.querySelectorAll('.pr-voltar').forEach((b) => b.addEventListener('click', () => {
        irPara(b.classList.contains('pr-refazer') ? 1 : Math.max(1, atual - 1), true);
    }));
    form.addEventListener('submit', (e) => e.preventDefault());

    // Botões "Quero este" (apps): marcam a opção da 1ª pergunta e já levam
    // para a 2ª.
    document.querySelectorAll('[data-pedido-marcar]').forEach((a) => a.addEventListener('click', (e) => {
        const caixa = pergunta(1).querySelector(`input[value="${a.dataset.pedidoMarcar}"]`);
        if (!caixa) return;
        e.preventDefault();
        caixa.checked = true;
        pergunta(1).querySelector('.pr-aviso').hidden = true;
        mostrarProxima();
        irPara(2, false);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const titulo = pergunta(2).querySelector('legend');
        titulo.setAttribute('tabindex', '-1');
        titulo.focus({ preventScroll: true });
    }));

    irPara(1, false);
})();
