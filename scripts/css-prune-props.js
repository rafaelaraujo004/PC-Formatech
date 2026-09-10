#!/usr/bin/env node
/**
 * Poda no nível de PROPRIEDADE.
 *
 * O css-prune.js remove regras inteiras que estão encobertas. Sobram regras
 * vivas que carregam uma ou outra propriedade morta — declarada de novo mais
 * adiante na cascata, no mesmo seletor e no mesmo @media. São essas que este
 * script tira.
 *
 * Uso: node scripts/css-prune-props.js --dry   styles.css mobile-desktop.css styles2.css
 *      node scripts/css-prune-props.js --apply styles.css mobile-desktop.css styles2.css
 *
 * Segurança:
 *   • compara nomes de propriedade EXATOS. "padding-top" nunca é considerado
 *     coberto por "padding", porque a ordem entre atalho e propriedade longa
 *     depende de qual vem depois — o conservador aqui é não mexer;
 *   • uma propriedade !important só é considerada morta se a que a cobre
 *     também for !important;
 *   • regras dentro de @keyframes ficam intocadas;
 *   • listas de seletores separadas por vírgula ficam intocadas, porque a
 *     propriedade pode estar viva para um dos seletores da lista.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const aplicar = args.includes('--apply');
const arquivos = args.filter((a) => !a.startsWith('--'));

if (!arquivos.length) {
    console.error('uso: node scripts/css-prune-props.js [--dry|--apply] <css em ordem de carga>');
    process.exit(1);
}

function parse(arquivo, ordem) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const mascarado = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const regras = [];
    let i = 0, media = '', profundidade = 0, emKeyframes = false;

    while (i < mascarado.length) {
        const abre = mascarado.indexOf('{', i);
        if (abre === -1) break;
        const cabecalho = mascarado.slice(i, abre).trim();

        if (/^@(media|supports)/.test(cabecalho)) { media = cabecalho.replace(/\s+/g, ' '); profundidade++; i = abre + 1; continue; }
        if (/^@keyframes/.test(cabecalho)) { emKeyframes = true; profundidade++; i = abre + 1; continue; }

        const fecha = mascarado.indexOf('}', abre);
        if (fecha === -1) break;

        const seletores = cabecalho && !cabecalho.startsWith('@')
            ? cabecalho.split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean)
            : [];

        if (seletores.length) {
            // Declarações com posição exata dentro do corpo.
            const declaracoes = [];
            let pos = abre + 1;
            mascarado.slice(abre + 1, fecha).split(';').forEach((bruto) => {
                const inicioRel = pos;
                pos += bruto.length + 1; // +1 do ';'
                const d = bruto.trim();
                if (!d) return;
                const c = d.indexOf(':');
                if (c === -1) return;
                const nome = d.slice(0, c).trim().toLowerCase();
                if (!nome || nome.startsWith('--')) return; // variáveis ficam
                declaracoes.push({
                    nome,
                    importante: /!important\s*$/.test(d),
                    inicio: inicioRel,
                    fim: inicioRel + bruto.length + 1
                });
            });

            regras.push({
                arquivo, ordem, media, emKeyframes,
                seletores, declaracoes,
                linha: mascarado.slice(0, abre).split('\n').length,
                unico: seletores.length === 1
            });
        }

        i = fecha + 1;
        const prox = mascarado.slice(i).match(/^\s*\}/);
        if (prox && profundidade > 0) { profundidade--; media = ''; emKeyframes = false; i += prox[0].length; }
    }
    return regras;
}

const todas = [];
arquivos.forEach((a, ordem) => todas.push(...parse(a, ordem)));
todas.sort((a, b) => (a.ordem - b.ordem) || (a.declaracoes[0] ? a.declaracoes[0].inicio : 0) - (b.declaracoes[0] ? b.declaracoes[0].inicio : 0));

const mortas = [];

todas.forEach((regra, idx) => {
    if (!regra.unico || regra.emKeyframes) return;
    const sel = regra.seletores[0];
    const posteriores = todas.slice(idx + 1).filter((o) => o.media === regra.media && o.seletores.includes(sel));
    if (!posteriores.length) return;

    regra.declaracoes.forEach((d) => {
        const coberta = posteriores.some((post) =>
            post.declaracoes.some((q) => q.nome === d.nome && (!d.importante || q.importante))
        );
        if (coberta) {
            mortas.push({
                arquivo: regra.arquivo, linha: regra.linha, seletor: sel, media: regra.media,
                prop: d.nome, inicio: d.inicio, fim: d.fim,
                porQuem: posteriores.filter((p) => p.declaracoes.some((q) => q.nome === d.nome))
                    .map((p) => path.basename(p.arquivo) + ':' + p.linha)
            });
        }
    });
});

console.log('Propriedades mortas encontradas: ' + mortas.length + '\n');

const porArquivo = {};
mortas.forEach((m) => { (porArquivo[m.arquivo] = porArquivo[m.arquivo] || []).push(m); });

Object.entries(porArquivo).forEach(([arq, lista]) => {
    console.log('── ' + path.basename(arq) + ' (' + lista.length + ') ──');
    lista.slice(0, 25).forEach((m) => {
        console.log('  :' + m.linha + '  ' + m.seletor + (m.media ? ' [' + m.media.replace('@media screen and ', '') + ']' : '') +
            '  → ' + m.prop + '  (encoberta por ' + m.porQuem.join(', ') + ')');
    });
    if (lista.length > 25) console.log('  ... e mais ' + (lista.length - 25));
});

if (!aplicar) {
    console.log('\n(simulação — nada foi gravado; use --apply)');
    process.exit(0);
}

let removidas = 0;
Object.entries(porArquivo).forEach(([arq, lista]) => {
    let texto = fs.readFileSync(arq, 'utf8');
    lista.sort((a, b) => b.inicio - a.inicio).forEach((m) => {
        const trecho = texto.slice(m.inicio, m.fim);
        // Só remove se o trecho de fato contém a propriedade esperada.
        if (!new RegExp('(^|[\\s;{])' + m.prop.replace(/[-]/g, '\\-') + '\\s*:').test(trecho)) return;
        texto = texto.slice(0, m.inicio) + texto.slice(m.fim);
        removidas++;
    });
    // Regras que ficaram vazias saem inteiras.
    texto = texto.replace(/([^{}]+)\{\s*\}\s*/g, (m, sel) => (sel.trim().startsWith('@') ? m : ''));
    fs.writeFileSync(arq, texto);
});

console.log('\nRemovidas ' + removidas + ' propriedades mortas.');
