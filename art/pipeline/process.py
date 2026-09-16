#!/usr/bin/env python3
"""
Turn raw generated art into game sprites.

    python3 process.py <raw-folder> [--out ../sprites] [--sheet contact.png]

For each image: keys out the flat grey background, trims to content, re-centres on a
common optical size, and writes the master plus the sizes the game draws at.

The background is removed by flood-filling inward from the edges rather than by colour
threshold alone. That distinction matters: a milk pitcher is the same grey as the
backdrop, and a threshold would punch a hole straight through it.
"""
import sys, os, re, io, math
from PIL import Image, ImageDraw, ImageFilter

MASTER = 512          # one master per asset; everything downscales from this
MARGIN = 0.08         # padding inside the square, so a row of sprites reads at one size
GAME_SIZES = [34, 20] # what the bins and the order chips actually draw
FACE_SIZES = [40, 30]  # what an order ticket and a seat draw a customer at
FIT_SIZES  = [64, 44] # what the room and a shop row draw a fitting at
THRESH = 34           # how far from the sampled backdrop still counts as backdrop

# Asset id -> the sprite name the game already references.
NAMES = {
    "i-01": "ice",      "i-02": "syrup",  "i-03": "datepaste", "i-04": "milk",
    "i-05": "shot",     "i-06": "tea",    "i-07": "pastry",    "i-08": "dough",
    "d-01": "espresso", "d-02": "mint",   "d-03": "latte",     "d-04": "karak",
    "d-05": "almond",   "d-06": "iced",   "d-07": "dateshake", "d-08": "luqaimat",
    "d-09": "regag",    "d-10": "saffron","d-11": "affogato",  "d-12": "cortado",
    "m-01": "m_espresso","m-02": "m_kettle","m-03": "m_syrup",
    "m-04": "m_steamer","m-05": "m_oven", "m-06": "m_ice",
    "r-01": "room_counter", "r-02": "room_day", "r-03": "room_evening",
}
for i in range(1, 13):
    NAMES["c-%02d" % i] = "p%d" % i

# §A fittings -- everything the player can buy, so it can appear in the room
FITTINGS = {
    "f-01": "f_stool",     "f-02": "f_stool_pad", "f-03": "f_table_sm",
    "f-04": "f_table_lg",  "f-05": "f_banquette",
}
NAMES.update(FITTINGS)

# How big each fitting is IN THE ROOM, relative to a stool.
#
# Squaring every asset into one box is right for a shop row -- a grid of equal tiles is
# what a list wants -- and wrong for the room, where it draws a stool the size of a
# banquette. Food never needed this because every cup is cup-sized. Furniture does.
# The room multiplies its base draw size by this; the shop row ignores it.
ROOM_SCALE = {
    "f_stool": 1.00, "f_stool_pad": 1.08, "f_table_sm": 1.26,
    "f_table_lg": 1.85, "f_banquette": 2.55,
}

# Fallback when the file was not named by id.
KEYWORDS = [
    ("espresso", "espresso"), ("latte", "latte"), ("karak", "karak"), ("mint", "mint"),
    ("almond", "almond"), ("croissant", "almond"), ("iced", "iced"), ("shake", "dateshake"),
    ("luqaimat", "luqaimat"), ("regag", "regag"), ("saffron", "saffron"),
    ("affogato", "affogato"), ("cortado", "cortado"), ("datepaste", "datepaste"),
    ("date-paste", "datepaste"), ("dough", "dough"), ("pastry", "pastry"),
    ("syrup", "syrup"), ("milk", "milk"), ("shot", "shot"), ("tea", "tea"), ("ice", "ice"),
]

def target_name(fn):
    stem = os.path.splitext(os.path.basename(fn))[0].lower()
    m = re.search(r"\b([idmrcf])[-_ ]?(\d{1,2})\b", stem)
    if m:
        key = "%s-%02d" % (m.group(1), int(m.group(2)))
        if key in NAMES:
            return NAMES[key]
    for kw, name in KEYWORDS:
        if kw in stem:
            return name
    return None

def cut_background(im):
    """Flood-fill inward from every edge pixel, so interior greys survive."""
    im = im.convert("RGB")
    w, h = im.size
    # sample the four corners; a flat backdrop makes these agree
    corners = [im.getpixel(p) for p in ((0,0), (w-1,0), (0,h-1), (w-1,h-1))]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    work = im.copy()
    KEY = (255, 0, 255)
    seeds = [(x, 0) for x in range(0, w, 8)] + [(x, h-1) for x in range(0, w, 8)] \
          + [(0, y) for y in range(0, h, 8)] + [(w-1, y) for y in range(0, h, 8)]
    for s in seeds:
        px = work.getpixel(s)
        if px == KEY:
            continue
        if max(abs(px[i] - bg[i]) for i in range(3)) <= THRESH:
            ImageDraw.floodfill(work, s, KEY, thresh=THRESH)

    src = work.load()
    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if src[x, y] == KEY:
                ap[x, y] = 0
    # NOTE: the generator bakes a soft drop shadow onto the backdrop and it survives this
    # cut. Stripping it by colour was tried and reverted: a shadow and an object's own
    # neutral mid-greys are indistinguishable, so it ate the milk pitcher's body and the
    # shaded sides of the cup and bowl. At 34px the baked shadow is invisible, and at
    # larger sizes it grounds the object, so it stays.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))   # antialias the cut edge
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out

