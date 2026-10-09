// Link curto de cada arte da Divulgação, com a própria arte na prévia.
//
//   GET /a/<canal>-<código>        → página com as tags de prévia da arte
//                                    (WhatsApp, Instagram, Facebook…) que leva
//                                    a pessoa ao link da arte com
//                                    ?origem=<canal>-arte-<código>
//   GET /a/imagem/<código>?v=…     → a prévia: 1200×630 JPEG, a arte inteira
//                                    no centro sobre um fundo desfocado dela
//
// O robô da prévia não roda JavaScript: lê as tags e para aí. Quem toca no
// link é levado na hora para a página da arte. A resposta é a mesma para
// todos, então a CDN guarda. O código é o mesmo da aba Visitas
// (codigoDaArte do id da publicação, ou de "loja-<id>" para produtos).

const fs = require('fs');
const path = require('path');
const { iniciarAdmin } = require('./_push');
const { codigoDaArte } = require('../resumo-visitas.js');

const SITE = 'https://www.pcformatech.com.br';
const LARGURA = 1200;
const ALTURA = 630;
const SLUG = /^([a-z]{2,15})-([a-z0-9]{6})$/;
const CODIGO = /^[a-z0-9]{6}$/;
const NOME_MARCA = { pcformatech: 'PC Formatech', birdtech: 'Bird Tech', apps: 'PC Formatech', promocoes: 'PC Formatech' };
// A legenda já vai junto na mensagem: a descrição da prévia completa, não repete.
const CHAMADA = {
    pcformatech: 'Assistência técnica em Canaã dos Carajás ou à distância. Toque para ver os detalhes e chamar no WhatsApp.',
    promocoes: 'Assistência técnica em Canaã dos Carajás ou à distância. Toque para ver os detalhes e chamar no WhatsApp.',
    apps: 'Apps e sistemas sob medida, no celular e no computador. Toque para ver como funciona e chamar no WhatsApp.',
    birdtech: 'Bird Tech, a loja de periféricos da PC Formatech em Canaã dos Carajás. Toque para ver e pedir pelo WhatsApp.'
};

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const moeda = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');

// ── Índice código → arte (guardado por 1 minuto na instância) ─────────────

let indice = null;
let indiceEm = 0;

/**
 * Arte pelo código. Se não achar (arte criada agora há pouco) ou a versão
 * não bater (arte editada), relê a lista — no máximo uma vez a cada 5 s, para
 * códigos inventados não virarem leituras no Firestore.
 */
async function acharArte(db, codigo, versao) {
    const confere = (a) => a && (versao === undefined || String(a.versao) === versao);
    let arte = (await carregarIndice(db)).get(codigo);
    if (!confere(arte) && Date.now() - indiceEm > 5000) arte = (await carregarIndice(db, true)).get(codigo);
    return arte;
}

async function carregarIndice(db, forcar) {
    if (!forcar && indice && Date.now() - indiceEm < 60_000) return indice;
    const [publicacoes, produtos] = await Promise.all([
        db.collection('publicacoes').select('categoria', 'titulo', 'link', 'imagem', 'atualizadoEm').get(),
        db.collection('lojaProdutos').select('nome', 'preco', 'imagem', 'atualizadoEm').get()
    ]);
    const mapa = new Map();
    publicacoes.docs.forEach((doc) => {
        const d = doc.data();
        mapa.set(codigoDaArte(doc.id), {
            colecao: 'publicacoes',
            id: doc.id,
            marca: d.categoria === 'birdtech' ? 'birdtech' : 'pcformatech',
            titulo: limparTitulo(d.titulo) || NOME_MARCA[d.categoria] || 'PC Formatech',
            descricao: CHAMADA[d.categoria] || CHAMADA.pcformatech,
            link: d.link || SITE + '/site.html',
            imagem: d.imagem || null,
            versao: d.atualizadoEm || 0
        });
    });
    produtos.docs.forEach((doc) => {
        const d = doc.data();
        mapa.set(codigoDaArte('loja-' + doc.id), {
            colecao: 'lojaProdutos',
            id: doc.id,
            marca: 'birdtech',
            titulo: d.preco ? `${d.nome} por ${moeda(d.preco)}` : d.nome,
            descricao: CHAMADA.birdtech,
            link: SITE + '/loja.html#' + encodeURIComponent(doc.id),
            imagem: d.imagem || null,
            versao: d.atualizadoEm || 0
        });
    });
    indice = mapa;
    indiceEm = Date.now();
    return mapa;
}

/** "Criação de apps (feed)" → "Criação de apps": o formato é só para o painel. */
function limparTitulo(titulo) {
    return String(titulo || '').replace(/\s*\((feed|status[^)]*|stor[^)]*)\)\s*$/i, '').trim();
}

/** Link da arte com a origem; só marca links do próprio site. */
function destinoDa(arte, origem) {
    try {
        const url = new URL(arte.link, SITE);
        if (/(^|\.)pcformatech\.com\.br$/.test(url.hostname)) url.searchParams.set('origem', origem);
        return url.toString();
    } catch (e) {
        return `${SITE}/site.html?origem=${origem}`;
    }
}

// ── Página com as tags de prévia ─────────────────────────────────────────

