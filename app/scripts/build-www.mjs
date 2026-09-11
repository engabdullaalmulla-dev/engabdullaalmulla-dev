// Assemble the offline web bundle the iOS shell loads.
//
// Run: npm run build
//
// The prototype is the single source of truth. This script copies it into
// `www/`, swaps the Google Fonts stylesheet for the bundled Latin subsets, adds
// the iOS meta tags, and then ASSERTS that nothing in the bundle reaches the
// network. That last check is the point: the core game has to work in aeroplane
// mode, and a stray CDN link would break it silently in exactly the situation
// nobody tests.

import { cp, mkdir, readFile, rm, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const proto = join(app, '..', 'prototype');
const www = join(app, 'www');

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });

await cp(join(proto, 'src'), join(www, 'src'), { recursive: true });
await cp(join(proto, 'styles.css'), join(www, 'styles.css'));
await cp(join(app, 'assets', 'fonts'), join(www, 'assets', 'fonts'), { recursive: true });

await writeFile(join(www, 'index.html'), `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#070b0f">
<title>Marble Ultimate Football</title>
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="styles.css">
<div class="app" id="app"></div>
<script type="module" src="src/app.js"></script>
`);

// --- the offline assertion -------------------------------------------------
async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const TEXT = /\.(html|css|js|mjs|json)$/;
const OUTBOUND = /\b(https?:)?\/\/(?!\/)[a-z0-9.-]+\.[a-z]{2,}/gi;
const ALLOWED = [/^https:\/\/(www\.)?(fifa|uefa|the-afc)\.com/, /^https:\/\/en\.wikipedia\.org/];

const offenders = [];
for (const file of await walk(www)) {
  if (!TEXT.test(file)) continue;
  const text = await readFile(file, 'utf8');
  for (const m of text.match(OUTBOUND) || []) {
    // Source citations in the ruleset sheet are links the player may tap. They
    // are never fetched by the app, so they do not break offline play.
    if (ALLOWED.some(re => re.test(m))) continue;
    offenders.push(`${relative(www, file)}: ${m}`);
  }
}

if (offenders.length) {
  console.error('\nThe bundle would fetch from the network at runtime:\n');
  for (const o of offenders) console.error('  ' + o);
  console.error('\nBundle the asset instead. The core game must run offline.\n');
  process.exit(1);
}

const files = await walk(www);
let bytes = 0;
for (const f of files) bytes += (await stat(f)).size;
console.log(`www/ built: ${files.length} files, ${(bytes / 1024).toFixed(0)} KB, no outbound fetches.`);