def head_crop(im, keep=0.60):
    """Characters are busts: the shoulders run off the bottom of the frame, so the
    subject touches the border and the backdrop is no longer a closed region to fill
    from. Cropping to the head fixes that AND fixes legibility — a whole bust drawn at
    40px leaves a 16px face, which is not a face."""
    w, h = im.size
    im = im.crop((0, 0, w, int(h * keep)))
    # re-centre horizontally on the head: find the widest non-backdrop run near the top
    px = im.convert("RGB").load()
    bg = px[2, 2]
    cols = []
    for x in range(im.size[0]):
        hit = 0
        for y in range(4, im.size[1], 7):
            c = px[x, y]
            if max(abs(c[i] - bg[i]) for i in range(3)) > THRESH:
                hit += 1
        cols.append(hit)
    live = [i for i, c in enumerate(cols) if c > 2]
    if live:
        cx = (live[0] + live[-1]) // 2
        half = min(cx, im.size[0] - cx)
        if half > im.size[0] * 0.28:
            im = im.crop((cx - half, 0, cx + half, im.size[1]))
    return im

def fade_bottom(im, band=0.14):
    """The head crop leaves a hard horizontal slice where it cut through the collar.
    Fading the last band of alpha turns that slice into a vignette."""
    w, h = im.size
    a = im.split()[3].load()
    y0 = int(h * (1 - band))
    for y in range(y0, h):
        k = 1.0 - (y - y0) / float(h - y0)
        k = k * k
        for x in range(w):
            v = a[x, y]
            if v:
                a[x, y] = int(v * k)
    return im

def trim_and_square(im, margin=MARGIN, size=MASTER):
    bbox = im.getbbox()
    if not bbox:
        return im.resize((size, size), Image.LANCZOS)
    im = im.crop(bbox)
    inner = int(size * (1 - 2 * margin))
    w, h = im.size
    scale = inner / max(w, h)
    im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(im, ((size - im.size[0]) // 2, (size - im.size[1]) // 2), im)
    return canvas

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    raw = sys.argv[1]
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv \
          else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sprites")
    sheet_path = sys.argv[sys.argv.index("--sheet") + 1] if "--sheet" in sys.argv else None
    os.makedirs(out, exist_ok=True)

    files = sorted(f for f in os.listdir(raw)
                   if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    if not files:
        print("no images found in", raw); sys.exit(1)

    done, unnamed = [], []
    for f in files:
        name = target_name(f)
        if not name:
            unnamed.append(f); continue
        src = Image.open(os.path.join(raw, f))
        wide = name.startswith("room_")
        face = re.match(r"^p\d+$", name) is not None
        if wide:
            im = src.convert("RGBA")
        else:
            im = cut_background(head_crop(src) if face else src)
            if face:
                im = fade_bottom(im)
            im = trim_and_square(im, margin=0.04 if face else MARGIN)
        im.save(os.path.join(out, name + ".png"))
        sizes = [] if wide else (FACE_SIZES if face else
                 (FIT_SIZES if name.startswith("f_") else GAME_SIZES))
        for s in sizes:
            im.resize((s * 3, s * 3), Image.LANCZOS).save(
                os.path.join(out, "%s@%d.png" % (name, s)))
        done.append((name, im))
        print("  %-22s <- %s" % (name + ".png", f))

    if unnamed:
        print("\ncould not match a sprite name (rename with its asset id, e.g. d-03-latte.png):")
        for f in unnamed:
            print("   ", f)

    if sheet_path and done:
        # the row-at-real-size check: anything unreadable here needs a bolder silhouette
        cols, pad = 8, 14
        rows = math.ceil(len(done) / cols)
        cell = 34 + pad * 2
        sheet = Image.new("RGBA", (cols * cell, rows * cell * 2), (23, 19, 16, 255))
        for i, (name, im) in enumerate(done):
            cx, cy = (i % cols) * cell, (i // cols) * cell * 2
            for j, s in enumerate(GAME_SIZES):
                th = im.resize((s, s), Image.LANCZOS)
                sheet.paste(th, (cx + (cell - s) // 2, cy + j * cell + (cell - s) // 2), th)
        sheet.save(sheet_path)
        print("\ncontact sheet ->", sheet_path, "(top row 34px, bottom row 20px)")

    fits = [n for n, _ in done if n.startswith("f_")]
    if fits:
        import json
        man = os.path.join(out, "fittings.json")
        data = {}
        if os.path.exists(man):
            try:
                data = json.load(open(man))
            except Exception:
                data = {}
        for n in fits:
            data[n] = round(ROOM_SCALE.get(n, 1.0), 2)
        missing = [n for n in fits if n not in ROOM_SCALE]
        with open(man, "w") as fh:
            json.dump(dict(sorted(data.items())), fh, indent=2)
            fh.write("\n")
        print("\nfittings.json -> %d room scales" % len(data))
        if missing:
            print("  no ROOM_SCALE for: %s (defaulted to 1.0 -- add them)" % ", ".join(missing))

    print("\n%d sprites written to %s" % (len(done), os.path.normpath(out)))

if __name__ == "__main__":
    main()
