// Gera as páginas de serviço (servicos/<slug>/index.html), a página
// servicos/index.html e o sitemap.xml.
//
// Cada serviço tem uma página própria para o Google mostrar quando alguém
// busca exatamente aquilo ("formatação de computador em Canaã dos Carajás").
// Para mudar um texto ou preço: edite SERVICOS abaixo e rode
//     node ferramentas/gerar-seo.js
// Os preços seguem os cartões de serviço de site.html.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SITE = 'https://pcformatech.vercel.app';
const WHATSAPP = '5594984305772';
const CIDADE = 'Canaã dos Carajás';

const EMPRESA = {
    '@type': 'LocalBusiness',
    '@id': SITE + '/#empresa',
    name: 'PC Formatech',
    description: 'Assistência técnica de computadores e notebooks: formatação, limpeza, otimização, remoção de vírus, backup e suporte remoto.',
    url: SITE + '/site.html',
    image: SITE + '/images/og-preview.jpg',
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
        slug: 'limpeza-e-otimizacao',
        nome: 'Limpeza e otimização',
        titulo: `Computador Lento? Limpeza e Otimização em ${CIDADE}`,
        descricao: `Computador ou notebook lento em ${CIDADE}? Limpeza do sistema, otimização do Windows, drivers atualizados e relatório de desempenho. A partir de R$ 70.`,
        icone: 'fa-tachometer-alt',
        preco: 70,
        chamada: 'Programas escondidos, arquivos acumulados e inicialização pesada roubam desempenho todo dia. A manutenção encontra e corrige.',
        inclui: ['Limpeza do sistema', 'Otimização do Windows', 'Atualização de drivers', 'Verificação de hardware', 'Remoção de arquivos temporários', 'Relatório de desempenho'],
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
        titulo: 'Suporte Técnico Remoto para Computador, com 20% de Desconto',
        descricao: 'Suporte técnico remoto pelo AnyDesk para todo o Brasil: instalação de programas, diagnóstico, otimização e correção de problemas, com 20% de desconto.',
        icone: 'fa-globe',
        preco: null,
        precoTexto: '20% de desconto',
        chamada: 'Resolva sem sair de casa. Pelo AnyDesk, o técnico acessa o seu computador com a sua permissão e você acompanha tudo pela tela.',
        inclui: ['Atendimento sem sair de casa', 'Suporte técnico em tempo real', 'Instalação de programas', 'Diagnóstico e otimização do sistema', 'Conexão segura e criptografada', '20% de desconto em todos os serviços'],
        quando: ['Você precisa instalar ou configurar um programa', 'O computador está lento ou dando erro', 'Você mora fora de Canaã dos Carajás', 'Você não tem tempo de levar o computador'],
        passos: ['Baixe o AnyDesk no site oficial (anydesk.com)', 'Instale o programa; não precisa reiniciar', 'Chame no WhatsApp e passe o código que aparece no AnyDesk', 'Acompanhe o atendimento pela tela, com 20% de desconto'],
        faq: [
            ['O atendimento remoto é seguro?', 'Sim. A conexão do AnyDesk é criptografada, só começa quando você aceita e você pode encerrar a qualquer momento.'],
            ['Atende fora de Canaã dos Carajás?', 'Sim. O suporte remoto atende qualquer cidade do Brasil, só precisa de internet.'],
            ['O desconto vale para quais serviços?', 'Para todos os serviços feitos à distância: 20% de desconto.']
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
            ['Dá para instalar à distância?', 'Sim, pelo suporte remoto, que tem 20% de desconto.'],
            ['Os drivers são oficiais?', 'Sim. São instalados a partir dos fabricantes, sem programas que vêm com propaganda.']
        ]
    }
];

// ── Utilidades ────────────────────────────────────────────────────────────

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const zap = (msg) => `https://api.whatsapp.com/send?phone=${WHATSAPP}&amp;text=${encodeURIComponent(msg)}`;
const reais = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const precoDe = (s) => (s.preco ? `A partir de ${reais(s.preco)}` : s.precoTexto);

