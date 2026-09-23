/* ═══════════════════════════════════════════════════════════════════════════
   PC FORMATECH — Busca da página de entrada

   A pessoa escreve o problema do jeito dela ("meu pc ta lento", "pegou virus",
   "quero por o word") e a página destaca o serviço que resolve. Não há servidor
   de busca: cada serviço tem uma lista de palavras e expressões que um leigo
   usaria, e a pontuação é feita aqui, no navegador.

   Para ensinar a busca a entender uma palavra nova, acrescente-a em TERMOS no
   serviço certo. Acento e maiúsculas não importam.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // Expressões (mais de uma palavra) valem mais que palavras soltas: "nao liga"
    // diz muito mais do que "liga".
    const TERMOS = {
        formatacao: [
            'formatar', 'formatacao', 'formatado', 'formata', 'formatei', 'windows', 'reinstalar', 'reinstalacao',
            'zerar', 'resetar', 'restaurar', 'sistema', 'do zero', 'como novo', 'deixar novo', 'windows 10',
            'windows 11', 'tela azul', 'nao inicia', 'nao entra no windows', 'reiniciando sozinho', 'reinicia sozinho',
            'sistema corrompido', 'windows corrompido', 'atualizar windows', 'trocar windows', 'instalar windows'
        ],
        manutencao: [
            'lento', 'lenta', 'lentidao', 'devagar', 'travando', 'trava', 'travado', 'travada', 'congelando',
            'demora', 'demorando', 'demorado', 'pesado', 'pesada', 'otimizar', 'otimizacao', 'acelerar',
            'rapido', 'desempenho', 'performance', 'limpeza', 'limpar', 'poeira', 'esquentando', 'esquenta',
            'quente', 'superaquecendo', 'barulho', 'barulhento', 'ventoinha', 'cooler', 'manutencao',
            'preventiva', 'nao responde', 'nao ta respondendo', 'demora para ligar', 'demora pra ligar',
            'demora para abrir', 'arquivos temporarios', 'memoria cheia', 'disco cheio', 'hd cheio'
        ],
        seguranca: [
            'virus', 'antivirus', 'malware', 'trojan', 'spyware', 'ransomware', 'hacker', 'hackeado', 'hackearam',
            'invadido', 'invasao', 'propaganda', 'propagandas', 'anuncio', 'anuncios', 'popup', 'pop up',
            'abrindo sozinho', 'abre sozinho', 'janela sozinha', 'janelas sozinhas', 'spam', 'seguranca',
            'protecao', 'proteger', 'protegido', 'golpe', 'senha roubada', 'roubaram minha senha',
            'pagina estranha', 'navegador estranho', 'sites estranhos', 'firewall', 'infectado', 'praga'
        ],
        programas: [
            'programa', 'programas', 'instalar', 'instalacao', 'office', 'pacote office', 'word', 'excel',
            'powerpoint', 'power point', 'outlook', 'aplicativo', 'aplicativos', 'app', 'software', 'softwares',
            'pdf', 'leitor de pdf', 'adobe', 'photoshop', 'corel', 'autocad', 'navegador', 'chrome',
            'google chrome', 'firefox', 'zoom', 'jogo', 'jogos', 'winrar', 'editor', 'edicao de video',
            'baixar', 'por o word', 'colocar programa'
        ],
        drivers: [
            'driver', 'drivers', 'som', 'sem som', 'audio', 'caixa de som', 'fone', 'microfone', 'wifi', 'wi fi',
            'sem internet', 'internet', 'rede', 'bluetooth', 'impressora', 'imprimir', 'nao imprime',
            'placa de video', 'video', 'resolucao', 'tela grande', 'tela esticada', 'webcam', 'camera',
            'touchpad', 'mouse', 'teclado', 'usb', 'nao reconhece', 'pendrive', 'dispositivo', 'parou de funcionar'
        ],
        backup: [
            'backup', 'copia', 'copia de seguranca', 'salvar', 'guardar', 'fotos', 'foto', 'arquivos', 'arquivo',
            'documentos', 'videos', 'musicas', 'recuperar', 'perdi', 'apaguei', 'perder', 'transferir',
            'passar arquivos', 'passar fotos', 'computador novo', 'pc novo', 'notebook novo', 'nuvem',
            'google drive', 'hd externo'
        ],
        remoto: [
            'remoto', 'remota', 'distancia', 'a distancia', 'online', 'anydesk', 'acesso remoto',
            'sem sair de casa', 'de casa', 'outra cidade', 'longe', 'pela internet', 'desconto'
        ],
        ajuda: [
            'nao sei', 'nao liga', 'nao ligou', 'desliga sozinho', 'desligando sozinho', 'desligou', 'apagou',
            'queimou', 'quebrou', 'quebrado', 'defeito', 'estragou', 'estragado', 'conserto', 'consertar',
            'arrumar', 'tela preta', 'bipando', 'apitando', 'orcamento', 'quanto custa', 'preco', 'duvida',
            'ajuda', 'problema', 'caiu agua', 'molhou', 'tela quebrada', 'carregador', 'bateria'
        ]
    };

    // Palavras que não dizem nada sobre o problema.
    const VAZIAS = new Set([
        'meu', 'minha', 'meus', 'minhas', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'e', 'em',
        'no', 'na', 'nos', 'nas', 'um', 'uma', 'com', 'que', 'para', 'pra', 'pro', 'por', 'esta', 'ta',
        'ficou', 'fica', 'muito', 'mto', 'quero', 'queria', 'preciso', 'precisa', 'gostaria', 'pc',
        'computador', 'notebook', 'note', 'maquina', 'ele', 'ela', 'isso', 'esse', 'essa', 'tem', 'to',
        'estou', 'eu', 'me', 'ao', 'mais', 'bem', 'ja', 'agora', 'sempre', 'as', 'vezes', 'fazer', 'nao'
    ]);

    // Mensagem que abre no WhatsApp, por serviço, quando a pessoa já escreveu algo.
    const ASSUNTO = {
        formatacao: 'formatação do computador',
        manutencao: 'computador lento / manutenção',
        seguranca: 'vírus e segurança',
        programas: 'instalação de programas',
        drivers: 'drivers (som, Wi-Fi, vídeo)',
        backup: 'backup de arquivos',
        remoto: 'atendimento remoto',
        ajuda: 'um problema no computador'
    };

    function normalizar(texto) {
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function distancia(a, b) {
        if (Math.abs(a.length - b.length) > 1) return 2;
        const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let anterior = linha[0];
            linha[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const guardado = linha[j];
                linha[j] = Math.min(
                    linha[j] + 1,
                    linha[j - 1] + 1,
                    anterior + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
                anterior = guardado;
            }
        }
        return linha[b.length];
    }

    /** Quanto uma palavra digitada se parece com uma palavra da lista. */
    function parecenca(digitada, termo) {
        if (digitada === termo) return 3;
        const menor = Math.min(digitada.length, termo.length);
        if (menor >= 4 && (termo.startsWith(digitada) || digitada.startsWith(termo))) return 2;
        if (menor >= 5 && distancia(digitada, termo) <= 1) return 2;
        return 0;
    }

    const INDICE = Object.keys(TERMOS).map((id) => {
        const termos = TERMOS[id].map(normalizar);
        return {
            id,
            expressoes: termos.filter((t) => t.includes(' ')),
            palavras: termos.filter((t) => !t.includes(' '))
        };
    });

    function pontuar(consulta) {
        const texto = normalizar(consulta);
        const comEspacos = ' ' + texto + ' ';
        const palavras = texto.split(' ').filter((p) => p && !VAZIAS.has(p));

        return INDICE.map((servico) => {
            let pontos = 0;

            servico.expressoes.forEach((exp) => {
                if (comEspacos.includes(' ' + exp + ' ')) pontos += 3 * exp.split(' ').length;
            });

            palavras.forEach((palavra) => {
                let melhor = 0;
                servico.palavras.forEach((termo) => {
                    const p = parecenca(palavra, termo);
                    if (p > melhor) melhor = p;
                });
                pontos += melhor;
            });

            return { id: servico.id, pontos };
        }).sort((a, b) => b.pontos - a.pontos);
    }


    // ── Página ────────────────────────────────────────────────────────────────

    const form = document.getElementById('busca');
    const campo = document.getElementById('pt-q');
    const grade = document.getElementById('pt-grid');
    const titulo = document.getElementById('pt-opcoes-titulo');
    const status = document.getElementById('pt-status');
    const vazio = document.getElementById('pt-empty');
    const linkVazio = document.getElementById('pt-empty-wa');
    const limpar = document.getElementById('pt-clear');
    if (!form || !campo || !grade) return;

    const cards = Array.from(grade.querySelectorAll('.pt-card'));
    const ordemOriginal = cards.slice();
    const hrefOriginal = new Map();
    cards.forEach((card) => {
        const wa = card.querySelector('[data-wa]');
        if (wa) hrefOriginal.set(card, wa.getAttribute('href'));
    });

    const cfg = window.PCFT_CONFIG;

    function linkWhatsApp(mensagem) {
        if (cfg && cfg.linkWhatsApp) return cfg.linkWhatsApp(mensagem);
        return 'https://api.whatsapp.com/send?phone=5594984305772&text=' + encodeURIComponent(mensagem);
    }

    // Preços saem da mesma configuração que o site principal usa.
    if (cfg && cfg.servicoPorId) {
        document.querySelectorAll('[data-preco]').forEach((el) => {
            const servico = cfg.servicoPorId(el.dataset.preco);
            if (servico && servico.preco) el.textContent = cfg.formatarPreco(servico.preco);
        });
    }

    function restaurar() {
        grade.classList.remove('is-searching');
        ordemOriginal.forEach((card) => {
            card.hidden = false;
            card.classList.remove('is-best');
            grade.appendChild(card);
            const wa = card.querySelector('[data-wa]');
            if (wa && hrefOriginal.has(card)) wa.setAttribute('href', hrefOriginal.get(card));
        });
        vazio.hidden = true;
        limpar.hidden = true;
        titulo.textContent = 'Principais serviços';
        status.textContent = '';
    }

    function buscar(consulta, anunciar) {
        const texto = String(consulta || '').trim();
        if (normalizar(texto).length < 2) {
            restaurar();
            return;
        }

        const resultado = pontuar(texto);
        const encontrados = resultado.filter((r) => r.pontos > 0);
        const porId = new Map(cards.map((c) => [c.dataset.id, c]));

        grade.classList.add('is-searching');
        limpar.hidden = false;
        cards.forEach((c) => c.classList.remove('is-best'));

        if (!encontrados.length) {
            // Nada casou: a resposta é conversar. Os cards continuam à vista como
            // sugestão, na ordem de sempre.
            grade.classList.remove('is-searching');
            ordemOriginal.forEach((card) => { card.hidden = false; grade.appendChild(card); });
            vazio.hidden = false;
            linkVazio.href = linkWhatsApp('Olá! Meu computador: ' + texto);
            titulo.textContent = 'Talvez seja um destes';
            status.textContent = 'Nenhum serviço com “' + texto + '”. Veja as opções abaixo ou fale com a gente.';
            return;
        }

        vazio.hidden = true;
        const melhor = encontrados[0];
        // Só entram os que chegam perto do melhor; os outros viram ruído.
        const corte = Math.max(1, melhor.pontos * 0.5);
        const exibidos = encontrados.filter((r) => r.pontos >= corte).slice(0, 4);
        const idsExibidos = new Set(exibidos.map((r) => r.id));

        exibidos.forEach((r) => grade.appendChild(porId.get(r.id)));
        cards.forEach((card) => {
            card.hidden = !idsExibidos.has(card.dataset.id);
            const wa = card.querySelector('[data-wa]');
            if (wa) {
                wa.setAttribute('href', linkWhatsApp(
                    'Olá! Vim pelo site sobre ' + ASSUNTO[card.dataset.id] + '. Meu problema: ' + texto
                ));
            }
        });

        const cardMelhor = porId.get(melhor.id);
        cardMelhor.classList.add('is-best');

        titulo.textContent = exibidos.length > 1 ? 'Serviços para o seu problema' : 'Serviço para o seu problema';
        const nomeMelhor = cardMelhor.querySelector('h3').textContent;
        status.textContent = anunciar
            ? 'Melhor opção: ' + nomeMelhor + (exibidos.length > 1 ? ' — e mais ' + (exibidos.length - 1) + ' relacionada(s).' : '.')
            : '';
    }

    let espera = null;
    campo.addEventListener('input', () => {
        clearTimeout(espera);
        espera = setTimeout(() => {
            buscar(campo.value, true);
            sincronizarUrl(campo.value);
        }, 140);
    });

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();
        clearTimeout(espera);
        buscar(campo.value, true);
        sincronizarUrl(campo.value);
        irParaResultados();
    });

    document.querySelectorAll('.pt-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            campo.value = chip.dataset.q;
            buscar(campo.value, true);
            sincronizarUrl(campo.value);
            irParaResultados();
        });
    });

    limpar.addEventListener('click', () => {
        campo.value = '';
        restaurar();
        sincronizarUrl('');
        campo.focus();
    });

    // No celular, depois de buscar, a resposta fica abaixo da dobra; o teclado
    // também some quando o campo perde o foco.
    function irParaResultados() {
        if (window.matchMedia('(max-width: 720px)').matches) {
            campo.blur();
            document.getElementById('opcoes').scrollIntoView({ block: 'start' });
        }
    }

    // A busca fica no endereço (?q=...) para o link poder ser compartilhado.
    function sincronizarUrl(valor) {
        try {
            const url = new URL(location.href);
            if (valor && valor.trim()) url.searchParams.set('q', valor.trim());
            else url.searchParams.delete('q');
            history.replaceState(null, '', url.pathname + url.search + url.hash);
        } catch (e) { /* navegador antigo: segue sem sincronizar */ }
    }

    // Exemplos que se alternam no campo vazio, para mostrar que pode escrever
    // do jeito que falaria.
    const exemplos = [
        'Ex.: meu computador está lento',
        'Ex.: quero formatar o notebook',
        'Ex.: apareceu vírus e propaganda',
        'Ex.: instalar o Word e o Excel',
        'Ex.: o som parou de funcionar',
        'Ex.: salvar as fotos antes de formatar'
    ];
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!semMovimento) {
        let i = 0;
        setInterval(() => {
            if (campo.value || document.activeElement === campo) return;
            i = (i + 1) % exemplos.length;
            campo.setAttribute('placeholder', exemplos[i]);
        }, 2800);
    }

    const inicial = new URLSearchParams(location.search).get('q');
    if (inicial) {
        campo.value = inicial;
        buscar(inicial, true);
    }

    // Exposto para conferência no console e testes.
    window.PCFT_PORTAL = { pontuar, normalizar };
})();
