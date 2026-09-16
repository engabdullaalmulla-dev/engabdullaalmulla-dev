# Café Rush — brand kit

Everything with the name Café Rush on it comes from here.

**Start with `guidelines.pdf`** — 28 pages, A4 landscape, fonts embedded, readable on a
machine that has none of them installed. `strategy.md` is the long-form argument the book
compresses; read it when you want to know *why* a rule exists.

## What ships

| Path | What |
|---|---|
| `guidelines.pdf` | The brand guidelines, 28 pages |
| `strategy.md` | Brand strategy, 11 sections — promise, positioning, voice, colour, type, store copy, rules |
| `fonts/fonts.css` | 16 faces as data URIs (Bricolage Grotesque, DM Sans, DM Mono). Drop-in for a press page |
| `assets/colour/tokens.css` | 30 core tokens, 6 art fills with shade partners, 8 accent fills |
| `assets/colour/tokens.json` | The same, with WCAG contrast against `ink-900` and `paper-100`, plus each token's never-rule |
| `assets/colour/swatches-*.png` | Six swatch sheets: ink, cream, accent, room, state, all |
| `assets/logo/` | 7 wordmark and lockup variants — dark, light, stacked, lockup, mono |
| `assets/icon/ios/` | 18 sizes, 29 to 1024, all exported from the 1024 master |
| `assets/icon/android/` | 10 files, including the adaptive foreground/background pair and the Play 512 |
| `assets/icon/web/` | 5 favicon and web-manifest sizes |
| `assets/marketing/` | Google Play feature graphic (1024×500), social and Open Graph banner (1200×630) |

Game art lives in `../art/sprites/` — 41 assets at 512, plus the `@34` and `@20` sizes the
build uses.

## Regenerating

Nothing in this kit is edited by hand.

```sh
python3 build-tokens.py        # tokens.css, tokens.json, swatches.html  <- the single colour table
python3 build-guidelines.py    # guidelines.html + doc-assets/           <- from tokens.json + strategy copy
node render-guidelines.js      # guidelines.pdf + the six swatch PNGs
```

Run them in that order. Change the table in `build-tokens.py` and the book, the stylesheet
and the swatch sheets all move together — which is the point, because the first hand-written
export had already drifted to `street-900` and `sun-200` for tokens the design spec calls
`street-700` and `sun-300`.

`render-guidelines.js` fails loudly rather than quietly: it reports any page whose content
runs past its box and any image that 404s, before it writes the PDF. A clean run prints
`overflowing: []` and `no errors`.

`marketing.html` + the same headless Chromium produce the two marketing graphics;
`render-logo.html` produces the wordmark variants. `doc-assets/` holds downscaled copies of
the art for the PDF only — Chromium embeds images at source resolution, and the first build
came out at 32 MB.

## The three rules people break first

1. **A hex value that is not a token is a bug** — in a banner, a slide and a press release
   exactly as in a scene file.
2. **`brass-400` is money and nothing else. `ok-500` is money earned and target met and
   nothing else.** The player learns both in ninety seconds; one decorative use un-teaches them.
3. **No exclamation marks in player-facing strings.** None.

## Authority

`strategy.md` governs brand and marketing output. Where it conflicts with
`docs/design-spec.md`, `docs/requirements.md`, `docs/target-player.md`, `docs/art-plan.md` or
`docs/rush-pivot.md`, **those win and the strategy is wrong and must be amended.** That has
happened once already: rule 23 banned the generated painted art the game actually ships, and
was corrected rather than quietly ignored.
