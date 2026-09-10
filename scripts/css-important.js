#!/usr/bin/env node
/**
 * Quais !important são realmente necessários?
 *
 * theme-system.css carrega DEPOIS de styles.css, mobile-desktop.css e
 * styles2.css. Numa cascata, quem vem depois já ganha quando a especificidade
 * empata — o !important só é necessário quando existe um rival com
 * especificidade MAIOR declarando a mesma propriedade.
 *
 * Uso: node scripts/css-important.js styles.css mobile-desktop.css styles2.css theme-system.css
 *      (na ordem de carga; o !important analisado é o do ÚLTIMO arquivo)
 */

const fs = require('fs');
const path = require('path');

const arquivos = process.argv.slice(2);
if (arquivos.length < 2) {
    console.error('uso: node scripts/css-important.js <css anteriores...> <css a analisar>');
    process.exit(1);
}
const alvo = arquivos[arquivos.length - 1];

function parse(arquivo) {
    const texto = fs.readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const regras = [];
    let i = 0, media = '', prof = 0;

    while (i < texto.length) {
        const abre = texto.indexOf('{', i);
        if (abre === -1) break;
        const cab = texto.slice(i, abre).trim();

        if (/^@(media|supports|keyframes)/.test(cab)) { media = cab.replace(/\s+/g, ' '); prof++; i = abre + 1; continue; }

        const fecha = texto.indexOf('}', abre);
        if (fecha === -1) break;

        const props = texto.slice(abre + 1, fecha).split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
            const c = d.indexOf(':');
            if (c === -1) return null;
            return { nome: d.slice(0, c).trim().toLowerCase(), importante: /!important\s*$/.test(d) };
        }).filter(Boolean);

        if (cab && !cab.startsWith('@')) {
            cab.split(',').forEach((s) => {
                const sel = s.trim().replace(/\s+/g, ' ');
                if (sel) regras.push({ arquivo: path.basename(arquivo), media, seletor: sel, props, linha: texto.slice(0, abre).split('\n').length });
            });
        }

        i = fecha + 1;
        const prox = texto.slice(i).match(/^\s*\}/);
        if (prox && prof > 0) { prof--; media = ''; i += prox[0].length; }
    }
    return regras;
}

/** (ids, classes, tags) achatado em um número comparável. */
function espec(sel) {
    const semPseudoEl = sel.replace(/::[a-z-]+/g, ' ');
    const ids = (semPseudoEl.match(/#[\w-]+/g) || []).length;
    const classes = (semPseudoEl.match(/\.[\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g) || []).length;
    const tags = ((semPseudoEl.replace(/[.#][\w-]+|\[[^\]]+\]|:[a-z-]+(\([^)]*\))?/g, '')).match(/\b[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classes * 100 + tags;
}

/** O seletor B pode casar os mesmos elementos que A? Aproximação por sufixo. */
function podeColidir(a, b) {
    const chaveA = a.split(/[\s>+~]/).filter(Boolean).pop() || a;
    const chaveB = b.split(/[\s>+~]/).filter(Boolean).pop() || b;
    return chaveA === chaveB || chaveB.includes(chaveA) || chaveA.includes(chaveB);
}

const anteriores = [];
arquivos.slice(0, -1).forEach((a) => anteriores.push(...parse(a)));
const regrasAlvo = parse(alvo);

let total = 0, necessarios = 0, desnecessarios = 0;
const lista = [];

regrasAlvo.forEach((r) => {
    const e = espec(r.seletor);
    r.props.filter((p) => p.importante).forEach((p) => {
        total++;
        const rival = anteriores.find((o) =>
            o.media === r.media &&
            espec(o.seletor) > e &&
            podeColidir(r.seletor, o.seletor) &&
            o.props.some((q) => q.nome === p.nome)
        );
        if (rival) {
            necessarios++;
        } else {
            desnecessarios++;
            lista.push({ linha: r.linha, seletor: r.seletor, prop: p.nome, media: r.media });
        }
    });
});

console.log('Analisando !important em ' + path.basename(alvo));
console.log('  contra: ' + arquivos.slice(0, -1).map((a) => path.basename(a)).join(', '));
console.log('');
console.log('  total de !important:        ' + total);
console.log('  com rival de especificidade maior (necessários): ' + necessarios);
console.log('  sem rival identificável (candidatos a remover):  ' + desnecessarios);
console.log('');
console.log('Amostra dos candidatos:');
lista.slice(0, 30).forEach((l) => {
    console.log('  :' + l.linha + '  ' + l.seletor + '  → ' + l.prop + (l.media ? '  [' + l.media + ']' : ''));
});
if (lista.length > 30) console.log('  ... e mais ' + (lista.length - 30));
console.log('');
console.log('Observação: "sem rival identificável" não é permissão automática para');
console.log('remover — a heurística de colisão é aproximada e o CSS inline ou o');
console.log('JS podem definir estilo direto no elemento, que só !important vence.');
