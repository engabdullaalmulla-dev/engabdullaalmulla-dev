// Regenerates dist/artifact.html from index.html + styles.css.
//
// The hosted build is index.html with the stylesheet inlined, so the page paints
// its own chrome on first frame instead of flashing an unstyled phone frame while
// a second request lands. It was previously kept in sync by hand, which is how it
// drifted; this script is the sync.
//
//   node tools/build-artifact.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'styles.css'), 'utf8');

const LINK = /<link rel="stylesheet" href="styles\.css">\s*/;
if (!LINK.test(html)) {
  console.error('index.html no longer links styles.css the way this script expects.');
  process.exit(1);
}

const out = html.replace(LINK, `<style>\n${css}\n</style>\n`);
mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(resolve(root, 'dist/artifact.html'), out);
console.log(`dist/artifact.html written — ${out.length} bytes`);
