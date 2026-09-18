#!/usr/bin/env python3
"""Publish the exact offline native document to web, legacy shell and installable PWA."""
import importlib.util
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("cafe_bundle", ROOT / "tools/build-native.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def main():
    doc, info = builder.bundle()
    outputs = [ROOT / "dist", ROOT / "app/www", ROOT / "site"]
    for destination in outputs:
        if destination.exists():
            shutil.rmtree(destination)
        destination.mkdir(parents=True)
        (destination / "index.html").write_text(doc, encoding="utf-8")

    site = ROOT / "site"
    with Image.open(ROOT / "native/assets/icon.png") as original:
        icon = original.convert("RGB")
        for size in (180, 192, 512):
            icon.resize((size, size), Image.Resampling.LANCZOS).save(site / ("icon-%d.png" % size))
    # PWA shell assets are local to the hosted site; gameplay stays entirely embedded.
    # Widen only the site's policy enough for its same-origin worker and manifest.
    site_doc = doc.replace("connect-src 'none'", "connect-src 'self'; worker-src 'self'; manifest-src 'self'")
    site_doc = site_doc.replace("</head>",
        '<meta name="theme-color" content="#f8f3e9">'
        '<meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">'
        '<link rel="manifest" href="manifest.webmanifest">'
        '<link rel="apple-touch-icon" href="icon-180.png">'
        '<script>if("serviceWorker" in navigator && location.protocol !== "file:")'
        'addEventListener("load",function(){navigator.serviceWorker.register("./sw.js").catch(function(){});});</script>'
        '</head>')
    # Manifest and touch icons need the same-origin image permission in the web shell.
    site_doc = site_doc.replace("img-src data: blob:", "img-src 'self' data: blob:")
    (site / "index.html").write_text(site_doc, encoding="utf-8")
    (site / "manifest.webmanifest").write_text(json.dumps({
        "id": "./", "name": "Café Life · حياة المقهى", "short_name": "Café Life",
        "description": "Plan your day, run your café and build a family story. خطط ليومك وأدر مقهاك وابنِ حكاية عائلتك.",
        "lang": "en", "start_url": "./", "scope": "./", "display": "standalone",
        "orientation": "portrait", "background_color": "#f8f3e9", "theme_color": "#f8f3e9",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}
        ]}, ensure_ascii=False, indent=2), encoding="utf-8")
    files = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]
    (site / "sw.js").write_text(
        '/* A complete offline game, refreshed only when authored content changes. */\n'
        'const VERSION = ' + json.dumps(info["buildId"]) + ';\n'
        'const FILES = ' + json.dumps(files) + ';\n'
        '''self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    key.startsWith('cafe-life-') && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
''', encoding="utf-8")
    print('%s: %d sprites, %.2f MB fully embedded -> dist/, app/www/, site/' % (
        info["buildId"], info["sprites"], len(doc.encode()) / 1e6))


if __name__ == "__main__":
    main()
