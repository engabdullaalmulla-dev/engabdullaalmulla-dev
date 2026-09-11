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

const bundle = fs.readFileSync(path.join(dist, found[1].replace(/^\//, '')), 'utf8');
if (bundle.includes('</script')) {
  throw new Error('the bundle contains a closing script tag and cannot be inlined as-is');
}

const page = `<title>EMBER</title>
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
<style>
  html, body { height: 100%; background: #14100E; }
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
