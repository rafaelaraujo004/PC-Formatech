#!/usr/bin/env node
/**
 * Gera as variantes responsivas (AVIF + WebP) das imagens do hero.
 *
 * Uso: npm run build:images
 *
 * Para cada images/hero/slide-NN.jpg produz, em images/hero/optimized/:
 *   slide-NN-640.avif   slide-NN-640.webp
 *   slide-NN-1280.avif  slide-NN-1280.webp
 *   slide-NN-1920.avif  slide-NN-1920.webp
 *
 * O .jpg original continua sendo o fallback do <picture> no index.html.
 * O script é idempotente: pula o que já está gerado e mais novo que a origem.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = path.join(__dirname, '..', 'images', 'hero');
const OUT_DIR = path.join(SRC_DIR, 'optimized');
const WIDTHS = [640, 1280, 1920];

const FORMATS = {
    avif: { quality: 50, effort: 5 },
    webp: { quality: 72, effort: 5 }
};

function log(...args) {
    console.log(...args);
}

async function buildOne(file, force) {
    const srcPath = path.join(SRC_DIR, file);
    const base = path.basename(file, path.extname(file));
    const srcStat = fs.statSync(srcPath);
    const meta = await sharp(srcPath).metadata();

    let written = 0;
    let bytes = 0;

    for (const width of WIDTHS) {
        // Não faz upscale: se a origem é menor que o alvo, usa a largura da origem.
        const targetWidth = Math.min(width, meta.width);

        for (const [format, options] of Object.entries(FORMATS)) {
            const outPath = path.join(OUT_DIR, `${base}-${width}.${format}`);

            if (!force && fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
                bytes += fs.statSync(outPath).size;
                continue;
            }

            await sharp(srcPath)
                .resize({ width: targetWidth, withoutEnlargement: true })
                .toFormat(format, options)
                .toFile(outPath);

            written++;
            bytes += fs.statSync(outPath).size;
        }
    }

    return { base, originalBytes: srcStat.size, bytes, written };
}

async function main() {
    const force = process.argv.includes('--force');

    if (!fs.existsSync(SRC_DIR)) {
        console.error(`Pasta não encontrada: ${SRC_DIR}`);
        process.exit(1);
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const files = fs.readdirSync(SRC_DIR)
        .filter((f) => /\.(jpe?g|png)$/i.test(f))
        .sort();

    if (!files.length) {
        log('Nenhuma imagem encontrada em images/hero.');
        return;
    }

    log(`Gerando ${WIDTHS.length} larguras × ${Object.keys(FORMATS).length} formatos para ${files.length} imagens...\n`);

    let totalOriginal = 0;
    let totalSmallest = 0;

    for (const file of files) {
        const result = await buildOne(file, force);
        totalOriginal += result.originalBytes;

        // Referência de ganho: a variante que o navegador realmente baixa num desktop 1x.
        const desktopAvif = path.join(OUT_DIR, `${result.base}-1280.avif`);
        totalSmallest += fs.existsSync(desktopAvif) ? fs.statSync(desktopAvif).size : 0;

        const kb = (n) => `${Math.round(n / 1024)}KB`;
        log(
            `  ${result.base.padEnd(10)} ${kb(result.originalBytes).padStart(7)} → ` +
            `${kb(fs.existsSync(desktopAvif) ? fs.statSync(desktopAvif).size : 0).padStart(6)} (avif 1280)` +
            (result.written ? '' : '  [cache]')
        );
    }

    const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
    const saved = 100 - (totalSmallest / totalOriginal) * 100;

    log('');
    log(`Originais (jpg 1920):  ${mb(totalOriginal)}`);
    log(`AVIF 1280 equivalente: ${mb(totalSmallest)}  (−${saved.toFixed(1)}%)`);
    log('');
    log('Os .jpg originais foram mantidos como fallback do <picture>.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
