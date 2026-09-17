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
import os, shutil, re
from PIL import Image

SRC  = "art/sprites"
OUT  = "dist"          # the web build, wrapped by the artifact platform
APP  = "app/www"      # the same game as a whole document, for the native shell
SQ, WIDE = 128, 900

def main():
    for d in (OUT, APP):
        if os.path.isdir(d):
            shutil.rmtree(d)
    os.makedirs(os.path.join(OUT, "sprites"))
    os.makedirs(APP)

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
    html = open("prototype/cafelife.html", encoding="utf-8").read()
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

    total = sum(os.path.getsize(os.path.join(dp, f))
                for dp, _, fs in os.walk(OUT) for f in fs)
    print("%d sprites, %.1f MB -> %s (artifact) and %s (native shell)"
          % (n, total/1e6, OUT, APP))

main()
