/**
 * Packs the web build into one self-contained HTML file — no separate script
 * to fetch, nothing loaded from the network — so EMBER can be dropped on any
 * static host, or opened straight off disk.
 *
 *   npm run bundle:web            # plays the bots only
 *   EXPO_PUBLIC_EMBER_SERVER=https://your-server npm run bundle:web
 *
 * Writes dist/ember.html.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

// Without a server to reach, the app hides online play rather than offering a
// button that cannot work.
if (!process.env.EXPO_PUBLIC_EMBER_SERVER) process.env.EXPO_PUBLIC_EMBER_SERVER = 'none';

fs.rmSync(dist, { recursive: true, force: true });
execFileSync('npx', ['expo', 'export', '--platform', 'web'], { cwd: root, stdio: 'inherit' });

const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const found = shell.match(/<script src="([^"]+)"/);
if (!found) throw new Error('no bundle in the exported index.html');

let bundle = fs.readFileSync(path.join(dist, found[1].replace(/^\//, '')), 'utf8');

/**
 * The sounds are separate files by the time Metro is done with them. Fold each
 * one back into the bundle as a data URI, so the page really does need nothing
 * from the network.
 */
const TYPES = { '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };

function inlineAssets(directory) {
  if (!fs.existsSync(directory)) return 0;
  let inlined = 0;
  const walk = (here) => {
    for (const entry of fs.readdirSync(here, { withFileTypes: true })) {
      const full = path.join(here, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const type = TYPES[path.extname(entry.name).toLowerCase()];
      if (!type) continue;
      const reference = '/' + path.relative(dist, full).split(path.sep).join('/');
      if (!bundle.includes(reference)) continue;
      const uri = `data:${type};base64,${fs.readFileSync(full).toString('base64')}`;
      bundle = bundle.split(reference).join(uri);
      inlined += 1;
    }
  };
  walk(directory);
  return inlined;
}

const inlined = inlineAssets(path.join(dist, 'assets'));
if (inlined > 0) console.log(`\ninlined ${inlined} asset${inlined === 1 ? '' : 's'} into the bundle`);

const leftovers = bundle.match(/["'`]\/assets\/[^"'`]+/g);
if (leftovers) {
  throw new Error(`these assets would have been fetched from the network: ${leftovers.slice(0, 3).join(', ')}`);
}
if (bundle.includes('</script')) {
  throw new Error('the bundle contains a closing script tag and cannot be inlined as-is');
}

const page = `<title>EMBER</title>
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
<style>
  html, body { height: 100%; background: #F6EEE4; }
  body { overflow: hidden; margin: 0; }
  #root { display: flex; height: 100%; flex: 1; }
  /* Nothing here is text you would want to select mid-game. */
  #root, #root * { -webkit-tap-highlight-color: transparent; }
</style>

<div id="root"></div>
<noscript>EMBER needs JavaScript.</noscript>
<script>
${bundle}
</script>
`;

const out = path.join(dist, 'ember.html');
fs.writeFileSync(out, page);
console.log(`\nwrote ${path.relative(root, out)} — ${(page.length / 1024).toFixed(0)} KB, no external requests`);
