// Generates every Riocut logo/icon asset for all apps from the SVG sources below.
// Run: node brand/build.mjs   (uses the sharp already installed for Next.js)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// sharp ships as a dependency of next, so resolve it from there.
const fromApp = createRequire(join(root, 'apps/movies/package.json'));
const sharp = createRequire(fromApp.resolve('next'))('sharp');

// ---------- brand tokens ----------
const TEAL_LIGHT = '#2dd4bf'; // teal-400
const TEAL_DARK = '#0d9488'; // teal-600
const INK = '#0a0f0f';

// ---------- mark: rounded tile + play button sliced by a diagonal "cut" ----------
const markBody = (id) => `
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${TEAL_LIGHT}"/>
      <stop offset="1" stop-color="${TEAL_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#${id})"/>
  <g fill="#fff" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" transform="translate(2.5 0)">
    <path d="M25 18 L25 36.4 L39.55 26.86 Z" transform="translate(-0.8 -1.25)"/>
    <path d="M25 36.4 L39.55 26.86 L48 32 L25 46 Z" transform="translate(0.8 1.25)"/>
  </g>`;

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">${markBody('rc-g')}
</svg>
`;

// ---------- wordmark: geometric stroke letters (no font dependency) ----------
const wordPaths = `
    <path d="M8 100 V18 H38 A22 22 0 0 1 38 62 H8 M36 62 L62 100"/>
    <path d="M98 48 V100"/>
    <circle cx="160" cy="74" r="26"/>
    <path d="M267.9 57.3 A26 26 0 1 0 267.9 90.7"/>
    <path d="M304 48 V78 A22 22 0 0 0 348 78 V48 V100"/>
    <path d="M384 26 V86 A14 14 0 0 0 398 100 H408 M368 50 H406"/>`;
const word = (color) => `
  <g fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">${wordPaths}
  </g>
  <circle cx="98" cy="22" r="9.5" fill="${color}"/>`;

// Lock-up: mark (118px) + wordmark. Light text for dark UI (default), ink text for light backgrounds.
const logo = (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 566 118" width="566" height="118">
  <g transform="scale(1.84375)">${markBody('rc-lg')}</g>
  <g transform="translate(150 0)">${word(color)}</g>
</svg>
`;

// Social card 1200x630.
const og = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="glow" cx="0.18" cy="0.1" r="0.9">
      <stop offset="0" stop-color="${TEAL_DARK}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(96 196) scale(1.6)">
    <g transform="scale(1.84375)">${markBody('rc-og')}</g>
    <g transform="translate(150 0)">${word('#ffffff')}</g>
  </g>
  <g fill="#cbd5d4" font-family="Helvetica, Arial, sans-serif">
    <text x="100" y="470" font-size="44" font-weight="700" fill="#ffffff">Movies, TV shows, live sports &amp; live TV.</text>
    <text x="100" y="530" font-size="30">Stream free in HD · watch together · riocut.com</text>
  </g>
</svg>
`;

// ---------- write ----------
const apps = ['movies', 'sports', 'tv', 'blog', 'admin'];
const png = (svg, size, bg) =>
    sharp(Buffer.from(svg), { density: 600 })
        .resize(size, size, { fit: 'contain', background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

// ICO with embedded PNGs (supported by every modern browser).
function ico(pngs) {
    const head = Buffer.alloc(6 + 16 * pngs.length);
    head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
    let offset = head.length;
    pngs.forEach(({ size, buf }, i) => {
        const o = 6 + 16 * i;
        head.writeUInt8(size >= 256 ? 0 : size, o); head.writeUInt8(size >= 256 ? 0 : size, o + 1);
        head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
        head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12);
        offset += buf.length;
    });
    return Buffer.concat([head, ...pngs.map((p) => p.buf)]);
}

const out = (p, data) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data); };

const icoBuf = ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, buf: await png(mark, size) }))));
const files = {
    'logo.svg': logo('#ffffff'),
    'logo-dark.svg': logo(INK),
    'icon.svg': mark,
    'favicon.svg': mark,
    'favicon.ico': icoBuf,
    'apple-touch-icon.png': await png(mark, 180, INK),
    'icon-192.png': await png(mark, 192),
    'icon-512.png': await png(mark, 512),
    'og-image.jpg': await sharp(Buffer.from(og)).jpeg({ quality: 90 }).toBuffer(),
};
files['og-image-blog.jpg'] = files['og-image.jpg'];

out(join(root, 'brand/dist/logo.svg'), files['logo.svg']);
out(join(root, 'brand/dist/og-image.jpg'), files['og-image.jpg']);
for (const app of apps) for (const [name, data] of Object.entries(files)) out(join(root, 'apps', app, 'public', name), data);
console.log(`wrote ${Object.keys(files).length} assets × ${apps.length} apps`);