function cabeca({ titulo, descricao, url, extras }) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <script>try{if(localStorage.getItem('pcft-theme')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}</script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>${esc(titulo)} | PC Formatech</title>
    <meta name="description" content="${esc(descricao)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="PC Formatech">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${SITE}/images/og-preview.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#0b2b2c">
    <link rel="icon" type="image/svg+xml" href="/favicon-icon.svg">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/sora-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/fontes.css">
    <link rel="stylesheet" href="/icones.css">
    <link rel="stylesheet" href="/servicos/servicos.css?v=1">
${extras}
</head>`;
}

const topo = `<header class="sv-topo">
        <a class="sv-marca" href="/site.html"><img src="/icon-192.png" alt="" width="36" height="36"><span>PC Formatech</span></a>
        <nav class="sv-nav" aria-label="Principal">
            <a href="/servicos/">Serviços</a>
            <a href="/loja.html">Loja</a>
            <a class="sv-nav-zap" href="${zap('Olá! Vim pelo site e quero um orçamento.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>
        </nav>
    </header>`;

function rodape() {
    return `<footer class="sv-rodape">
        <div>
            <strong>PC Formatech</strong>
            <p>Assistência técnica de computadores e notebooks em ${CIDADE}, PA, e suporte remoto para todo o Brasil.</p>
        </div>
        <nav aria-label="Serviços">
            ${SERVICOS.map((s) => `<a href="/servicos/${s.slug}/">${esc(s.nome)}</a>`).join('\n            ')}
        </nav>
        <p class="sv-rodape-contato"><a href="${zap('Olá! Vim pelo site.')}" target="_blank" rel="noopener">(94) 98430-5772</a> · <a href="https://instagram.com/pcformatech" target="_blank" rel="noopener">@pcformatech</a></p>
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

    return `${cabeca({ titulo: s.titulo, descricao: s.descricao, url, extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
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
                <a class="sv-cta" href="${zap(msg)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Pedir orçamento no WhatsApp</a>
                <a class="sv-cta-sec" href="/site.html#diagnostico">Fazer diagnóstico grátis</a>
            </div>
            <ul class="sv-selos">
                <li><i class="fas fa-check-circle" aria-hidden="true"></i> +500 PCs atendidos</li>
                <li><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${s.slug === 'suporte-remoto' ? 'Todo o Brasil' : CIDADE + ', PA'}</li>
                <li><i class="fas fa-bolt" aria-hidden="true"></i> Resposta rápida</li>
            </ul>
        </section>

        <div class="sv-conteudo">
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
                <p>Mande uma mensagem contando o problema. O diagnóstico pelo WhatsApp é grátis e você sabe o valor antes de qualquer serviço.</p>
                <a class="sv-cta" href="${zap(msg)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> Chamar no WhatsApp</a>
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
</body>
</html>
`;
}

// ── Página com todos os serviços ──────────────────────────────────────────

function paginaIndice() {
    const url = SITE + '/servicos/';
    const titulo = `Serviços de Informática em ${CIDADE}`;
    const descricao = `Formatação, limpeza e otimização, remoção de vírus, backup, instalação de programas e suporte remoto em ${CIDADE}, PA. Diagnóstico grátis pelo WhatsApp.`;
    const dados = [
        EMPRESA,
        {
            '@type': 'ItemList',
            name: titulo,
            itemListElement: SERVICOS.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/servicos/${s.slug}/`, name: s.titulo }))
        }
    ];
    return `${cabeca({ titulo, descricao, url, extras: '    ' + jsonLd({ '@context': 'https://schema.org', '@graph': dados }) })}
<body>
    ${topo}

    <main>
        <section class="sv-hero">
            <nav class="sv-trilha" aria-label="Você está em"><a href="/site.html">Início</a> <span aria-hidden="true">/</span> <span aria-current="page">Serviços</span></nav>
            <h1>${esc(titulo)}</h1>
            <p class="sv-hero-texto">Assistência técnica de computadores e notebooks, presencial em ${CIDADE} ou remota para todo o Brasil. Escolha o serviço para ver o que está incluso e quanto custa.</p>
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

// ── sitemap.xml ───────────────────────────────────────────────────────────

function sitemap() {
    const hoje = new Date().toISOString().slice(0, 10);
    const urls = [
        ['/', '1.0'],
        ['/site.html', '1.0'],
        ['/servicos/', '0.9'],
        ...SERVICOS.map((s) => [`/servicos/${s.slug}/`, '0.8']),
        ['/loja.html', '0.8'],
        ['/formulario-formatacao.html', '0.4']
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `    <url><loc>${SITE}${u}</loc><lastmod>${hoje}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`;
}

// ── Gravação ──────────────────────────────────────────────────────────────

function gravar(rel, conteudo) {
    const arq = path.join(RAIZ, rel);
    fs.mkdirSync(path.dirname(arq), { recursive: true });
    fs.writeFileSync(arq, conteudo);
    console.log('gravado', rel);
}

SERVICOS.forEach((s) => gravar(`servicos/${s.slug}/index.html`, paginaServico(s)));
gravar('servicos/index.html', paginaIndice());
gravar('sitemap.xml', sitemap());
