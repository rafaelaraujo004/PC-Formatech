// Junta e compacta as folhas de estilo da página principal (site.html) num só
// arquivo: css/site-pacote.css.
//
// Antes eram 8 arquivos bloqueando a primeira pintura, cada um com sua ida e
// volta ao servidor. Os originais continuam sendo editados normalmente (o
// painel e as outras páginas ainda os usam); depois de mexer em qualquer um,
// rode:
//     node ferramentas/empacotar-css.js
// e troque o ?v= do css/site-pacote.css em site.html.

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
// Mesma ordem em que estavam no <head> de site.html: a cascata depende dela.
const ARQUIVOS = [
    'fontes.css',
    'brand.css',
    'styles.css',
    'mobile-desktop.css',
    'styles2.css',
    'theme-system.css',
    'refinements.css',
    'icones.css'
];

/**
 * Compactação conservadora: tira comentários e espaços que não mudam nada.
 * Não mexe dentro de strings ('...' e "..."), e mantém o espaço antes de ":"
 * porque em seletor ele tem significado (".a :hover" é diferente de ".a:hover").
 */
function compactar(css) {
    let saida = '';
    let i = 0;
    while (i < css.length) {
        const c = css[i];
        if (c === '"' || c === "'") {
            let j = i + 1;
            while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1;
            saida += css.slice(i, j + 1);
            i = j + 1;
        } else if (c === '/' && css[i + 1] === '*') {
            const fim = css.indexOf('*/', i + 2);
            i = fim < 0 ? css.length : fim + 2;
        } else if (/\s/.test(c)) {
            while (i < css.length && /\s/.test(css[i])) i++;
            saida += ' ';
        } else {
            saida += c;
            i++;
        }
    }
    return saida
        .replace(/ ?([{};,>]) ?/g, '$1')
        .replace(/: /g, ':')
        .replace(/;}/g, '}')
        .trim();
}

const partes = ARQUIVOS.map((arq) => {
    const css = fs.readFileSync(path.join(RAIZ, arq), 'utf8');
    return `/* ${arq} */\n` + compactar(css);
});

const destino = path.join(RAIZ, 'css', 'site-pacote.css');
fs.mkdirSync(path.dirname(destino), { recursive: true });
const final = '/* Gerado por ferramentas/empacotar-css.js a partir de ' + ARQUIVOS.join(', ') + '. Não edite aqui. */\n' + partes.join('\n') + '\n';
fs.writeFileSync(destino, final);

const antes = ARQUIVOS.reduce((t, a) => t + fs.statSync(path.join(RAIZ, a)).size, 0);
console.log(`css/site-pacote.css: ${(final.length / 1024).toFixed(1)} KB (antes ${(antes / 1024).toFixed(1)} KB em ${ARQUIVOS.length} arquivos)`);
