// Gera as páginas de serviço (servicos/<slug>/index.html), a página
// servicos/index.html, a página de apps e sistemas (apps.html), os artigos de
// /dicas/ (texto em ferramentas/dicas.js) e o sitemap.xml.
//
// Cada serviço tem uma página própria para o Google mostrar quando alguém
// busca exatamente aquilo ("formatação de computador em Canaã dos Carajás").
// Para mudar um texto ou preço: edite SERVICOS abaixo e rode
//     node ferramentas/gerar-seo.js
// Os preços seguem os cartões de serviço de site.html.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DICAS = require('./dicas');
const SITE = 'https://www.pcformatech.com.br';
const WHATSAPP = '5594984305772';
const CIDADE = 'Canaã dos Carajás';

const EMPRESA = {
    '@type': 'LocalBusiness',
    '@id': SITE + '/#empresa',
    name: 'PC Formatech',
    description: 'Assistência técnica de computadores e notebooks (só programas, sem conserto de peças): formatação, manutenção, limpeza e otimização, remoção de vírus, backup e suporte remoto.',
    url: SITE + '/site.html',
    image: SITE + '/images/og/pc-formatech.jpg',
    logo: SITE + '/icon-512.png',
    telephone: '+55 94 98430-5772',
    priceRange: 'R$ 40 a R$ 80',
    address: { '@type': 'PostalAddress', addressLocality: CIDADE, addressRegion: 'PA', addressCountry: 'BR' },
    areaServed: [
        { '@type': 'City', name: CIDADE },
        { '@type': 'Country', name: 'Brasil' }
    ],
    sameAs: ['https://instagram.com/pcformatech']
};

const SERVICOS = [
    {
        slug: 'formatacao-de-computador',
        nome: 'Formatação de computador',
        titulo: `Formatação de Computador e Notebook em ${CIDADE}`,
        descricao: `Formatação completa de computador e notebook em ${CIDADE}: Windows, programas essenciais e backup opcional, com garantia de 30 dias. A partir de R$ 80.`,
        icone: 'fa-laptop',
        preco: 80,
        chamada: 'Windows limpo, programas essenciais instalados e seus arquivos guardados. Seu computador volta a funcionar como novo.',
        inclui: ['Formatação com Windows original', 'Navegadores e players de mídia', 'Programas essenciais instalados', 'Garantia de 30 dias', 'Suporte pós-formatação por 30 dias', 'Backup dos arquivos (opcional, sob consulta)'],
        quando: ['O computador demora para ligar e travar virou rotina', 'Apareceram vírus, propagandas ou programas que você não instalou', 'O Windows mostra erros ou não atualiza mais', 'Você vai vender, doar ou passar o computador para outra pessoa'],
        faq: [
            ['Quanto tempo leva para formatar o computador?', 'Normalmente de 2 a 4 horas, conforme os programas que você precisa instalar.'],
            ['Vou perder meus arquivos?', 'Não, se você pedir o backup. Ele é opcional: basta avisar que quer guardar fotos, documentos e outros arquivos antes da formatação.'],
            ['A formatação tem garantia?', 'Sim. São 30 dias de garantia e de suporte depois da formatação.'],
            ['Dá para formatar à distância?', 'Em muitos casos, sim, pelo atendimento remoto, que tem desconto. Fale pelo WhatsApp para saber se o seu caso permite.']
        ]
    },
    {
        // Página para quem busca "manutenção de computador": reúne o que a
        // manutenção de programas inclui e deixa claro que não é de peças.
        slug: 'manutencao-de-computador',
        nome: 'Manutenção de computador',
        titulo: `Manutenção de Computador e Notebook em ${CIDADE}`,
        descricao: `Manutenção de computador e notebook em ${CIDADE}: limpeza do sistema, otimização, Windows e drivers atualizados e verificação de vírus. A partir de R$ 70.`,
        icone: 'fa-tools',
        preco: 70,
        chamada: 'Manutenção de programas para o computador voltar a ficar rápido, seguro e atualizado, sem apagar seus arquivos. Trabalhamos só com a parte de software: sem abrir a máquina e sem trocar peças.',
        inclui: ['Limpeza do sistema e de arquivos temporários', 'Otimização da inicialização e do Windows', 'Windows e drivers atualizados', 'Verificação de vírus e da proteção', 'Diagnóstico do sistema e do disco', 'Relatório do que foi feito'],
        quando: ['Faz mais de um ano que o computador não passa por manutenção', 'Ficou lento, trava ou demora para ligar', 'O Windows mostra erros ou não termina as atualizações', 'Você vai usar o computador para trabalho ou estudo e precisa dele confiável'],
        faq: [
            ['O que é manutenção de computador?', 'É o cuidado com a parte de programas: limpeza, otimização, atualizações e verificação de vírus e de erros do sistema. Deixa o computador mais rápido e evita problemas maiores, como perder arquivos.'],
            ['Vocês fazem manutenção de peças (hardware)?', 'Não. A PC Formatech trabalha só com programas (software). Conserto de peças, tela, placa ou limpeza interna não é com a gente; se o problema for de peça, você é avisado já no diagnóstico.'],
            ['De quanto em quanto tempo fazer manutenção?', 'Uma vez por ano é um bom ritmo para a maioria dos computadores. Se o computador é usado o dia inteiro, para trabalho, vale a cada 6 meses.'],
            ['A manutenção apaga meus arquivos?', 'Não. Seus programas e arquivos continuam no computador. Se o caso pedir formatação, você é avisado antes e decide.'],
            ['Dá para fazer à distância?', 'Sim. A maior parte da manutenção pode ser feita pelo atendimento remoto, que tem 10% de desconto.']
        ]
    },
    {
        slug: 'limpeza-e-otimizacao',
        nome: 'Limpeza e otimização',
        titulo: `Computador Lento? Limpeza e Otimização em ${CIDADE}`,
        descricao: `Computador ou notebook lento em ${CIDADE}? Limpeza do sistema, otimização do Windows, drivers atualizados e relatório de desempenho. A partir de R$ 70.`,
        icone: 'fa-tachometer-alt',
        preco: 70,
        chamada: 'Programas escondidos, arquivos acumulados e inicialização pesada roubam desempenho todo dia. A manutenção encontra e corrige.',
        inclui: ['Limpeza do sistema', 'Otimização do Windows', 'Atualização de drivers', 'Diagnóstico do sistema e do disco', 'Remoção de arquivos temporários', 'Relatório de desempenho'],
        quando: ['O computador ficou lento com o tempo', 'Os programas demoram para abrir', 'O ventilador faz barulho ou o notebook esquenta', 'Faz mais de um ano que ninguém cuida da máquina'],
        faq: [
            ['Limpeza resolve computador lento sem formatar?', 'Muitas vezes, sim. A otimização tira o que pesa na inicialização e no uso do dia a dia sem apagar seus programas e arquivos.'],
            ['De quanto em quanto tempo devo fazer manutenção?', 'Uma vez por ano é um bom ritmo para a maioria dos computadores de casa e de trabalho.'],
            ['Meus arquivos continuam no computador?', 'Sim. A manutenção não apaga seus arquivos nem seus programas.']
        ]
    },
    {
        slug: 'remocao-de-virus',
        nome: 'Remoção de vírus e proteção',
        titulo: `Remoção de Vírus e Proteção do Computador em ${CIDADE}`,
        descricao: `Remoção de vírus e malware, antivírus, firewall e proteção contra ransomware em ${CIDADE}. Seu computador seguro de novo. A partir de R$ 60.`,
        icone: 'fa-shield-alt',
        preco: 60,
        chamada: 'Propagandas que surgem sozinhas, navegador estranho e programas desconhecidos são sinais de vírus. A gente remove e deixa o computador protegido.',
        inclui: ['Remoção de vírus e malware', 'Instalação de antivírus', 'Configuração de firewall', 'Proteção contra ransomware', 'Backup em nuvem', 'Monitoramento de segurança'],
        quando: ['Aparecem propagandas e janelas sozinhas', 'A página inicial do navegador mudou sem você mexer', 'Arquivos sumiram ou ficaram com nomes estranhos', 'O antivírus está desatualizado ou desligado'],
        faq: [
            ['Precisa formatar para tirar vírus?', 'Nem sempre. Na maioria dos casos dá para remover o vírus sem formatar. Quando não dá, você é avisado antes.'],
            ['Antivírus gratuito protege?', 'Protege o básico. O mais importante é estar atualizado e bem configurado, junto com o firewall do Windows.'],
            ['Meus dados ficam seguros durante o atendimento?', 'Sim. Seus arquivos não são abertos nem copiados sem a sua autorização.']
        ]
    },
    {
        slug: 'suporte-remoto',
        nome: 'Suporte técnico remoto',
        titulo: 'Suporte Técnico Remoto para Computador, com 10% de Desconto',
        descricao: 'Suporte técnico remoto pelo AnyDesk para todo o Brasil: instalação de programas, diagnóstico, otimização e correção de problemas, com 10% de desconto.',
        icone: 'fa-globe',
        preco: null,
        precoTexto: '10% de desconto',
        chamada: 'Resolva sem sair de casa. Pelo AnyDesk, o técnico acessa o seu computador com a sua permissão e você acompanha tudo pela tela.',
        inclui: ['Atendimento sem sair de casa', 'Suporte técnico em tempo real', 'Instalação de programas', 'Diagnóstico e otimização do sistema', 'Conexão segura e criptografada', '10% de desconto em todos os serviços'],
        quando: ['Você precisa instalar ou configurar um programa', 'O computador está lento ou dando erro', 'Você mora fora de Canaã dos Carajás', 'Você não tem tempo de levar o computador'],
        passos: ['Baixe o AnyDesk no site oficial (anydesk.com)', 'Instale o programa; não precisa reiniciar', 'Chame no WhatsApp e passe o código que aparece no AnyDesk', 'Acompanhe o atendimento pela tela, com 10% de desconto'],
        faq: [
            ['O atendimento remoto é seguro?', 'Sim. A conexão do AnyDesk é criptografada, só começa quando você aceita e você pode encerrar a qualquer momento.'],
            ['Atende fora de Canaã dos Carajás?', 'Sim. O suporte remoto atende qualquer cidade do Brasil, só precisa de internet.'],
            ['O desconto vale para quais serviços?', 'Para todos os serviços feitos à distância: 10% de desconto.']
        ]
    },
    {
        slug: 'backup-de-dados',
        nome: 'Backup de dados',
        titulo: `Backup de Dados e Recuperação de Arquivos em ${CIDADE}`,
        descricao: `Backup completo de fotos, documentos e arquivos em ${CIDADE}, com verificação de integridade e organização dos dados. A partir de R$ 45.`,
        icone: 'fa-database',
        preco: 45,
        chamada: 'Fotos, documentos e trabalhos guardados com segurança antes de uma formatação, uma troca de computador ou simplesmente por precaução.',
        inclui: ['Backup completo dos arquivos', 'Verificação de integridade', 'Organização dos dados', 'Armazenamento seguro', 'Backup em mais de um dispositivo', 'Relatório do que foi guardado'],
        quando: ['Antes de formatar o computador', 'Antes de trocar de computador ou de HD', 'O computador está dando sinais de defeito', 'Você nunca fez uma cópia das suas fotos e documentos'],
        faq: [
            ['Para onde vão os arquivos do backup?', 'Para um HD externo, pendrive ou nuvem, como você preferir. Dá para guardar em mais de um lugar.'],
            ['Meus arquivos ficam com a PC Formatech?', 'Não. A cópia é entregue a você e nada fica guardado sem a sua autorização.'],
            ['Quanto tempo leva?', 'Depende da quantidade de arquivos. Na maioria dos casos, algumas horas.']
        ]
    },
    {
        slug: 'instalacao-de-programas-e-drivers',
        nome: 'Instalação de programas e drivers',
        titulo: `Instalação de Programas, Office e Drivers em ${CIDADE}`,
        descricao: `Instalação de programas, pacote Office, softwares de edição e drivers oficiais em ${CIDADE}, também por acesso remoto. A partir de R$ 40.`,
        icone: 'fa-download',
        preco: 40,
        chamada: 'Programas instalados e configurados do jeito certo, e drivers oficiais para impressora, placa de vídeo, som e rede funcionarem sem dor de cabeça.',
        inclui: ['Pacote Office atualizado', 'Programas de produtividade e de edição', 'Drivers oficiais e atualizados', 'Identificação do hardware', 'Correção de problemas de driver', 'Teste de funcionamento'],
        quando: ['A impressora, o som ou a internet pararam de funcionar', 'Você precisa do Office ou de um programa específico', 'O computador acabou de ser formatado', 'A tela ou os jogos estão com desempenho ruim'],
        faq: [
            ['Quanto custa instalar programas?', 'A partir de R$ 50 para programas e de R$ 40 para drivers. O valor final depende do que precisa ser instalado.'],
            ['Dá para instalar à distância?', 'Sim, pelo suporte remoto, que tem 10% de desconto.'],
            ['Os drivers são oficiais?', 'Sim. São instalados a partir dos fabricantes, sem programas que vêm com propaganda.']
        ]
    }
];

