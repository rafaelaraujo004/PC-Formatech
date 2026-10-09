// Artigos da seção /dicas/ (gerados por ferramentas/gerar-seo.js).
//
// Cada artigo responde uma dúvida que as pessoas pesquisam no Google e leva
// aos serviços relacionados. Para escrever um novo, copie um bloco abaixo,
// troque o slug e o texto, e rode: node ferramentas/gerar-seo.js
//
// blocos: { h2, p: [parágrafos], lista: [itens], passos: [itens numerados] }
// servicos: slugs de servicos/ que aparecem em "Serviços relacionados".

module.exports = [
    {
        slug: 'computador-nao-atualiza-para-windows-11',
        titulo: 'Meu computador não atualiza para o Windows 11: e agora?',
        descricao: 'O suporte do Windows 10 acabou. Veja por que o computador não atualiza para o Windows 11, como saber se ele é compatível e quais são as opções.',
        resumo: 'Por que o Windows 11 não aparece, como verificar o seu computador e o que fazer com o Windows 10.',
        publicado: '2026-10-09',
        servicos: ['formatacao-de-computador', 'backup-de-dados', 'suporte-remoto'],
        blocos: [
            {
                p: [
                    'O Windows 10 deixou de receber suporte da Microsoft em 14 de outubro de 2025. O computador continua ligando e funcionando, mas sem atualizações de segurança ele fica cada vez mais exposto a vírus e golpes, principalmente quem usa banco e compras pela internet.',
                    'Quem se inscreveu no programa de atualizações estendidas (ESU) para uso doméstico recebeu mais um ano de correções de segurança, até 13 de outubro de 2026. Depois disso, o Windows 10 fica sem nenhuma atualização.'
                ]
            },
            {
                h2: 'Por que o Windows 11 não aparece no meu computador',
                p: ['O Windows 11 é gratuito para quem tem Windows 10, mas exige mais do computador. Os requisitos principais são:'],
                lista: [
                    'Processador compatível: em geral, Intel de 8ª geração ou mais novo, ou AMD Ryzen 2000 ou mais novo',
                    'Pelo menos 4 GB de memória e 64 GB de espaço',
                    'TPM 2.0, um chip de segurança que muitos computadores têm, mas vem desligado',
                    'Inicialização segura (Secure Boot) ativada'
                ]
            },
            {
                h2: 'Como saber se o seu computador é compatível',
                passos: [
                    'Abra o Windows Update (Configurações › Atualização e Segurança) e veja se aparece a oferta do Windows 11.',
                    'Se não aparecer, instale o aplicativo "Verificação de Integridade do PC", da própria Microsoft. Ele diz o que falta.',
                    'Se o problema for só o TPM ou a inicialização segura, muitas vezes basta ativar uma opção na configuração do computador (BIOS) e o Windows 11 passa a ser liberado.'
                ]
            },
            {
                h2: 'E se o computador não for compatível?',
                p: [
                    'Existe forma de instalar o Windows 11 em alguns computadores fora dos requisitos, mas a própria Microsoft avisa que eles podem não receber atualizações. Por isso avaliamos caso a caso e explicamos os riscos antes.',
                    'Se o processador for muito antigo, o caminho seguro costuma ser trocar de computador. Troca de peças não é com a gente, mas depois podemos instalar o Windows 11 e passar seus arquivos e programas para o computador novo.'
                ]
            },
            {
                h2: 'Antes de atualizar, guarde seus arquivos',
                p: ['A atualização do Windows 10 para o 11 normalmente mantém arquivos e programas, mas qualquer falha no meio do caminho pode dar trabalho. Faça uma cópia das fotos e documentos antes, ou peça o backup junto com o serviço.']
            }
        ]
    },
    {
        slug: 'quanto-tempo-demora-formatar-notebook',
        titulo: 'Quanto tempo demora para formatar um notebook?',
        descricao: 'Formatar um computador ou notebook leva normalmente de 2 a 4 horas. Veja o que influencia no tempo e como deixar tudo pronto para ser mais rápido.',
        resumo: 'Quanto tempo leva a formatação e o que deixa ela mais rápida ou mais demorada.',
        publicado: '2026-10-09',
        servicos: ['formatacao-de-computador', 'backup-de-dados', 'instalacao-de-programas-e-drivers'],
        blocos: [
            {
                p: ['Na PC Formatech, formatar um computador ou notebook leva normalmente de 2 a 4 horas. Em geral, dá para combinar a entrega no mesmo dia.']
            },
            {
                h2: 'O que influencia no tempo',
                lista: [
                    'Quantidade de arquivos para copiar antes e devolver depois (o backup)',
                    'Quantos programas precisam ser instalados, como Office e programas do seu trabalho',
                    'As atualizações do Windows e dos drivers, que dependem da internet',
                    'Se o computador tem HD ou SSD: com SSD tudo fica bem mais rápido'
                ]
            },
            {
                h2: 'Como deixar tudo mais rápido',
                passos: [
                    'Separe a lista dos programas que você usa e as senhas das contas (e-mail, Microsoft, Google).',
                    'Diga quais pastas precisam ser guardadas: fotos, documentos, trabalhos.',
                    'Se tiver programas pagos, deixe à mão as chaves ou o login de cada um.'
                ]
            },
            {
                h2: 'Dá para formatar à distância?',
                p: ['Em muitos casos, sim, pelo atendimento remoto, que tem 10% de desconto. Você acompanha tudo pela tela e não precisa sair de casa. Pelo WhatsApp a gente confirma se o seu caso permite.']
            }
        ]
    },
    {
        slug: 'formatar-computador-sem-perder-arquivos',
        titulo: 'Como formatar o computador sem perder seus arquivos',
        descricao: 'O que salvar antes de formatar (fotos, documentos, senhas, favoritos e programas), onde guardar e como funciona a formatação com backup.',
        resumo: 'A lista do que guardar antes de formatar e onde deixar a cópia.',
        publicado: '2026-10-09',
        servicos: ['backup-de-dados', 'formatacao-de-computador'],
        blocos: [
            {
                p: ['Formatar apaga tudo o que está no computador. Para não perder nada, o segredo é fazer a cópia (o backup) antes e conferir se ela abriu certinho.']
            },
            {
                h2: 'O que guardar antes de formatar',
                lista: [
                    'Pastas Documentos, Área de Trabalho, Downloads, Imagens e Vídeos',
                    'Senhas e favoritos do navegador: entre na sua conta do Google ou da Microsoft para sincronizar',
                    'E-mails e contatos do Outlook, se você usa o programa no computador',
                    'Arquivos de programas do trabalho, como sistemas de loja, planilhas e bancos de dados',
                    'Chaves ou login dos programas pagos, como o Office'
                ]
            },
            {
                h2: 'Onde guardar a cópia',
                lista: [
                    'HD externo ou pendrive: rápido e fica com você',
                    'Nuvem (Google Drive ou OneDrive): acessa de qualquer lugar, mas depende do espaço da conta',
                    'O ideal é ter a cópia em dois lugares'
                ]
            },
            {
                h2: 'Formatação com backup',
                p: ['Se preferir não se preocupar, peça o backup junto com a formatação (a partir de R$ 45,00). A gente copia seus arquivos, confere se estão abrindo, formata e devolve tudo no lugar, com os programas essenciais instalados. Seus arquivos não ficam guardados com a gente sem a sua autorização.']
            }
        ]
    },
    {
        slug: 'quanto-custa-formatar-computador',
        titulo: 'Quanto custa formatar um computador em Canaã dos Carajás?',
        descricao: 'Quanto custa formatar computador ou notebook em Canaã dos Carajás, o que está incluso, quanto tempo leva e quando vale mais a pena só limpar e otimizar.',
        resumo: 'O preço da formatação, o que vem incluso e como saber se o seu computador precisa mesmo dela.',
        publicado: '2026-10-08',
        servicos: ['formatacao-de-computador', 'backup-de-dados', 'limpeza-e-otimizacao'],
        blocos: [
            {
                p: [
                    'A formatação na PC Formatech começa em R$ 80,00. O valor final depende do que você precisa: só o Windows e os programas básicos, ou também cópia dos seus arquivos, pacote Office e programas específicos do seu trabalho.',
                    'Antes de qualquer serviço você recebe o diagnóstico e o valor pelo WhatsApp, sem compromisso.'
                ]
            },
            {
                h2: 'O que está incluso na formatação',
                lista: [
                    'Instalação do Windows do zero',
                    'Navegador, leitor de PDF, players de vídeo e programas essenciais',
                    'Drivers de som, vídeo, rede e impressora',
                    'Garantia de 30 dias e suporte depois do serviço'
                ],
                p: ['O backup dos seus arquivos (fotos, documentos, trabalhos) é opcional e combinado antes. Se você precisa guardar tudo, peça junto.']
            },
            {
                h2: 'Quanto tempo leva',
                p: ['Normalmente de 2 a 4 horas, conforme a quantidade de programas e de arquivos para copiar. Em muitos casos dá para fazer à distância, pelo atendimento remoto, que tem 10% de desconto.']
            },
            {
                h2: 'Formatar ou só limpar?',
                p: ['Nem todo computador lento precisa de formatação. Se o Windows ainda funciona bem e o problema é lentidão, a limpeza e otimização (a partir de R$ 70,00) costuma resolver sem apagar seus programas. A formatação é a melhor escolha quando:'],
                lista: [
                    'O Windows mostra erros toda hora ou não atualiza mais',
                    'Há vírus que não saem ou programas estranhos instalados',
                    'O computador vai ser vendido, doado ou passado para outra pessoa'
                ]
            }
        ]
    },
    {
        slug: 'computador-lento-o-que-fazer',
        titulo: 'Computador lento: 7 causas comuns e o que fazer',
        descricao: 'Por que o computador fica lento e o que você mesmo pode fazer antes de chamar um técnico. Dicas simples para notebook e PC com Windows.',
        resumo: 'As causas mais comuns de lentidão e o que dá para resolver em casa.',
        publicado: '2026-10-08',
        servicos: ['limpeza-e-otimizacao', 'formatacao-de-computador', 'suporte-remoto'],
        blocos: [
            {
                p: ['Computador lento quase sempre tem conserto, e muitas vezes sem trocar peça nenhuma. Veja as causas mais comuns:']
            },
            {
                h2: 'As 7 causas mais comuns',
                passos: [
                    'Muitos programas abrindo junto com o Windows e pesando desde a hora que você liga.',
                    'Disco quase cheio: com menos de 10% livre, o Windows fica bem mais lento.',
                    'Vírus ou programas que vieram escondidos junto com outros downloads.',
                    'Windows ou drivers desatualizados.',
                    'Navegador com dezenas de abas e extensões.',
                    'Sujeira e poeira, que esquentam o computador e fazem ele trabalhar mais devagar (limpeza interna é serviço de peça, que não fazemos).',
                    'HD antigo: trocar por um SSD costuma deixar o computador várias vezes mais rápido (troca de peça também não é com a gente, mas depois da troca podemos instalar o Windows e passar seus arquivos).'
                ]
            },
            {
                h2: 'O que você pode fazer em casa',
                lista: [
                    'Reiniciar o computador de vez em quando, em vez de só suspender',
                    'Desinstalar programas que você não usa mais',
                    'Apagar arquivos grandes e esvaziar a lixeira',
                    'Fechar abas e tirar extensões do navegador que você não usa',
                    'Deixar o Windows Update terminar as atualizações'
                ]
            },
            {
                h2: 'Quando chamar um técnico',
                p: ['Se mesmo assim continuar lento, ou se aparecerem propagandas e janelas sozinhas, vale uma limpeza e otimização completa. Ela tira o que pesa na inicialização, atualiza os drivers e verifica o sistema e o disco, sem apagar seus arquivos. Pode ser feita presencialmente em Canaã dos Carajás ou à distância.']
            }
        ]
    },
    {
        slug: 'como-saber-se-o-computador-tem-virus',
        titulo: 'Como saber se o computador está com vírus',
        descricao: 'Os sinais de que o computador está com vírus, o que fazer primeiro e quando é hora de pedir ajuda para remover sem perder seus arquivos.',
        resumo: 'Os sinais mais comuns de vírus e o que fazer primeiro.',
        publicado: '2026-10-08',
        servicos: ['remocao-de-virus', 'backup-de-dados', 'suporte-remoto'],
        blocos: [
            {
                h2: 'Sinais de que pode ser vírus',
                lista: [
                    'Propagandas e janelas que aparecem sozinhas, até fora do navegador',
                    'A página inicial ou o buscador do navegador mudaram sem você mexer',
                    'Programas que você não instalou aparecendo no computador',
                    'O computador ficou lento de repente, com o ventilador sempre alto',
                    'Arquivos sumindo, renomeados ou que não abrem mais',
                    'Amigos recebendo mensagens estranhas suas por e-mail ou redes sociais'
                ]
            },
            {
                h2: 'O que fazer primeiro',
                passos: [
                    'Não digite senhas de banco nem faça compras nesse computador até resolver.',
                    'Faça uma cópia dos arquivos importantes num pendrive ou HD externo.',
                    'Rode uma verificação completa com o antivírus (o Windows Defender já vem no Windows).',
                    'Troque as senhas principais usando outro aparelho, como o celular.'
                ]
            },
            {
                h2: 'Precisa formatar?',
                p: ['Na maioria dos casos, não. A remoção de vírus (a partir de R$ 60,00) limpa o sistema sem apagar seus programas e arquivos, e deixa o computador protegido com antivírus e firewall configurados. Quando o estrago é grande, você é avisado antes e decide.']
            }
        ]
    },
    {
        slug: 'formatar-ou-limpar-o-computador',
        titulo: 'Formatar ou limpar o computador? Como decidir',
        descricao: 'Formatação ou limpeza e otimização: a diferença entre os dois, quanto custa cada um e qual escolher para o seu computador ou notebook.',
        resumo: 'A diferença entre formatar e limpar, e qual escolher no seu caso.',
        publicado: '2026-10-08',
        servicos: ['limpeza-e-otimizacao', 'formatacao-de-computador'],
        blocos: [
            {
                h2: 'Limpeza e otimização',
                p: ['Mantém o Windows, seus programas e seus arquivos. Tira o que pesa na inicialização, apaga arquivos temporários, atualiza drivers e verifica o hardware. A partir de R$ 70,00.'],
                lista: ['Bom para: computador que ficou lento com o tempo', 'Vantagem: você não precisa reinstalar nada']
            },
            {
                h2: 'Formatação',
                p: ['Apaga tudo e instala o Windows do zero, com os programas essenciais e os drivers. A partir de R$ 80,00, com garantia de 30 dias. O backup dos arquivos é opcional.'],
                lista: ['Bom para: Windows com erros, vírus difíceis, computador que vai mudar de dono', 'Vantagem: o computador fica como novo']
            },
            {
                h2: 'Ainda em dúvida?',
                p: ['Conte o que está acontecendo pelo WhatsApp. O diagnóstico é grátis e você recebe a indicação do serviço certo e o valor antes de decidir.']
            }
        ]
    }
];
