#!/usr/bin/env python3
"""Emit the brand colour tokens as CSS, JSON and a swatch-sheet source page.

Authority: docs/design-spec.md §2.3 for every game token, verbatim in name and hex.
brand/strategy.md §8 may only ADD tokens the game does not need (terracotta-400,
paper-100) and may never rename or restate one. Where the two disagree the spec wins
-- that is the strategy's own rule, and the reason this file exists rather than a
hand-written stylesheet: the first export drifted to `street-900` and `sun-200`.
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "assets" / "colour"

# (token, hex, use, never)  -- "never" is the brand rule from strategy.md §8
GROUPS = [
 ("ink", "Ground and surfaces", "The cafe at night, lamp-lit. Three surface steps in a composition, never four.", [
  ("ink-950", "#0E0B09", "Modal scrims at 72%, contact shadows, type set on amber", "Never the app background"),
  ("ink-900", "#171310", "Brand ground. App, store graphics, press page, slides, social", "Never lightened for readability, never pure black"),
  ("ink-850", "#1E1815", "Plate well, inset wells", ""),
  ("ink-800", "#231C18", "Panel, card, ticket, bin", ""),
  ("ink-700", "#2E2521", "Raised panel, chip tile, meter track", ""),
  ("ink-600", "#3B302A", "Default 1 pt edge", "Never a text colour"),
  ("ink-500", "#4A3C34", "Raised edge, rim light", "Never a text colour"),
  ("ink-450", "#5A4A3A", "Edge of a bin holding stock", "Never a text colour"),
  ("ink-outline", "#2A1D16", "The one outline colour on all art, in game and in marketing", "Nothing else is ever used for a stroke"),
 ]),
 ("cream", "Type, and paper", "Type on ink is cream. Type on paper is ink-900.", [
  ("cream-50",  "#F7EFE3", "Primary type on ink, ready-state ring, sprite highlights", "Never on amber-500 -- type on amber is ink-950"),
  ("cream-200", "#D9C9B6", "Secondary emphasis", ""),
  ("cream-400", "#A8988A", "Secondary text, dish names", "Never below 11 pt"),
  ("cream-600", "#6F6058", "Tertiary text, disabled, micro-labels", "Never for anything read while the clock runs"),
  ("paper-100", "#FBF6ED", "Brand-only. Print, press kit, the one-page site, a light shelf", "Never appears in the game"),
 ]),
 ("accent", "Warm accents", "The brand is amber on ink. Money is brass and nothing else.", [
  ("amber-400", "#FFBC63", "Focus ring, active highlight, cook-ready flash, lit edge of the wordmark", "Never a fill for body type on cream"),
  ("amber-500", "#F2A03D", "Brand primary. The wordmark's e, primary fill, the + glyph, the clock bar", "Never money. Never a field larger than a button"),
  ("amber-700", "#C97C22", "Pressed and active, and amber on light grounds", "Never at rest, never in marketing"),
  ("brass-400", "#E8C36B", "Money and only money: coins, AED figures, tips, takings, the listed price", "Never a button, decoration or headline"),
  ("terracotta-600", "#A8452A", "Awning, wall band, dusk sky, the CLOSED stamp", "Never a button, warning or state"),
  ("terracotta-400", "#C9603C", "Brand-only. Large flat marketing fields where -600 goes muddy", "Never in the game, never beside state-urgent"),
 ]),
 ("room", "Environment", "Cafe art only. These may never carry UI state.", [
  ("wood-600",  "#7A4A2B", "Counter front, shelf", "Never carries state"),
  ("wood-400",  "#A9704A", "Counter top, lit wood", "Never carries state"),
  ("tile-500",  "#3E6E6B", "The one cool note: the tile band, and one accent per composition", "Never more than one element per composition"),
  ("street-700","#1C2430", "The street beyond the window", "Never a page background"),
  ("sun-300",   "#F4D9A8", "Window light, lamp glow, steam, the glow behind the wordmark at <=12%", "Never type, never a control fill"),
 ]),
 ("state", "Semantic state", "Learned in the first shift. The same meaning everywhere, screenshots included.", [
  ("state-calm",  "#5B9DD9", "Patience >= 55%, cooking in progress", "Anything monetary"),
  ("state-soon",  "#F2A03D", "Patience 25-55%, recoverable warning", "Idle decoration"),
  ("state-urgent","#E24B2E", "Patience < 25%, walkout, failure", "Food, buttons at rest, any marketing field"),
  ("ok-500",      "#4FBF7B", "Money earned and targets met", "Urgency, readiness, timers"),
  ("focus-500",   "#FFBC63", "Focus ring, 2 pt, 2 pt offset", "Anything else"),
 ]),
]

# Art fill sets -- exported so an illustrator has no reason to invent a hex.
FILLS = [("fill-porcelain","#F1E6D6","#D3C3AE"), ("fill-glass","#DCE9EE","#B6CBD4"),
         ("fill-dough","#E8C79A","#C4914F"),     ("fill-steel","#CFCAC2","#A7A099"),
         ("fill-honey","#E7B24C","#BE8524"),     ("fill-linen","#E3D8C6","#C2B49A")]
ACCENT_FILLS = [("espresso","#4A2A1C"),("tea","#C98A4E"),("mint","#7FB86B"),("milk","#FAF6EE"),
                ("karak","#C98A4E"),("ice-core","#AFD4E4"),("almond","#D8B27E"),("date","#6B3B23")]
CHIPS = ["#E8B86D","#C9A0DC","#7FC8A9","#F09B8C","#9BB8E8","#D9C06B","#E8A0B4","#8FD1C4","#C2B49A","#B9A3E0"]


def srgb_to_lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def luminance(hx):
    r, g, b = (int(hx[i:i+2], 16) for i in (1, 3, 5))
    return 0.2126*srgb_to_lin(r) + 0.7152*srgb_to_lin(g) + 0.0722*srgb_to_lin(b)

def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    css = ["/* Cafe Rush brand colour tokens.",
           "   Generated by brand/build-tokens.py from docs/design-spec.md 2.3 + brand/strategy.md 8.",
           "   A hex literal that is not one of these is a bug. Edit the generator, not this file. */",
           ":root {"]
    data = {"groups": [], "fills": [], "accentFills": [], "customerChips": CHIPS}
    for key, title, note, rows in GROUPS:
        css.append("  /* %s -- %s */" % (key, title.lower()))
        g = {"key": key, "title": title, "note": note, "tokens": []}
        for tok, hx, use, never in rows:
            css.append("  --%s: %s;%s/* %s */" % (tok, hx, " " * max(1, 22 - len(tok) - len(hx)), use))
            g["tokens"].append({"token": tok, "hex": hx, "use": use, "never": never,
                                "onInk900": round(contrast(hx, "#171310"), 2),
                                "onPaper100": round(contrast(hx, "#FBF6ED"), 2)})
        data["groups"].append(g)
    css.append("")
    css.append("  /* art fills -- the fills permitted to dominate a silhouette, with shade partners */")
    for tok, base, shade in FILLS:
        css.append("  --%s: %s;" % (tok, base))
        css.append("  --%s-shade: %s;" % (tok, shade))
        data["fills"].append({"token": tok, "hex": base, "shade": shade})
    css.append("")
    css.append("  /* accent fills -- small internal areas only, under 40%% of a silhouette */")
    for tok, hx in ACCENT_FILLS:
        css.append("  --fill-%s: %s;" % (tok, hx))
        data["accentFills"].append({"token": "fill-" + tok, "hex": hx})
    css.append("}")
    (OUT / "tokens.css").write_text("\n".join(css) + "\n")
    (OUT / "tokens.json").write_text(json.dumps(data, indent=2) + "\n")

    write_swatch_page(data)

    n = sum(len(g["tokens"]) for g in data["groups"])
    print("tokens.css / tokens.json: %d core tokens, %d art fills, %d accent fills, %d chips"
          % (n, len(FILLS), len(ACCENT_FILLS), len(CHIPS)))
    return data


SWATCH_CSS = """
*{box-sizing:border-box}
body{margin:0;background:#888;font-family:"DM Sans",sans-serif}
.sheet{width:1000px;background:var(--paper-100);padding:40px 44px;margin:16px}
.sh{display:flex;justify-content:space-between;align-items:baseline;
    border-bottom:2px solid var(--ink-900);padding-bottom:10px;margin-bottom:6px}
.sh h1{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:30px;
       letter-spacing:-.02em;margin:0}
.sh .m{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.18em;
       text-transform:uppercase;color:#6F6058}
.note{font-size:13px;color:#4A3C34;margin:10px 0 20px;max-width:640px;line-height:1.45}
.row{display:flex;gap:18px;align-items:stretch;padding:13px 0;
     border-bottom:1px solid rgba(23,19,16,.12)}
.chip{width:132px;height:74px;flex:none;border-radius:5px;border:1px solid rgba(23,19,16,.18);
      position:relative}
.chip b{position:absolute;left:9px;bottom:7px;font-family:"DM Mono",monospace;font-size:11px;
        font-weight:500}
.meta{flex:1;min-width:0}
.tk{font-family:"DM Mono",monospace;font-size:15px;font-weight:500}
.use{font-size:13.5px;line-height:1.4;margin-top:4px}
.never{font-size:12.5px;line-height:1.35;color:#A8452A;margin-top:4px}
.never i{font-family:"DM Mono",monospace;font-style:normal;font-size:9px;letter-spacing:.14em;
         text-transform:uppercase;margin-right:7px}
.cr{font-family:"DM Mono",monospace;font-size:10px;color:#6F6058;margin-top:5px;
    letter-spacing:.04em}
.foot{font-family:"DM Mono",monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;
      color:#6F6058;margin-top:22px;padding-top:11px;border-top:1px solid rgba(23,19,16,.14);
      display:flex;justify-content:space-between}
"""


def write_swatch_page(data):
    """One sheet per group, plus an all-tokens sheet. render-guidelines.js shoots each."""
    def rows(tokens):
        out = []
        for t in tokens:
            # a swatch that separates well from ink-900 is a light swatch, so its
            # inset hex label has to be ink, not cream
            light = t["onInk900"] > t["onPaper100"]
            out.append(
              '<div class="row"><div class="chip" style="background:%s">'
              '<b style="color:%s">%s</b></div><div class="meta">'
              '<div class="tk">%s</div><div class="use">%s</div>%s'
              '<div class="cr">on ink-900 %.2f:1 &middot; on paper-100 %.2f:1</div>'
              '</div></div>'
              % (t["hex"], "#171310" if light else "#F7EFE3", t["hex"], t["token"], t["use"],
                 ('<div class="never"><i>never</i>%s</div>' % t["never"]) if t["never"] else "",
                 t["onInk900"], t["onPaper100"]))
        return "".join(out)

    sheets = []
    for g in data["groups"]:
        sheets.append(
          '<div class="sheet" id="swatches-%s"><div class="sh"><h1>%s</h1>'
          '<div class="m">Cafe Rush &middot; %d tokens</div></div>'
          '<p class="note">%s</p>%s'
          '<div class="foot"><span>docs/design-spec.md 2.3 + brand/strategy.md 8</span>'
          '<span>a hex that is not a token is a bug</span></div></div>'
          % (g["key"], g["title"], len(g["tokens"]), g["note"], rows(g["tokens"])))

    allrows = "".join(
      '<div class="a"><span style="background:%s"></span><b>%s</b><i>%s</i></div>'
      % (t["hex"], t["token"], t["hex"])
      for g in data["groups"] for t in g["tokens"])
    allrows += "".join(
      '<div class="a"><span style="background:%s"></span><b>%s</b><i>%s</i></div>'
      % (f["hex"], f["token"], f["hex"]) for f in data["fills"])
    allrows += "".join(
      '<div class="a"><span style="background:%s"></span><b>%s</b><i>%s</i></div>'
      % (a["hex"], a["token"], a["hex"]) for a in data["accentFills"])
    sheets.append(
      '<div class="sheet" id="swatches-all"><div class="sh"><h1>All tokens</h1>'
      '<div class="m">Cafe Rush &middot; %d values</div></div>'
      '<div class="grid">%s</div>'
      '<div class="foot"><span>docs/design-spec.md 2.3 + brand/strategy.md 8</span>'
      '<span>a hex that is not a token is a bug</span></div></div>'
      % (sum(len(g["tokens"]) for g in data["groups"]) + len(data["fills"]) + len(data["accentFills"]),
         allrows))

    extra = ("\n.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:18px}"
             "\n.a span{display:block;height:64px;border-radius:5px;border:1px solid rgba(23,19,16,.18)}"
             "\n.a b{display:block;font-family:'DM Mono',monospace;font-size:11.5px;font-weight:500;"
             "margin-top:6px}"
             "\n.a i{font-family:'DM Mono',monospace;font-style:normal;font-size:10px;color:#6F6058}")
    doc = ('<!doctype html><html><head><meta charset="utf-8">'
           '<link rel="stylesheet" href="../../fonts/fonts.css">'
           '<link rel="stylesheet" href="tokens.css">'
           '<style>%s%s</style></head><body>%s</body></html>'
           % (SWATCH_CSS, extra, "\n".join(sheets)))
    (OUT / "swatches.html").write_text(doc)


if __name__ == "__main__":
    main()