// Perguntas rápidas de cada serviço (pedido-rapido.js): a pessoa responde 3
// perguntas e a mensagem chega no WhatsApp com tudo o que precisa para dar o
// valor. As duas primeiras são iguais para todos; a terceira é de cada um.
const PERGUNTA_APARELHO = { nome: 'aparelho', rotulo: 'Aparelho', pergunta: 'É notebook ou computador de mesa?', opcoes: [{ texto: 'Notebook' }, { texto: 'Computador de mesa' }, { texto: 'Mais de um aparelho' }] };
const PERGUNTA_ONDE = {
    nome: 'onde', rotulo: 'Atendimento', pergunta: 'Como prefere ser atendido?',
    opcoes: [{ texto: `Presencial em ${CIDADE}` }, { texto: 'À distância (10% de desconto)', nota: 'À distância, 10% de desconto.' }, { texto: 'Tanto faz' }]
};
const PERGUNTAS_SERVICO = {
    'formatacao-de-computador': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'arquivos', rotulo: 'Arquivos', pergunta: 'Precisa guardar seus arquivos antes?',
        opcoes: [{ texto: 'Sim, quero o backup', nota: 'O backup é combinado junto.' }, { texto: 'Não precisa' }, { texto: 'Não sei' }]
    }],
    'manutencao-de-computador': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'problema', rotulo: 'O que incomoda', pergunta: 'O que mais incomoda hoje?',
        opcoes: [{ texto: 'Está lento' }, { texto: 'Trava ou dá erro' }, { texto: 'Faz tempo que não cuido' }, { texto: 'Outra coisa' }]
    }],
    'limpeza-e-otimizacao': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'desde', rotulo: 'Lento desde', pergunta: 'Há quanto tempo está lento?',
        opcoes: [{ texto: 'Começou agora' }, { texto: 'Algumas semanas' }, { texto: 'Meses ou mais' }]
    }],
    'remocao-de-virus': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'sinal', rotulo: 'O que acontece', pergunta: 'O que está acontecendo?',
        opcoes: [{ texto: 'Propagandas e janelas sozinhas' }, { texto: 'Navegador estranho' }, { texto: 'Arquivos sumindo ou travados' }, { texto: 'Outra coisa' }]
    }],
    'backup-de-dados': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'quanto', rotulo: 'Para guardar', pergunta: 'Quanto tem para guardar, mais ou menos?',
        opcoes: [{ texto: 'Documentos e fotos' }, { texto: 'Muita coisa (vídeos, trabalhos)' }, { texto: 'Não sei' }]
    }],
    'instalacao-de-programas-e-drivers': [PERGUNTA_APARELHO, PERGUNTA_ONDE, {
        nome: 'instalar', rotulo: 'Instalar', pergunta: 'O que precisa instalar?', tipo: 'checkbox', dica: 'Pode marcar mais de um.',
        opcoes: [{ texto: 'Office' }, { texto: 'Programas do trabalho' }, { texto: 'Driver (impressora, som, Wi-Fi)' }, { texto: 'Outra coisa' }]
    }],
    'suporte-remoto': [PERGUNTA_APARELHO, {
        nome: 'anydesk', rotulo: 'AnyDesk', pergunta: 'Já tem o AnyDesk instalado?',
        opcoes: [{ texto: 'Sim, já tenho' }, { texto: 'Ainda não' }, { texto: 'Não sei o que é', extra: 'Preciso de ajuda para instalar o AnyDesk.' }]
    }, {
        nome: 'resolver', rotulo: 'Resolver', pergunta: 'O que precisa resolver?',
        opcoes: [{ texto: 'Instalar ou configurar programa' }, { texto: 'Lento ou com erro' }, { texto: 'Vírus' }, { texto: 'Outra coisa' }]
    }]
};

