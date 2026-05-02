// Gera ícones PNG a partir dos SVGs para PWA e favicon
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// icon.svg = logo completa (com texto "PC FORMATECH") → ícones do app
const appSvg = fs.readFileSync(path.join(__dirname, 'icon.svg'));

// favicon-icon.svg = apenas o ícone do monitor (sem texto) → favicon da aba
const faviconSvg = fs.readFileSync(path.join(__dirname, 'favicon-icon.svg'));

const appIcons = [
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const faviconIcons = [
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  for (const { name, size } of appIcons) {
    await sharp(appSvg).resize(size, size).png().toFile(path.join(__dirname, name));
    console.log(`✅ ${name} (${size}x${size}) [logo completa]`);
  }
  for (const { name, size } of faviconIcons) {
    await sharp(faviconSvg).resize(size, size).png().toFile(path.join(__dirname, name));
    console.log(`✅ ${name} (${size}x${size}) [ícone monitor]`);
  }
  console.log('\n🎉 Todos os ícones gerados com sucesso!');
}

generateIcons().catch(console.error);
