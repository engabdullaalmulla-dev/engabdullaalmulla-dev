#!/usr/bin/env python3
"""Pack the prototype into something publishable.

art/sprites is 86MB across 392 files, which is past what an artifact will take. Nothing in
the game needs that: a portrait is drawn at 48px, a fitting at 34-75px, a dish at about 20.
So the square sprites go to 128px -- still 2x the largest draw on a 3x phone -- and the wide
room and branch plates go to 900px wide and a 256-colour palette, which is plenty for a
backdrop sitting behind a dark wash.

The @NN variants the pipeline exports are not referenced by the game at all; sprite() builds
its own URL from the base name. They are skipped.
"""
import os, shutil, re, json, hashlib
from PIL import Image

# Anchored to the repository rather than the shell's working directory, for the same reason
# tools/build-native.py is: a caller that is not standing in the repo root is not a mistake.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda *p: os.path.join(ROOT, *p)

def icons(into):
    """The home-screen icon, at the sizes iOS and Android each ask for."""
    src = Image.open(R("app/resources/icon.png")).convert("RGB")
    for px in (180, 192, 512):
        src.resize((px, px), Image.LANCZOS).save(os.path.join(into, "icon-%d.png" % px))

SRC  = R("art/sprites")
OUT  = R("dist")          # the web build, wrapped by the artifact platform
APP  = R("app/www")      # the same game as a whole document, for the native shell
SITE = R("site")         # the same document again, installable from a phone browser
SQ, WIDE = 128, 900
# the service worker cache name: changes whenever the game does, so a deploy replaces it
BUILD_ID = "cafe-life-" + hashlib.sha1(
    open(R("prototype/cafelife.html"), "rb").read()).hexdigest()[:10]

def main():
    for d in (OUT, APP, SITE):
        if os.path.isdir(d):
            shutil.rmtree(d)
    os.makedirs(os.path.join(OUT, "sprites"))
    os.makedirs(APP)
    os.makedirs(SITE)

    n = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".png") or "@" in f:
            continue
        im = Image.open(os.path.join(SRC, f))
        wide = im.width != im.height
        if wide:
            im = im.convert("RGB")
            im = im.resize((WIDE, round(im.height * WIDE / im.width)), Image.LANCZOS)
            im = im.convert("P", palette=Image.ADAPTIVE, colors=256)
        else:
            im = im.convert("RGBA").resize((SQ, SQ), Image.LANCZOS)
        im.save(os.path.join(OUT, "sprites", f), optimize=True)
        n += 1

    # The page itself. An artifact wraps the file it is given in its own skeleton -- doctype,
    # html, head, body, a reset and the phone's safe-area padding -- so the published file has
    # to be the contents of that document, not another whole one. Strip the wrapper, keep the
    # title, the font link and the style block, and point the sprite path at the packed copy.
    html = open(R("prototype/cafelife.html"), encoding="utf-8").read()
    before = html
    html = html.replace('const ART = "../art/sprites/";', 'const ART = "sprites/";')
    assert html != before, "ART constant not found -- did prototype/cafelife.html change?"

    head, body = html.split("</head><body>", 1)
    head = re.sub(r"^<!doctype html><html[^>]*><head>", "", head, flags=re.I)
    head_no_meta = re.sub(r"<meta[^>]*>", "", head, flags=re.I)   # the artifact supplies these
    body = body.rsplit("</body></html>", 1)[0]
    page = head_no_meta.strip() + "\n" + body.strip() + "\n"
    assert "<!doctype" not in page.lower() and "<body" not in page.lower(), "wrapper not stripped"
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page)

    # The native shell needs a whole document, not the artifact's stripped body, plus the
    # viewport and status-bar bits a phone app wants. Same sprites, same game, different wrap.
    shutil.copytree(os.path.join(OUT, "sprites"), os.path.join(APP, "sprites"),
                    dirs_exist_ok=True)
    doc = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
           '<meta name="viewport" content="width=device-width,initial-scale=1,'
           'maximum-scale=1,user-scalable=no,viewport-fit=cover">'
           '<meta name="apple-mobile-web-app-capable" content="yes">'
           '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
           '<meta name="theme-color" content="#171310">'
           '<style>html,body{background:#171310}'
           ':root{padding-top:env(safe-area-inset-top,0px);'
           'padding-bottom:env(safe-area-inset-bottom,0px)}</style>'
           + head.strip() + '</head><body>' + body.strip() + '</body></html>')
    open(os.path.join(APP, "index.html"), "w", encoding="utf-8").write(doc)

    # A third copy of the same game, as a site a phone can install to its home screen.
    # This is the only way to hand the game to a tester without an Apple account, so it is
    # not a lesser build: same sprites, same document, plus the manifest and the worker that
    # make it launch full-screen and run with no signal.
    shutil.copytree(os.path.join(OUT, "sprites"), os.path.join(SITE, "sprites"))
    icons(SITE)
    site_doc = doc.replace("</head>",
        '<link rel="manifest" href="manifest.webmanifest">'
        '<link rel="apple-touch-icon" href="icon-180.png">'
        '<script>if("serviceWorker" in navigator)'
        'addEventListener("load",function(){navigator.serviceWorker.register("sw.js")});</script>'
        "</head>")
    open(os.path.join(SITE, "index.html"), "w", encoding="utf-8").write(site_doc)
    open(os.path.join(SITE, "manifest.webmanifest"), "w", encoding="utf-8").write(json.dumps({
        "name": "Caf\u00e9 Life", "short_name": "Caf\u00e9 Life",
        "description": "A caf\u00e9 on a UAE shopping street, run one season at a time.",
        "start_url": ".", "scope": ".", "display": "standalone",
        "orientation": "portrait", "background_color": "#171310", "theme_color": "#171310",
        "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
                  {"src": "icon-512.png", "sizes": "512x512", "type": "image/png",
                   "purpose": "maskable"}]}, indent=2))
    # Everything is cached on install, so a tester on a bad connection still gets a game.
    names = ["index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png",
             "icon-512.png"] + ["sprites/" + f for f in sorted(os.listdir(
                 os.path.join(SITE, "sprites")))]
    open(os.path.join(SITE, "sw.js"), "w", encoding="utf-8").write(
        "/* Cache the whole game on install. It is 7.6MB and it never changes between\n"
        "   deploys, so a version bump is the only thing that refetches it. */\n"
        "const V = %r;\n" % BUILD_ID
        + "const FILES = " + json.dumps(names) + ";\n"
        + """self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() =>
      self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
""")

    total = sum(os.path.getsize(os.path.join(dp, f))
                for dp, _, fs in os.walk(OUT) for f in fs)
    rel = lambda p: os.path.relpath(p, ROOT)
    print("%d sprites, %.1f MB -> %s (artifact) and %s (native shell)"
          % (n, total/1e6, rel(OUT), rel(APP)))
    print("     and %s (installable site, %s)" % (rel(SITE), BUILD_ID))

main()
