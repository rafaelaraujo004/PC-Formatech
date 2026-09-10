#!/usr/bin/env node
/**
 * Remove declarações de CSS que estão completamente encobertas por outra
 * posterior na cascata — código morto, que não pinta um pixel.
 *
 * Uso: node scripts/css-prune.js --dry     (só lista)
 *      node scripts/css-prune.js --apply   (remove e grava)
 *
 * Regras de segurança — só remove quando TODAS valem:
 *   • a regra tem UM único seletor (nada de listas separadas por vírgula,
 *     onde apagar afetaria seletores que não foram analisados);
 *   • existe outra regra depois, com o mesmo seletor e o mesmo contexto de
 *     @media, declarando todas as mesmas propriedades;
 *   • se a propriedade encoberta é !important, a que encobre também é;
 *   • a regra não está dentro de @keyframes (onde "0%"/"to" não são seletores
 *     no sentido da cascata).
 *
 * A ordem dos arquivos na linha de comando precisa ser a ordem de carga no
 * HTML: é ela que define quem encobre quem.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const aplicar = args.includes('--apply');
const arquivos = args.filter((a) => !a.startsWith('--'));

if (!arquivos.length) {
    console.error('uso: node scripts/css-prune.js [--dry|--apply] styles.css mobile-desktop.css styles2.css');
    process.exit(1);
}

/** Regras com posição exata na fonte, para poder recortar depois. */
function parse(arquivo, ordem) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    const mascarado = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    const regras = [];

    let i = 0, media = '', profundidade = 0, dentroKeyframes = false;

    while (i < mascarado.length) {
        const abre = mascarado.indexOf('{', i);
        if (abre === -1) break;

        const inicioCabecalho = i;
        const cabecalho = mascarado.slice(i, abre).trim();

        if (/^@(media|supports)/.test(cabecalho)) {
            media = cabecalho.replace(/\s+/g, ' ');
            profundidade++;
            i = abre + 1;
            continue;
        }
        if (/^@keyframes/.test(cabecalho)) {
            dentroKeyframes = true;
            profundidade++;
            i = abre + 1;
            continue;
        }

        const fecha = mascarado.indexOf('}', abre);
        if (fecha === -1) break;

        const corpo = mascarado.slice(abre + 1, fecha);
        const props = corpo.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
            const c = d.indexOf(':');
            if (c === -1) return null;
            return { nome: d.slice(0, c).trim().toLowerCase(), importante: /!important\s*$/.test(d) };
        }).filter(Boolean);

        if (cabecalho && !cabecalho.startsWith('@')) {
            const seletores = cabecalho.split(',').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
            regras.push({
                arquivo, ordem,
                inicio: inicioCabecalho, fim: fecha + 1,
                linha: mascarado.slice(0, abre).split('\n').length,
                media, dentroKeyframes,
                seletores, props,
                unico: seletores.length === 1
            });
        }

        i = fecha + 1;
        const proximo = mascarado.slice(i).match(/^\s*\}/);
        if (proximo && profundidade > 0) {
            profundidade--;
            media = '';
            dentroKeyframes = false;
            i += proximo[0].length;
        }
    }

    return regras;
}

const todas = [];
arquivos.forEach((a, ordem) => todas.push(...parse(a, ordem)));

// Ordem de cascata: arquivo (ordem de carga), depois posição no arquivo.
todas.sort((a, b) => (a.ordem - b.ordem) || (a.inicio - b.inicio));

const mortas = [];

todas.forEach((regra, idx) => {
    if (!regra.unico || regra.dentroKeyframes || !regra.props.length) return;

    const sel = regra.seletores[0];
    const posteriores = todas.slice(idx + 1).filter((o) =>
        o.media === regra.media && o.seletores.includes(sel)
    );
    if (!posteriores.length) return;

    const todasCobertas = regra.props.every((p) =>
        posteriores.some((post) => post.props.some((q) => q.nome === p.nome && (!p.importante || q.importante)))
    );

    if (todasCobertas) {
        mortas.push({
            regra,
            porQuem: posteriores.map((p) => path.basename(p.arquivo) + ':' + p.linha)
        });
    }
});

console.log('Regras analisadas: ' + todas.length);
console.log('Declarações totalmente encobertas: ' + mortas.length + '\n');

const porArquivo = {};
mortas.forEach((m) => {
    const b = path.basename(m.regra.arquivo);
    (porArquivo[b] = porArquivo[b] || []).push(m);
});

Object.entries(porArquivo).forEach(([arq, lista]) => {
    console.log('── ' + arq + ' (' + lista.length + ') ──');
    lista.forEach((m) => {
        console.log('  :' + m.regra.linha + '  ' + m.regra.seletores[0] +
            (m.regra.media ? '  [' + m.regra.media + ']' : '') +
            '  (' + m.regra.props.length + ' props) → ' + m.porQuem.join(', '));
    });
});

if (!aplicar) {
    console.log('\n(simulação — nada foi gravado; use --apply para remover)');
    process.exit(0);
}

// Remove de trás para frente, para os offsets não se deslocarem.
let removidas = 0, bytes = 0;
Object.keys(porArquivo).forEach((arq) => {
    const caminho = mortas.find((m) => path.basename(m.regra.arquivo) === arq).regra.arquivo;
    let texto = fs.readFileSync(caminho, 'utf8');
    const alvos = porArquivo[arq].map((m) => m.regra).sort((a, b) => b.inicio - a.inicio);

    alvos.forEach((r) => {
        const trecho = texto.slice(r.inicio, r.fim);
        const comentario = '/* removido: encoberto por regra posterior — ' + r.seletores[0] + ' */';
        bytes += trecho.length;
        texto = texto.slice(0, r.inicio) + comentario + texto.slice(r.fim);
        removidas++;
    });

    fs.writeFileSync(caminho, texto);
});

console.log('\nRemovidas ' + removidas + ' declarações (' + Math.round(bytes / 1024) + ' KB de CSS morto).');
console.log('Cada uma deixou um comentário no lugar, para o histórico ficar legível no diff.');
