// "Monte seu pedido em 3 perguntas" (apps.html): uma pergunta por vez e, no
// fim, a mensagem pronta para o WhatsApp — o Rafael já recebe sabendo o que
// a pessoa quer organizar, quantos vão usar e como ela controla hoje.
// Sem JavaScript, as perguntas aparecem todas e o botão do WhatsApp continua
// funcionando (com uma mensagem genérica).

(function () {
    'use strict';

    const form = document.getElementById('ap-pedido-form');
    if (!form) return;

    const passos = [...form.querySelectorAll('[data-passo]')];
    const progresso = [...form.querySelectorAll('.ap-pedido-progresso li')];
    const enviar = document.getElementById('ap-pedido-enviar');
    const telefone = (enviar.href.match(/phone=(\d+)/) || [])[1] || '5594984305772';
    const reais = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
    let atual = 1;

    form.classList.add('is-js');

    const marcados = (nome) => [...form.querySelectorAll(`input[name="${nome}"]:checked`)];
    const rotulo = (input) => input.closest('label').textContent.trim().replace(/\s+/g, ' ');

    function irPara(n, focar) {
        atual = n;
        passos.forEach((p) => p.classList.toggle('is-atual', Number(p.dataset.passo) === n));
        progresso.forEach((li, i) => {
            li.classList.toggle('is-feito', i + 1 < n);
            li.classList.toggle('is-atual', i + 1 === n);
        });
        if (n === 4) montarResultado();
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

    function montarResultado() {
        const oQue = marcados('o-que');
        const pessoas = marcados('pessoas')[0];
        const hoje = marcados('hoje')[0];
        const nomes = oQue.map(rotulo);
        form.querySelector('[data-resumo="o-que"]').textContent = nomes.join(', ');
        form.querySelector('[data-resumo="pessoas"]').textContent = pessoas ? rotulo(pessoas) : '—';
        form.querySelector('[data-resumo="hoje"]').textContent = hoje ? rotulo(hoje) : '—';

        // Estimativa: a criação mais cara entre os marcados ("a partir de") e,
        // se já definida, a menor mensalidade entre eles.
        const precos = oQue.map((i) => Number(i.dataset.preco)).filter((v) => v > 0);
        const mensais = oQue.map((i) => Number(i.dataset.mensal)).filter((v) => v > 0);
        const estimativa = form.querySelector('[data-estimativa]');
        if (precos.length) {
            let texto = `Criação a partir de <strong>${reais(Math.max(...precos))}</strong>`;
            if (mensais.length) texto += ` + mensalidade a partir de <strong>${reais(Math.min(...mensais))}</strong>/mês`;
            if (oQue.length > 1) texto += '. Juntando mais de um, o valor fecha na conversa.';
            estimativa.innerHTML = texto;
        } else {
            estimativa.textContent = 'O valor você recebe depois de contar a sua ideia.';
        }
        estimativa.hidden = false;

        const linhas = [
            'Olá! Vim pelo site e respondi as 3 perguntas sobre o sistema:',
            '',
            '1. Quero organizar: ' + nomes.join(', '),
            '2. Quem vai usar: ' + (pessoas ? rotulo(pessoas) : '-'),
            '3. Hoje eu controlo: ' + (hoje ? rotulo(hoje) : '-')
        ];
        if (hoje && /planilha/i.test(hoje.value)) linhas.push('', 'Posso mandar a minha planilha.');
        enviar.href = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(linhas.join('\n'))}`;
    }

    // "Próxima": na 1ª (pode marcar vários) sempre; na 2ª e na 3ª aparece
    // quando já há resposta — por exemplo, ao voltar para mudar outra.
    const NOME_DO_PASSO = { 1: 'o-que', 2: 'pessoas', 3: 'hoje' };
    form.querySelectorAll('.ap-avancar').forEach((b) => b.addEventListener('click', () => {
        const passo = Number(b.closest('[data-passo]').dataset.passo);
        const respondeu = marcados(NOME_DO_PASSO[passo]).length > 0;
        if (passo === 1) form.querySelector('.ap-pergunta-aviso').hidden = respondeu;
        if (respondeu) irPara(passo + 1, true);
    }));
    const mostrarProxima = () => {
        [2, 3].forEach((n) => {
            const b = form.querySelector(`[data-passo="${n}"] .ap-avancar`);
            if (b) b.hidden = !marcados(NOME_DO_PASSO[n]).length;
        });
    };

    // 2ª e 3ª: um toque já responde e passa para a próxima — inclusive tocar
    // de novo na que já estava marcada. Pelo teclado (setas), só marca, para
    // não pular pergunta sem querer; aí segue pelo "Próxima".
    let ultimoToque = 0;
    form.addEventListener('pointerdown', () => { ultimoToque = Date.now(); });
    form.addEventListener('click', (e) => {
        const r = e.target;
        if (r.type !== 'radio' || Date.now() - ultimoToque > 800) return;
        if (r.name === 'pessoas' && atual === 2) setTimeout(() => irPara(3, true), 180);
        if (r.name === 'hoje' && atual === 3) setTimeout(() => irPara(4, true), 180);
    });
    form.addEventListener('change', (e) => {
        if (e.target.name === 'o-que') form.querySelector('.ap-pergunta-aviso').hidden = true;
        mostrarProxima();
    });
    form.querySelectorAll('.ap-voltar').forEach((b) => b.addEventListener('click', () => {
        irPara(b.classList.contains('ap-refazer') ? 1 : Math.max(1, atual - 1), true);
    }));
    form.addEventListener('submit', (e) => e.preventDefault());

    // "Quero este" nos cartões: marca o sistema e já vai para a 2ª pergunta.
    document.querySelectorAll('.ap-card-cta[data-sistema]').forEach((a) => a.addEventListener('click', (e) => {
        const caixa = form.querySelector(`input[name="o-que"][value="${a.dataset.sistema}"]`);
        if (!caixa) return;
        e.preventDefault();
        caixa.checked = true;
        form.querySelector('.ap-pergunta-aviso').hidden = true;
        irPara(2, false);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const titulo = form.querySelector('[data-passo="2"] legend');
        titulo.setAttribute('tabindex', '-1');
        titulo.focus({ preventScroll: true });
    }));

    irPara(1, false);
})();
