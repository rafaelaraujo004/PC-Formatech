#!/usr/bin/env node
/**
 * Remove !important de um subconjunto seguro de regras do theme-system.css.
 *
 * Uso: node scripts/css-drop-important.js --dry
 *      node scripts/css-drop-important.js --apply
 *
 * Escopo: só regras cujo seletor começa com html[data-theme=...].
 *
 * Por que essas são seguras:
 *   • theme-system.css é a última folha antes de refinements.css, então já
 *     ganha por ordem de carga em qualquer empate de especificidade;
 *   • html[data-theme='dark'] .algo tem especificidade (0,2,1) — maior que o
 *     .algo (0,1,0) que styles.css e styles2.css usam para as mesmas regras;
 *   • o seletor só casa quando o atributo está no <html>, então não existe
 *     risco de vazar para o tema claro.
 *
 * O que continua com !important: as regras sem o prefixo de tema, que são as
 * que de fato disputam com seletores mais específicos das folhas anteriores.
 *
 * Ainda assim, o resultado precisa ser conferido no navegador nos dois temas —
 * estilo inline posto por JS só perde para !important, e isso nenhum parser vê.
 */

const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, '..', 'theme-system.css');
const aplicar = process.argv.includes('--apply');

const texto = fs.readFileSync(ARQUIVO, 'utf8');
const mascarado = texto.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

const trechos = [];   // intervalos de corpo de regra elegíveis
let i = 0;
let profundidade = 0;

while (i < mascarado.length) {
    const abre = mascarado.indexOf('{', i);
    if (abre === -1) break;
    const cabecalho = mascarado.slice(i, abre).trim();

    if (/^@/.test(cabecalho)) { profundidade++; i = abre + 1; continue; }

    const fecha = mascarado.indexOf('}', abre);
    if (fecha === -1) break;

    // Só regras em que TODO seletor da lista tem o prefixo de tema.
    const seletores = cabecalho.split(',').map((s) => s.trim()).filter(Boolean);
    const elegivel = seletores.length > 0 && seletores.every((s) => /^html\[data-theme=/.test(s));

    if (elegivel) trechos.push({ inicio: abre + 1, fim: fecha, seletores });

    i = fecha + 1;
    const prox = mascarado.slice(i).match(/^\s*\}/);
    if (prox && profundidade > 0) { profundidade--; i += prox[0].length; }
}

let removidos = 0;
let novoTexto = texto;

// De trás para frente, para não deslocar os offsets.
for (let k = trechos.length - 1; k >= 0; k--) {
    const t = trechos[k];
    const corpo = novoTexto.slice(t.inicio, t.fim);
    const limpo = corpo.replace(/\s*!important/g, () => { removidos++; return ''; });
    if (limpo !== corpo) novoTexto = novoTexto.slice(0, t.inicio) + limpo + novoTexto.slice(t.fim);
}

const totalAntes = (texto.match(/!important/g) || []).length;
const totalDepois = (novoTexto.match(/!important/g) || []).length;

console.log('Regras com prefixo html[data-theme=...]: ' + trechos.length);
console.log('!important em theme-system.css: ' + totalAntes + ' → ' + totalDepois + '  (−' + removidos + ')');

if (!aplicar) {
    console.log('\n(simulação — nada foi gravado; use --apply)');
    process.exit(0);
}

fs.writeFileSync(ARQUIVO, novoTexto);
console.log('\nAplicado. Confira os dois temas no navegador antes de commitar.');
