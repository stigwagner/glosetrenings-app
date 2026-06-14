/**
 * Genererer PWA-ikoner for glosetrenings-appen
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const outputDir = './public';

// SVG mal for ikon med gradient bakgrunn og "G" bokstav
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Bakgrunn med gradient -->
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>

  <!-- Hvit "G" bokstav -->
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="Arial, sans-serif"
    font-size="${size * 0.6}"
    font-weight="bold"
    fill="white">G</text>
</svg>
`;

console.log('🎨 Genererer PWA-ikoner...\n');

// Generer ikoner
for (const size of sizes) {
  const svg = createIconSVG(size);
  const outputPath = path.join(outputDir, `icon-${size}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✅ Generert: icon-${size}.png (${size}x${size})`);
}

// Generer også et større ikon for splash screen (1024x1024)
const splashSVG = createIconSVG(1024);
await sharp(Buffer.from(splashSVG))
  .png()
  .toFile(path.join(outputDir, 'icon-1024.png'));

console.log(`✅ Generert: icon-1024.png (1024x1024)`);

// Generer favicon
const faviconSVG = createIconSVG(32);
await sharp(Buffer.from(faviconSVG))
  .png()
  .toFile(path.join(outputDir, 'favicon.png'));

console.log(`✅ Generert: favicon.png (32x32)`);

console.log('\n✨ Alle ikoner er generert!');