function pagina(arte, slug, codigo, destino) {
    const site = arte.marca === 'birdtech' ? 'Bird Tech · PC Formatech' : 'PC Formatech';
    const titulo = `${arte.titulo} | ${arte.marca === 'birdtech' ? 'Bird Tech' : 'PC Formatech'}`;
    const imagem = `${SITE}/a/imagem/${codigo}?v=${arte.versao}`;
    const descricao = arte.descricao;
    // JSON dentro de <script>: "<" escapado para não fechar a tag.
    const destinoJs = JSON.stringify(destino).replace(/</g, '\\u003c');
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(titulo)}</title>
    <meta name="robots" content="noindex">
    <meta name="description" content="${esc(descricao)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(site)}">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:url" content="${SITE}/a/${slug}">
    <meta property="og:title" content="${esc(titulo)}">
    <meta property="og:description" content="${esc(descricao)}">
    <meta property="og:image" content="${imagem}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="${LARGURA}">
    <meta property="og:image:height" content="${ALTURA}">
    <meta property="og:image:alt" content="${esc(arte.titulo)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#0b2b2c">
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b2b2c; color: #fff; font: 600 17px/1.5 system-ui, sans-serif; text-align: center; }
        a { color: #8ff1e3; }
    </style>
</head>
<body>
    <p>Abrindo ${esc(arte.marca === 'birdtech' ? 'a Bird Tech' : 'a PC Formatech')}…<br><a href="${esc(destino)}">Toque aqui se não abrir</a></p>
    <script>location.replace(${destinoJs});</script>
</body>
</html>`;
}

// ── Imagem de prévia ──────────────────────────────────────────────────────

async function bytesDaArte(db, arte) {
    if (arte.imagem && /^\/images\/[\w./-]+$/.test(arte.imagem) && !arte.imagem.includes('..')) {
        const local = path.join(process.cwd(), arte.imagem);
        if (fs.existsSync(local)) return fs.readFileSync(local);
        const resposta = await fetch(SITE + arte.imagem);
        if (!resposta.ok) return null;
        return Buffer.from(await resposta.arrayBuffer());
    }
    const doc = await db.collection(arte.colecao).doc(arte.id).get();
    const dados = doc.exists ? doc.data().imagemDados : null;
    const partes = dados && /^data:image\/[a-z]+;base64,(.+)$/.exec(dados);
    return partes ? Buffer.from(partes[1], 'base64') : null;
}

/**
 * A arte inteira no centro (cantos arredondados e sombra) sobre ela mesma
 * ampliada e desfocada: vale para feed, story e foto quadrada de produto.
 */
async function montarPrevia(bytes) {
    const sharp = require('sharp');
    // Um resize por pipeline (o sharp usa só o último): primeiro reduz bem,
    // depois amplia e desfoca — fica só a cor da arte, sem texto legível.
    const miniatura = await sharp(bytes).resize(48, 26, { fit: 'cover' }).toBuffer();
    const fundo = await sharp(miniatura).resize(LARGURA, ALTURA, { kernel: 'cubic' }).blur(18)
        .modulate({ brightness: 0.55, saturation: 1.2 })
        .toBuffer();
    const frente = await sharp(bytes).resize({ width: LARGURA - 120, height: ALTURA - 64, fit: 'inside' })
        .toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = frente.info;
    const raio = Math.round(Math.min(w, h) * 0.04);
    const x = Math.round((LARGURA - w) / 2);
    const y = Math.round((ALTURA - h) / 2);
    const mascara = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${raio}" ry="${raio}"/></svg>`);
    const arredondada = await sharp(frente.data).ensureAlpha().composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
    const sombra = Buffer.from(`<svg width="${LARGURA}" height="${ALTURA}"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter></defs><rect x="${x}" y="${y + 12}" width="${w}" height="${h}" rx="${raio}" fill="#000" fill-opacity=".5" filter="url(#s)"/></svg>`);
    return sharp(fundo)
        .composite([{ input: sombra, left: 0, top: 0 }, { input: arredondada, left: x, top: y }])
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer();
}

// ── Rota ──────────────────────────────────────────────────────────────────

async function handler(req, res, db) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
    const consulta = req.query || {};
    db = db || iniciarAdmin().firestore();

    if (consulta.img !== undefined) {
        const codigo = String(consulta.img);
        if (!CODIGO.test(codigo)) return res.status(404).end();
        const arte = await acharArte(db, codigo, String(consulta.v || ''));
        if (!arte) {
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
            return res.status(404).end();
        }
        // Só a versão atual é montada (e guardada pela CDN); outra vai para ela.
        if (String(consulta.v || '') !== String(arte.versao)) {
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
            res.setHeader('Location', `/a/imagem/${codigo}?v=${arte.versao}`);
            return res.status(302).end();
        }
        const bytes = await bytesDaArte(db, arte);
        if (!bytes) return res.status(404).end();
        const jpeg = await montarPrevia(bytes);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
        return res.status(200).send(jpeg);
    }

    const slug = String(consulta.s || '').toLowerCase();
    const partes = SLUG.exec(slug);
    if (!partes) {
        res.setHeader('Location', SITE + '/site.html');
        return res.status(302).end();
    }
    const [, canal, codigo] = partes;
    const origem = `${canal}-arte-${codigo}`;
    const arte = await acharArte(db, codigo);
    if (!arte) {
        // Arte removida: o link continua levando ao site e contando a origem.
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
        res.setHeader('Location', `${SITE}/site.html?origem=${origem}`);
        return res.status(302).end();
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(pagina(arte, slug, codigo, destinoDa(arte, origem)));
}

module.exports = async function (req, res) {
    try {
        return await handler(req, res);
    } catch (erro) {
        console.error('arte:', erro);
        if (req.query && req.query.img !== undefined) return res.status(500).end();
        res.setHeader('Location', SITE + '/site.html');
        return res.status(302).end();
    }
};
module.exports.handler = handler;
module.exports.montarPrevia = montarPrevia;
module.exports.limparTitulo = limparTitulo;
module.exports._envelhecerIndice = (ms) => { indiceEm -= ms; };
