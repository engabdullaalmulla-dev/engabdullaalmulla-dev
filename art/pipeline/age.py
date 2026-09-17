#!/usr/bin/env python3
"""PLACEHOLDER aged portraits, so the prototype runs before §B2 is generated.

These are NOT the shipping assets. The filter holds at the 40px a service row draws
and visibly does not at the 150px a story screen can, so §B2 is still eleven images
to generate properly. Running process.py over a generated a-XX file overwrites the
placeholder and removes it from art/sprites/PLACEHOLDERS.json.

What it does: derive an aged portrait from the original.

    python3 age.py ../sprites

Eleven ageing portraits were the slowest item in art-brief-2: one image per message,
each needing the original as its only reference, because the test is whether a stranger
can tell it is the same person thirty years on.

The test is also the reason this works. The game draws a face at 40-72px. At that size
the signal that reads as age is hair going grey -- not wrinkles, not jowls, which are
sub-pixel. So: find the hair (dark, low-saturation, opaque), lift it toward grey, and
take a little warmth out of the whole portrait.

Judged at 40px it is indistinguishable from a generated version. Judged at 150px it is
visibly a filter, so it is only fit for the sizes the game actually uses -- which is all
of them. A-12 is deliberately absent: the grandmother does not get thirty more years.
"""
import sys, os
import numpy as np
from PIL import Image

AGED = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"]
# p12 is A-12, the grandmother, and is deliberately absent: she does not get thirty
# more years. I first skipped p8 by mistake, which is A-08 and does get them.
SIZES = [40, 30]


def age(im, amount=0.8):
    a = np.asarray(im.convert("RGBA"), dtype=np.float64).copy()
    rgb, al = a[:, :, :3], a[:, :, 3]
    mx, mn = rgb.max(2), rgb.min(2)
    v = mx / 255.0
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    hair = (v < 0.34) & (sat < 0.62) & (al > 40)
    tgt = np.clip(rgb.mean(2)[:, :, None] * 1.9 + 92, 0, 232)
    m = hair[:, :, None] * amount
    rgb[:] = rgb * (1 - m) + tgt * m
    g = rgb.mean(2)[:, :, None]
    rgb[:] = rgb * 0.93 + g * 0.07                     # the years take some warmth out
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "../sprites"
    n = 0
    for p in AGED:
        src = os.path.join(out, p + ".png")
        if not os.path.exists(src):
            print("  missing", src); continue
        im = age(Image.open(src))
        im.save(os.path.join(out, p + "_old.png"))
        for s in SIZES:
            im.resize((s * 3, s * 3), Image.LANCZOS).save(
                os.path.join(out, "%s_old@%d.png" % (p, s)))
        n += 1
        print("  %-12s <- %s" % (p + "_old.png", p + ".png"))
    print("\n%d aged portraits written (A-12 / p12 skipped by design)" % n)


if __name__ == "__main__":
    main()
