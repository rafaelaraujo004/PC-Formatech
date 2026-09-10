#!/usr/bin/env node
/**
 * Confere se o .vercelignore não está excluindo nada que uma página publicada
 * carrega.
 *
 * Uso: npm run check:deploy
 *
 * Existe por causa de um erro real: ao excluir "*.secure.js" do deploy para
 * tirar ~360 KB de build ofuscado, dois arquivos que o admin.html carrega
 * (auth-system.secure.js e firebase-config.secure.js) foram junto. O painel
 * teria quebrado em produção sem nenhum sinal em desenvolvimento, porque
 * localmente o arquivo está lá.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

function lerIgnore() {
    const caminho = path.join(RAIZ, '.vercelignore');
    if (!fs.existsSync(caminho)) return [];
    return fs.readFileSync(caminho, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
}

/** Padrão do .vercelignore casa com este caminho? */
function casa(padrao, arquivo) {
    if (padrao.endsWith('/')) return arquivo.startsWith(padrao);
    if (padrao === arquivo) return true;
    if (!padrao.includes('*')) return arquivo === padrao || arquivo.startsWith(padrao + '/');
    const re = new RegExp('^' + padrao.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
    return re.test(arquivo);
}

const linhas = lerIgnore();
// Padrões com "!" reabilitam um arquivo que um padrão anterior excluiu.
const negados = linhas.filter((l) => l.startsWith("!")).map((l) => l.slice(1));
const ignorados = linhas.filter((l) => !l.startsWith("!"));
const htmls = fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html'));

// Páginas que o próprio .vercelignore exclui não precisam ser conferidas.
const htmlsPublicados = htmls.filter((h) => !ignorados.some((p) => casa(p, h)));

const problemas = [];
let conferidos = 0;

htmlsPublicados.forEach((html) => {
    const conteudo = fs.readFileSync(path.join(RAIZ, html), 'utf8');
    const refs = new Set();

    // src/href locais (ignora http, //, data:, mailto:, âncoras)
    for (const m of conteudo.matchAll(/(?:src|href)="(?!https?:|\/\/|data:|mailto:|tel:|#)([^"?#]+)/g)) {
        refs.add(m[1].replace(/^\.?\//, ''));
    }

    refs.forEach((ref) => {
        conferidos++;
        const alvo = path.join(RAIZ, ref);
        if (!fs.existsSync(alvo)) {
            problemas.push({ html, ref, motivo: 'arquivo não existe no repositório' });
            return;
        }
        if (negados.some((p) => casa(p, ref))) return;
        const padrao = ignorados.find((p) => casa(p, ref));
        if (padrao) {
            problemas.push({ html, ref, motivo: 'excluído do deploy pelo padrão "' + padrao + '"' });
        }
    });
});

console.log('Páginas publicadas: ' + htmlsPublicados.join(', '));
console.log('Referências conferidas: ' + conferidos);
console.log('');

if (!problemas.length) {
    console.log('Tudo certo: nenhuma página publicada depende de arquivo ausente ou excluído.');
    process.exit(0);
}

console.error('PROBLEMAS ENCONTRADOS (' + problemas.length + '):');
problemas.forEach((p) => {
    console.error('  ' + p.html + ' → ' + p.ref);
    console.error('      ' + p.motivo);
});
process.exit(1);
