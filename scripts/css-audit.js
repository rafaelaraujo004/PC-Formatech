#!/usr/bin/env node
/**
 * Diagnóstico da cascata de CSS.
 *
 * Uso: node scripts/css-audit.js [arquivo.css ...]
 *
 * Responde três perguntas antes de mexer em qualquer coisa:
 *   1. Que seletores duas folhas disputam entre si (e sob qual @media)?
 *   2. Que declarações estão completamente encobertas por uma posterior —
 *      isto é, mortas, seguras de apagar?
 *   3. Onde os !important realmente disputam com outro arquivo?
 *
 * O parser é deliberadamente simples: cobre regras, @media e blocos aninhados
 * de um nível, que é tudo o que este projeto usa. Não substitui um parser de
 * verdade; serve para decidir onde é seguro mexer.
 */

const fs = require('fs');
const path = require('path');

const arquivos = process.argv.slice(2);
if (!arquivos.length) {
    console.error('uso: node scripts/css-audit.js styles.css mobile-desktop.css styles2.css');
    process.exit(1);
}

/** Extrai regras {arquivo, media, seletor, props, linha}. */
function parse(arquivo) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const semComentarios = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const regras = [];

    let i = 0;
    let media = '';
    let profundidade = 0;

    while (i < semComentarios.length) {
        const abre = semComentarios.indexOf('{', i);
        if (abre === -1) break;

        const cabecalho = semComentarios.slice(i, abre).trim();
        const linha = semComentarios.slice(0, abre).split('\n').length;

        if (cabecalho.startsWith('@media') || cabecalho.startsWith('@supports')) {
            media = cabecalho;
            profundidade++;
            i = abre + 1;
            continue;
        }

        // Bloco de declarações: acha o fecha correspondente.
        let fecha = semComentarios.indexOf('}', abre);
        if (fecha === -1) break;

        const corpo = semComentarios.slice(abre + 1, fecha);
        const props = corpo
            .split(';')
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => {
                const c = d.indexOf(':');
                if (c === -1) return null;
                return {
                    nome: d.slice(0, c).trim(),
                    valor: d.slice(c + 1).trim(),
                    importante: /!important\s*$/.test(d)
                };
            })
            .filter(Boolean);

        if (cabecalho && !cabecalho.startsWith('@')) {
            cabecalho.split(',').forEach((sel) => {
                const s = sel.trim().replace(/\s+/g, ' ');
                if (s) regras.push({ arquivo: path.basename(arquivo), media, seletor: s, props, linha });
            });
        }

        i = fecha + 1;

        // Fecha o @media quando o próximo caractere significativo é '}'.
        const resto = semComentarios.slice(i);
        const proximo = resto.match(/^\s*\}/);
        if (proximo && profundidade > 0) {
            profundidade--;
            media = '';
            i += proximo[0].length;
        }
    }

    return regras;
}

/** Especificidade aproximada (a,b,c) — suficiente para comparar seletores simples. */
function especificidade(sel) {
    const limpo = sel.replace(/::?[a-z-]+(\([^)]*\))?/g, ' ');
    const ids = (limpo.match(/#[\w-]+/g) || []).length;
    const classes = (limpo.match(/\.[\w-]+|\[[^\]]+\]/g) || []).length;
    const tags = (limpo.replace(/[.#][\w-]+|\[[^\]]+\]/g, '').match(/\b[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classes * 100 + tags;
}

const todas = [];
arquivos.forEach((a) => todas.push(...parse(a)));

console.log('Regras lidas: ' + todas.length + ' em ' + arquivos.length + ' arquivo(s)\n');

/* ── 1 · Seletores disputados entre arquivos ─────────────────────────────── */
const porChave = new Map();
todas.forEach((r) => {
    const chave = r.media + '||' + r.seletor;
    if (!porChave.has(chave)) porChave.set(chave, []);
    porChave.get(chave).push(r);
});

const entreArquivos = [];
const dentroDoMesmo = [];
for (const [chave, regras] of porChave) {
    if (regras.length < 2) continue;
    const arqs = new Set(regras.map((r) => r.arquivo));
    (arqs.size > 1 ? entreArquivos : dentroDoMesmo).push([chave, regras]);
}

console.log('── Seletores repetidos ENTRE arquivos: ' + entreArquivos.length + ' ──');
entreArquivos.slice(0, 40).forEach(([chave, regras]) => {
    const [media, sel] = chave.split('||');
    console.log('  ' + sel + (media ? '   [' + media + ']' : ''));
    regras.forEach((r) => console.log('      ' + r.arquivo + ':' + r.linha + '  (' + r.props.length + ' props)'));
});

/* ── 2 · Declarações totalmente encobertas ───────────────────────────────── */
const mortas = [];
for (const [, regras] of porChave) {
    if (regras.length < 2) continue;
    for (let i = 0; i < regras.length - 1; i++) {
        const atual = regras[i];
        if (!atual.props.length) continue;

        const posteriores = regras.slice(i + 1);
        const cobertas = atual.props.filter((p) =>
            posteriores.some((post) =>
                post.props.some((q) => q.nome === p.nome && (!p.importante || q.importante))
            )
        );

        if (cobertas.length === atual.props.length) {
            mortas.push({
                arquivo: atual.arquivo,
                linha: atual.linha,
                seletor: atual.seletor,
                media: atual.media,
                props: atual.props.length,
                encobertaPor: posteriores.map((p) => p.arquivo + ':' + p.linha).join(', ')
            });
        }
    }
}

console.log('\n── Declarações COMPLETAMENTE encobertas (mortas): ' + mortas.length + ' ──');
const porArquivoMortas = {};
mortas.forEach((m) => { porArquivoMortas[m.arquivo] = (porArquivoMortas[m.arquivo] || 0) + 1; });
Object.entries(porArquivoMortas).forEach(([a, n]) => console.log('  ' + a + ': ' + n));
mortas.slice(0, 30).forEach((m) => {
    console.log('  ' + m.arquivo + ':' + m.linha + '  ' + m.seletor + '  (' + m.props + ' props) → encoberta por ' + m.encobertaPor);
});

/* ── 3 · !important que disputa com outro arquivo ────────────────────────── */
const importantes = todas.filter((r) => r.props.some((p) => p.importante));
let disputando = 0;
const semDisputa = [];
importantes.forEach((r) => {
    const espec = especificidade(r.seletor);
    const rivais = todas.filter((o) =>
        o !== r &&
        o.arquivo !== r.arquivo &&
        o.media === r.media &&
        o.seletor === r.seletor &&
        r.props.some((p) => p.importante && o.props.some((q) => q.nome === p.nome))
    );
    // Também conta rival com especificidade maior tocando a mesma propriedade.
    const rivaisEspec = todas.filter((o) =>
        o !== r && o.arquivo !== r.arquivo && especificidade(o.seletor) > espec &&
        o.seletor.includes(r.seletor.split(/[ >]/).pop())
    );
    if (rivais.length || rivaisEspec.length) disputando++;
    else semDisputa.push(r);
});

const totalImportantes = todas.reduce((n, r) => n + r.props.filter((p) => p.importante).length, 0);
console.log('\n── !important ──');
console.log('  propriedades com !important: ' + totalImportantes);
console.log('  regras que usam !important: ' + importantes.length);
console.log('  dessas, com rival identificável em outro arquivo: ' + disputando);
console.log('  sem rival aparente (candidatas a perder o !important): ' + semDisputa.length);
