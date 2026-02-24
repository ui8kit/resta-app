/**
 * Downloads Nunito variable font (woff2) from Google Fonts to src/assets/font/Nunito/.
 * Run once with internet: bun run download-fonts
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '..', 'src', 'assets', 'font', 'Nunito');
const FONTS = [
  { file: 'cyrillic.italic.woff2', url: 'https://fonts.gstatic.com/s/nunito/v31/XRXX3I6Li01BKofIMNaHRs71cA.woff2' },
  { file: 'latin.italic.woff2', url: 'https://fonts.gstatic.com/s/nunito/v31/XRXX3I6Li01BKofIMNaDRs4.woff2' },
  { file: 'cyrillic.normal.woff2', url: 'https://fonts.gstatic.com/s/nunito/v31/XRXV3I6Li01BKofIMeaBXso.woff2' },
  { file: 'latin.normal.woff2', url: 'https://fonts.gstatic.com/s/nunito/v31/XRXV3I6Li01BKofINeaB.woff2' },
];

for (const { file, url } of FONTS) {
  const out = path.join(FONT_DIR, file);
  console.log(`Downloading ${file}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  await Bun.write(out, res);
  console.log(`  -> ${out}`);
}

console.log('Done. Nunito fonts saved to src/assets/font/Nunito/');
