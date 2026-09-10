#!/usr/bin/env node
/**
 * Responde uma pergunta específica: mover styles2.css para antes de
 * mobile-desktop.css mudaria alguma coisa?
 *
 * Só muda se as duas folhas declararem a MESMA propriedade no MESMO seletor,
 * sob o mesmo contexto de @media. Se a interseção for vazia, a ordem entre elas
 * é irrelevante e a fusão é segura.
 */

const fs = require('fs');
const path = require('path');

function parse(arquivo) {
    const texto = fs.readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
    const regras = [];
    let i = 0, media = '', profundidade = 0;

    while (i < texto.length) {
        const abre = texto.indexOf('{', i);
        if (abre === -1) break;
        const cabecalho = texto.slice(i, abre).trim();

        if (cabecalho.startsWith('@media') || cabecalho.startsWith('@supports') || cabecalho.startsWith('@keyframes')) {
            media = cabecalho;
            profundidade++;
            i = abre + 1;
            continue;
        }

        const fecha = texto.indexOf('}', abre);
        if (fecha === -1) break;
        const corpo = texto.slice(abre + 1, fecha);
        const props = corpo.split(';').map((d) => d.trim()).filter(Boolean)
            .map((d) => d.slice(0, d.indexOf(':')).trim()).filter(Boolean);

        if (cabecalho && !cabecalho.startsWith('@')) {
            cabecalho.split(',').forEach((sel) => {
                const s = sel.trim().replace(/\s+/g, ' ');
                if (s) regras.push({ media, seletor: s, props });
            });
        }

        i = fecha + 1;
        const proximo = texto.slice(i).match(/^\s*\}/);
        if (proximo && profundidade > 0) { profundidade--; media = ''; i += proximo[0].length; }
    }
    return regras;
}

const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error('uso: node scripts/css-conflict.js A.css B.css'); process.exit(1); }

const ra = parse(a), rb = parse(b);

const mapa = new Map();
ra.forEach((r) => {
    const k = r.media + '||' + r.seletor;
    if (!mapa.has(k)) mapa.set(k, new Set());
    r.props.forEach((p) => mapa.get(k).add(p));
});

const conflitos = [];
rb.forEach((r) => {
    const k = r.media + '||' + r.seletor;
    const doA = mapa.get(k);
    if (!doA) return;
    const comuns = r.props.filter((p) => doA.has(p));
    if (comuns.length) conflitos.push({ seletor: r.seletor, media: r.media, props: comuns });
});

console.log(path.basename(a) + ' × ' + path.basename(b));
console.log('  regras: ' + ra.length + ' / ' + rb.length);
console.log('  conflitos reais (mesmo seletor + mesma propriedade + mesmo @media): ' + conflitos.length);

if (!conflitos.length) {
    console.log('\n  => A ordem entre estas duas folhas é IRRELEVANTE. Fusão segura.');
} else {
    console.log('\n  => A ordem IMPORTA. Conflitos:');
    conflitos.forEach((c) => {
        console.log('     ' + c.seletor + (c.media ? '  [' + c.media + ']' : ''));
        console.log('       props: ' + c.props.join(', '));
    });
}
