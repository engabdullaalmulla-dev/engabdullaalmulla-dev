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
    m = re.search(r"\b([idmrc])[-_ ]?(\d{1,2})\b", stem)
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
        im = cut_background(src) if not wide else src.convert("RGBA")
        im = trim_and_square(im) if not wide else im
        im.save(os.path.join(out, name + ".png"))
        for s in ([] if wide else GAME_SIZES):
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

    print("\n%d sprites written to %s" % (len(done), os.path.normpath(out)))

if __name__ == "__main__":
    main()