// ── Utilidades ────────────────────────────────────────────────────────────

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const zap = (msg) => `https://api.whatsapp.com/send?phone=${WHATSAPP}&amp;text=${encodeURIComponent(msg)}`;
const reais = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const precoDe = (s) => (s.preco ? `A partir de ${reais(s.preco)}` : s.precoTexto);

/** Prévia para WhatsApp/redes: images/og/<nome>.jpg se existir, senão a geral. */
function imagemPrevia(nome) {
    return nome && fs.existsSync(path.join(RAIZ, 'images/og', nome + '.jpg')) ? `${SITE}/images/og/${nome}.jpg` : SITE + '/images/og/pc-formatech.jpg';
}

function cabeca({ titulo, descricao, url, extras, previa, tipo }) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <script>try{if(localStorage.getItem('pcft-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${esc(titulo)} | PC Formatech</title>
    <meta name="description" content="${esc(descricao)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${tipo || 'website'}">
    <meta property="og:site_name" content="PC Formatech">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${imagemPrevia(previa)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${esc(titulo)} | PC Formatech">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#0b2b2c">
    <link rel="icon" type="image/svg+xml" href="/favicon-icon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/fontes.css">
    <link rel="stylesheet" href="/icones.css">
    <link rel="stylesheet" href="/servicos/servicos.css?v=4">
${extras}
</head>`;
}

const topo = `<header class="sv-topo">
        <a class="sv-marca" href="/site.html" aria-label="PC Formatech, página inicial"><img src="/icon-192.png" alt="" width="36" height="36"><span>PC Formatech</span></a>
        <nav class="sv-nav" aria-label="Principal">
            <a href="/servicos/">Serviços</a>
            <a href="/loja.html">Loja</a>
            <a href="/apps.html">Apps</a>
            <a class="sv-nav-zap" href="${zap('Olá! Vim pelo site e quero um orçamento.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>
        </nav>
    </header>`;

function rodape() {
    return `<footer class="sv-rodape">
        <div>
            <strong>PC Formatech</strong>
            <p>Assistência técnica de computadores e notebooks em ${CIDADE}, PA, e suporte remoto para todo o Brasil. Também loja de periféricos Bird Tech e criação de apps e sistemas.</p>
        </div>
        <nav aria-label="Serviços">
            ${SERVICOS.map((s) => `<a href="/servicos/${s.slug}/">${esc(s.nome)}</a>`).join('\n            ')}
        </nav>
        <p class="sv-rodape-contato"><a href="/dicas/">Dicas para o seu computador</a> · <a href="${zap('Olá! Vim pelo site.')}" target="_blank" rel="noopener">(94) 98430-5772</a> · <a href="https://instagram.com/pcformatech" target="_blank" rel="noopener">@pcformatech</a></p>
        <p class="sv-rodape-autor">Site feito por Rafael Araújo</p>
    </footer>`;
}

// ── Página de cada serviço ────────────────────────────────────────────────

function paginaServico(s) {
    const url = `${SITE}/servicos/${s.slug}/`;
    const outros = SERVICOS.filter((o) => o.slug !== s.slug);
    const msg = `Olá! Vim pelo site e quero ${s.nome.toLowerCase()}.`;
    const dados = [
        EMPRESA,
        {
            '@type': 'Service',
            '@id': url + '#servico',
            name: s.titulo,
            serviceType: s.nome,
            description: s.descricao,
            url,
            provider: { '@id': EMPRESA['@id'] },
            areaServed: s.slug === 'suporte-remoto' ? { '@type': 'Country', name: 'Brasil' } : { '@type': 'City', name: CIDADE },
            ...(s.preco ? { offers: { '@type': 'Offer', price: s.preco.toFixed(2), priceCurrency: 'BRL', description: 'Preço a partir de' } } : {})
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/site.html' },
                { '@type': 'ListItem', position: 2, name: 'Serviços', item: SITE + '/servicos/' },
                { '@type': 'ListItem', position: 3, name: s.nome, item: url }
            ]
        },
        {
            '@type': 'FAQPage',
            mainEntity: s.faq.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } }))
        }
    ];
    const passos = s.passos || ['Chame no WhatsApp e conte o que está acontecendo', 'Receba o diagnóstico e o valor antes de qualquer serviço', 'Atendimento presencial em ' + CIDADE + ' ou remoto, do jeito que for melhor para você'];

    return `${cabeca({ titulo: s.titulo, descricao: s.descricao, url, previa: 'servico-' + s.slug, extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <a href="/servicos/">Serviços</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(s.nome)}</span></nav>
            <span class="sv-hero-icone" aria-hidden="true"><i class="fas ${s.icone}"></i></span>
            <h1>${esc(s.titulo)}</h1>
            <p class="sv-hero-texto">${esc(s.chamada)}</p>
            <p class="sv-preco">${esc(precoDe(s))}</p>
            <div class="sv-acoes">
                <a class="sv-cta" href="#pedido">Pedir orçamento (3 perguntas)</a>
                <a class="sv-cta-sec" href="${zap(msg)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Falar direto no WhatsApp</a>
            </div>
            <ul class="sv-selos">
                <li><i class="fas fa-check-circle" aria-hidden="true"></i> +500 PCs atendidos</li>
                <li><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${s.slug === 'suporte-remoto' ? 'Todo o Brasil' : CIDADE + ', PA'}</li>
                <li><i class="fas fa-bolt" aria-hidden="true"></i> Resposta rápida</li>
            </ul>
        </section>

        <div class="sv-conteudo">
            ${blocoPedido({
                titulo: 'Peça o orçamento em 3 perguntas',
                sub: 'No fim, a mensagem vai pronta para o WhatsApp e você recebe o valor sem precisar explicar tudo de novo.',
                intro: msg,
                preco: s.preco,
                precoTexto: s.preco ? '' : s.precoTexto + ' em todos os serviços à distância.',
                perguntas: PERGUNTAS_SERVICO[s.slug]
            })}

            <section class="sv-bloco">
                <h2>O que está incluso</h2>
                <ul class="sv-lista">
                    ${s.inclui.map((i) => `<li><i class="fas fa-check" aria-hidden="true"></i> ${esc(i)}</li>`).join('\n                    ')}
                </ul>
            </section>

            <section class="sv-bloco">
                <h2>Quando chamar</h2>
                <ul class="sv-lista sv-lista-sinais">
                    ${s.quando.map((i) => `<li><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> ${esc(i)}</li>`).join('\n                    ')}
                </ul>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Como funciona</h2>
                <ol class="sv-passos">
                    ${passos.map((p) => `<li>${esc(p)}</li>`).join('\n                    ')}
                </ol>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Perguntas frequentes</h2>
                ${s.faq.map(([q, r]) => `<details class="sv-faq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('\n                ')}
            </section>

            <section class="sv-bloco sv-bloco-largo sv-chamada">
                <h2>Pronto para resolver?</h2>
                <p>Responda as 3 perguntas e mande pelo WhatsApp. O diagnóstico é grátis e você sabe o valor antes de qualquer serviço.</p>
                <div class="sv-acoes sv-acoes-centro">
                    <a class="sv-cta" href="#pedido">Pedir orçamento (3 perguntas)</a>
                    <a class="sv-cta-sec" href="${zap(msg)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Falar direto</a>
                </div>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Outros serviços</h2>
                <div class="sv-outros">
                    ${outros.map((o) => `<a href="/servicos/${o.slug}/"><i class="fas ${o.icone}" aria-hidden="true"></i><span><strong>${esc(o.nome)}</strong><small>${esc(precoDe(o))}</small></span></a>`).join('\n                    ')}
                </div>
            </section>
        </div>
    </main>

    ${rodape()}
    <script src="/pedido-rapido.js?v=1" defer></script>
</body>
</html>
`;
}

// ── Página com todos os serviços ──────────────────────────────────────────

function paginaIndice() {
    const url = SITE + '/servicos/';
    const titulo = `Serviços de Informática em ${CIDADE}`;
    const descricao = `Formatação, manutenção, limpeza e otimização, remoção de vírus, backup, instalação de programas e suporte remoto em ${CIDADE}, PA. Diagnóstico grátis pelo WhatsApp.`;
    const dados = [
        EMPRESA,
        {
            '@type': 'ItemList',
            name: titulo,
            itemListElement: SERVICOS.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/servicos/${s.slug}/`, name: s.titulo }))
        }
    ];
    return `${cabeca({ titulo, descricao, url, previa: 'servicos', extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <span aria-current="page">Serviços</span></nav>
            <h1>${esc(titulo)}</h1>
            <p class="sv-hero-texto">Assistência técnica de computadores e notebooks, presencial em ${CIDADE} ou remota para todo o Brasil. Trabalhamos só com a parte de programas (software), sem conserto de peças. Escolha o serviço para ver o que está incluso e quanto custa.</p>
            <div class="sv-acoes">
                <a class="sv-cta" href="${zap('Olá! Vim pelo site e quero um orçamento.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Pedir orçamento no WhatsApp</a>
            </div>
        </section>

        <div class="sv-conteudo">
            <section class="sv-bloco sv-bloco-largo">
                <h2>Escolha o serviço</h2>
                <div class="sv-outros sv-outros-grande">
                    ${SERVICOS.map((s) => `<a href="/servicos/${s.slug}/"><i class="fas ${s.icone}" aria-hidden="true"></i><span><strong>${esc(s.nome)}</strong><small>${esc(precoDe(s))}</small><em>${esc(s.chamada)}</em></span></a>`).join('\n                    ')}
                </div>
            </section>
        </div>
    </main>

    ${rodape()}
</body>
</html>
`;
}

// ── Página de criação de apps e sistemas (apps.html) ──────────────────────
//
// PREÇOS: preencha os valores (em reais) e rode o script de novo. Enquanto um
// preço estiver null, a página mostra "R$ [PREÇO]" e o script avisa.
// Cada sistema tem a criação (preco) e a mensalidade, mais barata, que cobre
// hospedagem, cópia de segurança, suporte e pequenos ajustes. Mensalidade
// null = ainda não definida: a página não mostra valor (diz que vem junto
// com o orçamento).

const APPS = {
    prazo: '7 a 15 dias',
    // Suporte e manutenção: incluso nos sistemas que têm mensalidade.
    suporteMensal: 'incluso',
    // As 3 perguntas do "Monte seu pedido" (a 1ª são os próprios sistemas).
    perguntas: {
        pessoas: ['Só eu', '2 a 5 pessoas', '6 ou mais'],
        hoje: ['No caderno ou papel', 'Em planilha (Excel)', 'Pelo WhatsApp', 'Em outro sistema', 'Ainda não controlo']
    },
    sistemas: [
        {
            id: 'estoque',
            curto: 'Estoque e vendas',
            pedido: 'um sistema de controle de estoque e vendas',
            nome: 'Controle de estoque e vendas',
            texto: 'Saiba na hora o que tem na prateleira, o que vendeu e o que precisa repor.',
            itens: ['Entrada e saída de produtos', 'Aviso de estoque baixo', 'Vendas do dia e do mês'],
            icone: 'caixa',
            preco: 299.99,
            mensalidade: null
        },
        {
            id: 'agenda',
            curto: 'Agenda de clientes',
            pedido: 'um sistema de agendamento de clientes',
            nome: 'Agendamento de clientes',
            texto: 'Seus horários organizados, sem conflito e sem caderno perdido.',
            itens: ['Agenda por dia e por profissional', 'Lembrete para o cliente', 'Histórico de cada cliente'],
            icone: 'agenda',
            preco: 149.99,
            mensalidade: null
        },
        {
            id: 'orcamentos',
            curto: 'Orçamentos e serviços',
            pedido: 'um sistema de orçamentos e ordens de serviço',
            nome: 'Orçamentos e ordens de serviço',
            texto: 'Monte orçamentos em segundos e acompanhe cada serviço do início ao fim.',
            itens: ['Orçamento pronto para enviar', 'Situação de cada serviço', 'Tudo guardado por cliente'],
            icone: 'documento',
            preco: 199.99,
            mensalidade: null
        },
        {
            id: 'financeiro',
            curto: 'Financeiro e clientes',
            pedido: 'um sistema de controle financeiro e de clientes',
            nome: 'Controle financeiro e de clientes',
            texto: 'Entradas, saídas, quem pagou e quem está devendo, num lugar só.',
            itens: ['Contas a pagar e a receber', 'Cadastro de clientes', 'Resumo do mês'],
            icone: 'carteira',
            preco: 249.99,
            mensalidade: null
        },
        {
            id: 'painel',
            curto: 'Gráficos do negócio',
            pedido: 'um painel com gráficos automáticos do meu negócio',
            nome: 'Painel com gráficos automáticos',
            texto: 'Os números do seu negócio em gráficos que se atualizam sozinhos.',
            itens: ['Gráficos de vendas e despesas', 'Comparação entre meses', 'Abre no celular'],
            icone: 'grafico',
            preco: 149.99,
            mensalidade: null
        },
        {
            id: 'outro',
            curto: 'Outra coisa',
            nome: 'Outro sistema sob medida',
            texto: 'Tem uma ideia ou um processo diferente? A gente conversa e monta do seu jeito.',
            itens: ['Feito para o seu negócio', 'Você acompanha cada etapa', 'Ajustes até ficar certo'],
            icone: 'ideia',
            preco: 'fale',
            mensalidade: null
        }
    ]
};

const ICONES_APPS = {
    caixa: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    agenda: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18M8 14h3v3H8z"/>',
    documento: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    carteira: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h.01M3 10h18M7 6V4h10v2"/>',
    grafico: '<path d="M3 3v18h18"/><path d="M7 15v3M11 11v7M15 13v5M19 7v11"/>',
    ideia: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    zap: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    celular: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    ferramenta: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 0-5-5L13 5z"/><path d="m6 18-3 3"/>'
};

const ico = (nome, classe) => `<svg class="${classe || 'ap-ico'}" viewBox="0 0 24 24" aria-hidden="true">${ICONES_APPS[nome]}</svg>`;
const precoApp = (v) => (v === 'fale' ? 'Fale com a gente' : `A partir de ${typeof v === 'number' ? reais(v) : 'R$ [PREÇO]'}`);
/**
 * Perguntas rápidas antes do WhatsApp (pedido-rapido.js): até 3 perguntas,
 * uma por vez; no fim, resumo, valor e a mensagem pronta para o WhatsApp.
 * Sem JavaScript, aparecem todas e o botão do WhatsApp funciona assim mesmo.
 *   cfg.perguntas: [{ nome, rotulo, pergunta, tipo ('radio'|'checkbox'),
 *                     dica, resumo, opcoes: [{ texto, valor, icone, preco,
 *                     mensal, nota, extra }] }]
 *   nota  = frase que entra no valor (ex.: desconto à distância)
 *   extra = linha que entra no fim da mensagem (ex.: "Posso mandar a planilha")
 */
function blocoPedido(cfg) {
    const atributos = (o) => [
        typeof o.preco === 'number' ? ` data-preco="${o.preco}"` : '',
        typeof o.mensal === 'number' ? ` data-mensal="${o.mensal}"` : '',
        o.nota ? ` data-nota="${esc(o.nota)}"` : '',
        o.extra ? ` data-extra="${esc(o.extra)}"` : ''
    ].join('');
    const perguntas = cfg.perguntas.map((q, i) => {
        const tipo = q.tipo || 'radio';
        const opcoes = q.opcoes.map((o) => `<label class="pr-opcao"><input type="${tipo}" name="${q.nome}" value="${esc(o.valor || o.texto)}"${atributos(o)}><span>${o.icone ? ico(o.icone, 'pr-ico') + ' ' : ''}${esc(o.texto)}</span></label>`);
        return `<fieldset class="pr-pergunta" data-passo="${i + 1}" data-rotulo="${esc(q.rotulo)}">
                        <legend><span>${i + 1}</span> ${esc(q.pergunta)}</legend>
                        ${q.dica ? `<p class="pr-dica">${esc(q.dica)}</p>` : ''}
                        <div class="pr-opcoes${tipo === 'radio' ? ' pr-opcoes-lista' : ''}">
                            ${opcoes.join('\n                            ')}
                        </div>
                        <p class="pr-aviso" role="alert" hidden>Escolha pelo menos uma opção.</p>
                        <div class="pr-acoes">${i ? '<button type="button" class="pr-voltar">Voltar</button>' : ''}<button type="button" class="sv-cta pr-avancar"${tipo === 'radio' ? ' hidden' : ''}>Próxima</button></div>
                    </fieldset>`;
    });
    const dados = [
        ` data-intro="${esc(cfg.intro)}"`,
        typeof cfg.preco === 'number' ? ` data-preco-base="${cfg.preco}"` : '',
        cfg.precoTexto ? ` data-preco-texto="${esc(cfg.precoTexto)}"` : '',
        cfg.precoRotulo ? ` data-preco-rotulo="${esc(cfg.precoRotulo)}"` : '',
        cfg.semPreco ? ` data-sem-preco="${esc(cfg.semPreco)}"` : ''
    ].join('');
    return `<section class="sv-bloco sv-bloco-largo pr-pedido" id="pedido" aria-labelledby="pr-titulo">
                <div class="pr-topo">
                    <p class="pr-selo">${ico('relogio', 'pr-ico-mini')} Menos de 1 minuto</p>
                    <h2 id="pr-titulo">${esc(cfg.titulo)}</h2>
                    <p class="pr-sub">${esc(cfg.sub)}</p>
                </div>
                <form class="pr-form" novalidate${dados}>
                    <ol class="pr-progresso" aria-hidden="true">${cfg.perguntas.map((q, i) => `<li>${i + 1}</li>`).join('')}</ol>
                    ${perguntas.join('\n                    ')}
                    <div class="pr-resultado" data-passo="${cfg.perguntas.length + 1}" aria-live="polite">
                        <h3>Seu pedido está pronto</h3>
                        <dl class="pr-resumo">
                            ${cfg.perguntas.map((q) => `<div><dt>${esc(q.resumo || q.rotulo)}</dt><dd data-resumo="${q.nome}">—</dd></div>`).join('\n                            ')}
                        </dl>
                        <p class="pr-estimativa" data-estimativa hidden></p>
                        <a class="sv-cta pr-enviar" href="${zap(cfg.intro)}" target="_blank" rel="noopener">${ico('zap', 'pr-ico-zap')} Enviar pelo WhatsApp</a>
                        <button type="button" class="pr-voltar pr-refazer">Mudar as respostas</button>
                    </div>
                </form>
            </section>`;
}

/** "+ R$ 49,90/mês" quando a mensalidade já foi definida; senão, nada. */
const mensalApp = (s) => (typeof s.mensalidade === 'number' ? `+ ${reais(s.mensalidade)}/mês` : '');
const menorMensalidade = () => {
    const valores = APPS.sistemas.map((s) => s.mensalidade).filter((v) => typeof v === 'number');
    return valores.length ? Math.min(...valores) : null;
};

// Projetos reais (portfólio): sistemas em uso na própria PC Formatech. Prints
// em /images/apps/ (celular 9:19). "ver" = endereço público para abrir ao vivo.
const PORTFOLIO = [
    {
        arq: 'projeto-portal',
        nome: 'Site com orçamento na hora',
        texto: 'A pessoa escreve o problema do computador e vê na hora o serviço certo e o preço, com o botão do WhatsApp já com a mensagem pronta.',
        itens: ['Busca que entende o problema', 'Preços e promoções do painel', 'Funciona no celular'],
        ver: '/'
    },
    {
        arq: 'projeto-loja',
        nome: 'Loja virtual com Pix',
        texto: 'Catálogo da Bird Tech com carrinho, pedido pelo WhatsApp e QR Code do Pix com o valor exato. Os produtos são cadastrados pelo painel.',
        itens: ['Carrinho e pedido pelo WhatsApp', 'Pix com o valor certo', 'Fotos com fundo automático'],
        ver: '/loja.html'
    },
    {
        arq: 'projeto-painel',
        nome: 'Painel de gestão',
        texto: 'Clientes, orçamentos, parcelas e as visitas do site em tempo real, com aviso no celular. Entra com a digital e também funciona como app.',
        itens: ['De onde vêm os clientes', 'Lembretes no celular', 'Entrada com biometria'],
        ver: null
    }
];

function paginaApps() {
    const url = SITE + '/apps.html';
    const titulo = 'Criação de Apps e Sistemas para Empresas';
    const descricao = 'Troque suas planilhas por um sistema feito sob medida: estoque, vendas, agenda, orçamentos e financeiro, no celular e no computador. Pronto em ' + APPS.prazo + '.';
    const msgPlanilha = 'Olá! Vim pelo site. Quero mandar minha planilha para ver como ficaria num sistema.';
    const faq = [
        ['Preciso entender de tecnologia?', 'Não. O sistema é feito para ser simples: se você usa WhatsApp, consegue usar. E você recebe uma explicação de como mexer.'],
        ['Dá para aproveitar a minha planilha?', 'Sim. Os dados que você já tem podem ir para o sistema novo, sem precisar digitar tudo de novo.'],
        ['Funciona no celular?', 'Sim. O sistema abre no celular e no computador, e quem você autorizar vê a mesma informação ao mesmo tempo.'],
        ['Tem mensalidade?', 'Na maioria dos sistemas, sim: um valor de criação e uma mensalidade mais barata, que cobre hospedagem, cópia de segurança, suporte e pequenos ajustes. Você sabe os dois valores antes de começar.'],
        ['E se eu precisar mudar alguma coisa depois?', 'Nos sistemas com mensalidade, ajustes pequenos e dúvidas estão incluídos. Mudanças maiores são combinadas antes.']
    ];
    const dados = [
        EMPRESA,
        {
            '@type': 'Service',
            '@id': url + '#servico',
            name: titulo,
            serviceType: 'Criação de sistemas e aplicativos sob medida',
            description: descricao,
            url,
            provider: { '@id': EMPRESA['@id'] },
            areaServed: { '@type': 'Country', name: 'Brasil' }
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/site.html' },
                { '@type': 'ListItem', position: 2, name: 'Apps e sistemas', item: url }
            ]
        },
        { '@type': 'FAQPage', mainEntity: faq.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) }
    ];

    const cards = APPS.sistemas.map((s) => `<article class="ap-card">
                    <span class="ap-card-ico">${ico(s.icone)}</span>
                    <h3>${esc(s.nome)}</h3>
                    <p>${esc(s.texto)}</p>
                    <ul>
                        ${s.itens.map((i) => `<li>${ico('check', 'ap-ico-mini')} ${esc(i)}</li>`).join('\n                        ')}
                    </ul>
                    <p class="ap-preco${s.preco === 'fale' ? ' ap-preco-fale' : ''}">${esc(precoApp(s.preco))}${mensalApp(s) ? ` <small class="ap-preco-mensal">${esc(mensalApp(s))}</small>` : ''}</p>
                    <a class="sv-cta ap-card-cta" data-pedido-marcar="${s.id}" href="${zap(s.preco === 'fale' ? 'Olá! Vim pelo site. Tenho uma ideia de sistema para o meu negócio e quero conversar.' : `Olá! Vim pelo site e quero ${s.pedido}.`)}" target="_blank" rel="noopener">${ico('zap', 'ap-ico-zap')} Quero este</a>
                </article>`).join('\n                ');

    // As 3 perguntas antes do WhatsApp (ver blocoPedido e pedido-rapido.js).
    const pedido = blocoPedido({
        titulo: 'Monte seu pedido em 3 perguntas',
        sub: 'No fim, a mensagem vai pronta para o WhatsApp e eu já respondo sabendo o que você precisa.',
        intro: 'Olá! Vim pelo site e respondi as 3 perguntas sobre o sistema:',
        precoRotulo: 'Criação a partir de',
        semPreco: 'O valor você recebe depois de contar a sua ideia.',
        perguntas: [
            { nome: 'o-que', rotulo: 'Quero organizar', resumo: 'Organizar', pergunta: 'O que você quer organizar?', tipo: 'checkbox', dica: 'Pode marcar mais de um.',
                opcoes: APPS.sistemas.map((s) => ({ valor: s.id, texto: s.curto, icone: s.icone, preco: s.preco, mensal: s.mensalidade })) },
            { nome: 'pessoas', rotulo: 'Quem vai usar', resumo: 'Quem usa', pergunta: 'Quantas pessoas vão usar?', opcoes: APPS.perguntas.pessoas.map((t) => ({ texto: t })) },
            { nome: 'hoje', rotulo: 'Hoje eu controlo', resumo: 'Hoje', pergunta: 'Como você controla isso hoje?',
                opcoes: APPS.perguntas.hoje.map((t) => ({ texto: t, extra: /planilha/i.test(t) ? 'Posso mandar a minha planilha.' : '' })) }
        ]
    });

    const portfolio = PORTFOLIO.map((p) => `<article class="ap-projeto">
                    <div class="ap-demo-tela ap-projeto-tela">
                        <img src="/images/apps/${p.arq}.webp" alt="${esc(p.nome)}: tela no celular" width="720" height="1520" loading="lazy" decoding="async">
                    </div>
                    <div class="ap-projeto-texto">
                        <h3>${esc(p.nome)}</h3>
                        <p>${esc(p.texto)}</p>
                        <ul>
                            ${p.itens.map((i) => `<li>${ico('check', 'ap-ico-mini')} ${esc(i)}</li>`).join('\n                            ')}
                        </ul>
                        ${p.ver ? `<a class="sv-cta-sec ap-projeto-ver" href="${p.ver}">Ver ao vivo</a>` : '<p class="ap-projeto-interno">Uso interno</p>'}
                    </div>
                </article>`).join('\n                ');

    // Telas de demonstração (dados fictícios), em formato de celular 9:19, em
    // /images/apps/. Para trocar por prints reais, substitua os arquivos.
    const demos = [
        ['demo-estoque', 'Estoque e vendas', 'Produtos, vendas do dia e aviso de reposição'],
        ['demo-agenda', 'Agenda de clientes', 'Horários do dia, confirmação e lembrete'],
        ['demo-painel', 'Painel com gráficos', 'Faturamento, despesas e lucro do mês']
    ].map(([arq, nome, texto]) => `<figure class="ap-demo">
                    <div class="ap-demo-tela">
                        <img src="/images/apps/${arq}.webp" alt="Tela de demonstração: ${esc(nome)}" width="720" height="1520" loading="lazy" decoding="async">
                    </div>
                    <figcaption><strong>${esc(nome)}</strong><small>${esc(texto)}</small></figcaption>
                </figure>`).join('\n                ');

    const mensalMin = menorMensalidade();

    return `${cabeca({ titulo, descricao, url, previa: 'apps', extras: '    <link rel="stylesheet" href="/apps.css?v=4">\n    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero ap-hero">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <span aria-current="page">Apps e sistemas</span></nav>
            <p class="ap-kicker">Criação de apps e sistemas</p>
            <h1>Troque suas planilhas por um sistema feito sob medida</h1>
            <p class="sv-hero-texto">Para empresas e negócios próprios que hoje se viram com planilhas. Um sistema simples, do seu jeito, que funciona no celular e no computador.</p>
            <div class="sv-acoes">
                <a class="sv-cta" href="#pedido">Montar meu pedido (3 perguntas)</a>
                <a class="sv-cta-sec" href="#sistemas">Ver o que dá para fazer</a>
            </div>
            <ul class="sv-selos">
                <li>${ico('relogio', 'ap-ico-selo')} Pronto em ${esc(APPS.prazo)}</li>
                <li>${ico('celular', 'ap-ico-selo')} Funciona no celular</li>
                <li>${ico('ferramenta', 'ap-ico-selo')} Suporte incluso</li>
            </ul>
        </section>

        <div class="sv-conteudo ap-conteudo">
            ${pedido}

            <section class="sv-bloco sv-bloco-largo ap-antes-depois" aria-labelledby="ap-ad-titulo">
                <h2 id="ap-ad-titulo">Antes e depois</h2>
                <div class="ap-comparar">
                    <div class="ap-lado ap-antes">
                        <p class="ap-rotulo">Antes: a planilha</p>
                        <div class="ap-planilha" aria-hidden="true">
                            <div class="ap-planilha-barra"><span></span><span></span><span></span><em>estoque_FINAL_v3 (2).xlsx</em></div>
                            <table>
                                <tr><th></th><th>A</th><th>B</th><th>C</th><th>D</th></tr>
                                <tr><th>1</th><td>Produto</td><td>Qtd</td><td>Preço</td><td>Total</td></tr>
                                <tr><th>2</th><td>Fone EJ-40</td><td>12</td><td>14,99</td><td>179,88</td></tr>
                                <tr><th>3</th><td>fone ej40</td><td class="ap-erro">??</td><td>14,99</td><td class="ap-erro">#VALOR!</td></tr>
                                <tr><th>4</th><td>Mouse USB</td><td>-3</td><td></td><td class="ap-erro">#REF!</td></tr>
                                <tr><th>5</th><td class="ap-amarelo">VER COM JOÃO</td><td></td><td>19,9</td><td></td></tr>
                                <tr><th>6</th><td>Cabo HDMI</td><td>4</td><td>25</td><td>100</td></tr>
                            </table>
                        </div>
                        <ul class="ap-lista ap-lista-antes">
                            <li>${ico('x', 'ap-ico-mini')} Fórmulas que quebram e dados repetidos</li>
                            <li>${ico('x', 'ap-ico-mini')} Só funciona direito no computador</li>
                            <li>${ico('x', 'ap-ico-mini')} Ninguém sabe qual é a versão certa</li>
                        </ul>
                    </div>
                    <div class="ap-seta" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
                    <div class="ap-lado ap-depois">
                        <p class="ap-rotulo">Depois: o sistema</p>
                        <div class="ap-celular" aria-hidden="true">
                            <div class="ap-celular-tela">
                                <div class="ap-app-topo"><strong>Estoque</strong><span>Hoje</span></div>
                                <div class="ap-app-resumo">
                                    <div><small>Vendas hoje</small><b>R$ 389</b></div>
                                    <div><small>Em estoque</small><b>148</b></div>
                                </div>
                                <div class="ap-app-grafico"><i style="height:40%"></i><i style="height:65%"></i><i style="height:50%"></i><i style="height:85%"></i><i style="height:70%"></i><i style="height:95%"></i></div>
                                <ul class="ap-app-lista">
                                    <li><span>Fone EJ-40</span><em class="ok">12 un.</em></li>
                                    <li><span>Mouse USB</span><em class="baixo">Repor</em></li>
                                    <li><span>Cabo HDMI</span><em class="ok">4 un.</em></li>
                                </ul>
                                <div class="ap-app-botao">+ Nova venda</div>
                            </div>
                        </div>
                        <ul class="ap-lista ap-lista-depois">
                            <li>${ico('check', 'ap-ico-mini')} Contas certas, feitas sozinhas</li>
                            <li>${ico('check', 'ap-ico-mini')} Abre no celular, de qualquer lugar</li>
                            <li>${ico('check', 'ap-ico-mini')} Toda a equipe vê a mesma informação</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section class="sv-bloco sv-bloco-largo" id="sistemas" aria-labelledby="ap-sistemas-titulo">
                <h2 id="ap-sistemas-titulo">O que dá para fazer</h2>
                <div class="ap-cards">
                ${cards}
                </div>
                <p class="ap-nota">Valores da criação do sistema. A maioria tem também uma mensalidade, mais barata, que cobre hospedagem, cópia de segurança, suporte e pequenos ajustes. Você recebe os dois valores antes de começar.</p>
            </section>

            <section class="sv-bloco sv-bloco-largo ap-portfolio" id="projetos" aria-labelledby="ap-projetos-titulo">
                <h2 id="ap-projetos-titulo">Projetos que eu já fiz</h2>
                <p class="ap-sub">Sistemas reais, em uso todo dia na própria PC Formatech. O mesmo cuidado vai para o seu.</p>
                <div class="ap-projetos">
                ${portfolio}
                </div>
            </section>

            <section class="sv-bloco sv-bloco-largo sv-chamada ap-destaque">
                <h2>Mande sua planilha e eu mostro como ficaria</h2>
                <p>Envie a planilha que você usa hoje pelo WhatsApp. Eu analiso e mostro, sem compromisso, como ela ficaria num sistema.</p>
                <a class="sv-cta" href="${zap(msgPlanilha)}" target="_blank" rel="noopener">${ico('zap', 'ap-ico-zap')} Enviar minha planilha</a>
            </section>

            <section class="sv-bloco" aria-labelledby="ap-como-titulo">
                <h2 id="ap-como-titulo">Como funciona</h2>
                <ol class="sv-passos ap-passos">
                    <li>Você conta como trabalha hoje (ou manda a planilha)</li>
                    <li>Eu mostro como o sistema vai ficar, antes de começar</li>
                    <li>O sistema fica pronto e você aprende a usar</li>
                </ol>
                <p class="ap-prazo">${ico('relogio', 'ap-ico-selo')} Pronto em <strong>${esc(APPS.prazo)}</strong></p>
            </section>

            <section class="sv-bloco ap-suporte" aria-labelledby="ap-suporte-titulo">
                <h2 id="ap-suporte-titulo">Suporte e manutenção mensal</h2>
                <p>Seu sistema sempre funcionando, com alguém para ajudar quando precisar.</p>
                <ul class="sv-lista">
                    <li><i class="fas fa-check" aria-hidden="true"></i> Sistema no ar (hospedagem)</li>
                    <li><i class="fas fa-check" aria-hidden="true"></i> Cópia de segurança dos dados</li>
                    <li><i class="fas fa-check" aria-hidden="true"></i> Ajuda pelo WhatsApp</li>
                    <li><i class="fas fa-check" aria-hidden="true"></i> Pequenos ajustes e correções</li>
                </ul>
                ${mensalMin !== null
                    ? `<p class="ap-mensal"><span>a partir de</span> <strong>${reais(mensalMin)}</strong><span>/mês</span></p>`
                    : APPS.suporteMensal === 'incluso'
                        ? '<p class="ap-incluso"><strong>Tudo isso na mensalidade</strong>, que é mais barata que a criação. O valor vem junto com o orçamento.</p>'
                        : `<p class="ap-mensal"><strong>${typeof APPS.suporteMensal === 'number' ? reais(APPS.suporteMensal) : 'R$ [PREÇO]'}</strong><span>/mês</span></p>`}
            </section>

            <section class="sv-bloco sv-bloco-largo" aria-labelledby="ap-exemplos-titulo">
                <h2 id="ap-exemplos-titulo">Exemplos</h2>
                <p class="ap-sub">Telas de demonstração, com dados de exemplo: é assim que o seu sistema pode ficar no celular.</p>
                <div class="ap-demos">
                ${demos}
                </div>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Perguntas frequentes</h2>
                ${faq.map(([q, r]) => `<details class="sv-faq"><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('\n                ')}
            </section>

            <section class="sv-bloco sv-bloco-largo sv-chamada">
                <h2>Vamos organizar o seu negócio?</h2>
                <p>Responda as 3 perguntas e mande pelo WhatsApp. A conversa é sem compromisso e você sabe o valor antes de começar.</p>
                <div class="sv-acoes ap-acoes-centro">
                    <a class="sv-cta" href="#pedido">Montar meu pedido</a>
                    <a class="sv-cta-sec" href="${zap('Olá! Vim pelo site e quero um sistema para o meu negócio.')}" target="_blank" rel="noopener">Prefiro conversar direto</a>
                </div>
            </section>
        </div>
    </main>

    ${rodape()}
    <script src="/pedido-rapido.js?v=1" defer></script>
</body>
</html>
`;
}

const faltando = APPS.sistemas.filter((s) => s.preco === null).map((s) => s.nome).concat(APPS.suporteMensal === null ? ['Suporte mensal'] : []);
if (faltando.length) console.warn('ATENÇÃO apps.html: preço ainda não definido para: ' + faltando.join(', '));

// ── Dicas (artigos) ───────────────────────────────────────────────────────

const servicoPorSlug = (slug) => SERVICOS.find((x) => x.slug === slug);

function blocoDica(b) {
    return [
        b.h2 ? `<h2>${esc(b.h2)}</h2>` : '',
        ...(b.p || []).map((t) => `<p>${esc(t)}</p>`),
        b.lista ? `<ul class="sv-lista">${b.lista.map((t) => `<li><i class="fas fa-check" aria-hidden="true"></i> ${esc(t)}</li>`).join('')}</ul>` : '',
        b.passos ? `<ol class="sv-artigo-passos">${b.passos.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>` : ''
    ].filter(Boolean).join('\n                ');
}

function paginaDica(d) {
    const url = `${SITE}/dicas/${d.slug}/`;
    const outras = DICAS.filter((x) => x.slug !== d.slug);
    const relacionados = d.servicos.map(servicoPorSlug).filter(Boolean);
    const dados = [
        EMPRESA,
        {
            '@type': 'Article',
            '@id': url + '#artigo',
            headline: d.titulo,
            description: d.descricao,
            url,
            image: imagemPrevia('dica-' + d.slug),
            datePublished: d.publicado,
            dateModified: d.atualizado || d.publicado,
            inLanguage: 'pt-BR',
            author: { '@id': EMPRESA['@id'] },
            publisher: { '@id': EMPRESA['@id'] },
            mainEntityOfPage: url
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/site.html' },
                { '@type': 'ListItem', position: 2, name: 'Dicas', item: SITE + '/dicas/' },
                { '@type': 'ListItem', position: 3, name: d.titulo, item: url }
            ]
        }
    ];
    const data = new Date(d.publicado + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${cabeca({ titulo: d.titulo, descricao: d.descricao, url, previa: 'dica-' + d.slug, tipo: 'article', extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero sv-hero-artigo">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <a href="/dicas/">Dicas</a></nav>
            <h1>${esc(d.titulo)}</h1>
            <p class="sv-hero-texto">${esc(d.resumo)}</p>
            <p class="sv-artigo-data">PC Formatech · ${esc(data)}</p>
        </section>

        <div class="sv-conteudo">
            <article class="sv-bloco sv-bloco-largo sv-artigo">
                ${d.blocos.map(blocoDica).join('\n                ')}
            </article>

            <section class="sv-bloco sv-bloco-largo sv-chamada">
                <h2>Quer ajuda com o seu computador?</h2>
                <p>Conte o que está acontecendo. O diagnóstico pelo WhatsApp é grátis e você sabe o valor antes de qualquer serviço.</p>
                <a class="sv-cta" href="${zap('Olá! Li a dica "' + d.titulo + '" no site e quero ajuda com o meu computador.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Chamar no WhatsApp</a>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Serviços relacionados</h2>
                <div class="sv-outros">
                    ${relacionados.map((o) => `<a href="/servicos/${o.slug}/"><i class="fas ${o.icone}" aria-hidden="true"></i><span><strong>${esc(o.nome)}</strong><small>${esc(precoDe(o))}</small></span></a>`).join('\n                    ')}
                </div>
            </section>

            <section class="sv-bloco sv-bloco-largo">
                <h2>Outras dicas</h2>
                <div class="sv-outros sv-outros-grande">
                    ${outras.map((o) => `<a href="/dicas/${o.slug}/"><i class="fas fa-lightbulb" aria-hidden="true"></i><span><strong>${esc(o.titulo)}</strong><em>${esc(o.resumo)}</em></span></a>`).join('\n                    ')}
                </div>
            </section>
        </div>
    </main>

    ${rodape()}
</body>
</html>
`;
}

function paginaDicas() {
    const url = SITE + '/dicas/';
    const titulo = 'Dicas para o seu computador';
    const descricao = 'Dicas simples sobre computador lento, vírus, formatação e manutenção, da PC Formatech, assistência técnica em Canaã dos Carajás.';
    const dados = [
        EMPRESA,
        { '@type': 'ItemList', name: titulo, itemListElement: DICAS.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/dicas/${d.slug}/`, name: d.titulo })) }
    ];
    return `${cabeca({ titulo, descricao, url, previa: 'dicas', extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <span aria-current="page">Dicas</span></nav>
            <h1>${esc(titulo)}</h1>
            <p class="sv-hero-texto">Respostas rápidas para as dúvidas mais comuns sobre computador e notebook, de quem resolve isso todo dia.</p>
        </section>

        <div class="sv-conteudo">
            <section class="sv-bloco sv-bloco-largo">
                <h2>Artigos</h2>
                <div class="sv-outros sv-outros-grande">
                    ${DICAS.map((d) => `<a href="/dicas/${d.slug}/"><i class="fas fa-lightbulb" aria-hidden="true"></i><span><strong>${esc(d.titulo)}</strong><em>${esc(d.resumo)}</em></span></a>`).join('\n                    ')}
                </div>
            </section>
        </div>
    </main>

    ${rodape()}
</body>
</html>
`;
}

// ── sitemap.xml ───────────────────────────────────────────────────────────

/** Arquivo de cada endereço do sitemap ("/servicos/x/" → servicos/x/index.html). */
const arquivoDe = (u) => (u === '/' ? 'index.html' : u.endsWith('/') ? u.slice(1) + 'index.html' : u.slice(1));

/**
 * Data da última mudança de verdade de cada página. Se toda página "muda"
 * todo dia, o Google passa a ignorar o lastmod; assim ele sabe quais
 * páginas valem uma nova visita.
 */
function ultimaMudanca(rel, hoje) {
    if (alterados.has(rel)) return hoje;
    try {
        const { execSync } = require('child_process');
        if (execSync(`git status --porcelain -- "${rel}"`, { cwd: RAIZ }).toString().trim()) return hoje;
        const data = execSync(`git log -1 --format=%cs -- "${rel}"`, { cwd: RAIZ }).toString().trim();
        if (data) return data;
    } catch (e) { /* fora do git: usa hoje */ }
    return hoje;
}

function sitemap() {
    const hoje = new Date().toISOString().slice(0, 10);
    const urls = [
        ['/', '1.0'],
        ['/site.html', '1.0'],
        ['/servicos/', '0.9'],
        ...SERVICOS.map((s) => [`/servicos/${s.slug}/`, '0.8']),
        ['/loja.html', '0.8'],
        ['/apps.html', '0.8'],
        ['/dicas/', '0.7'],
        ...DICAS.map((d) => [`/dicas/${d.slug}/`, '0.7']),
        ['/formulario-formatacao.html', '0.4']
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `    <url><loc>${SITE}${u}</loc><lastmod>${ultimaMudanca(arquivoDe(u), hoje)}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`;
}

// ── Gravação ──────────────────────────────────────────────────────────────

// Páginas cujo conteúdo mudou nesta geração (as iguais nem são regravadas).
const alterados = new Set();

function gravar(rel, conteudo) {
    const arq = path.join(RAIZ, rel);
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    const antes = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8').replace(/\r\n/g, '\n') : null;
    if (antes === conteudo.replace(/\r\n/g, '\n')) return;
    fs.writeFileSync(arq, conteudo);
    alterados.add(rel);
    console.log('gravado', rel);
}

SERVICOS.forEach((s) => gravar(`servicos/${s.slug}/index.html`, paginaServico(s)));
gravar('servicos/index.html', paginaIndice());
gravar('apps.html', paginaApps());
DICAS.forEach((d) => gravar(`dicas/${d.slug}/index.html`, paginaDica(d)));
gravar('dicas/index.html', paginaDicas());
gravar('sitemap.xml', sitemap());
