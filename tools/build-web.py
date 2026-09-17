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
OUT  = "dist"
SQ, WIDE = 128, 900

def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "sprites"))

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
    head = re.sub(r"<meta[^>]*>", "", head, flags=re.I)      # the skeleton supplies these
    body = body.rsplit("</body></html>", 1)[0]
    page = head.strip() + "\n" + body.strip() + "\n"
    assert "<!doctype" not in page.lower() and "<body" not in page.lower(), "wrapper not stripped"
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(page)

    total = sum(os.path.getsize(os.path.join(dp, f))
                for dp, _, fs in os.walk(OUT) for f in fs)
    print("%d sprites + index.html, %.1f MB" % (n, total/1e6))

main()
