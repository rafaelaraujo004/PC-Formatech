// PDF do orçamento e do laudo técnico que vai para o cliente (jsPDF +
// autoTable, carregados no admin.html).
//
// Um atendimento tem um número só, do começo ao fim: o "Orçamento Nº
// 2026-0007" vira o "Laudo Nº 2026-0007" depois do serviço.
//
// O PDF leva:
//   • o logo (icon-512.png) num cabeçalho da mesma cor do fundo dele;
//   • os itens, os totais e o valor por extenso;
//   • o QR Code do Pix com o valor exato (pix.js + vendor/qrcode-generator.js);
//   • no orçamento, o botão "Aprovar pelo WhatsApp"; no laudo, as assinaturas.

(function () {
    'use strict';

    const EMPRESA = {
        nome: 'PC Formatech',
        linha: 'Assistência técnica em informática',
        endereco: 'Rodovia PA-160, Serra Dourada II · Canaã dos Carajás/PA',
        whatsapp: '(94) 98430-5772',
        whatsappNumero: '5594984305772',
        site: 'www.pcformatech.com.br',
        instagram: '@pcformatech',
        email: 'rafaelaraujo004@gmail.com'
    };

    const COR = {
        fundoTopo: [6, 15, 27],      // o mesmo azul quase preto do fundo do logo
        menta: [94, 226, 206],
        teal: [11, 61, 61],
        verde: [31, 122, 92],
        zap: [37, 211, 102],
        texto: [23, 37, 42],
        suave: [96, 112, 118],
        claro: [196, 212, 214],
        linha: [222, 230, 229],
        fundo: [243, 248, 247],
        zebra: [247, 251, 250]
    };

    const LARG = 210;
    const ALT = 297;
    const M = 14;               // margem
    const UTIL = LARG - 2 * M;
    const LIMITE = ALT - 22;    // abaixo daqui fica o rodapé

    // ── Formatos ──────────────────────────────────────────────────────────

    const moeda = (v) => 'R$ ' + (Number(v) || 0).toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const dataBR = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '');

    function somarDias(iso, dias) {
        const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
        d.setDate(d.getDate() + (Number(dias) || 0));
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    const quantidade = (q) => {
        const n = Number(q) || 1;
        return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
    };

    /** Subtotal, desconto (nunca maior que o subtotal) e total. */
    function totais(orc) {
        const soma = (lista) => (Array.isArray(lista) ? lista : [])
            .reduce((t, i) => t + (Number(i.quantity) || 1) * (Number(i.price) || 0), 0);
        const servicos = soma(orc.services);
        const produtos = soma(orc.products);
        const subtotal = servicos + produtos;
        const desconto = Math.min(Math.max(Number(orc.desconto) || 0, 0), subtotal);
        return { servicos, produtos, subtotal, desconto, total: Math.round((subtotal - desconto) * 100) / 100 };
    }

    // ── Valor por extenso ─────────────────────────────────────────────────

    const UNIDADES = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
        'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    function ate999(n) {
        if (n === 100) return 'cem';
        const partes = [];
        const c = Math.floor(n / 100);
        const r = n % 100;
        if (c) partes.push(CENTENAS[c]);
        if (r) partes.push(r < 20 ? UNIDADES[r] : DEZENAS[Math.floor(r / 10)] + (r % 10 ? ' e ' + UNIDADES[r % 10] : ''));
        return partes.join(' e ');
    }

    /** 1530 → "mil quinhentos e trinta"; 2000500 → "dois milhões e quinhentos". */
    function inteiroPorExtenso(n) {
        if (n === 0) return 'zero';
        const grupos = [
            { valor: Math.floor(n / 1e6), nome: (v) => (v === 1 ? 'um milhão' : ate999(v) + ' milhões') },
            { valor: Math.floor((n % 1e6) / 1000), nome: (v) => (v === 1 ? 'mil' : ate999(v) + ' mil') },
            { valor: n % 1000, nome: ate999 }
        ].filter((g) => g.valor);
        return grupos.map((g, i) => {
            const texto = g.nome(g.valor);
            if (i === 0) return texto;
            // "mil e quinhentos", "mil e trinta", mas "mil duzentos e trinta".
            return (g.valor < 100 || g.valor % 100 === 0 ? ' e ' : ' ') + texto;
        }).join('');
    }

    function extenso(valor) {
        const centavosTotais = Math.round((Number(valor) || 0) * 100);
        const reais = Math.floor(centavosTotais / 100);
        const centavos = centavosTotais % 100;
        const partes = [];
        if (reais) {
            const redondo = reais >= 1e6 && reais % 1e6 === 0;
            partes.push(inteiroPorExtenso(reais) + (reais === 1 ? ' real' : (redondo ? ' de reais' : ' reais')));
        }
        if (centavos) partes.push(inteiroPorExtenso(centavos) + (centavos === 1 ? ' centavo' : ' centavos'));
        return partes.length ? partes.join(' e ') : 'zero reais';
    }

    // ── Arquivo ───────────────────────────────────────────────────────────

    const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

    /** "Orcamento-2026-0007-Maria-Rosa.pdf" (sem acento e sem espaço: abre em qualquer app). */
    function nomeArquivo(orc, cliente, tipo) {
        const doc = tipo === 'laudo' ? 'Laudo' : 'Orcamento';
        const nome = semAcento(cliente && cliente.name).replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'Cliente';
        return `${doc}-${orc.number}-${nome}.pdf`;
    }

    let logoPronto = null;
    function carregarLogo() {
        if (!logoPronto) {
            logoPronto = fetch('/icon-512.png')
                .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('sem logo'))))
                .then((blob) => new Promise((resolve, reject) => {
                    const leitor = new FileReader();
                    leitor.onload = () => resolve(leitor.result);
                    leitor.onerror = reject;
                    leitor.readAsDataURL(blob);
                }))
                .catch(() => { logoPronto = null; return null; });
        }
        return logoPronto;
    }

    /** Link de aprovação: abre a conversa da loja com a mensagem pronta. */
    function linkAprovar(orc, total) {
        const texto = `Olá! Aprovo o orçamento Nº ${orc.number} da PC Formatech (${moeda(total)}). Como seguimos?`;
        return `https://wa.me/${EMPRESA.whatsappNumero}?text=${encodeURIComponent(texto)}`;
    }

    // ── Desenho ───────────────────────────────────────────────────────────

    /**
     * Gera o PDF. opcoes.tipo: 'orcamento' | 'laudo' (padrão: a etapa do
     * atendimento). opcoes.pix: false tira o QR Code do Pix.
     * Devolve o jsPDF pronto (doc.save, doc.output('blob')…).
     */
    async function gerar(orc, cliente, opcoes) {
        const o = opcoes || {};
        const laudo = (o.tipo || (orc.etapa === 'laudo' ? 'laudo' : 'orcamento')) === 'laudo';
        const titulo = laudo ? 'LAUDO TÉCNICO' : 'ORÇAMENTO';
        const nomeDoc = laudo ? 'Laudo' : 'Orçamento';
        const t = totais(orc);
        const logo = await carregarLogo();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
        doc.setProperties({
            title: `${nomeDoc} Nº ${orc.number} - ${(cliente && cliente.name) || ''}`,
            author: EMPRESA.nome,
            creator: EMPRESA.nome
        });

        const fonte = (estilo, tamanho, cor) => {
            doc.setFont('helvetica', estilo);
            doc.setFontSize(tamanho);
            doc.setTextColor(...(cor || COR.texto));
        };
        const rotulo = (texto, x, yy, cor) => { fonte('bold', 7.2, cor || COR.suave); doc.text(texto, x, yy); };
        let y = 0;
        const espaco = (altura) => {
            if (y + altura > LIMITE) { doc.addPage(); y = 20; }
        };

        // Cabeçalho: faixa escura com o logo, os dados da loja e o documento.
        doc.setFillColor(...COR.fundoTopo);
        doc.rect(0, 0, LARG, 46, 'F');
        doc.setFillColor(...COR.menta);
        doc.rect(0, 46, LARG, 1.2, 'F');
        if (logo) {
            try { doc.addImage(logo, 'PNG', M - 2, 5, 36, 36, 'logo', 'FAST'); } catch (e) { /* segue sem logo */ }
        }
        const xT = logo ? M + 38 : M;
        fonte('bold', 18, [255, 255, 255]);
        doc.text(EMPRESA.nome, xT, 17);
        fonte('normal', 8.4, COR.menta);
        doc.text(EMPRESA.linha, xT, 22.6);
        fonte('normal', 8, COR.claro);
        doc.text(EMPRESA.endereco, xT, 30);
        doc.text(`WhatsApp ${EMPRESA.whatsapp}   ·   ${EMPRESA.site}`, xT, 34.8);
        doc.text(`Instagram ${EMPRESA.instagram}   ·   ${EMPRESA.email}`, xT, 39.6);

        fonte('bold', 9, COR.menta);
        doc.text(titulo, LARG - M, 15, { align: 'right' });
        fonte('bold', 17, [255, 255, 255]);
        doc.text(`Nº ${orc.number}`, LARG - M, 24, { align: 'right' });
        fonte('normal', 8.4, COR.claro);
        if (laudo) {
            doc.text(`Emitido em ${dataBR(orc.laudoData || orc.date)}`, LARG - M, 31, { align: 'right' });
            if (orc.laudoData && orc.laudoData !== orc.date) doc.text(`Orçamento de ${dataBR(orc.date)}`, LARG - M, 35.8, { align: 'right' });
        } else {
            doc.text(`Emitido em ${dataBR(orc.date)}`, LARG - M, 31, { align: 'right' });
            fonte('bold', 8.4, COR.menta);
            doc.text(`Válido até ${dataBR(somarDias(orc.date, orc.validadeDias || 7))}`, LARG - M, 35.8, { align: 'right' });
        }

        // Cliente (e equipamento, quando informado).
        y = 55;
        const equipamento = String(orc.equipamento || '').trim();
        const linhasEquip = equipamento ? doc.splitTextToSize(equipamento, 70).slice(0, 2) : [];
        doc.setFillColor(...COR.fundo);
        doc.roundedRect(M, y, UTIL, 23, 3, 3, 'F');
        rotulo('CLIENTE', M + 5, y + 6.6);
        fonte('bold', 12.5);
        doc.text(doc.splitTextToSize(String((cliente && cliente.name) || 'Cliente'), equipamento ? 95 : 170)[0], M + 5, y + 13.4);
        fonte('normal', 9, COR.suave);
        const contato = [cliente && cliente.phone, cliente && cliente.email].filter(Boolean).join('   ·   ');
        if (contato) doc.text(contato, M + 5, y + 18.9);
        if (equipamento) {
            rotulo('EQUIPAMENTO', 120, y + 6.6);
            fonte('bold', 10);
            doc.text(linhasEquip, 120, y + 12.8, { lineHeightFactor: 1.3 });
        }
        y += 23 + 8;

        // Textos do atendimento, com uma faixa de cor à esquerda. Texto longo
        // continua na página seguinte.
        const bloco = (tituloBloco, texto, cor) => {
            const limpo = String(texto || '').trim();
            if (!limpo) return;
            fonte('normal', 9.6);
            let linhas = doc.splitTextToSize(limpo, UTIL - 8);
            const passo = 4.55;
            espaco(7 + passo * Math.min(linhas.length, 3) + 4);
            let primeiro = true;
            while (linhas.length) {
                const cabem = Math.max(1, Math.floor((LIMITE - y - (primeiro ? 9 : 3)) / passo));
                const parte = linhas.slice(0, cabem);
                linhas = linhas.slice(cabem);
                const h = (primeiro ? 8.6 : 2) + parte.length * passo + 1.5;
                doc.setFillColor(...cor);
                doc.rect(M, y, 1.3, h, 'F');
                if (primeiro) { fonte('bold', 9.6, COR.teal); doc.text(tituloBloco, M + 5, y + 4.6); }
                fonte('normal', 9.6);
                doc.text(parte, M + 5, y + (primeiro ? 9.9 : 3.3), { lineHeightFactor: 1.36 });
                y += h + 4.5;
                primeiro = false;
                if (linhas.length) { doc.addPage(); y = 20; }
            }
        };
        if (laudo) {
            bloco('Defeito relatado pelo cliente', orc.defect, [214, 158, 46]);
            bloco('Diagnóstico técnico', orc.report, [47, 109, 153]);
            bloco('Solução aplicada', orc.solution, COR.verde);
        } else {
            bloco('Problema relatado pelo cliente', orc.defect, [214, 158, 46]);
        }

        // Itens: serviços e produtos numa tabela só, separados por título.
        const servicos = (Array.isArray(orc.services) ? orc.services : []).filter((i) => i && i.name);
        const produtos = (Array.isArray(orc.products) ? orc.products : []).filter((i) => i && i.name);
        const corpo = [];
        const secao = (nome) => corpo.push([{
            content: nome,
            colSpan: 4,
            styles: { fontStyle: 'bold', fontSize: 7.4, textColor: COR.teal, fillColor: [255, 255, 255], cellPadding: { top: 3.4, bottom: 1.4, left: 3, right: 3 } }
        }]);
        const linha = (i) => {
            const q = Number(i.quantity) || 1;
            const unidade = i.unit && i.unit !== 'un' ? ' ' + i.unit : '';
            corpo.push([String(i.name), quantidade(q) + unidade, moeda(i.price), moeda(q * (Number(i.price) || 0))]);
        };
        if (servicos.length) { if (produtos.length) secao(laudo ? 'SERVIÇOS REALIZADOS' : 'SERVIÇOS'); servicos.forEach(linha); }
        if (produtos.length) { secao('PRODUTOS'); produtos.forEach(linha); }

        if (corpo.length) {
            espaco(30);
            doc.autoTable({
                startY: y,
                head: [['Descrição', 'Qtd', 'Valor unit.', 'Total']],
                body: corpo,
                theme: 'plain',
                margin: { left: M, right: M, top: 20, bottom: ALT - LIMITE + 2 },
                styles: { font: 'helvetica', fontSize: 9.6, textColor: COR.texto, cellPadding: { top: 2.9, bottom: 2.9, left: 3, right: 3 }, valign: 'middle', overflow: 'linebreak' },
                headStyles: { fillColor: COR.teal, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.4 },
                alternateRowStyles: { fillColor: COR.zebra },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 18, halign: 'center' },
                    2: { cellWidth: 32, halign: 'right' },
                    3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: (d) => {
                    if (d.section === 'head' && d.column.index > 0) d.cell.styles.halign = d.column.index === 1 ? 'center' : 'right';
                },
                didDrawCell: (d) => {
                    if (d.section !== 'body') return;
                    doc.setDrawColor(...COR.linha);
                    doc.setLineWidth(0.15);
                    doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
                }
            });
            y = doc.lastAutoTable.finalY + 6;
        } else {
            espaco(12);
            fonte('italic', 9.4, COR.suave);
            doc.text('Nenhum item lançado.', M, y + 4);
            y += 10;
        }

        // Totais à direita; o valor por extenso à esquerda.
        const alturaTotais = 6 + (t.desconto > 0 ? 6 : 0) + 15;
        espaco(alturaTotais + 4);
        const xCaixa = LARG - M - 76;
        const topoTotais = y;
        const linhaTotal = (nome, valor, cor) => {
            fonte('normal', 9.4, COR.suave);
            doc.text(nome, xCaixa + 4, y + 4);
            fonte('bold', 9.6, cor || COR.texto);
            doc.text(valor, LARG - M - 4, y + 4, { align: 'right' });
            y += 6;
        };
        linhaTotal('Subtotal', moeda(t.subtotal));
        if (t.desconto > 0) linhaTotal('Desconto', '- ' + moeda(t.desconto), COR.verde);
        doc.setFillColor(...COR.teal);
        doc.roundedRect(xCaixa, y + 0.5, 76, 13, 2.6, 2.6, 'F');
        fonte('bold', 9, COR.menta);
        doc.text('TOTAL', xCaixa + 4.5, y + 8.6);
        fonte('bold', 15, [255, 255, 255]);
        doc.text(moeda(t.total), LARG - M - 4.5, y + 9.2, { align: 'right' });
        y += 15;
        rotulo('VALOR POR EXTENSO', M, topoTotais + 4);
        fonte('italic', 9.4);
        const porExtenso = extenso(t.total);
        doc.text(doc.splitTextToSize(porExtenso.charAt(0).toUpperCase() + porExtenso.slice(1) + '.', xCaixa - M - 8), M, topoTotais + 9.4, { lineHeightFactor: 1.35 });
        y += 7;

        // Pagamento: QR Code do Pix com o valor exato e, no orçamento, o botão
        // de aprovar pelo WhatsApp.
        const pix = o.pix !== false && orc.pix !== false && t.total > 0 && window.PCFTPix && typeof window.qrcode === 'function';
        const pagamento = String(orc.pagamento || 'Pix, cartão ou dinheiro').trim();
        const aprovar = !laudo;
        if (pix) {
            const codigoPix = window.PCFTPix.codigo(t.total, 'PCF' + String(orc.number).replace(/\D/g, ''), `${nomeDoc} ${orc.number}`);
            const altura = 47;
            espaco(altura + 2);
            doc.setDrawColor(...COR.linha);
            doc.setLineWidth(0.35);
            doc.roundedRect(M, y, UTIL, altura, 3, 3, 'S');
            desenharQr(doc, codigoPix, M + 5, y + 5, 37);
            const xP = M + 48;
            const largTexto = aprovar ? 78 : 125;
            fonte('bold', 12, COR.teal);
            doc.text('Pague com Pix', xP, y + 9);
            fonte('normal', 8.6, COR.texto);
            const instrucao = doc.splitTextToSize(`No app do banco, toque em Pix e depois em "Ler QR Code". O valor de ${moeda(t.total)} já vem preenchido.`, largTexto);
            doc.text(instrucao, xP, y + 14.5, { lineHeightFactor: 1.32 });
            let yP = y + 14.5 + instrucao.length * 3.9 + 1.5;
            fonte('normal', 8, COR.suave);
            doc.text(`Recebedor: ${window.PCFTPix.dados.titular} (${EMPRESA.nome})`, xP, yP);
            yP += 4.3;
            doc.text(doc.splitTextToSize(`Também aceitamos: ${pagamento}.`, largTexto)[0], xP, yP);
            yP += 5.3;
            rotulo('PIX COPIA E COLA', xP, yP);
            doc.setFont('courier', 'normal');
            doc.setFontSize(6.3);
            doc.setTextColor(...COR.suave);
            // O código não tem onde quebrar: corta em linhas do mesmo tamanho.
            const porLinha = Math.max(20, Math.floor(largTexto / doc.getTextWidth('0')));
            doc.text(codigoPix.match(new RegExp('.{1,' + porLinha + '}', 'g')).slice(0, 4), xP, yP + 3.6, { lineHeightFactor: 1.15 });
            if (aprovar) botaoAprovar(M + UTIL - 48, y + 9, 44);
            y += altura + 6;
        } else {
            espaco(aprovar ? 20 : 10);
            rotulo('FORMAS DE PAGAMENTO', M, y + 4);
            fonte('normal', 9.4);
            doc.text(pagamento, M, y + 9.4);
            if (aprovar) botaoAprovar(LARG - M - 48, y, 48);
            y += aprovar ? 20 : 14;
        }

        function botaoAprovar(x, yy, largura) {
            doc.setFillColor(...COR.zap);
            doc.roundedRect(x, yy, largura, 12, 2.6, 2.6, 'F');
            fonte('bold', 9.4, [255, 255, 255]);
            doc.text('Aprovar pelo WhatsApp', x + largura / 2, yy + 7.6, { align: 'center' });
            doc.link(x, yy, largura, 12, { url: linkAprovar(orc, t.total) });
            fonte('normal', 7.6, COR.suave);
            doc.text(doc.splitTextToSize('Toque no botão e a conversa abre com a mensagem pronta.', largura), x + largura / 2, yy + 16.5, { align: 'center', lineHeightFactor: 1.3 });
        }

        // Condições: garantia, validade e observações.
        const condicoes = [];
        if (orc.warranty) condicoes.push(['Garantia', String(orc.warranty)]);
        if (!laudo) condicoes.push(['Validade', `Este orçamento vale até ${dataBR(somarDias(orc.date, orc.validadeDias || 7))}. Depois dessa data, os valores podem mudar.`]);
        if (orc.observations) condicoes.push(['Observações', String(orc.observations)]);
        if (condicoes.length) {
            espaco(14);
            rotulo('CONDIÇÕES', M, y + 3);
            y += 7;
            condicoes.forEach(([nome, texto]) => {
                fonte('normal', 9);
                const linhas = doc.splitTextToSize(texto, UTIL - 32);
                espaco(linhas.length * 4.2 + 3);
                doc.setFillColor(...COR.menta);
                doc.circle(M + 1.2, y + 1.4, 0.9, 'F');
                fonte('bold', 9);
                doc.text(nome, M + 4.5, y + 2.6);
                fonte('normal', 9);
                doc.text(linhas, M + 30, y + 2.6, { lineHeightFactor: 1.32 });
                y += linhas.length * 4.2 + 2.6;
            });
        }

        // Laudo: assinaturas do técnico e do cliente.
        if (laudo) {
            espaco(30);
            y = Math.max(y + 16, Math.min(LIMITE - 14, y + 16));
            doc.setDrawColor(...COR.suave);
            doc.setLineWidth(0.3);
            doc.line(M + 6, y, M + 80, y);
            doc.line(LARG - M - 80, y, LARG - M - 6, y);
            fonte('bold', 8.8);
            doc.text(`${EMPRESA.nome}`, M + 43, y + 4.6, { align: 'center' });
            doc.text(String((cliente && cliente.name) || 'Cliente'), LARG - M - 43, y + 4.6, { align: 'center' });
            fonte('normal', 7.6, COR.suave);
            doc.text('Técnico responsável', M + 43, y + 8.4, { align: 'center' });
            doc.text('Cliente', LARG - M - 43, y + 8.4, { align: 'center' });
        }

        // Rodapé de todas as páginas; nas seguintes, uma linha de título no topo.
        const paginas = doc.getNumberOfPages();
        for (let p = 1; p <= paginas; p++) {
            doc.setPage(p);
            if (p > 1) {
                fonte('bold', 8, COR.teal);
                doc.text(`${EMPRESA.nome} · ${nomeDoc} Nº ${orc.number}`, M, 11);
                doc.setDrawColor(...COR.linha);
                doc.setLineWidth(0.3);
                doc.line(M, 13.5, LARG - M, 13.5);
            }
            doc.setDrawColor(...COR.linha);
            doc.setLineWidth(0.3);
            doc.line(M, ALT - 13, LARG - M, ALT - 13);
            fonte('normal', 7.4, COR.suave);
            doc.text(`${EMPRESA.nome} · ${EMPRESA.site} · WhatsApp ${EMPRESA.whatsapp} · Instagram ${EMPRESA.instagram}`, M, ALT - 8.4);
            doc.text(`${nomeDoc} Nº ${orc.number} · página ${p} de ${paginas}`, LARG - M, ALT - 8.4, { align: 'right' });
        }
        return doc;
    }

    /** QR Code em vetor (nítido em qualquer zoom): uma faixa por sequência de módulos escuros. */
    function desenharQr(doc, texto, x, y, lado) {
        const qr = window.qrcode(0, 'M');
        qr.addData(texto);
        qr.make();
        const n = qr.getModuleCount();
        const m = lado / n;
        doc.setFillColor(255, 255, 255);
        doc.rect(x - 1.5, y - 1.5, lado + 3, lado + 3, 'F');
        doc.setFillColor(...COR.fundoTopo);
        for (let r = 0; r < n; r++) {
            let c = 0;
            while (c < n) {
                if (!qr.isDark(r, c)) { c++; continue; }
                let fim = c;
                while (fim < n && qr.isDark(r, fim)) fim++;
                doc.rect(x + c * m, y + r * m, (fim - c) * m + 0.02, m + 0.02, 'F');
                c = fim;
            }
        }
    }

    window.PCFTOrcamentoPDF = { gerar, nomeArquivo, totais, extenso, moeda, somarDias, linkAprovar, EMPRESA };
})();
