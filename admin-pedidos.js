// Aba "Pedidos" do painel: carrinhos da loja Bird Tech que chegaram ao
// fechamento. Mostra o que o cliente fez (abriu o Pix, copiou o código,
// enviou o comprovante ou foi combinar no WhatsApp) e deixa o dono marcar o
// pedido como pago, entregue ou cancelado. Dados em /api/pedidos.

(function () {
    'use strict';

    const ROTA = '/api/pedidos';
    const WHATSAPP_LOJA = '5594984305772';
    const $ = (id) => document.getElementById(id);

    let pedidos = [];
    let filtro = 'abertos';
    let carregado = false;
    let atualizador = null;

    const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const hora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataHora = (ms) => {
        const d = new Date(ms);
        const hoje = new Date();
        const ontem = new Date(Date.now() - 864e5);
        const dia = d.toDateString() === hoje.toDateString() ? 'Hoje' : (d.toDateString() === ontem.toDateString() ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        return dia + ', ' + hora(ms);
    };

    const ETAPAS = [
        ['pix', 'Abriu o Pix'],
        ['copiou', 'Copiou o código'],
        ['comprovante', 'Enviou comprovante'],
        ['whatsapp', 'Foi combinar no WhatsApp']
    ];
    const SITUACOES = {
        aguardando: ['Aguardando pagamento', 'is-alerta'],
        pago: ['Pago', 'is-ok'],
        entregue: ['Entregue', 'is-info'],
        cancelado: ['Cancelado', 'is-neutro']
    };

    function status(texto, erro) {
        const el = $('pd-status');
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

    /** Pedido parado no Pix há mais de 30 min, sem comprovante: provavelmente desistiu. */
    const esfriou = (p) => p.situacao === 'aguardando' && !p.etapas.comprovante && Date.now() - p.atualizadoEm > 30 * 60 * 1000;

    function filtrar() {
        return pedidos.filter((p) => {
            if (filtro === 'abertos') return p.situacao === 'aguardando';
            if (filtro === 'comprovante') return p.situacao === 'aguardando' && p.etapas.comprovante;
            if (filtro === 'todos') return true;
            return p.situacao === filtro;
        });
    }

    function desenharResumo() {
        const hoje = new Date().toDateString();
        const deHoje = pedidos.filter((p) => !p.teste && new Date(p.criadoEm).toDateString() === hoje);
        const comprovantes = pedidos.filter((p) => p.situacao === 'aguardando' && p.etapas.comprovante).length;
        const recebidoMes = pedidos
            .filter((p) => !p.teste && (p.situacao === 'pago' || p.situacao === 'entregue') && new Date(p.criadoEm).getMonth() === new Date().getMonth())
            .reduce((t, p) => t + p.total, 0);
        const itens = [
            ['fa-shopping-bag', String(deHoje.length), deHoje.length === 1 ? 'pedido hoje' : 'pedidos hoje'],
            ['fa-qrcode', String(pedidos.filter((p) => p.situacao === 'aguardando' && !p.teste).length), 'aguardando pagamento'],
            ['fa-receipt', String(comprovantes), comprovantes === 1 ? 'comprovante para conferir' : 'comprovantes para conferir'],
            ['fa-wallet', moeda(recebidoMes), 'pago neste mês']
        ];
        $('pd-resumo').replaceChildren(...itens.map(([icone, valor, rotulo]) => {
            const card = document.createElement('div');
            card.className = 'ad-kpi';
            card.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i>`;
            const v = document.createElement('strong');
            v.textContent = valor;
            const r = document.createElement('span');
            r.textContent = rotulo;
            card.append(v, r);
            return card;
        }));
    }

    function botao(icone, texto, classe, acao) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'av-botao ' + (classe || 'av-botao-secundario');
        b.innerHTML = `<i class="fas ${icone}" aria-hidden="true"></i> `;
        b.append(texto);
        b.addEventListener('click', acao);
        return b;
    }

    function cartao(p) {
        const card = document.createElement('article');
        card.className = 'pd-card pd-' + p.situacao + (esfriou(p) ? ' is-esfriou' : '');

        const topo = document.createElement('div');
        topo.className = 'pd-topo';
        const cod = document.createElement('strong');
        cod.className = 'pd-codigo';
        cod.textContent = p.codigo;
        const quando = document.createElement('span');
        quando.className = 'pd-quando';
        quando.textContent = dataHora(p.criadoEm);
        const [txt, cls] = SITUACOES[p.situacao];
        const chip = document.createElement('span');
        chip.className = 'ad-situacao ' + cls;
        chip.textContent = txt;
        topo.append(cod, quando, chip);
        if (p.teste) {
            const t = document.createElement('span');
            t.className = 'ad-tipo';
            t.textContent = 'Teste (seu aparelho)';
            topo.append(t);
        }
        if (esfriou(p)) {
            const e = document.createElement('span');
            e.className = 'ad-situacao is-neutro';
            e.textContent = 'Parado há ' + Math.round((Date.now() - p.atualizadoEm) / 60000) + ' min';
            topo.append(e);
        }

        const lista = document.createElement('ul');
        lista.className = 'pd-itens';
        p.itens.forEach((i) => {
            const li = document.createElement('li');
            li.textContent = `${i.qtd}x ${i.nome}`;
            const v = document.createElement('span');
            v.textContent = moeda(i.preco * i.qtd);
            li.appendChild(v);
            lista.appendChild(li);
        });

        const total = document.createElement('p');
        total.className = 'pd-total';
        total.innerHTML = '<span>Total</span>';
        const tv = document.createElement('strong');
        tv.textContent = moeda(p.total);
        total.appendChild(tv);

        const cliente = document.createElement('p');
        cliente.className = 'pd-cliente';
        const partes = [p.nome || 'Cliente sem nome', p.entrega === 'entrega' ? 'Quer entrega' : 'Vai retirar'];
        if (p.telefone) partes.push(p.telefone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3'));
        cliente.textContent = partes.join(' · ');
        if (p.obs) {
            const o = document.createElement('em');
            o.textContent = ' “' + p.obs + '”';
            cliente.appendChild(o);
        }

        const linha = document.createElement('ol');
        linha.className = 'pd-etapas';
        ETAPAS.forEach(([id, nome]) => {
            if (!p.etapas[id]) return;
            const li = document.createElement('li');
            li.className = 'pd-etapa-' + id;
            li.textContent = nome + ' · ' + hora(p.etapas[id]);
            linha.appendChild(li);
        });

        const acoes = document.createElement('div');
        acoes.className = 'pd-acoes';
        if (p.situacao === 'aguardando') acoes.append(botao('fa-check', 'Marcar como pago', 'av-botao pd-pago', () => mudar(p, 'pago')));
        if (p.situacao === 'pago') acoes.append(botao('fa-box', 'Marcar como entregue', 'av-botao', () => mudar(p, 'entregue')));
        if (p.situacao !== 'aguardando') acoes.append(botao('fa-undo', 'Voltar para aguardando', null, () => mudar(p, 'aguardando')));
        if (p.telefone) {
            const numero = p.telefone.length <= 11 ? '55' + p.telefone : p.telefone;
            const msg = p.situacao === 'aguardando'
                ? `Olá${p.nome ? ', ' + p.nome.split(' ')[0] : ''}! Aqui é da Bird Tech (PC Formatech). Vi seu pedido ${p.codigo} de ${moeda(p.total)}. Posso ajudar a finalizar?`
                : `Olá${p.nome ? ', ' + p.nome.split(' ')[0] : ''}! Aqui é da Bird Tech (PC Formatech), sobre o seu pedido ${p.codigo}.`;
            const a = document.createElement('a');
            a.className = 'av-botao av-botao-secundario';
            a.href = `https://api.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(msg)}`;
            a.target = '_blank';
            a.rel = 'noopener';
            a.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> Chamar cliente';
            acoes.append(a);
        }
        if (p.situacao !== 'cancelado') acoes.append(botao('fa-times', 'Cancelar', 'av-botao-secundario bl-remover', () => mudar(p, 'cancelado')));
        else acoes.append(botao('fa-trash-alt', 'Apagar', 'av-botao-secundario bl-remover', () => apagar(p)));

        card.append(topo, lista, total, cliente, linha, acoes);
        return card;
    }

    function desenhar() {
        desenharResumo();
        // Quem já mandou comprovante vem primeiro: é o que precisa ser conferido.
        const lista = filtrar().sort((x, y) => (Boolean(y.etapas.comprovante && y.situacao === 'aguardando') - Boolean(x.etapas.comprovante && x.situacao === 'aguardando')) || (y.criadoEm - x.criadoEm));
        const grade = $('pd-lista');
        if (!lista.length) {
            const vazio = document.createElement('div');
            vazio.className = 'dv-vazio';
            vazio.innerHTML = '<i class="fas fa-receipt" aria-hidden="true"></i>';
            const t = document.createElement('p');
            t.textContent = pedidos.length ? 'Nenhum pedido neste filtro.' : 'Nenhum pedido ainda. Quando alguém fechar uma compra na loja, ele aparece aqui.';
            vazio.appendChild(t);
            grade.replaceChildren(vazio);
            return;
        }
        grade.replaceChildren(...lista.map(cartao));
    }

    async function listar(silencioso) {
        if (!silencioso) status('Carregando…');
        try {
            const json = await chamar('listar');
            pedidos = json.pedidos || [];
            carregado = true;
            if (!silencioso) status('');
            desenhar();
        } catch (erro) {
            if (!silencioso) status(erro.message, true);
        }
    }

    async function mudar(p, situacao) {
        if (situacao === 'cancelado' && !window.confirm(`Cancelar o pedido ${p.codigo}?`)) return;
        try {
            await chamar('situacao', { codigo: p.codigo, situacao });
            p.situacao = situacao;
            desenhar();
            status(`Pedido ${p.codigo}: ${SITUACOES[situacao][0].toLowerCase()}.`);
        } catch (erro) {
            status(erro.message, true);
        }
    }

    async function apagar(p) {
        if (!window.confirm(`Apagar o pedido ${p.codigo}? Isso não pode ser desfeito.`)) return;
        try {
            await chamar('remover', { codigo: p.codigo });
            pedidos = pedidos.filter((x) => x !== p);
            desenhar();
            status('Pedido apagado.');
        } catch (erro) {
            status(erro.message, true);
        }
    }

    function iniciar() {
        if (!$('tab-pedidos')) return;
        $('pd-atualizar').addEventListener('click', () => listar());
        document.querySelectorAll('[data-pd-filtro]').forEach((b) => b.addEventListener('click', () => {
            filtro = b.dataset.pdFiltro;
            document.querySelectorAll('[data-pd-filtro]').forEach((x) => {
                x.classList.toggle('is-ativo', x === b);
                x.setAttribute('aria-pressed', String(x === b));
            });
            desenhar();
        }));
    }

    // Abre a aba: carrega e passa a atualizar sozinho a cada minuto enquanto ela estiver aberta.
    const trocarAbaOriginal = window.switchTab;
    if (typeof trocarAbaOriginal === 'function') {
        window.switchTab = function (aba) {
            const resultado = trocarAbaOriginal.apply(this, arguments);
            clearInterval(atualizador);
            if (aba === 'pedidos') {
                listar(carregado);
                atualizador = setInterval(() => { if (!document.hidden) listar(true); }, 60000);
            }
            return resultado;
        };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();

    window.PCFTPedidos = { listar };
})();
