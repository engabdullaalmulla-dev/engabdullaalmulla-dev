# Café Rush — Design Specification v1.0

**Lead Designer (UX + visual) · 2026-09-15**

Scope: the shippable design for `prototype/frenzy.html` — real-time cooking/time-management,
portrait phone, one café on a struggling shopping street in the UAE. Currency AED. Ninety-second
shifts against an earnings target, upgrades between days, endless wave mode after day three.

This document assumes and builds on:
`docs/art-plan.md` (art budget reality), `docs/target-player.md` (who this is for),
`docs/rush-pivot.md` (why the loop is simultaneous), `docs/engine-decision.md` (Godot 4 default),
`prototype/frenzy.html` (the working loop, which is the truth about what this game is).

Nothing here changes a game rule. Every mechanic described is the mechanic already in the
prototype — the two-layer ingredient/dish economy, the six bins, the three-to-five seats, the
90-second clock, the derived target, the endless ramp. This spec describes how that game should
**look, read, and feel**.

Units: `pt` = iOS points / Android dp. Reference frame **390 × 844 pt** (iPhone 14 / Pixel 7 class),
with a 47 pt top inset and a 34 pt bottom inset. Every layout is specified against that frame and
then given a rule for how it flexes.

---

## 1. Design principles

Six principles, each derived from a specific line in `docs/target-player.md`.

| # | Principle | Rationale |
|---|---|---|
| **P1** | **The clock is the only thing allowed to pressure the player.** | The player said "don't want to wait 4 hours for something to build" and "without feeling that I have to play". Pressure inside the 90 seconds is the product; pressure outside it — energy, streaks, daily rewards, timed offers — is the thing they walked away from. No UI element may ever imply an obligation that outlives the shift. |
| **P2** | **Legible before beautiful; beautiful only where it is also legible.** | This is a triage game. The player parses five patience states, three plate slots and six bin stocks in under a second, forty times a shift. Any art choice that costs a millisecond of parsing is a bad art choice regardless of how it looks in a screenshot. |
| **P3** | **One committed look, executed by rule, beats an expensive look executed unevenly.** | `art-plan.md` puts Cooking-Madness fidelity out of reach of this project, and is right that a consistent cheap style beats an inconsistent expensive one. All art here is authored in-repo as code, so consistency has to come from enforceable rules rather than from an illustrator's hand — see §2.5. |
| **P4** | **New content must be nearly free to draw.** | "Lasts a while" is the single most-stated want in the source post, and the named failure of the closest competitor. Longevity is an art-pipeline requirement before it is a content requirement: if a new recipe costs a day of illustration, there will never be a hundred recipes. |
| **P5** | **Every tap answers back within 100 ms, physically.** | The Dash lineage is a *tactile* genre. `art-plan.md` is right that the juice pass closes most of the perceived gap for free. A tap that deforms, travels and lands sells "game"; a tap that changes a number sells "spreadsheet". |
| **P6** | **The café is a place, not a backdrop.** | The calm prototype failed because it was sequential, not because it was warm. The warmth is the reason this isn't Cook, Serve, Delicious!. Named customers, a street that dims toward evening, a barista who reacts — all of it lives in the calm moments and the middle band, never in the triage. |

---

## 2. Art direction

> **Production reality:** there is no external illustrator. Every asset in this game is authored
> **in-repo as hand-written SVG/vector in code** — flat geometric primitives, a fixed palette, a
> shared construction grid. This is a constraint on the style, and the style below is chosen to
> make it an advantage rather than a limitation.

### 2.1 The recommendation: **Warm Vector**

> **Flat geometric vector.** Every object is assembled from circles, rounded rectangles, and short
> bezier paths on a shared 4-unit construction grid. One dark ink outline, one flat fill per shape,
> one hard-edged shade shape, at most one highlight. A single light direction for the whole game.
> No texture, no gradients, no rendered form, no hand-illustrated portraits.

Think **transit signage**, **Gulf enamel shopfront lettering**, **airline safety cards** — systems
where a handful of shapes, used with discipline, produce dozens of unmistakable objects. Warmth
comes from the **palette and the proportions** (generous radii, chunky forms, a dark lamp-lit
ground, brass money), not from rendering.

### 2.2 Why this is the right style for code-authored art

1. **It is the only style that survives being written by hand in SVG.** A circle, a rounded rect
   and a two-node bezier are things a code author can place exactly and repeat exactly. Painted
   texture, airbrushed gradients and illustrated faces are not — attempting them in code produces
   the "uncanny clip art" failure, which is worse than committing to flat.
2. **Consistency becomes mechanical rather than a matter of taste.** In §2.5–§2.8 every visual
   decision is reduced to a rule with a number attached: a radius from a fixed set, a stroke width
   derived from the viewBox, a shade shape built by one recipe, a light direction that never moves.
   A code author who obeys the rules cannot produce an inconsistent asset. That is not true of any
   painterly style.
3. **The marginal cost of content approaches zero.** `docs/target-player.md` names longevity as the
   headline want and the closest competitor's specific failure. When a new ingredient is forty
   lines of SVG built from the same primitives as the last one, an eight-recipe expansion is an
   afternoon. This is what makes P4 physically possible.
4. **A restyle is a global edit, not a re-commission.** Because every asset draws its colours from
   the token table in §2.3 and its geometry from the grid in §2.5, changing the entire game's look
   — warmer, cooler, higher contrast, a seasonal palette, a colour-blind palette — is a change to
   one file. Nothing has to be redrawn, re-exported, re-quoted or waited for.
5. **It scales perfectly and ships tiny.** Vector authored once is crisp at 21 pt on the ticket
   chip and at 1024 pt on the app icon. There are no @2x/@3x export sets to manage and no texture
   memory to budget.

**The honest risk:** flat vector will not screenshot like Cooking Madness, and it never will.
The mitigation is warmth and character, not detail — the dark warm ground, brass money, generous
radii, named recognisable customers, and above all the juice in §6, which `docs/art-plan.md` is
right to say closes most of the perceived gap for free. A flat game that *feels* excellent beats a
half-painted one every time.

### 2.3 Colour palette

The prototype's palette is already correct in structure — warm dark ground, cream type, amber
action. It is kept and extended rather than replaced. Token names map 1:1 onto `frenzy.html`'s CSS
custom properties.

**Ground and surfaces** — the café at night, lamp-lit.

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#0E0B09` | Modal scrims (at 72%), contact shadows, text on amber |
| `ink-900` | `#171310` | App background *(was `--bg`)* |
| `ink-850` | `#1E1815` | Plate well, inset wells |
| `ink-800` | `#231C18` | Panel, card, ticket card, bin card *(was `--panel`)* |
| `ink-700` | `#2E2521` | Raised panel, chip tile, meter track *(was `--panel-2`)* |
| `ink-600` | `#3B302A` | Default 1 pt edge *(was `--edge`)* |
| `ink-500` | `#4A3C34` | Raised edge, rim light |
| `ink-450` | `#5A4A3A` | Edge of a bin holding stock *(was `.bin.has`)* |

**Type and line**

| Token | Hex | Use |
|---|---|---|
| `cream-50` | `#F7EFE3` | Primary text, ready-state ring, sprite highlights |
| `cream-200` | `#D9C9B6` | Secondary emphasis |
| `cream-400` | `#A8988A` | Secondary text, dish names on tickets *(was `--dim`)* |
| `cream-600` | `#6F6058` | Tertiary text, disabled, micro-labels *(was `--dimmer`)* |
| **`ink-outline`** | **`#2A1D16`** | **The one outline colour in the entire game.** Nothing else is ever used for a stroke on art |

**Warm accents**

| Token | Hex | Use |
|---|---|---|
| `amber-400` | `#FFBC63` | Focus ring, active highlight, cook-ready flash |
| `amber-500` | `#F2A03D` | Primary action fill, the `+` glyph, clock bar |
| `amber-700` | `#C97C22` | Primary pressed |
| `brass-400` | `#E8C36B` | **Money only** — coins, AED figures, tips, cash total |
| `terracotta-600` | `#A8452A` | Awning, wall band, dusk sky, "CLOSED" stamp |

**Environment — café art only. These may never carry UI state.**

| Token | Hex | Use |
|---|---|---|
| `wood-600` | `#7A4A2B` | Counter front, shelf |
| `wood-400` | `#A9704A` | Counter top, lit wood |
| `tile-500` | `#3E6E6B` | Teal tile band behind the machines (the one cool note) |
| `street-700` | `#1C2430` | The street beyond the window |
| `sun-300` | `#F4D9A8` | Window light, lamp glow, steam |

**Light Fill set** — the fills permitted to dominate a sprite's silhouette (see the Dominant Fill
Rule, §2.6). All are L\* ≥ 70 and separate cleanly from `ink-900`.

| Token | Hex | Shade partner | Typical use |
|---|---|---|---|
| `fill-porcelain` | `#F1E6D6` | `#D3C3AE` | Cups, saucers, jugs, plates |
| `fill-glass` | `#DCE9EE` | `#B6CBD4` | Istikana glass, ice, iced-latte tumbler |
| `fill-dough` | `#E8C79A` | `#C4914F` | Pastry, croissant, date/almond bakes |
| `fill-steel` | `#CFCAC2` | `#A7A099` | Machine bodies, steamer, oven front |
| `fill-honey` | `#E7B24C` | `#BE8524` | Syrup, date syrup, brass fittings |
| `fill-linen` | `#E3D8C6` | `#C2B49A` | Aprons, shirts, bags |

**Accent Fill set** — permitted only for small internal areas (< 40% of silhouette).

`espresso #4A2A1C` · `tea #C98A4E` · `mint #7FB86B` · `milk #FAF6EE` · `karak #C98A4E` ·
`ice-core #AFD4E4` · `almond #D8B27E` · `date #6B3B23`

**Semantic state — see §8.1 for why this ramp and not green→red**

| Token | Hex | Meaning | Never used for |
|---|---|---|---|
| `state-calm` | `#5B9DD9` | Patience ≥ 55%, cooking progress | Anything monetary |
| `state-soon` | `#F2A03D` | Patience 25–55%, recoverable warnings | Idle decoration |
| `state-urgent` | `#E24B2E` | Patience < 25%, walkout, failure | Food, buttons at rest, the scrape control |
| `ok-500` | `#4FBF7B` | **Money earned and targets met only** | Urgency, readiness, timers |
| `focus-500` | `#FFBC63` | Focus ring, 2 pt, 2 pt offset | — |

**Customer identity chips** (kept from `HUES`, expanded to 10). Decorative identity only — never
state, because a customer whose chip is red must not read as urgent.

`#E8B86D` `#C9A0DC` `#7FC8A9` `#F09B8C` `#9BB8E8` `#D9C06B` `#E8A0B4` `#8FD1C4` `#C2B49A` `#B9A3E0`

All chips test ≥ 4.5:1 against `ink-900` and carry `ink-950` initials.

**Skin set** — four swatches, each with its shade partner:

`#F2D0AE`/`#D3AE89` · `#DCA97A`/`#B9865A` · `#B07845`/`#8E5C32` · `#7A4E2E`/`#5D3820`

**Every colour in the game comes from these tables. A hex literal that is not a token is a bug.**

### 2.4 Typography

Three Latin faces across two superfamilies, plus two Arabic faces. All five are SIL Open Font
License — zero licensing cost, embeddable, already proven in the prototype.

| Role | Typeface | Weights | Fallback chain |
|---|---|---|---|
| **Display** — screen titles, money totals, button labels, floating payments, streak count | **Bricolage Grotesque** | 600, 800 | `Bricolage Grotesque` → `Archivo` → `Inter Tight` → system-ui → sans-serif |
| **UI / body** — running copy, hints, dish names, shop descriptions, settings | **DM Sans** | 400, 500, 700 | `DM Sans` → `Inter` → `Roboto` → system-ui → sans-serif |
| **Numerals / micro-labels** — clock, timers, stock counts, prices, ALL-CAPS labels | **DM Mono** | 400, 500 | `DM Mono` → `Roboto Mono` → `SF Mono` → ui-monospace → monospace |
| **Arabic display** | **Cairo** | 700, 900 | `Cairo` → `Tajawal` → `Noto Kufi Arabic` → sans-serif |
| **Arabic UI + numerals** | **IBM Plex Sans Arabic** | 400, 500, 600 | `IBM Plex Sans Arabic` → `Noto Sans Arabic` → sans-serif, with `font-feature-settings: "tnum"` |

**Why this split.** Bricolage's optical-size axis lets one file serve a 34 pt title and a 15 pt
button without the heavy weight going muddy. DM Mono is tabular by construction, which is what a
HUD needs — a clock that never reflows, stock counts that align. DM Sans shares DM Mono's skeleton,
so body copy and numerals look related rather than borrowed. There is no Arabic monospace worth
shipping; IBM Plex Sans Arabic with `tnum` is the substitute and it is good.

**Type scale.** Sizes in pt; line-height absolute so baselines land on the 4 pt grid.

| Style | Face / weight | Size / line-height | Tracking | Used on |
|---|---|---|---|---|
| `display-xl` | Bricolage 800 | 34 / 36 | −0.02em | Result headline, splash wordmark |
| `display-l` | Bricolage 800 | 29 / 31 | −0.02em | Screen titles ("Open the café") |
| `display-m` | Bricolage 800 | 22 / 24 | −0.02em | Cash total, result figure |
| `display-s` | Bricolage 800 | 17 / 20 | −0.01em | Button labels, HUD numbers, floating payment |
| `body-l` | DM Sans 400 | 15 / 22 | 0 | Briefing copy, shop descriptions |
| `body-m` | DM Sans 400 | 13 / 19 | 0 | Row descriptions, settings captions |
| `body-s` | DM Sans 400 | 11.5 / 17 | 0 | Hints, footnotes |
| `num-l` | DM Mono 500 | 20 / 22 | 0 | Endless wave counter, big timers |
| `num-m` | DM Mono 500 | 14 / 18 | 0 | Prices, stock counts, seconds-left badge |
| `num-s` | DM Mono 400 | 11 / 14 | 0 | Bin names, ticket sub-labels |
| `label` | DM Mono 500 | 9 / 12 | +0.14em, uppercase | "DAY" "EARNED" "TARGET" "STREAK" |

Absolute minimum rendered size anywhere: **9 pt, and only for the all-caps `label` style** — short,
spaced, static, high contrast. Nothing the player must read *while the clock runs* is below 11 pt.

### 2.5 The construction grid — the rules that make code-authored art consistent

These are not guidelines. They are checkable constraints, and a lint pass should enforce them.

| Rule | Value |
|---|---|
| **R1 · Canvas** | Icons, ingredients, dishes, machines, FX: `viewBox="0 0 96 96"`. Characters: `0 0 96 128`. Environment layers: `0 0 390 216`. UI glyphs: `0 0 24 24`. **No other viewBox exists.** |
| **R2 · Grid** | Every coordinate is a multiple of **4** in a 96 box (a multiple of **2** in a 24 box). Bezier control points may be multiples of 2. Anything else is a bug. |
| **R3 · Padding box** | Artwork occupies the centred **80 × 80** region of a 96 box — an 8-unit margin on all sides. Characters use 80 × 112 centred. This guarantees a consistent optical size when twelve different sprites sit in a row, which is the single most common flat-icon failure. |
| **R4 · Corner radii** | Only from the set **{4, 8, 12, 24, 48}**. 48 in a 96 box is a full circle. No other radius value appears anywhere in the codebase, including UI. |
| **R5 · Angles** | Only **0°, 30°, 45°, 60°, 90°** and their negatives. The 30° diagonal is the house angle: liquid surfaces, pastry flake edges, the ice cluster axis, the highlight bar. |
| **R6 · Shape budget** | Maximum **9 drawn shapes** per 96-box asset, excluding the contact shadow. If an asset needs a tenth, it is over-detailed and will not read at 21 pt. |
| **R7 · Stroke width** | `viewBoxEdge / 16` for silhouette edges (**6 units** in a 96 box, **1.5 units** in a 24 box). Interior divisions use half that. `stroke-linejoin:round`, `stroke-linecap:round`. Strokes scale with the asset, so proportion is constant at every display size. |
| **R8 · Light direction** | Upper right, 60° above horizontal. **Fixed for every asset in the game, forever.** |
| **R9 · Silhouette first** | Every asset is authored as a black silhouette and reviewed at **21 pt** before any colour is applied. If two silhouettes are confusable at 21 pt, one is redesigned. |
| **R10 · Tokens only** | Every `fill` and `stroke` value is a token name from §2.3. No literal hex in any asset file. |

### 2.6 Stroke, shade and highlight policy

**One stroke policy, no exceptions.**

- Every shape on the silhouette edge is stroked in **`ink-outline #2A1D16`** at the R7 width.
- Interior divisions (a liquid line, a handle join, a lid seam) use the same colour at half width.
- **Never stroked:** highlight shapes, shade shapes, contact shadows, particles, the grain overlay.
- There is exactly one outline colour in the game. Not "a dark version of the fill" — one colour.
  This is what makes fourteen separately-authored foods look like one set.

**Shade — one shape per asset, built by one recipe.**

```
shade = silhouette path, translated (−14, +14) units, clipped to the silhouette
fill  = the base fill's shade partner from §2.3
```

Flat, hard-edged, opacity 1, no blur, no blend mode. Where the silhouette is a circle, the shade is
the same circle offset and clipped — which produces the crescent that reads as form. Where it is a
rounded rect, the shade is an L along the lower-left. There is never a second shade shape.

**Highlight — at most one per asset, one of exactly two forms.**

| Form | Geometry | Used on |
|---|---|---|
| `H-dot` | Circle, r = 8 units, centred at (64, 30) in a 96 box | Round forms: cups, jugs, ice, fruit |
| `H-bar` | Rounded rect 8 × 26, radius 4, rotated **−30°**, top-right quadrant | Flat forms: glass, oven fronts, trays, machine panels |

Fill `cream-50`, opacity 1. Never a gradient, never two highlights, never a highlight on an asset
smaller than 32 pt display (it becomes noise).

**Contact shadow — for anything that sits on a surface.**

Ellipse, `rx = 34`, `ry = 7` units, centred at `(48, 90)` in a 96 box, `ink-950` at **22%**, no
blur, no stroke. This single ellipse is what makes a flat sprite sit on the counter rather than
float in front of it.

### 2.7 Reading on both dark and light grounds

Sprites appear on the dark gameplay ground (`ink-900`/`ink-800`) **and** on light surfaces (result
plaques, the "CLOSED" stamp, the app icon, marketing frames). Three rules guarantee both:

1. **The Dominant Fill Rule.** At least **60% of a sprite's silhouette area** must be filled from
   the **Light Fill set** (§2.3, all L\* ≥ 70). Dark Accent Fills — espresso, date, street — may
   only occupy interior areas under 40%. So the espresso *liquid* is dark; the *cup* is porcelain.
   This guarantees separation from `ink-900` by luminance alone.
2. **The outline handles the light ground.** `ink-outline` at 14:1 against `cream-50` means every
   silhouette holds its edge on a light plaque even when the fill is nearly the same value as the
   surface.
3. **The optional carrier tile.** Where a sprite must sit on an unpredictable ground (a ticket chip
   over the urgent column wash, a dish sprite on the result plaque), it is drawn on its standard
   carrier: a rounded rect, radius 8, fill `ink-700` on dark surfaces / `cream-200` on light ones,
   with the sprite inset 4 units. The carrier is a **UI** decision made per placement; the sprite
   itself never changes.

**The verification test, run on every new asset:** render it at 21 pt on `ink-900`, at 21 pt on
`cream-50`, and at 21 pt in pure greyscale. If it is not immediately identifiable in all three, it
is not finished.

### 2.8 Food and ingredient construction

Food is the game's vocabulary and must be identifiable at **21 pt** — the ticket chip, and the
hardest constraint in the whole art spec.

**The house construction.** Every food form is built around a single **30° diagonal** (R5) — the
liquid surface, the flaked edge, the ice axis. That shared angle is what makes fourteen separately
authored items read as one family.

| Item | Primitives | Distinguishing silhouette |
|---|---|---|
| **Shot** | Rounded rect 44 × 40 r12 (`fill-porcelain`), ellipse top 44 × 12, liquid rect clipped (`espresso`), saucer ellipse 64 × 10 | Short, wide, **no handle** — the squat one |
| **Tea** | Bulbous *istikana*: two arcs mirrored, waist at y 56, 36 wide (`fill-glass`), liquid (`tea`), saucer ellipse | **Tall with a waist** — the only hourglass profile |
| **Syrup** | Squeeze bottle: rounded rect 32 × 52 r8 (`fill-honey`), tapered neck trapezoid, one drip circle r6 | The only asset with a **narrow neck and a drip** |
| **Milk** | Straight jug: rect 40 × 52 r8 (`fill-porcelain`), triangular pouring lip at 30°, C-handle stroke on the right | **Straight sides + handle + lip** |
| **Pastry** | Croissant: three overlapping rounded rects r12 on a 30° arc (`fill-dough`), two 30° score lines | **Crescent, no container** — the only non-vessel with mass |
| **Ice** | Three squares 26 × 26 r4 (`fill-glass`), rotated 0°/30°/−30°, overlapping | **Cluster of three, no container** — the only asset with visible internal gaps |

**Dishes** reuse their ingredient vessel and change the fill and one garnish shape, which is both
cheap and semantically correct — a latte *is* a milk-coloured shot.

| Dish | Base | Difference |
|---|---|---|
| Espresso | Shot | — |
| Mint tea | Tea | `mint` liquid, two leaf ellipses at 30° |
| Latte | Shot, taller (rect 44 × 52) | `milk` liquid, one `tea` heart shape on the surface |
| Karak chai | Tea | `karak` liquid, one `cream-50` foam arc, a cardamom dot |
| Almond croissant | Pastry | `almond` flake triangles ×3, a `cream-50` dusting of four dots |
| Iced latte | Tall tumbler rect 44 × 60 r8 (`fill-glass`) | `milk` liquid, two `ice-core` squares, a straw rect at 30° |

**Rules:** maximum three fills plus outline, shade and highlight (R6 caps total shapes at 9).
Steam is never drawn into a sprite — it is a particle (§6), so a shot looks the same fresh or cold.
Bakes use the `fill-dough`/`almond`/`date` family that no drink touches, so "bake or drink" is
answerable from colour at a glance.

### 2.9 Character construction

Characters are **flat shapes, not portraits**. Eight primitives, assembled from a parts library.
This is entirely authorable in code and is the whole point.

| Part | Geometry (96 × 128 viewBox) | Variants |
|---|---|---|
| **Shoulders** | One rounded trapezoid, top 48 wide, bottom 84 wide, y 92 → 120, top corners r24 | 6 outfit fills (`fill-linen`, kandura cream, abaya `ink-700`, courier `tile-500`, office `fill-glass`, hoodie `terracotta-600`) |
| **Neck** | Rect 20 × 14, r4, centred, y 84 → 98, skin fill, drawn behind the head | — |
| **Head** | Circle r 28 centred (48, 56), **or** squircle 56 × 56 r24 — two face shapes only | 4 skin swatches × 2 shapes = 8 heads |
| **Hair / headwear** | One path laid over the head circle, never more than 4 nodes | 8: ghutra + agal (two rects + one circle arc), shayla (one draped path), short crop (arc), bun (arc + circle r10), curls (five circles r10), cap (half-disc + brim rect), long (two arcs), bald + beard (one arc below) |
| **Eyes** | Two circles, **r 3.5**, at (38, 54) and (58, 54). That is all — no whites, no pupils, no lashes | Fill `ink-outline`. Blink = scale-y to 0.15 for 90 ms |
| **Mouth** | One short path, 16 units wide, centred at (48, 70) | 5: `neutral` (straight rect 16 × 3 r2) · `pleased` (arc, curve up) · `impatient` (straight, shifted 3 left) · `annoyed` (arc, curve down) · `delighted` (half-disc, `ink-outline` fill with a `cream-50` tooth rect) |
| **Brows** | Two rects 12 × 3 r2 at y 42 | Rotation only: `neutral` 0°, `impatient` −10°/+10°, `annoyed` −20°/+20°. Hidden on `pleased` |
| **Accessory** | One shape, optional | 3: phone (rect 14 × 22 r4), tote (rounded rect + strap arc), glasses (two circles r11 + bridge rect) |

**Expression is four numbers**, not four drawings: mouth index, brow rotation, head tilt, lean
offset. That is why the whole expression system is five mouth paths.

**Identity binding.** The prototype's `NAMES` array (Rami, Noor, Dana, Samir, Aisha, Khalid, Mona,
Yusuf, Salma, Tarek, Hana, Omar) is kept, and each name is **permanently bound** to one parts
combination and one identity hue, so "Noor" always looks like Noor. Twelve recognisable regulars
from a parts library of thirty shapes.

**The barista** — the player's avatar in the café band — is the one bespoke figure: the same eight
primitives, plus four arm poses (`idle`, `reach`, `serve`, `celebrate`) built as two rounded-rect
limbs rotating about a shoulder pivot. All animation is transform-only; no part is ever redrawn.

### 2.10 What we are NOT doing

| Not doing | Because |
|---|---|
| **Painted or rendered art of any kind** | Cannot be authored in code. `art-plan.md` also prices it at USD 4,000–12,000 for a slice against a premium price point that cannot repay it. |
| **Gradients**, including on buttons and backgrounds | The fastest way to break a flat system and the hardest thing to keep consistent across hundreds of hand-written paths. The only permitted gradient in the whole game is the modal scrim. |
| **Soft shadows, blurs, glows, bloom** | Same. One exception: a 6 pt `amber-400` outer glow on the ready plate, which is a state cue, not decoration. |
| **Texture, grain, paper fibre, halftone, noise overlays** | Not authorable as geometry, and it makes every asset heavier for no legibility gain. |
| **Hand-illustrated character portraits, faces with rendered features, drawn hair strands** | Faces are two dots and one path. Anything more cannot be kept consistent across twelve characters written by hand. |
| **Frame-by-frame animation** | Every motion in §6 is a transform on an existing shape. No asset is ever redrawn for a frame. |
| **Skeletal animation tooling (Spine/DragonBones)** | Transform-only rigs cover every need in §6 and remove a tool dependency, a licence and an export pipeline. |
| **Drop shadows for UI elevation** | Depth comes from the fill/edge token ladder (`ink-800` panel on `ink-900` ground with an `ink-600` edge). |
| **Radii, angles or stroke widths outside R4/R5/R7** | The rules are the consistency. A one-off 10 pt radius is the first crack. |
| **Hex literals in asset code** | R10. Every colour is a token, which is what makes a restyle a one-file edit. |
| **Any free-to-play visual furniture** | No gem counters, no energy bar, no chests, no "×2" badges, no timed-offer ribbons, no VIP crown. P1, and every line of `target-player.md`. |
| **Red as a decorative colour** | Red is reserved. §7.3. |
| **Green as a state or urgency colour** | Green means money and nothing else. §8.1. |
| **Text baked into any asset** | Localisation. Every string is live text over vector, always. |
| **Emoji as shipping art** | The prototype uses emoji as placeholders (`☕ 🫖 🍯 🥛 🥐 🧊`). Platform-inconsistent, unstyleable and wrong at small sizes. Every one is replaced by a Warm Vector asset in §9. |

### 2.11 A note on production

All art is produced **in-repo as code**, alongside the game, by the same author. There is no
commissioning step, no asset hand-off, no export pipeline and no waiting on a third party. Two
consequences worth stating plainly:

- **Re-colouring is free.** Because every fill is a token (R10), a seasonal palette, a
  high-contrast palette or a complete tonal restyle is a change to one table.
- **A style change is a global edit, not a re-commission.** If the geometry language itself needs
  to move — rounder, squarer, thicker outlines, a different light angle — it is a change to the
  rules in §2.5 and a pass over the asset files, not a new quote and a six-week wait.

This is the strongest argument for the style, and it is worth protecting: the moment a one-off
raster asset enters the repo, it stops being true.

---

## 3. Screen inventory

Twenty-one screens. IDs map to the prototype's `show()` states where one exists; the prototype's
four sections (`s-intro` / `s-play` / `s-result` / `s-shop`) expand into these.

| ID | Screen | Purpose | Entered from | Exits to |
|---|---|---|---|---|
| **S-01** | Splash | Brand moment while the save loads. Nothing interactive. | Cold app launch | S-02 (auto, ≥1200 ms) or S-19 if no save + no language set |
| **S-02** | Home / Café | The hub. The café at rest, current day, cash, and the one big "Open the café" button. Replaces the prototype's implicit return-to-intro. | S-01, S-08, S-09, S-11, S-12, S-14 | S-03 (open), S-10 (shop), S-13 (settings), S-15 (recipes), S-11 (endless, day > 3) |
| **S-03** | Day briefing | Contract for the shift: target, seats, order size, today's menu, what's new. The prototype's `screenIntro()`. | S-02, S-08 ("try again") | S-04 (start shift), S-02 (back) |
| **S-04** | **Gameplay** | The game. The prototype's `s-play`. | S-03, S-11 | S-05 (pause), S-07/S-08 (day end), S-12 (endless end) |
| **S-05** | Pause | Stop the clock without penalty; resume, restart, quit, settings. New — the prototype only pauses on `visibilitychange`. | S-04 (pause button or backgrounding) | S-04 (resume, via S-06), S-03 (restart), S-02 (quit) |
| **S-06** | Resume countdown | A 3-2-1 overlay so the player is not dropped back into a live clock cold. | S-05, return from background | S-04 (auto, 1800 ms) |
| **S-07** | Day result — **pass** | Celebrate, itemise the take, bank it. `endShift()` won branch. | S-04 (clock hits 0, money ≥ target) | S-10 (bank and shop) |
| **S-08** | Day result — **fail** | Explain *why* without punishing, and offer an immediate retry. `endShift()` lost branch. | S-04 (clock hits 0, money < target) | S-03 (retry same day), S-02 (back to café) |
| **S-09** | Day unlock card | A single card when a new dish or bin comes online. Interstitial, dismissible. | S-10 (on advancing to a day where `DISHES[k].day === S.day`) | S-03 |
| **S-10** | Upgrade shop | Spend banked AED between shifts. The prototype's `screenShop()`. | S-07, S-02 | S-09 or S-03 (open next day), S-02 (back) |
| **S-11** | Endless intro | Explain the endless contract (no target, 3 lives, ramps every 25 s), show the personal best, start. | S-02 (day > 3), S-12 | S-04 (endless mode), S-02 (back) |
| **S-12** | Endless result | Wave reached, time lasted, take banked, personal best. `endEndless()`. | S-04 (3 walkouts in endless) | S-11 (go again), S-02 (back) |
| **S-13** | Settings | Sound, music, haptics, motion, colour-blind mode, text size, hand preference, language, restore purchase, reset save. | S-02, S-05 | back to caller |
| **S-14** | Store / purchase | The premium unlock and expansion packs. No currency, no gems, no ads. | S-02 (after the free run ends), S-13 | S-02 (on success, via S-16) |
| **S-15** | Menu / recipes | The reference sheet: every dish, its ingredients, its price, its unlock day, and the cook time of each component. | S-02, S-03, S-05 | back to caller |
| **S-16** | Purchase success | A short confirmation stamp. | S-14 | S-02 (auto, 1600 ms) |
| **S-17** | Purchase / restore error | Something failed, in plain language, with a retry. | S-14 | S-14 |
| **S-18** | Onboarding OB-1…OB-4 | Four gated, in-game coach steps layered over S-04 on day 1. Replaces the prototype's wall-of-text `!S.seen` card. | S-04, day 1 only | S-04 |
| **S-19** | Language picker | First-run only: English / العربية. | S-01 (no stored language) | S-02 |
| **S-20** | Credits | Who made it, font and audio licences. | S-13 | S-13 |
| **S-21** | Save conflict / corrupt save | Rare. "We couldn't read your save" with start-fresh or retry. | S-01 | S-02 or S-19 |

---

## 4. Screen-by-screen layout specs

Global rules that apply to every screen and are not repeated:

- Frame **390 × 844**, top inset **47**, bottom inset **34**. Content width **358** (16 pt gutters).
- Background `ink-900`. Paper grain overlay at 6% over everything.
- Cards: `ink-800` fill, 1 pt `ink-600` edge, **12 pt** radius, 16 pt internal padding.
- Primary button: full width (358), **56 pt** tall, 10 pt radius, `amber-500` fill, `ink-950`
  label in `display-s`. Pressed: `amber-700`, scale 0.98.
- Secondary button: same box, transparent fill, 1 pt `ink-600` edge, `cream-50` label.
- Every back affordance is a 48 × 48 hit area in the top-left (top-right in RTL) containing a
  24 pt chevron.
- Vertical rhythm: 4 pt grid. Section gap 16 pt, related-item gap 8 pt.

### S-01 Splash

**Purpose:** cover the save read and the font load; establish the look before the first frame of UI.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Safe | 0–47 | 47 | — |
| Void | 47–300 | 253 | Empty `ink-900` |
| Wordmark | 300–420 | 120 | "CAFÉ RUSH" `display-xl` cream-50, centred; beneath it a 2 pt × 64 pt `amber-500` rule; beneath that the karak-glass sprite at 56 pt with a steam particle |
| Void | 420–760 | 340 | Empty |
| Progress | 760–784 | 24 | A 2 pt × 120 pt track `ink-700` with an `amber-500` fill, centred. Appears only if load exceeds 600 ms |
| Safe | 810–844 | 34 | — |

**At rest:** wordmark and glass, steam rising. **States:** `loading` (progress rule visible),
`ready` (fades out). **Interactive:** none — a tap after 1200 ms skips to S-02.
**Primary action:** none (auto-advance).

### S-02 Home / Café

**Purpose:** the place you come back to. The café, lit, quiet, with the barista wiping the counter.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Safe | 0–47 | 47 | — |
| Top bar | 47–95 | 48 | Left: settings gear, 48×48 hit. Centre: nothing. Right: cash pill — brass coin icon 20 pt + `S.cash` in `display-s` `brass-400` + "AED" in `label` `cream-600`, on an `ink-800` pill, 32 pt tall, 16 pt radius |
| Café scene | 95–455 | 360 | The full flat-vector café: back wall + tile band, window to the street (time-of-day tinted by `S.day`), shelf of machines, counter, barista `idle`. Parallax: on device tilt, layers shift ±4 / ±2 / 0 pt. Non-interactive except the barista (tap → she waves, 500 ms, plays `vo_barista_wave`) |
| Day plaque | 455–531 | 76 | Card, 358 × 68. Left: `label` "DAY" over `display-m` day number. Right: a 3-dot streak-of-days indicator and, if a dish unlocks today, a 20 pt `amber-500` "NEW" pill |
| Actions | 531–715 | 184 | Primary **"Open the café"** (56). 8 gap. Secondary **"Upgrades"** with a brass dot badge if anything is affordable (56). 8 gap. Secondary **"Endless rush"** (56) — present only when `S.day > 3`; when present its right side shows `best · {S.bestEndless.money}` in `num-m` |
| Utility row | 715–763 | 48 | Three 48×48 icon buttons, evenly spaced across 358: recipes (book), store (bag — only if not yet purchased), credits-free space |
| Safe | 810–844 | 34 | — |

**Interactive states:** each button — `rest` / `pressed` (scale 0.98, fill darkens one step) /
`disabled` (`cream-600` label, no edge) / `focus` (2 pt `focus-500` ring, 2 pt offset).
The upgrades badge has `none` / `affordable` (brass dot, 8 pt, gentle 1.0→1.12 pulse at 0.5 Hz).
**At rest:** the café, the day plaque, three buttons, the utility row. Nothing moves except the
barista's idle bob and the window's slow steam.
**Primary action:** Open the café → S-03.

### S-03 Day briefing

**Purpose:** the contract. Scrollable, because the menu grows to eight rows by the late game.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Safe | 0–47 | 47 | — |
| Top bar | 47–95 | 48 | Back chevron left; "MENU" text button right → S-15 |
| Title block | 95–171 | 76 | `label` "DAY {n}" `cream-600`; `display-l` "Open the café" (day 1) or "Another rush" |
| Contract card | 171–343 | 172 | Card. Four stat rows, 36 pt each, key in `body-m` `cream-400` left, value in `num-m` `cream-50` right, 1 pt `ink-600` divider between: **Take by closing** `{target} AED` (value in `brass-400` `display-s`) · **Shift length** `90 seconds` · **Seats** `{S.seats}` · **Orders per customer** `1` / `up to 2` |
| Menu card | 359–…| flexes | Card. `label` "ON THE MENU". One 40 pt row per unlocked dish: ingredient chips at 28 pt joined by 10 pt `cream-600` "+", a 12 pt "→", the dish sprite at 32 pt, the dish name in `body-m` (in `amber-500` if it unlocked today, with a "NEW" pill), the price right-aligned in `num-m` `brass-400` |
| Scroll spacer | — | flexes | — |
| Footer (pinned) | 731–795 | 64 | Primary **"Start shift"** (56), 8 pt above the safe inset. The footer sits on an `ink-900` plate with a top 1 pt `ink-600` edge and a 16 pt upward fade when content scrolls beneath it |
| Safe | 810–844 | 34 | — |

**At rest:** title, contract, menu, pinned button. **States:** menu rows have `locked` (not shown
at all), `known`, `new-today` (amber name + pill + a 400 ms shimmer on first appearance).
**Primary action:** Start shift → S-04.

### S-04 Gameplay

Specified in full in **§5**.

### S-05 Pause

**Purpose:** stop the clock honourably. Overlay, not a screen swap — the game stays visible.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Scrim | 0–844 | full | `ink-950` at 72%, plus a 2 pt blur on the layer beneath (skipped under reduced motion / low-end) |
| Panel | 232–612 | 380 | Card, 326 wide, centred (32 pt side margins). Contents: `label` "PAUSED" · `display-l` "Day {n}" or "Wave {w}" · a 3-row mini-stat block (Earned / Target / Served) at 32 pt each · **"Resume"** primary (56) · **"Recipes"** secondary (48) · **"Restart the day"** secondary (48) · **"Quit to café"** text button, `body-m` `cream-400`, 44 pt hit |
| — | — | — | Destructive items (Restart, Quit) require a second tap: the label swaps to "Sure?" in `state-urgent` for 2500 ms |

**At rest:** scrim + panel. The game beneath is frozen on its last frame, desaturated 40%.
**Primary action:** Resume → S-06 → S-04.

### S-06 Resume countdown

Full-screen `ink-950` at 60%. One centred numeral in `display-xl` at 96 pt: **3 → 2 → 1 → GO**,
each held 450 ms, each entering at scale 1.4 → 1.0 over 220 ms `cubic-bezier(.2,.9,.3,1.2)` and
leaving with opacity → 0 over 120 ms. Plays `ui_count_tick` ×3 then `ui_count_go`. Non-interactive.

### S-07 Day result — pass

**Purpose:** pay off the shift. This is the game's biggest reward moment outside the gameplay screen.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Safe | 0–47 | 47 | — |
| Stamp | 47–215 | 168 | The barista `celebrate` at 120 pt on the left third; on the right, a rotated −7° "CLOSED" stamp in `terracotta-600` on a cream plaque that lands with a 180 ms impact (§6) |
| Headline | 215–291 | 76 | `label` "DAY {n} · CLOSED" · `display-l` "You made it" |
| Takings | 291–355 | 64 | The number, alone and large: `{money}` in Bricolage 800 at **48 pt** `brass-400`, with "AED" in `label` beside it. Counts up from 0 over 900 ms, ease-out, with a coin tick every 60 ms |
| Stat card | 371–591 | 220 | Card, five 40 pt rows: **Target** `{target} AED` · **Served** `{served}` (`ok-500`) · **Walked out** `{lost}` (`state-urgent` if > 0, else `cream-400`) · **Scraped** `{wasted}` · **Best streak** `×{best}` |
| Note | 591–651 | 60 | `body-s` `cream-600`, one line of earned praise: "Nobody left waiting." / "Three tips over 40%." |
| Footer | 731–795 | 64 | Primary **"Bank {money} AED"** |
| Safe | 810–844 | 34 | — |

**Primary action:** Bank → S-10.

### S-08 Day result — fail

Identical geometry to S-07 with these differences — and the tone rule is: **the screen explains,
it never scolds.**

| Difference | Spec |
|---|---|
| Stamp zone | Barista `neutral`, not sad. The plaque reads "SHORT" in `cream-400` on `ink-700`, no impact animation — it slides in over 260 ms |
| Headline | "Short of target" |
| Takings | `{money}` in `cream-50` (not brass), with "of {target}" beneath in `num-m` `cream-600`. No count-up celebration; the number is simply present |
| Stat card | Same five rows; the shortfall row is highlighted with a 2 pt left bar in `state-urgent` |
| Coach note | Replaces the praise line, 80 pt tall, `body-m` `cream-400`, chosen by cause exactly as the prototype does: too many walkouts → "Too many people left waiting. Keep bins stocked during the quiet moments — pastry takes four seconds, and starting it when the order arrives is already too late." Otherwise → "An empty bin is a customer you cannot serve. Press + before you need it." |
| Footer | Primary **"Try day {n} again"** → S-03; secondary **"Back to the café"** (48, above the primary) → S-02 |

**No life lost, no currency spent, no ad offered.** Retry is free and immediate. P1.

### S-09 Day unlock card

Full-screen `ink-900`. Centred 326 × 300 card. Top: the new dish sprite at **120 pt**, entering
at scale 0.6 → 1.08 → 1.0 over 420 ms with a 12-particle sparkle burst. Then `label` "NEW ON THE
MENU", `display-m` dish name, its ingredient chips at 32 pt joined by "+", and the price in
`brass-400`. Bottom: primary **"Got it"**. A one-line `body-s` note names the new skill it
introduces ("Karak needs three things. Start the tea early.").

### S-10 Upgrade shop

**Purpose:** spend. Scroll-heavy; the list reaches ~15 rows by day 7.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Safe | 0–47 | 47 | — |
| Top bar | 47–95 | 48 | Back chevron; centre `label` "BETWEEN SHIFTS" |
| Wallet | 95–187 | 92 | `display-xl` `{S.cash}` `brass-400` + "AED" in `label`. Beneath, `body-s` `cream-600`: "Faster machines refill bins sooner. More slots let one machine cook several at once. A bigger bin lets you stockpile before a rush." |
| Segmented filter | 187–227 | 40 | Three 1/3-width segments on an `ink-700` track: **Machines · Café · All**. Selected segment = `ink-800` fill + `cream-50` label + 1 pt `ink-500` edge |
| Scroll list | 227–731 | 504 | Upgrade rows, 64 pt each, 8 pt gap. Anatomy left→right: 40 pt machine/furniture sprite · title `body-m` `cream-50` + delta line `num-s` `cream-400` ("2.2s → 1.8s") · a 3-pip level ladder (8 pt dots, filled `amber-500`) · buy button, 88 × 40, 8 pt radius |
| Footer | 731–795 | 64 | Primary **"Open day {n+1}"** |
| Safe | 810–844 | 34 | — |

**Buy button states:** `affordable` (`ink-700` fill, `amber-500` label, 1 pt `ink-500` edge) ·
`unaffordable` (`cream-600` label, `ink-800` fill, edge `ink-600`; tapping shakes the wallet
figure 6 pt for 200 ms and plays `ui_denied`) · `pressed` (scale 0.94, `amber-500` fill, `ink-950`
label) · `purchased` (240 ms: the button collapses to a check, the pip ladder fills one dot with a
pop, the wallet counts down, `sfx_purchase` fires) · `max` (label "MAX" in `ok-500`, no edge,
non-interactive).
**Secondary:** a "Start over" text button lives in **S-13 Settings**, not here — the prototype's
placement next to "Open day" is a mis-tap waiting to happen.
**Primary action:** Open day {n+1} → S-09 if a dish unlocks, else S-03.

### S-11 Endless intro

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Top bar | 47–95 | 48 | Back chevron |
| Title | 95–171 | 76 | `label` "ENDLESS RUSH" · `display-l` "No closing time" |
| Rules card | 171–307 | 136 | Three rows: **No target** — everything you take is banked · **Harder every 25 seconds** · **Over when 3 people walk out** (three 16 pt life icons shown filled) |
| Best card | 323–427 | 104 | If a best exists: `display-m` `{best.money} AED` `brass-400`, `num-m` "wave {best.wave}", and a 4 pt "beat this" marker. If not: `body-m` `cream-400` "No run yet." |
| Footer | 731–795 | 64 | Primary **"Start the rush"** |

**Primary action:** Start the rush → S-04 in endless mode.

### S-12 Endless result

Geometry as S-07, with: headline "New best" (with a brass ribbon across the stamp) or "Rush over";
stat rows **Lasted** `m:ss` · **Reached wave** `{w}` (`ok-500`) · **Taken** `{money} AED` ·
**Served** · **Best streak** · and when not a record, **Your best** `{prev} AED · wave {n}`.
Reassurance line, `body-s` `cream-600`: "Everything you took is banked either way — an endless run
is never wasted." Footer: primary **"Go again"** → S-11's start path; secondary **"Back to the
café"** → S-02.

### S-13 Settings

Grouped list, each group a card with a `label` header. Row height 56, toggle 52 × 32.

| Group | Rows |
|---|---|
| **Sound** | Sound effects (toggle, on) · Music (toggle, on) · Haptics (toggle, on) |
| **Display** | Colour-blind mode (segmented: **Off · Patterns · Patterns + shapes**, default Patterns) · Text size (segmented: **Normal · Large · Largest** = 1.0 / 1.15 / 1.3) · Reduced motion (toggle, mirrors OS by default) |
| **Play** | Hand preference (segmented: **Right · Left**) · Show recipe reminders on tickets (toggle, on) |
| **Language** | English / العربية (segmented). Changing it re-lays the app immediately, no restart |
| **Account** | Restore purchase (row + chevron) · Credits (row + chevron → S-20) |
| **Danger** | **Start over** — `state-urgent` label, requires typed-free two-step confirm in a modal naming the day it will erase |

**At rest:** scrollable list, everything visible, nothing modal.
**Primary action:** none — settings apply instantly. Back chevron returns to caller.

### S-14 Store / purchase

**Purpose:** sell the game once, honestly. No currency, no gems, no ads, no offers.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Top bar | 47–95 | 48 | Close X (right), 48 × 48 |
| Hero | 95–335 | 240 | A flat-vector illustration: the café with all six machines running, the barista mid-serve |
| Pitch | 335–459 | 124 | `display-l` "The whole café" · `body-l`: "Every day, every recipe, the endless rush, and every update. One payment. No ads, no energy, no gems, ever." |
| Included | 459–635 | 176 | Four check rows, 40 pt each, `ok-500` check + `body-m`: "All 30 days" · "All 14 recipes" · "Endless rush and leaderboard-free personal bests" · "Plays fully offline" |
| Price block | 651–731 | 80 | Primary button, label **"Unlock — {localised price}"**. Beneath, a 44 pt text button "Restore purchase" in `body-m` `cream-400` |
| Legal | 731–795 | 64 | `body-s` `cream-600`: one-time purchase, store-billed, links to terms and privacy |

**States:** `idle` · `purchasing` (button label replaced by a 20 pt spinner, whole screen
non-interactive, 10 s timeout) · `success` → S-16 · `failed` → S-17.
**Primary action:** Unlock.

### S-15 Menu / recipes

**Purpose:** the reference sheet a player opens when they forget what karak needs. Reachable from
pause, so it must be readable in four seconds.

| Zone | Top → bottom | Height | Contents |
|---|---|---|---|
| Top bar | 47–95 | 48 | Back chevron; centre `label` "RECIPES" |
| Ingredient strip | 95–207 | 112 | A horizontal row of the six ingredients, 96 pt cards: sprite 48 pt, name `num-s`, cook time `num-m` in `state-calm` ("2.2s"). Locked ones are at 30% with a lock glyph. **This strip is the thing players actually come for** — it is the only place cook times are visible outside the shop |
| Dish list | 207–795 | scroll | One 88 pt card per dish. Left: dish sprite 64 pt. Right: name `display-s`, price `num-m` `brass-400`, then the recipe as chips (28 pt) joined by "+", then a `num-s` `cream-600` line: "slowest part: pastry, 4.0s". Locked dishes show the silhouette in `ink-700` with `body-s` "Unlocks day 5" |

**At rest:** strip + list, nothing animated. **Primary action:** none; this is a read-only screen.

### S-16 Purchase success

Full-screen `ink-900`. A cream stamp lands at −7° reading "YOURS" with an impact (§6), a 10-coin
brass burst, `sfx_purchase_big`. `display-l` "The café is yours." `body-m` "Thank you — that
genuinely funds the next one." Auto-dismisses after 1600 ms or on tap.

### S-17 Purchase / restore error

Centred 326 × 260 card. A 48 pt warning glyph in `state-soon` (**not** red — this is recoverable;
§7.3). `display-m` headline, one of: "The store didn't answer" · "Nothing to restore on this
account" · "The purchase was cancelled". `body-m` explanation in plain language with no error
codes. Primary **"Try again"**, secondary **"Not now"**. A `num-s` `cream-600` reference string
sits at the bottom for support.

### S-18 Onboarding (OB-1 … OB-4)

Four coach steps layered over a **live but forgiving** S-04 on day 1: no customer can walk out
during OB-1–OB-3, and the clock does not start until OB-3 completes. This replaces the
prototype's `!S.seen` wall of text, which nobody reads.

| Step | The game state | The coach | Gate |
|---|---|---|---|
| **OB-1** | All bins empty, one customer seated wanting an espresso | Everything dims to 35% except the Shot bin's `+`, which keeps full brightness and gains a pulsing 2 pt `amber-400` ring. A caption card sits 24 pt above the bin grid: `display-s` "Start a shot." / `body-m` "Machines cook on their own. Tap +." A 32 pt hand cursor taps the `+` every 1.2 s | Player taps the `+` |
| **OB-2** | The shot cooks (2.2 s) in full view, its progress bar highlighted | Caption changes to "It cooks while you do other things." The bin dims until stock lands, then the whole **bin** lights and the caption becomes "Now tap the bin to put it on the plate." | Player taps the bin |
| **OB-3** | Plate holds one shot, plate ring goes ready | The plate strip lights; caption: "That's an espresso. Tap the customer who wants it." The seat card gains the ready caret. **Clock starts on completion.** | Player taps the seat |
| **OB-4** | Normal play, ~8 s later, at the moment the second customer arrives | A non-blocking 56 pt banner slides down from under the HUD for 3500 ms: "Start the next thing before you need it. Pastry takes four seconds." No dimming, no gate | Auto-dismiss or tap |

Coach caption card: 326 wide, `ink-800`, 12 pt radius, 2 pt `amber-500` left bar, 16 pt padding.
A "Skip" text button sits at the top-right of every gated step from OB-1 onward.

### S-19 Language picker

Two 88 pt cards stacked with 12 pt gap, centred vertically: **English** (set in DM Sans) and
**العربية** (set in IBM Plex Sans Arabic). Selecting either writes the setting, re-lays the app,
and goes to S-02. No confirm step, and it is changeable forever in S-13.

### S-20 Credits

Simple scroll: role, name, then font licences (OFL), audio licences, and a `body-s` thank-you.
No links that leave the app except the licence texts.

### S-21 Save conflict / corrupt save

Card as S-17. `display-m` "We couldn't read your save." `body-m` "Your progress file is damaged.
You can try again, or start a fresh café — nothing you paid for is lost either way." Primary
**"Try again"**, secondary **"Start fresh"** (two-step confirm). This screen must never appear
without offering the restore path.

---

## 5. S-04 — the gameplay screen, in depth

This is the money screen. Every other screen exists to get the player here and to send them back.

### 5.0 The spatial idea

The prototype has an empty band between the seats and the plate, and `prototype/README.md` names
it correctly: *that band is the counter*. The design resolves it like this —

> **Each customer exists twice, in the same column.** A **ticket** in the order rail at the top
> (what they want), and a **body** in the café band below it (who they are). Ticket `i` sits
> directly above customer `i`, joined by a 1 pt `ink-500` "order string" so the pairing is
> unambiguous. Tapping either one serves that customer.

This is what makes the character art load-bearing rather than decorative, gives the band a reason
to exist, and keeps the reference layout (orders pinned top, prep pinned bottom) intact.

### 5.1 Zones — exact heights, 390 × 844

| # | Zone | Top → bottom | Height | Flex rule |
|---|---|---|---|---|
| — | Top safe inset | 0 → 47 | **47** | Device inset |
| **A** | HUD | 47 → 103 | **56** | Fixed |
| **B** | Twin meter rail | 103 → 117 | **14** | Fixed |
| **C** | **Order rail** | 117 → 277 | **160** | Fixed |
| **D** | **Café / counter band** | 277 → 493 | **216** | **Absorbs all extra or missing height.** Min 150, max 320 |
| **E** | **Plate / assembly strip** | 493 → 585 | **92** | Fixed |
| **F** | **Ingredient bin grid** | 585 → 810 | **225** | Fixed |
| — | Bottom safe inset | 810 → 844 | **34** | Device inset |

Total: 47 + 56 + 14 + 160 + 216 + 92 + 225 + 34 = **844**. Zones E and F are pinned to the bottom
inset and never move; zone D is the only elastic band, so on a shorter phone the café gets
shorter and **nothing the player touches ever shifts position between devices**. That stability is
a gameplay requirement, not a layout preference — muscle memory is how this genre is played.

### 5.2 Zone A — HUD (56 pt)

Four blocks in a 358 pt row, 16 pt gutters, vertically centred.

```
┌──────────────────────────────────────────────────────────────┐
│  DAY        EARNED        TARGET              [×4]    ( ⏸ )  │
│   3         248 AED        410                streak         │
└──────────────────────────────────────────────────────────────┘
```

| Element | Geometry | Content | States |
|---|---|---|---|
| Day block | x 16, w 44 | `label` "DAY" `cream-600` over `display-s` `cream-50` | In endless: label "WAVE", and on each wave change the number pops (§6) |
| Earned block | x 68, w 96 | `label` "EARNED" over `display-s` **`brass-400`** + "AED" in `label` | `counting` during a payment count-up; number is tabular so it never reflows |
| Target block | x 172, w 72 | `label` "TARGET" over `display-s` `cream-400` | `met` — at the moment `money ≥ target`, the block flips to `ok-500`, draws a 14 pt check to its left, and pops once (§6). In endless: label "BEST", value `S.bestEndless.money` |
| Streak chip | x 252, w 64, h 32, right-aligned at 316 | Hidden below ×2. A pill: a 14 pt steam glyph + `×{n}` in `display-s` | See §5.7 |
| Pause | x 326, 48 × 48 hit, 24 pt glyph | Two `cream-400` bars | `pressed` scale 0.9. The **only** control in zone A |

**Nothing in the HUD is interactive except pause.** Numbers are information, not buttons.

### 5.3 Zone B — twin meter rail (14 pt)

Two full-width 5 pt bars stacked with a 4 pt gap, 3 pt radius, track `ink-700`, inset 16 pt.

| Bar | Position | Fill | Direction | States |
|---|---|---|---|---|
| **Goal** (upper) | y 103–108 | `ok-500` — money is the one thing green is for | Fills **left → right** as `money/target` | `progress` · `met` (whole bar flashes `cream-50` for 120 ms then holds `ok-500` with a 1 pt `cream-200` top edge) · In **endless** this bar becomes **LIVES**: three 5 pt segments with 6 pt gaps, filled `cream-200`, each lost segment collapsing to `ink-700` with a 200 ms shatter; at one life left the remaining segment pulses `state-urgent` |
| **Clock** (lower) | y 112–117 | `amber-500` | Drains **right → left** (fill anchored left, width shrinking) so remaining time reads as remaining *length* | `normal` · `low` (< 20%, i.e. last 18 s): fill switches to `state-urgent`, gains 45° `ink-950` stripes at 12% moving 1 stripe/s, and the bar grows to 7 pt · `final-5s`: the bar pulses opacity 1.0 → 0.7 once per second in time with `sfx_clock_tick` |

In endless the clock bar shows **progress through the current 25 s wave**, resetting with a 160 ms
sweep and a `sfx_wave` on each wave change.

### 5.4 Zone C — order rail (160 pt)

The rail holds 3–5 **ticket cards** — `S.seats`, which grows via the shop. Row is 358 wide with
7 pt gaps; card width is computed, not fixed:

| Seats | Card width | Card height |
|---|---|---|
| 3 | 114 | 138 |
| 4 | 84.25 | 138 |
| 5 | 66.4 | 138 |

Rail padding: 10 pt top, 12 pt bottom. Cards are top-aligned.

#### Ticket card anatomy, top → bottom

| Part | Height | Spec |
|---|---|---|
| **Patience bar** | 6 | Full card width minus 8 pt padding, 3 pt radius, track `#3A2F29`. Fill drains right → left. Colour + pattern per §5.6 |
| gap | 6 | |
| **Identity chip** | 28 | 28 pt circle, fill = the customer's bound hue, initial in Bricolage 800 12 pt `ink-950`. At 4–5 seats this shrinks to 24 pt |
| gap | 5 | |
| **Dish name** | 22 | `num-s` 11 pt `cream-400`, centred, max 2 lines, mid-truncated at 5 seats ("Almond crois…") |
| gap | 4 | |
| **Ingredient chips** | 21–46 | The needed ingredients as 21 pt rounded squares (5 pt radius, `ink-700` fill, 1 pt `ink-600` edge) holding the ingredient sprite at 15 pt. Wraps to two rows at 3 ingredients / 5 seats |
| gap | 4 | |
| **Order index** | 11 | `num-s` 8.5 pt `cream-600`, "1 of 2", shown only when the customer ordered more than one dish |

Card: `ink-800` fill, 1 pt `ink-600` edge, 10 pt radius, 8 pt / 4 pt padding.

#### Ticket card states

| State | Trigger | Visual |
|---|---|---|
| `empty` | No customer in that seat | No fill, 1 pt **dashed** `#2A221E` edge, contents hidden. The matching body in zone D shows an empty stool |
| `arriving` | Spawn | 280 ms: card scales 0.88 → 1.0, opacity 0 → 1, translate y +8 → 0, `cubic-bezier(.2,.9,.3,1.25)`. The order string draws downward over 180 ms |
| `waiting` | Default | Static. Patience bar draining |
| `partial` | Multi-dish, one delivered | The completed chip row is replaced by a 16 pt `ok-500` check for 400 ms, then the card re-renders for dish 2 with a 220 ms cross-fade. Index updates to "2 of 2" |
| **`serveable`** | The plate matches **this** customer's next dish | **2 pt `cream-50` ring** + a 6 pt `amber-400` outer glow + a **12 pt caret** appears in the 12 pt gap below the card, pointing down at the counter, bobbing 3 pt at 1.2 Hz. Readiness is signalled by *brightness and a pointer*, never by hue alone (§8.1) |
| `served` | Successfully served | 220 ms pop, scale 1 → 1.06 → 1; a floating payment rises (§6); then the card transitions to `empty` over 240 ms |
| `urgent` | Patience < 25% **and** this is the most urgent seat | See §5.8 |
| `walkout` | Patience hits 0 | Card fills `state-urgent` at 18% for 120 ms, a "walked out" float rises, card collapses to `empty` over 380 ms |
| `pressed` | Finger down | Scale 0.96, 90 ms |
| `rejected` | Tapped with a plate that doesn't match | 180 ms shake, ±5 pt, 3 cycles; the **plate** flashes, not the customer — the mistake is in the player's hand, not on the ticket. `ui_denied` |

### 5.5 Zone D — café / counter band (216 pt)

Six layers, back to front. Each customer body sits in the same x-column as its ticket.

| Layer | Depth | Contents | Behaviour |
|---|---|---|---|
| 1 · Street | y 277–341 | The window: `street-700` sky, flat shop silhouettes, one lamp in `sun-300`. Tints by day number from afternoon → dusk → night across days 1–7 | Parallax factor 0.15 on device tilt. One passer-by silhouette drifts across every ~12 s |
| 2 · Back wall | y 277–397 | `ink-800` wall, a `tile-500` band at y 365–397, a shelf with decorative jars | Static |
| 3 · Machines | y 341–397 | Small decorative repeats of the six machine sprites on the shelf, 32 pt, **only for unlocked ingredients** | A 6-frame steam particle fires above a machine whenever a cook completes — a second readout of "something is ready" placed where the eye already is |
| 4 · **Customers** | y 355–465 | Upper bodies, 110 pt tall, centred in each ticket column, cropped by the counter | Idle bob 2 pt @ 0.5 Hz, random phase. Expression is driven by patience: ≥55% `neutral`/`pleased`, 25–55% `impatient`, <25% `annoyed` + 6 pt forward lean, on serve `delighted` for 700 ms |
| 5 · **Barista** | y 371–493 | 140 pt, centre column (x 163–227), in front of the counter line, behind the counter front | `idle` · `reach` (150 ms when an item leaves a bin) · `serve` (220 ms on a successful serve) · `celebrate` (on target met, and on the day-result screen) |
| 6 · Counter front | y 465–493 | `wood-600` face with a 4 pt `wood-400` top edge and one `cream-50` rim-light stripe | The visual "floor" of the play area. The plate strip reads as sitting on it |

**Interactivity:** each customer body carries the *same* hit target as its ticket — a full-column
tap region from y 355 to 465. There is no other interactive element in zone D.

**This zone may never carry critical information.** If the art fails to load, is turned off for
performance, or the band is squeezed to its 150 pt minimum on a small phone, the game must remain
fully playable. Everything the player *needs* lives in zones A, B, C, E, F.

### 5.6 The customer patience indicator

The single most-read element in the game. It is specified with **five redundant channels**, so
that removing any one of them (colour, motion, sound) leaves it readable.

| Channel | Calm (≥55%) | Soon (25–55%) | Urgent (<25%) |
|---|---|---|---|
| **1 · Length** | Bar 100→55% | 55→25% | 25→0% |
| **2 · Hue** | `state-calm` `#5B9DD9` | `state-soon` `#F2A03D` | `state-urgent` `#E24B2E` |
| **3 · Pattern** (on by default; §8.1) | Solid | 45° stripes, `ink-950` @14%, 6 pt pitch, scrolling 1 pitch/s | 45° stripes, 4 pt pitch, scrolling 3 pitch/s |
| **4 · Height** | 6 pt | 6 pt | **8 pt** (the bar physically grows) |
| **5 · Expression** | `neutral` / `pleased` | `impatient` | `annoyed` + 6 pt lean |

The **hue ramp is blue → amber → red, not green → amber → red.** That is the colour-blind fix and
it is explained in §8.1: blue-vs-orange is the one axis that survives both deuteranopia and
protanopia, and green was reassigned to money, where it belongs.

**Patience sources** (unchanged from the prototype, documented here so the artist knows what varies):
base patience from `dayCfg`/`waveCfg`, multiplied by `1 + S.chairs × 0.15` (the Comfier Chairs
upgrade), multiplied by `1 + (steps − 1) × 0.35` where `steps` is the total ingredient count across
all their dishes. So a two-dish customer visibly starts with a longer fuse — and because channel 1
is *proportional*, the bar always reads as "fraction of their own patience", never as absolute time.

**Seconds badge.** Below 25%, and **only** below 25%, a `num-m` whole-second countdown appears
inside the identity chip's top-right corner on a 16 pt `ink-950` circle. Precise numbers are noise
when there is time and a lifeline when there is not.

### 5.7 The streak indicator

Streak = consecutive customers fully served without a walkout (`R.combo`). It multiplies tips by
`1 + min(combo,10) × 0.05`, so it is worth up to +50% and the player must be able to feel it.

| Tier | Range | Chip appearance | On increment |
|---|---|---|---|
| Hidden | 0–1 | Not rendered | — |
| Warm | 2–4 | `ink-700` pill, `cream-200` steam glyph, `cream-50` numeral | 140 ms scale 1 → 1.18 → 1, `cubic-bezier(.34,1.56,.64,1)`; `sfx_streak_up` pitched +1 semitone per step |
| Hot | 5–9 | `amber-500` glyph and numeral, 1 pt `amber-700` edge | Above, plus a 4-particle amber spark burst |
| Peak | 10+ | `brass-400` fill, `ink-950` numeral, a 2 pt `brass-400` halo pulsing at 0.6 Hz | Above, plus the chip briefly widens to show "MAX TIP" for 700 ms at exactly ×10 |

**On break** (a walkout, which is the only thing that resets it): the chip shakes ±6 pt over
260 ms, the numeral crossfades to 0, the fill greys to `ink-700`, and the chip fades out over
200 ms. `sfx_streak_break` — a short descending two-note figure, quiet. The break is *stated*, not
punished with a full-screen effect; the walkout itself is already the punishment.

### 5.8 How an urgent customer reads at a glance

The design rule that makes this work:

> **Only one seat at a time may play the full urgent treatment — the one with the least patience
> remaining.** Every other sub-25% seat shows only channels 1–4 (bar length, hue, pattern, height)
> plus the seconds badge. If four seats scream at once, none of them is telling you where to look.

The single **hottest seat** additionally gets:

| Cue | Spec |
|---|---|
| Card lift | `translateY(-4pt)` over 200 ms, held |
| Border | 2 pt `state-urgent`, replacing the 1 pt `ink-600` |
| Sway | ±2.4 pt rotation at 0.6 Hz — slow, not jittery, so it reads as a person shifting in a chair |
| Badge | A 20 pt `state-urgent` circle with a `cream-50` "!" glyph, pinned to the card's top-right, overlapping the corner by 6 pt |
| Column wash | A 40%-opacity vertical `state-urgent` gradient, 0% at the counter line rising to 12% at the ticket, drawn **behind** the customer body in zone D — so the whole column reads hot in peripheral vision |
| Body | `annoyed` expression, 6 pt forward lean, arms-crossed overlay |
| Sound | `amb_chair_scrape` loops at −18 dB, one voice only, stopping the instant the seat is resolved |

**The half-second test:** at arm's length, squinting, the player should be able to answer "who is
about to leave?" from the column wash alone, "how bad is it?" from bar length, and "what do they
want?" from the chip row — three questions, three separate channels, no reading required.

### 5.9 Zone E — plate / assembly strip (92 pt)

14 pt top padding, 64 pt content, 14 pt bottom padding. Row: plate well (286 wide) + 8 pt gap +
scrape button (64 × 64).

#### Plate well

286 × 64, 12 pt radius, `ink-850` fill, **1 pt dashed `#33291F`** edge when empty. It holds up to
**3 slots**, each 44 × 44 with a 6 pt gap, left-aligned from x 26, plus a name area on the right.

| State | Visual |
|---|---|
| `empty` | Dashed edge. Three faint 44 pt slot outlines (1 pt `ink-700`, 8 pt radius). Centred `body-s` `cream-600`: "Tap a bin to start a dish." |
| `partial` | Solid 1 pt `ink-600` edge. Filled slots hold the ingredient sprite at 36 pt on an `ink-700` 8 pt-radius tile; remaining slots stay as outlines |
| `complete-unwanted` | The three ingredients form a real dish but **nobody at the counter wants it.** Solid 1 pt `ink-500` edge, the dish name printed in `display-s` `cream-600` on the right, and a 24 pt ghosted dish sprite behind the slots at 30% |
| **`complete-wanted`** | The plate forms a dish someone wants. **2 pt `cream-50` edge**, 6 pt `amber-400` outer glow, `ink-850` → `#1D2C22` fill shift over 160 ms, dish name in `display-s` `ok-500` on the right, and the assembled dish sprite fades in at 44 pt behind the ingredient tiles at 45%. Simultaneously the matching ticket enters `serveable` and its caret appears |
| `full-rejected` | Player taps a bin with 3 items already on the plate: the well shakes ±4 pt over 160 ms, the third slot flashes `state-soon`, `ui_denied` |
| `clearing` | Items fall out of frame with a 40 pt drop over 200 ms `cubic-bezier(.4,0,1,1)`, staggered 40 ms apart |

#### Scrape button

64 × 64, 12 pt radius, `ink-800` fill, 1 pt `ink-600` edge, a 24 pt bin glyph in `cream-400`.

| State | Visual |
|---|---|
| `disabled` | Plate empty. 30% opacity, non-interactive |
| `enabled` | Full opacity |
| `pressed` | Scale 0.92, fill `ink-700`, lid glyph tilts 20°, 140 ms. Increments `R.wasted` |
| `confirm-not-required` | **Never confirms.** Scraping costs a statistic, not progress, and a confirm dialog in a 90-second shift is worse than the mistake |

It is **not red**, ever. §7.3.

### 5.10 Zone F — ingredient bin grid (225 pt)

`3 × 2` grid. 8 pt top padding, two rows of **102 pt** with a 9 pt gap, 4 pt bottom padding.
Columns: `(358 − 2 × 8) / 3 = 114 pt` wide. Bin position is **fixed for the life of the save** —
the six bins always occupy the same six cells in the same order (shot, tea, syrup / milk, pastry,
ice), locked ones included, so the player's thumb learns one map and never re-learns it.

#### Bin card anatomy (114 × 102)

```
┌──────────────────────────┐
│                     ┌───┐│   ← + button, 48×48, top-right,
│      [sprite]       │ + ││     radius 0/11/0/11
│                     └───┘│
│        Pastry            │   ← name, num-s 9pt
│      ● ● ○               │   ← stock pips
│   ▓▓▓▓▓░░  ░░░░░░        │   ← cook slot bars
└──────────────────────────┘
```

| Part | Geometry | Spec |
|---|---|---|
| Card | 114 × 102, 11 pt radius | `ink-800` fill, 1 pt `ink-600` edge |
| **Machine sprite** | 52 pt, centred, y +10 from card top | The flat-vector machine sprite for that ingredient. Two overlay states: `idle`, `running` (lever down / light on) |
| **`+` cook button** | **48 × 48**, pinned top-right, radius `0 11 0 11` | `ink-700` fill, 20 pt `amber-500` "+" glyph. This is the most-pressed control in the game and gets the largest corner target |
| **Name** | y 62, full width | `num-s` 9 pt `cream-400`, centred |
| **Stock pips** | y 76, centred row | One 8 pt circle per `S.binCap` (3–5), 3 pt gap. Empty `#3A2F29`; filled **`amber-500` with a 1 pt `amber-700` ring**. Pips fill left → right |
| **Cook slot bars** | y 90–94, full width minus 4 pt | One 4 pt bar per `S.up[i].slots` (1–3), equal widths, 2 pt gap, 2 pt radius. Track `#3A2F29`, fill `state-calm`, filling left → right over `cookTime(i)` |

#### Bin states

| State | Trigger | Visual |
|---|---|---|
| `locked` | Ingredient not required by any unlocked dish | 30% opacity, sprite replaced by a 28 pt lock glyph, name reads "Locked", `+` disabled, no pips or bars. Non-interactive. **Still occupies its cell** |
| `idle-empty` | Live, stock 0, nothing cooking | Default. Sprite `idle` |
| `cooking` | ≥1 slot running | Sprite `running`. A 4-particle steam puff every 800 ms above the sprite |
| `has-stock` | stock ≥ 1 | Edge brightens to `ink-450`; a 1 pt `amber-500` inner top edge; the sprite lifts 2 pt |
| `just-ready` | A cook completes | 260 ms: the newly-filled pip scales 0 → 1.3 → 1 `cubic-bezier(.34,1.56,.64,1)`, an `amber-400` ring expands from the pip 8 → 28 pt and fades, the card flashes its edge to `amber-400` and back. `sfx_cook_done` (pitched per ingredient) + a light haptic |
| `full` | `stock + cooking ≥ S.binCap` | The `+` glyph goes `cream-600`; the pip row gains a 1 pt `cream-600` underline; pressing `+` shakes the card ±3 pt for 160 ms with `ui_denied` |
| `take-pressed` | Card body tapped with stock > 0 | Card scale 1 → 0.94 → 1 over 160 ms (the prototype's `tap` keyframe, kept); the top pip empties; the sprite flies to the plate (§6.2) |
| `take-denied` | Card tapped with stock 0 | Shake ±3 pt 160 ms, the empty pip row flashes `state-soon` once, `ui_denied`, **no haptic** (a denied action should not feel like an action) |
| `cook-pressed` | `+` tapped and accepted | `+` scales 1 → 0.88 → 1 over 160 ms and briefly fills `amber-500` with an `ink-950` glyph; the next free cook bar animates from 0 |

**Hit targets.** The `+` occupies 48 × 48 at the top-right. The take-target is the remaining
L-shaped card area — a minimum of 114 × 54 in the lower band plus 66 × 48 to the left of the `+`.
A **4 pt dead zone** separates them: a tap inside it does nothing. This costs one lost tap
occasionally and prevents the far worse error of starting a cook when you meant to grab stock.

### 5.11 Gameplay screen — what is on screen at rest

At `t = 0` of day 3 with 3 seats and 5 unlocked bins:

- HUD: DAY 3 · EARNED 0 AED · TARGET 410 · no streak chip · pause.
- Meters: goal bar empty, clock bar full `amber-500`.
- Order rail: three `empty` dashed cards.
- Café band: dusk street, six shelf machines (five lit, one dim), three empty stools, the barista
  in `idle` wiping the counter.
- Plate: `empty`, dashed, "Tap a bin to start a dish."
- Bins: five live and empty, one locked at 30%. All pips grey, all cook bars at 0.

Roughly **1.2 s later** the first customer arrives. The screen is deliberately calm at the start of
a shift — the ramp is the experience.

### 5.12 Primary action

There is no single primary action; there are three verbs, and their priority order is the skill
the game teaches:

1. **`+` on a bin** — start a cook. *The action that wins the shift, taken before it is needed.*
2. **Bin body** — move stock to the plate.
3. **Ticket or customer** — serve.

The design's job is to make verb 1 feel as rewarding as verb 3 even though it pays nothing
immediately. That is why `just-ready` gets a haptic, a sound, a ring and a steam puff on the shelf:
the game applauds preparation, not only payment.

---

## 6. Interaction and feel — the juice specification

`docs/art-plan.md` is right that this is the highest-return work in the project and that it costs
nothing but code. With Warm Vector art, it is also where *all* of the perceived quality lives:
flat shapes moving beautifully read as a game; flat shapes teleporting read as a prototype.

**Named easing curves** — used by name everywhere below:

| Name | Curve | Character |
|---|---|---|
| `e-out` | `cubic-bezier(.22, 1, .36, 1)` | Fast start, long settle. Default for anything arriving |
| `e-in` | `cubic-bezier(.4, 0, 1, 1)` | Accelerating away. Default for anything leaving |
| `e-pop` | `cubic-bezier(.34, 1.56, .64, 1)` | Overshoot. Rewards, confirmations, pips |
| `e-snap` | `cubic-bezier(.2, .9, .3, 1.25)` | Slight overshoot, quick. Cards arriving, counters |
| `e-std` | `cubic-bezier(.4, 0, .2, 1)` | Neutral. Screen transitions, fades |

**The 100 ms rule (P5):** every player input produces a visible change within 100 ms, even when the
consequence takes longer. A cook takes 2.2 seconds; the `+` deforms in 40 ms.

### 6.1 Taps

| Action | Motion | Duration / easing | Haptic | SFX |
|---|---|---|---|---|
| `+` accepted (start a cook) | `+` scales 1 → 0.88 → 1; button fills `amber-500`, glyph `ink-950`, then reverts; cook bar animates from 0 | 160 ms `e-pop` | Light impact | `sfx_machine_start` |
| `+` denied (bin full / all slots busy) | Card shakes ±3 pt, 3 cycles; pip row flashes `state-soon` | 160 ms `e-in` | **None** | `ui_denied` |
| Bin body accepted (take stock) | Card scales 1 → 0.94 → 1; top pip empties with a 120 ms collapse; ingredient flies to plate (§6.2) | 160 ms `e-pop` | Light impact | `sfx_pickup` |
| Bin body denied (stock 0, or plate full) | Card shakes ±3 pt; if the plate is full, the **plate** shakes too | 160 ms `e-in` | **None** | `ui_denied` |
| Ticket / customer accepted | Card scales 1 → 1.06 → 1; barista → `serve` | 220 ms `e-pop` | Medium impact | `sfx_serve` |
| Ticket / customer denied | The **plate** shakes ±5 pt, 3 cycles, and its edge flashes `state-soon`; the customer does **not** move | 180 ms `e-in` | **None** | `ui_denied` |
| Scrape | Bin glyph lid tilts 20°; plate items drop out of frame staggered 40 ms | 200 ms `e-in` | Light | `sfx_scrape` |
| Any primary button | Scale 0.98, fill darkens one token step | 90 ms `e-std` | Light on press | `ui_tap` |
| Pause | Glyph scales 0.9; the whole game layer desaturates to 40% and the scrim fades in | 180 ms `e-std` | Light | `ui_pause` |

**Denied actions never get a haptic.** A buzz on a failed tap teaches the hand that the tap worked.

### 6.2 Item travel — bin to plate

The single most-repeated animation in the game (~40× a shift). It must be quick enough not to gate
the next tap and legible enough to teach where things go.

| Beat | Timing | Spec |
|---|---|---|
| 0 ms | — | A copy of the ingredient sprite is spawned at the bin sprite's screen position, 52 pt, over everything |
| 0–260 ms | `e-out` | It travels along a quadratic bezier to the target plate slot. Control point is the midpoint raised **40 pt** — a shallow arc, not a straight line. Simultaneously scales 52 → 36 pt and rotates −8° → 0° |
| 150 ms | — | The barista switches to `reach` (she is already moving before the item lands) |
| 260 ms | — | The travelling copy is destroyed; the real plate slot appears at scale 0.7 |
| 260–340 ms | `e-pop` | The slot scales 0.7 → 1.08 → 1.0. The plate well nudges down 2 pt and back |
| 300 ms | — | The barista returns to `idle` over 150 ms |
| 260 ms | — | If this completes a wanted dish: the plate `complete-wanted` transition begins (§6.3) |

**Concurrency:** up to three travels may overlap. Each takes the next free plate slot, decided at
spawn time, so two fast taps never contend for one slot.

### 6.3 Plate completion

| Beat | Timing | Spec |
|---|---|---|
| 0–160 ms | `e-std` | Plate fill `ink-850` → `#1D2C22`; edge 1 pt `ink-600` → 2 pt `cream-50`; `amber-400` outer glow 0 → 6 pt |
| 0–200 ms | `e-out` | The assembled dish sprite fades in behind the ingredient tiles at 44 pt, 0 → 45% opacity |
| 60 ms | — | The dish name types on, left to right, 4 characters per frame (~24 ms/char) |
| 0–240 ms | `e-snap` | The matching ticket enters `serveable`; its caret drops in from 8 pt above and begins bobbing |
| — | — | Haptic: **soft double-tick**. SFX `sfx_dish_ready` — a two-note rise, the game's most important "you may proceed" sound |

If the completed dish is **unwanted**, none of the above fires: the plate goes `complete-unwanted`
(grey, no glow, name in `cream-600`) over 160 ms `e-std`, with `sfx_dish_ready_flat` — the same
figure, flattened, quieter, no haptic. The player hears the difference without looking.

### 6.4 Serving and payment

| Beat | Timing | Spec |
|---|---|---|
| 0 ms | — | Plate slots clear instantly; well returns to `empty` |
| 0–220 ms | `e-pop` | Ticket card scales 1 → 1.06 → 1. Customer body: `delighted` expression, rig scale 1.06, tilt 3° |
| 0–220 ms | `e-out` | The dish sprite flies from the plate to the customer's hands along a 30 pt arc, scaling 44 → 28 pt, then fades over 80 ms |
| 40–260 ms | — | Barista `serve` pose, returning to `idle` over 150 ms |
| **Multi-dish, not yet complete** | 400 ms | A 16 pt `ok-500` check replaces the chip row, then the card cross-fades to dish 2 over 220 ms. Index updates. **No payment.** Haptic: light. SFX `sfx_serve_partial` |
| **Order complete — payment** | | |
| 0–120 ms | `e-out` | The floating payment appears above the card: `+{total}` in `display-s`, `ok-500` if patience was > 50% at serve, `state-soon` otherwise. This colour split is kept from the prototype and is the player's only feedback on tip quality |
| 120–850 ms | `e-out` | It rises 28 pt and fades to 0 (the prototype's `rise` keyframe, kept) |
| 0–520 ms | `e-in` then gravity | **Coin burst**: `4 + round(total/12)` coins, capped at 12. Each is a 12 pt `brass-400` disc with a 3 pt `ink-outline` stroke, launched with random velocity (−80…80, −220…−320 pt/s), gravity 900 pt/s², spin 0 → 540°, fading over the last 160 ms. They arc toward the HUD `EARNED` block |
| 300–900 ms | `e-out` | HUD `EARNED` counts up from the old to the new value, tabular so nothing reflows, with a 1.0 → 1.1 → 1.0 scale pop on the block at 300 ms |
| 220–460 ms | `e-in` | The customer rig translates 60 pt toward the door, rotates 12°, scales 0.9, fades to 0. The ticket card becomes `empty` |
| — | — | Haptic: **medium impact** at 0 ms, then a **light tick** at 300 ms as the counter starts. SFX `sfx_serve` → `sfx_coins` → `sfx_till` |
| **If this crosses the target** | +120 ms | The goal bar flashes `cream-50` for 120 ms, the `TARGET` HUD block flips to `ok-500` with a check and pops, the barista plays `celebrate` for 900 ms, `sfx_target_met` fires. **The shift does not end** — the player keeps playing for the remaining seconds, which is where the best takings come from |

### 6.5 Customer arrival and departure

| Event | Motion | Duration | Sound |
|---|---|---|---|
| **Arrival** | Body enters zone D from the door edge (right in LTR, left in RTL), translating 60 pt with a −8° → 0° rotate and 0 → 1 opacity. 90 ms later the ticket card scales 0.88 → 1.0 with y +8 → 0. 180 ms later the order string draws downward | 280 ms body `e-snap`, 280 ms card `e-snap`, 180 ms string linear | `sfx_door_chime` (pitched randomly ±2 semitones so a busy shift doesn't sound mechanical) |
| **Patience crossing 55%** | Expression → `impatient` over 200 ms; patience bar hue cross-fades `state-calm` → `state-soon` over 300 ms and the stripe pattern fades in | 300 ms `e-std` | none |
| **Patience crossing 25%** | Expression → `annoyed`; 6 pt forward lean over 240 ms; bar grows 6 → 8 pt; stripes accelerate to 3 pitch/s; the seconds badge scales 0 → 1 `e-pop`. If this is the hottest seat, the full urgent treatment (§5.8) engages over 200 ms | 240 ms `e-out` | `sfx_impatient` once, then `amb_chair_scrape` loops if hottest |
| **Satisfied departure** | See §6.4 | 460 ms | `sfx_door_chime` reversed, quiet |
| **Walkout** | Ticket fills `state-urgent` @18% for 120 ms. "walked out" float rises in `state-urgent`, 850 ms. Body stands (translate y −10 pt, 140 ms), then exits 70 pt toward the door with a 14° rotate, fading over 380 ms. Card collapses to `empty` over 240 ms. The streak chip breaks (§5.7). In endless, one life segment shatters | 380 ms `e-in` | `sfx_walkout` — a chair scrape and a door, **deliberately quiet**. The mistake is legible; it does not need a klaxon. Haptic: one **heavy** impact, the only heavy haptic in the game |

### 6.6 Wave and day transitions

| Event | Spec |
|---|---|
| **Wave change (endless, every 25 s)** | The clock bar sweeps back to 100% over 160 ms `e-out`. The HUD `WAVE` number flips: old scrolls up and out 120 ms, new scrolls in from below 160 ms `e-snap`. A 40 pt banner drops from under the HUD reading "WAVE {n}" in `display-s`, holds 900 ms, retracts — total 1400 ms, non-blocking, never covering the order rail. `sfx_wave`. Haptic: light |
| **Life lost (endless)** | The segment shatters into 5 shards that fall with gravity and fade, 320 ms. Remaining segments do not re-flow. At one life left the last segment begins pulsing `state-urgent` at 0.8 Hz |
| **Last 10 seconds of a day** | The clock bar pulses opacity 1.0 → 0.7 once a second. From 5 s, `sfx_clock_tick` on each second, rising a semitone each time. No screen-wide effect — the player is at their busiest and must not be visually interrupted |
| **Day end** | Play freezes. Everything on screen **falls away**: bins drop 200 pt over 320 ms `e-in` staggered 30 ms apart, plate drops, tickets rise 120 pt and fade, the café band fades to 0 over 240 ms. Total 520 ms, then S-07/S-08 fades in over 240 ms `e-std`. `sfx_shutter` |
| **Shift start** | The reverse: bins rise into place from 200 pt below, staggered 40 ms apart `e-out`, over 420 ms, while the café band fades in. The clock does not start until the last bin lands. `sfx_shutter` reversed + `amb_cafe` loop begins |
| **Screen-to-screen (all others)** | Forward: incoming slides x +24 → 0 with opacity 0 → 1, 240 ms `e-std`; outgoing fades to 0 and scales 0.98 over 160 ms. Back: mirrored. Modals (S-05, S-09, S-17): scrim fades 200 ms, panel scales 0.94 → 1 with y +16 → 0 over 260 ms `e-snap` |

### 6.7 Haptics — the complete map

Three strengths only. Over-haptics is the most common mobile-game feel error and it drains battery.

| Strength | Fires on |
|---|---|
| **Light** | `+` accepted · stock taken · plate item lands · button press · partial serve · cook completes (`just-ready`) · counter tick during a count-up (once, not per digit) |
| **Medium** | Successful serve · order completed and paid · purchase confirmed · target met |
| **Heavy** | **Walkout only.** One event, one feeling. Losing a life in endless uses the same heavy impact |
| **Never** | Any denied action · any passive state change · any per-frame effect · anything while the app is backgrounded |

Respects the OS haptics setting and the S-13 toggle. Disabled entirely under Low Power Mode.

### 6.8 Sound list

Twenty-nine SFX, two loops, one music bed — consistent with `art-plan.md`'s "20–30 short SFX plus
one loop", and all of it library-licensable.

**Design rules:** every SFX is ≤ 600 ms except where noted. All are in **C minor pentatonic**, so
overlapping sounds never clash during a rush. Simultaneous voices are capped at 6, oldest dropped.
Repeated sounds (`sfx_pickup`, `sfx_door_chime`) are pitch-randomised ±2 semitones.

| # | Name | Fires when | Character |
|---|---|---|---|
| 1 | `sfx_machine_start` | `+` accepted | Short mechanical clunk, the hiss of a lever |
| 2 | `sfx_cook_done` | A cook completes and stock lands | Bright two-note rise, pitched per ingredient so six bins are audibly distinct |
| 3 | `sfx_pickup` | Stock taken from a bin | Soft ceramic tap |
| 4 | `sfx_plate_land` | Item lands in a plate slot | Light click on porcelain |
| 5 | `sfx_dish_ready` | Plate completes a **wanted** dish | Two-note rise, warm, confident |
| 6 | `sfx_dish_ready_flat` | Plate completes an **unwanted** dish | Same figure, flattened, quieter |
| 7 | `sfx_serve` | Successful serve | Plate set down + a small "there you go" |
| 8 | `sfx_serve_partial` | One of a multi-dish order delivered | Half of `sfx_serve`, no resolution |
| 9 | `sfx_coins` | Payment | Brass coin scatter, 520 ms |
| 10 | `sfx_till` | Count-up ends | Old mechanical till ding |
| 11 | `sfx_tip_big` | Tip fraction > 40% | An extra bright coin, layered over `sfx_coins` |
| 12 | `sfx_streak_up` | Streak increments | Single note, +1 semitone per step, resetting at 10 |
| 13 | `sfx_streak_break` | Streak resets | Quiet descending two-note figure |
| 14 | `sfx_target_met` | Money crosses the target | Warm three-note resolve |
| 15 | `sfx_door_chime` | Customer arrives / leaves happy | Shop bell, pitch-randomised |
| 16 | `sfx_impatient` | Patience crosses 25% | A cup set down hard, once per customer |
| 17 | `sfx_walkout` | Customer walks out | Chair scrape + door, **quiet** |
| 18 | `sfx_scrape` | Plate scraped | Contents into a bin |
| 19 | `ui_denied` | Any denied action | Dry, short, unmusical thud. Deliberately unpleasant and deliberately small |
| 20 | `ui_tap` | Any button press | Soft click |
| 21 | `ui_pause` | Pause opened | Muffled stop |
| 22 | `ui_count_tick` | Resume countdown 3, 2, 1 | Wood block |
| 23 | `ui_count_go` | Resume countdown "GO" | Wood block, up a fifth |
| 24 | `sfx_clock_tick` | Each of the last 5 seconds | Rising semitone per tick |
| 25 | `sfx_shutter` | Shift start / end | Metal shutter, 700 ms |
| 26 | `sfx_wave` | Endless wave change | Rising sweep + a soft gong |
| 27 | `sfx_life_lost` | Endless life lost | Glass fracture, short |
| 28 | `sfx_purchase` | Upgrade bought | Coins out + a satisfying mechanical set |
| 29 | `sfx_purchase_big` | Premium unlock | Fuller version of 28 with the `sfx_target_met` figure over it |
| L1 | `amb_cafe` | Loops during play | Room tone, distant street, a fan. −26 dB |
| L2 | `amb_chair_scrape` | Loops while a hottest-seat customer is urgent | One voice only, −18 dB, stops instantly on resolve |
| M1 | `mus_cafe` | Loops on all non-gameplay screens; **ducked to −14 dB during play** | Oud + rhodes + brushed kit, ~92 BPM, 90 s loop, warm and unhurried. During a shift the music steps back so the SFX can do the work |

---

## 7. Readability under pressure

The design target: a player who glances at the screen for **500 ms** must be able to answer three
questions — *who is about to leave*, *what can I serve right now*, and *what is ready to pick up* —
without reading a single word.

### 7.1 The half-second parse

| Question | Channel | Where the eye goes |
|---|---|---|
| **Who is about to leave?** | The urgent column wash — a 12% `state-urgent` vertical gradient behind one customer, full-height through zones C and D | Peripheral vision. Colour-in-a-column is the fastest pre-attentive cue available |
| **How much time do they have?** | Patience bar **length** | Already looking at that column |
| **Can I serve right now?** | The plate's `cream-50` ring + `amber-400` glow, and the caret pointing from the ready ticket down at the counter | The ring is the brightest thing on the screen when it is on, and nothing else in the game is ever allowed to be that bright |
| **What is ready to pick up?** | Filled `amber-500` pips, counted not read, plus the bin's `ink-450` edge lift | Bottom third, where the thumb already is |
| **What is cooking?** | `state-calm` bars filling — the only blue in the play area | Same place |

**The brightness ladder is the whole trick.** Exactly one thing on screen is allowed to be at
`cream-50` brightness at a time: whatever the player should touch next. Everything else lives
between `ink-800` and `amber-500`.

### 7.2 Colour coding rules

| Colour | Means, and means only | Appears in |
|---|---|---|
| `state-calm` blue | "Time is being spent, and that is fine" | Cook progress bars, patience ≥ 55% |
| `state-soon` amber | "Attention soon", and separately: warm interactive affordance | Patience 25–55%, the `+` glyph, the clock bar, recoverable warnings |
| `state-urgent` red | "About to be lost" | Patience < 25%, walkout, clock < 20%, last life, destructive confirm |
| `ok-500` green | **Money and goals only** | Goal bar, floating payment on a good tip, "Served" stat, purchase checks |
| `brass-400` | **Currency figures only** | Cash totals, prices, coins, AED numbers |
| `cream-50` | "Touch this next" | Ready plate ring, ready ticket ring, primary text |

**Two colours are never used for state at all:** the ten customer identity hues, and the whole
environment palette. A player must never have to ask whether a colour is decoration.

### 7.3 What may and may not use red

**Red is reserved for loss and for the irreversible.** It is used for:

- A customer below 25% patience, and the walkout that follows
- The clock bar below 20%, and the last life in endless
- The failure row on S-08 and the shortfall marker
- The second-tap confirm state on destructive actions ("Start over", "Restart the day")

**Red may never be used for:**

| Not red | Use instead |
|---|---|
| The scrape/trash button at rest | `ink-800` fill, `cream-400` glyph |
| Any button in its resting state | Amber for primary, transparent for secondary |
| A recoverable error (S-17 purchase failure) | `state-soon` amber |
| "Not affordable" in the shop | `cream-600` dimming |
| Food, drink, or any environment element | The food and environment palettes |
| A customer's identity chip | The ten identity hues (none of which is `state-urgent`) |
| Decoration, borders, dividers, badges | `ink-600` / `amber-500` |

The rule exists because red's job is to be **rare**. A red trash icon sitting on screen for ninety
seconds costs the urgent customer their only unique signal.

### 7.4 Icon versus text

| Rule | Application |
|---|---|
| **Icon alone** — only where the object is the icon | Ingredient sprites in bins and on the plate. Six shapes, learned in one shift, used 40× a shift. Text here would be slower to parse than the shape |
| **Icon + text** — everywhere the player is *choosing* | Ticket cards (chips + dish name), shop rows, recipe list, settings rows. Under pressure the icon is read; at leisure the text confirms |
| **Text alone** — every number, every label, every action word | HUD, prices, timers, buttons, stats. No number is ever encoded as a picture |
| **Never icon-only** | Any destructive or irreversible action; any purchase; anything that appears fewer than five times per session |
| **Always paired with text on first appearance** | A newly unlocked ingredient shows its name on the bin at 2× normal prominence for the whole first shift it exists |

Button labels are **verbs, not nouns**: "Start shift", "Bank 320 AED", "Open day 4", "Try day 3
again". No button in the game is labelled "OK".

### 7.5 Minimum touch targets

| Element | Size | Notes |
|---|---|---|
| Absolute minimum, anywhere | **44 × 44** | Apple HIG floor |
| Minimum for anything touched during a shift | **48 × 48** | Android floor, adopted as the in-play standard |
| `+` cook button | **48 × 48** | The most-pressed control in the game. Cornered so it also catches off-target taps from the card edge |
| Bin take-target | **114 × 54 minimum** | The remaining L of the card |
| Ticket card (5 seats — the worst case) | **66 × 138** | Narrow but very tall; supplemented by the customer body below it |
| Customer body hit region | **column width × 110** | A second, larger target for the same action. At 5 seats the combined ticket + body target is 66 × 260 |
| Scrape button | **64 × 64** | Larger than the minimum because a mis-tap here costs three ingredients |
| Primary buttons on menu screens | **358 × 56** | |
| Spacing between any two distinct targets | **≥ 8 pt**, and ≥ 4 pt of dead zone where they share a card | |

### 7.6 What must never overlap

| Never overlapping | Why |
|---|---|
| The `+` button and the bin take-target | The two are opposite actions on the same card. A 4 pt dead zone separates them, permanently |
| Any two ticket cards | 7 pt minimum gap, even at 5 seats |
| The floating payment and the patience bar of an adjacent seat | Floats are clipped to their own column and z-ordered above their own card only |
| The urgent badge and the patience bar | The badge sits at the card's top-right, overlapping the *corner* by 6 pt, above the bar's right terminus but never over its fill |
| The coach caption (S-18) and the element it points at | The caption is always placed on the opposite side of the screen's midline from its target |
| Any modal panel and the order rail | Pause and unlock cards are vertically centred; the rail top at y 117 is never covered by a panel whose top edge is above y 232 |
| The wave banner and the order rail | The banner occupies y 117–157 only when the rail's cards are shorter; otherwise it renders as an overlay **above** the HUD, not below it |
| Text and any sprite | Every label sits in its own reserved band. No text is ever set over art |
| The system home indicator and any control | 34 pt bottom inset is empty, always |

---

## 8. Accessibility

### 8.1 Colour-blind safety

The prototype leans on green → amber → red for patience. Roughly **8% of men** cannot reliably
separate those. The fix is structural, not a filter.

**Fix 1 — reassign the hues.** Green is removed from the urgency ramp entirely and given one
permanent job: **money**. The patience ramp becomes **blue → amber → red**.

| | Old | New | Why |
|---|---|---|---|
| Calm | `#4FBF7B` green | **`#5B9DD9` blue** | Blue-vs-orange is the one colour axis that survives both deuteranopia and protanopia. Green-vs-red is the one that does not |
| Soon | `#F2A03D` amber | `#F2A03D` amber | Unchanged |
| Urgent | `#E24B2E` red | `#E24B2E` red | Unchanged — and now separated from calm by hue *and* by 22 points of L\* |

**Fix 2 — the Two-Channel Rule.** *No state in this game is ever signalled by hue alone.* Every
state carries at least two of: length, pattern, size, shape, position, motion, sound.

| State | Hue | Second channel | Third channel |
|---|---|---|---|
| Patience calm | blue | bar length 100–55% | solid fill, `neutral` face |
| Patience soon | amber | bar length 55–25% | 6 pt stripes scrolling 1/s, `impatient` face |
| Patience urgent | red | bar length 25–0% | 4 pt stripes at 3/s, bar grows to 8 pt, seconds badge, `annoyed` face + lean |
| Plate ready | *(none)* | `cream-50` 2 pt ring — **luminance**, not hue | caret pointer + printed dish name + `sfx_dish_ready` |
| Ticket serveable | *(none)* | `cream-50` ring + `amber-400` glow | bobbing caret |
| Bin has stock | amber pips | **countable discrete pips** | edge lift to `ink-450`, sprite raised 2 pt |
| Bin cooking | blue | bar **filling** (direction) | steam particle, sprite `running` |
| Target met | green | a drawn check glyph | a pop, `sfx_target_met` |
| Money earned | brass | the `+` sign and the numeral | coin burst, `sfx_coins` |

**Fix 3 — the greyscale test, as a build gate.** Every screen is rendered to greyscale in CI. If
two states of the same component cannot be told apart in greyscale, the build fails. This is the
only way the Two-Channel Rule stays true as the game grows.

**Fix 4 — an explicit setting (S-13 → Colour-blind mode), three levels:**

| Level | Effect |
|---|---|
| **Off** | Hues as specified; patterns still on (they are the default, not an accommodation) |
| **Patterns** *(default)* | As specified above |
| **Patterns + shapes** | The patience bar is replaced by **five discrete notches** that extinguish one at a time — countable rather than measured. The seconds badge shows from 100% rather than 25%. Bin pips gain a numeral. The plate ready state adds a 16 pt check glyph inside the ring |

**Fix 5 — never rely on the identity hues.** The ten customer chips carry a **letter** (the name's
initial) in every case, so two customers are always distinguishable without colour.

### 8.2 Text sizing

| Provision | Spec |
|---|---|
| Scale steps | **Normal 1.0 · Large 1.15 · Largest 1.3**, applied to every `body-*` and `num-*` style. `display-*` scales at half the rate (1.0 / 1.075 / 1.15) because it is already large and reflows hardest |
| OS setting | Read at launch and pre-selected; overridable in-app, because a player may want large system text and compact game text |
| What does not scale | The `label` style stays at 9 pt (it is a fixed-width HUD element) but **gains weight** from DM Mono 500 to 700 at Large and Largest |
| Reflow guarantee | Every screen is laid out with min-height rows and scrollable content areas. **No screen may clip at Largest.** The gameplay screen's zone heights are fixed, so at Largest the ticket dish name truncates to one line and the bin name hides — the sprites carry the meaning (§7.4) |
| Line length | Never above 68 characters at Normal |
| Contrast | Every text/background pair ≥ **4.5:1**; `cream-600` on `ink-800` is the floor case and is used only for non-essential tertiary copy, never for anything needed during a shift |

### 8.3 Reduced motion

Honours `prefers-reduced-motion` (mirrored from the OS, overridable in S-13). The prototype already
does the blunt version; this is the considered one.

| Effect | Full motion | Reduced motion |
|---|---|---|
| Item bin → plate | 260 ms arc | **100 ms cross-fade** — the travel is removed, the confirmation is kept |
| Card pops, pip pops, button squash | Scale animations | Replaced by a 90 ms opacity/fill flash |
| Coin burst | 12 physics coins | A single coin icon fading in and out over 240 ms |
| Floating payment | Rise 28 pt + fade | Fade in place, 600 ms |
| Customer arrive/leave | Translate + rotate | Fade only, 200 ms |
| Idle bob, urgent sway, caret bob, parallax | On | **Off entirely** |
| Stripe pattern scroll | 1–3 pitches/s | **Static stripes** — the pattern stays (it is an accessibility channel), only the scrolling stops |
| Screen transitions | Slide + fade | Fade only, 160 ms |
| Day start/end fall-away | 520 ms staggered | 200 ms fade |
| Scrim blur | 2 pt blur | No blur, scrim opacity 80% |

**Nothing that carries information is removed** — only the way it moves changes. And reduced motion
never changes timing of the *simulation*: cook times, patience and the clock are untouched.

### 8.4 One-handed reach

Portrait, held in one hand, thumb pivoting from the lower corner. The natural reach arc covers
roughly the **bottom 55%** of a 844 pt screen.

| Zone | y range | Reach | What lives there — and why |
|---|---|---|---|
| Bin grid | 585–810 | **Easy** | The most-tapped controls in the game (`+` ×6, take ×6) are in the easiest region. Correct |
| Plate strip | 493–585 | **Easy** | Scrape, and the plate's visual feedback |
| Café band | 277–493 | **Reachable** | The customer bodies — a secondary, larger target for the serve action, deliberately placed in the mid-reach band |
| Order rail | 117–277 | **Stretch** | Tickets are a *stretch* target — which is exactly why the customer body below duplicates the same action in an easier place. **Serving is always reachable one-handed** |
| HUD | 47–117 | **Hard** | Contains nothing interactive except pause, which is deliberately hard to hit by accident |

**Hand preference (S-13 → Right / Left)** mirrors the horizontal position of: the pause button, the
scrape button, the back chevron, and the shop's buy buttons. It does **not** mirror the bin grid or
the order rail — those are spatial memory and must stay stable.

**No control in the game requires a second hand, a long-press, a drag, a swipe or a multi-touch
gesture.** Every action is a single tap. This is a design constraint, not an accommodation: it is
what makes the game playable on a bus, which is where this player plays.

### 8.5 Arabic / RTL

The game is set in the UAE; Arabic is a first-class locale, not a translation layer.

| Concern | Decision |
|---|---|
| **Layout mirroring** | Full RTL mirror of every screen: back chevron moves right, pause moves left, stat rows flip key/value, buttons keep full width, list rows reverse |
| **Order rail** | Mirrored — seat 1 becomes the rightmost. The café band mirrors with it so ticket and body stay in the same column |
| **Bin grid** | **Mirrored.** The grid reads right-to-left in Arabic. It is a *reading* surface (six named machines), not a control panel, and Arabic players expect to scan it in their reading direction |
| **Progress fill direction** | **Mirrored.** Goal bar fills right → left; clock bar drains left → right; patience bars drain toward the trailing edge. Progress must always advance in the reading direction or it reads as running backwards |
| **Sprites** | **Never mirrored.** A jug's handle, a croissant's curve and the barista's stance are objects, not directions. Mirroring them makes the art look wrong for no gain |
| **Directional glyphs** | **Always mirrored:** chevrons, the recipe "→" arrow, the serveable caret's horizontal offset. **Never mirrored:** the "+" glyph, the check, the clock |
| **Customer arrival** | Enters from the *leading* edge and exits toward the *trailing* edge, so the door swaps sides with the layout |
| **Numerals** | Western Arabic (0–9) by default; an S-13 sub-toggle switches to Eastern Arabic (٠–٩). Prices read `١٦ د.إ` in Arabic, `16 AED` in English. Numerals stay **LTR within RTL text** — enforce with directional isolates so a price never scrambles |
| **Typography** | Cairo 700/900 for display, IBM Plex Sans Arabic 400/500/600 for UI. **Line-height +15%** across the board for Arabic (ascenders and descenders are taller). **No letter-spacing, ever** — it breaks Arabic joining. **No uppercase transform** — the `label` style drops its `+0.14em` tracking and uppercase and instead uses weight 600 in Arabic. **No faux bold or faux italic** |
| **Text expansion** | Arabic runs ~15% shorter than English here, which is the easy direction — but German-length is the real design constraint, so every label box is sized for **+35%** over the English string |
| **Names** | The `NAMES` array is already Arabic; in the Arabic locale they render in Arabic script (رامي، نور، دانة…) and the identity chip carries the Arabic initial |
| **Right-thumb default** | Arabic locale defaults the hand preference to Right as well — reading direction and handedness are unrelated |

---

## 9. Build list — v1.0 code-authored assets

**120 assets**, all authored in-repo as hand-written SVG/vector. This is a build list, not a
commissioning sheet: each row names the asset, its viewBox (R1), the primitives it is made from,
the states it must support, and the display sizes it must stay legible at. **The smallest in-game
size is the binding constraint** — an asset that fails at its smallest size is not finished (R9).

Conventions used in every row: all coordinates on the 4-unit grid (R2), artwork inside the 80 × 80
padding box (R3), radii from {4, 8, 12, 24, 48} (R4), angles from {0, 30, 45, 60, 90} (R5), ≤ 9
shapes (R6), 6-unit `ink-outline` silhouette stroke (R7), light upper-right 60° (R8), tokens only
(R10). "Shade" and "H-dot"/"H-bar" refer to the recipes in §2.6.

### 9.1 Ingredients — 7

| # | Asset | viewBox | Primitives | States | Display sizes (smallest **bold**) |
|---|---|---|---|---|---|
| 1 | `ing/shot` | 96×96 | rounded-rect 44×40 r12 `fill-porcelain`; top ellipse 44×12; clipped liquid rect `espresso`; saucer ellipse 64×10; shade; H-dot; contact ellipse | base · dimmed (locked bin) · silhouette (recipe ghost) | 52 (bin), 36 (plate), **21 (ticket chip)** |
| 2 | `ing/tea` | 96×96 | two mirrored arcs forming a waisted istikana `fill-glass`; liquid path `tea`; saucer ellipse 60×10; shade; H-bar; contact | as above | 52, 36, **21** |
| 3 | `ing/syrup` | 96×96 | rounded-rect 32×52 r8 `fill-honey`; neck trapezoid; cap rect 20×8 r4; drip circle r6; shade; H-bar; contact | as above | 52, 36, **21** |
| 4 | `ing/milk` | 96×96 | rect 40×52 r8 `fill-porcelain`; 30° pouring-lip triangle; C-handle stroke; liquid arc `milk`; shade; H-dot; contact | as above | 52, 36, **21** |
| 5 | `ing/pastry` | 96×96 | three overlapping rounded-rects r12 on a 30° arc `fill-dough`; two 30° score strokes; shade; H-bar; contact | as above | 52, 36, **21** |
| 6 | `ing/ice` | 96×96 | three squares 26×26 r4 at 0°/30°/−30° `fill-glass`; inner `ice-core` squares; shade on lowest; H-dot on highest; contact | as above | 52, 36, **21** |
| 7 | `ing/locked` | 96×96 | padlock: rounded-rect body 44×36 r8 `ink-700`; shackle arc stroke; keyhole circle r5 | base only | 52, **28** |

**Silhouette separation check (R9):** squat/no-handle · waisted · narrow-neck-with-drip ·
straight-with-handle-and-lip · crescent-no-vessel · three-part-cluster-with-gaps. All six differ in
outline alone.

### 9.2 Dishes — 8

Each reuses its ingredient vessel geometry and changes fill plus one garnish shape.

| # | Asset | viewBox | Built from | States | Display sizes |
|---|---|---|---|---|---|
| 8 | `dish/espresso` | 96×96 | `ing/shot` unchanged | base · ghost 45% (plate backdrop) · large (unlock card) | 120, 72, 64, 44, **32** |
| 9 | `dish/mint-tea` | 96×96 | `ing/tea` + `mint` liquid + two leaf ellipses at 30° | as above | 120, 72, 64, 44, **32** |
| 10 | `dish/latte` | 96×96 | shot vessel heightened to 44×52 + `milk` liquid + one `tea` heart path | as above | 120, 72, 64, 44, **32** |
| 11 | `dish/karak` | 96×96 | `ing/tea` + `karak` liquid + `cream-50` foam arc + cardamom dot r4 | as above | 120, 72, 64, 44, **32** |
| 12 | `dish/almond-croissant` | 96×96 | `ing/pastry` + three `almond` flake triangles + four `cream-50` dusting dots r3 | as above | 120, 72, 64, 44, **32** |
| 13 | `dish/iced-latte` | 96×96 | tumbler rect 44×60 r8 `fill-glass` + `milk` liquid + two `ice-core` squares + straw rect at 30° | as above | 120, 72, 64, 44, **32** |
| 14 | `dish/date-pastry` *(reserved)* | 96×96 | pastry base + `date` filling ellipse + `cream-50` lattice strokes | as above | 120, 72, 64, 44, **32** |
| 15 | `dish/saffron-tea` *(reserved)* | 96×96 | tea base + `fill-honey` liquid + three saffron strand strokes | as above | 120, 72, 64, 44, **32** |

Rows 14–15 exist so the expansion described in `target-player.md` §"How to last a while" has
somewhere to land without a style revision.

### 9.3 Machines — 6

Each machine sits in a bin card and again, at 32 pt, on the café shelf.

| # | Asset | viewBox | Primitives | States | Display sizes |
|---|---|---|---|---|---|
| 16 | `mach/espresso` | 96×96 | body rounded-rect 60×52 r8 `fill-steel`; group head rect 24×12; portafilter rect + handle; drip tray rect; shade; H-bar | **idle** · **running** (lever rotated 30°, `amber-400` lamp circle r4 on) · dimmed (locked) | 52 (bin), **32 (shelf)** |
| 17 | `mach/samovar` | 96×96 | urn body: circle r26 `fill-steel` + neck rect; tap rect at 30°; lid disc; shade; H-dot | idle · running (tap `sun-300` stream rect) · dimmed | 52, **32** |
| 18 | `mach/syrup-rack` | 96×96 | two bottles rounded-rect 20×44 r8 `fill-honey`; shelf rect `wood-600`; pump strokes; shade | idle · running (pump depressed 6 units) · dimmed | 52, **32** |
| 19 | `mach/steamer` | 96×96 | jug rect 36×48 r8 `fill-porcelain`; wand stroke at 30°; base rect `fill-steel`; shade; H-dot | idle · running (wand lowered, steam anchor point) · dimmed | 52, **32** |
| 20 | `mach/oven` | 96×96 | box 64×56 r8 `fill-steel`; door rect 48×36 r4 with `ink-700` window; two knob circles r5; shade; H-bar | idle · running (window `sun-300`, knob rotated 30°) · dimmed | 52, **32** |
| 21 | `mach/ice-well` | 96×96 | trough rounded-rect 64×36 r12 `fill-steel`; three ice squares r4 `fill-glass`; scoop arc; shade; H-bar | idle · running (scoop rotated) · dimmed | 52, **32** |

### 9.4 Customer parts library — 30

Assembled per §2.9. Every part shares the 96 × 128 viewBox and registers to the same pivots, so any
combination is valid without adjustment.

| # | Group | Count | viewBox | Primitives per part | States |
|---|---|---|---|---|---|
| 22–27 | `char/head` | **6** | 96×128 | circle r28 **or** squircle 56×56 r24, in 4 skin tokens (2 shapes × 4 tones, 6 shipped) | base · shaded (shade recipe) |
| 28–35 | `char/hair` | **8** | 96×128 | ≤ 4-node path over the head: ghutra+agal, shayla, short crop, bun, curls (5 circles r10), cap, long, bald+beard | base only |
| 36–41 | `char/torso` | **6** | 96×128 | one rounded trapezoid, top 48 → bottom 84, y 92–120, top r24: kandura, abaya, courier polo, office shirt, hoodie, apron | base · leaning (translate +6, rotate 3°) |
| 42–46 | `char/mouth` | **5** | 96×128 | one 16-unit path at (48, 70): neutral, pleased, impatient, annoyed, delighted | base only |
| 47–48 | `char/brow` | **2** | 96×128 | rect 12×3 r2, left and right | rotation −20°/−10°/0°/+10°/+20° |
| 49–51 | `char/accessory` | **3** | 96×128 | phone rect 14×22 r4; tote rounded-rect + strap arc; glasses two circles r11 + bridge | base only |

Eyes are two circles r 3.5 drawn by the assembler, not an asset. Twelve named regulars are twelve
fixed combinations of the above, bound permanently to the `NAMES` array.

**Display sizes:** 110 pt (café band) · 64 pt (result screen) · **28 pt (identity chip — head and
hair silhouette only, no features)**.

### 9.5 Barista parts — 9

| # | Asset | viewBox | Primitives | States | Display sizes |
|---|---|---|---|---|---|
| 52 | `barista/head` | 96×128 | squircle 56×56 r24, skin token 2, plus bound hair path | base | 140, 120, **64** |
| 53 | `barista/torso` | 96×128 | apron trapezoid `fill-linen` + collar path + two tie strokes | base | 140, 120, **64** |
| 54–57 | `barista/arm` | 96×128 ×4 | two rounded-rect limbs (upper 14×34 r8, fore 12×30 r8) rotating about a shoulder pivot | **idle** · **reach** · **serve** · **celebrate** | 140, 120, **64** |
| 58–60 | `barista/mouth` | 96×128 ×3 | one path: neutral, pleased, delighted | base | 140, 120, **64** |

### 9.6 Environment layers — 6

| # | Asset | viewBox | Primitives | States | Display |
|---|---|---|---|---|---|
| 61 | `env/street` | 390×216 | 5–7 flat shop silhouettes `street-700`; one lamp circle r10 `sun-300`; one passer-by silhouette (reuses `char/torso` + head) | **day** · **dusk** · **night** (fill token swap only — §2.11) | 390 wide, **full-bleed at min band 150 pt** |
| 62 | `env/window-frame` | 390×216 | rect frame strokes 6 units `wood-600`; one 30° `cream-50` glint bar | base | 390 |
| 63 | `env/wall` | 390×216 | `ink-800` rect; `tile-500` band rect 390×32; six tile division strokes | base | 390 |
| 64 | `env/shelf` | 390×216 | rect 358×8 r4 `wood-600` + three jar rounded-rects r8 `fill-glass` | base | 390 |
| 65 | `env/counter` | 390×216 | face rect `wood-600`; top rect 390×8 `wood-400`; one `cream-50` rim stroke 2 units | base | 390 |
| 66 | `env/door` | 390×216 | rect 56×120 r8 `wood-600`; handle rect; chime circle r5 | **closed** · **open** (rotate 20° about the hinge edge, 240 ms) | 56 |

### 9.7 UI glyphs — 28

All `viewBox="0 0 24 24"`, 2-unit grid, **1.5-unit stroke** (R7), round caps and joins, currentColor.

| # | Glyph | Primitives | Used on |
|---|---|---|---|
| 67 | `plus` | two rects 14×2 r1 | Bin `+` |
| 68 | `check` | two-node polyline | Target met, purchases, colour-blind ready cue |
| 69 | `close` | two rects rotated ±45° | Store, modals |
| 70 | `chevron` | two-node polyline | Back, list rows (mirrors in RTL) |
| 71 | `caret` | filled triangle, 12×8 | The serveable pointer |
| 72 | `lock` | rounded-rect + arc | Locked bins, locked recipes |
| 73 | `pause` | two rects 4×14 r2 | HUD |
| 74 | `gear` | circle + 6 rects at 60° | Settings |
| 75 | `speaker` | trapezoid + two arcs | Sound toggle (arcs removed = off) |
| 76 | `music-note` | ellipse + stem rect | Music toggle |
| 77 | `haptic` | rounded-rect + two arcs | Haptics toggle |
| 78 | `motion` | arrow arc | Reduced motion |
| 79 | `contrast` | circle, half filled | Colour-blind mode |
| 80 | `text-size` | two "A" paths at different scales | Text size |
| 81 | `hand` | palm rounded-rect + 4 finger rects | Hand preference, coach pointer |
| 82 | `globe` | circle + 3 arcs | Language |
| 83 | `coin` | circle r10 + inner circle r6 | Currency, particles |
| 84 | `aed-mark` | د.إ set as a path | Arabic price display |
| 85 | `streak-steam` | three 30° wavy strokes | Streak chip |
| 86 | `clock` | circle + two hands | Shift length, endless "lasted" |
| 87 | `stool` | seat ellipse + 3 legs | "Another seat" upgrade |
| 88 | `chair` | back rect + seat rect | "Comfier chairs" upgrade |
| 89 | `basket` | trapezoid + 3 weave strokes | "Bigger bins" upgrade |
| 90 | `bolt` | one 6-node path | Machine speed upgrade |
| 91 | `grid` | 3 rects | Machine slots upgrade |
| 92 | `scrape-bin` | body trapezoid + lid rect (tilts on press) | The scrape button |
| 93 | `warning` | rounded triangle + bar + dot | Recoverable errors, urgent badge |
| 94 | `book` | two rects + spine stroke | Recipes screen |

### 9.8 UI primitives — 7

Drawn by the engine from tokens, not exported. Listed because they are still authored assets.

| # | Asset | Spec | States |
|---|---|---|---|
| 95 | `ui/button-plate` | rounded-rect r10, 358×56, token fill | rest · pressed · disabled · focus |
| 96 | `ui/card` | rounded-rect r12, 1-unit `ink-600` edge | rest · raised · dashed (empty seat) |
| 97 | `ui/pill` | rounded-rect r16 | rest · active |
| 98 | `ui/segmented-track` | rounded-rect r12, `ink-700`, 2–3 cells | per-cell selected / unselected |
| 99 | `ui/stripe-pattern` | 45° stripe tile, `ink-950` @14%, pitch 6 and 4 | static · scrolling 1/s · scrolling 3/s |
| 100 | `ui/scrim` | full-frame `ink-950` @72% (the one permitted gradient: 0→72% over 24 pt at the top edge) | in · out |
| 101 | `ui/focus-ring` | rounded-rect stroke 2 pt `focus-500`, 2 pt offset | on · off |

### 9.9 Effects — 9

All built from the same primitives; all transform-and-opacity only.

| # | Asset | Primitives | Count / lifetime | Fires on |
|---|---|---|---|---|
| 102 | `fx/steam` | 4 circles r4–r8 `sun-300` @40% | 4 per puff, 800 ms rise + fade | Cook running, cook complete, shelf machines |
| 103 | `fx/coin` | reuses `coin` glyph, `brass-400` fill, 3-unit stroke | 4–12, 520 ms, gravity 900 pt/s² | Payment, purchase |
| 104 | `fx/sparkle` | 4-point star path, 3 sizes | 6–12, 420 ms | Dish unlock, streak ≥5, purchase success |
| 105 | `fx/ring-pulse` | circle stroke 3 units `amber-400`, r 8 → 28 | 1, 260 ms | Cook complete (from the pip) |
| 106 | `fx/dust` | 4 circles r3 `cream-600` @30% | 4, 300 ms | Card landing, bin grid entry |
| 107 | `fx/shard` | 5 triangles `cream-200` | 5, 320 ms, gravity | Endless life lost, streak break |
| 108 | `fx/float-text` | live text, `display-s` | 1, 850 ms rise 28 pt | Payment, "walked out" |
| 109 | `fx/stamp` | rounded-rect plaque r8 + live text, rotated −7° | 1, 180 ms impact + 60 ms settle | Day result, purchase success |
| 110 | `fx/confetti` | 3 shapes: rect 8×4 r2, circle r4, 30° parallelogram | 20, 900 ms | New personal best only |

### 9.10 Wordmark — 2

| # | Asset | viewBox | Spec |
|---|---|---|---|
| 111 | `brand/wordmark-en` | 390×120 | "CAFÉ RUSH" as outlined paths from Bricolage 800, plus a 2×64 `amber-500` rule and `ing/tea` at 56 pt with a steam anchor |
| 112 | `brand/wordmark-ar` | 390×120 | "كافيه راش" as paths from Cairo 900, same rule and glass. **Not a mirror** — separately composed, because Arabic display type needs its own spacing |

### 9.11 Store and launch — 5

| # | Asset | Size | Spec |
|---|---|---|---|
| 113 | `store/app-icon` | 1024×1024 | `ing/tea` at 640 pt on an `ink-900` field with a `terracotta-600` 30° corner band. **No text** (it is unreadable at 60 pt and breaks localisation) |
| 114 | `store/adaptive-fg` | 432×432 | Android adaptive foreground: the glass only, inside the 66% safe circle |
| 115 | `store/adaptive-bg` | 432×432 | Flat `ink-900` with the `terracotta-600` band |
| 116 | `store/splash` | 390×844 | `brand/wordmark-*` centred per S-01. Authored per locale from the same vector |
| 117 | `store/feature-graphic` | 1024×500 | The café band composition at full width with the wordmark right-aligned |

App Store screenshots are **captured from the running game**, not authored — which is only possible
because the art is vector and renders identically at any capture resolution.

### 9.12 Empty and system states — 3

| # | Asset | viewBox | Spec | Appears on |
|---|---|---|---|---|
| 118 | `sys/no-connection` | 96×96 | `env/door` closed + a 30° cross-out stroke `cream-600` | S-17 store unreachable |
| 119 | `sys/nothing-here` | 96×96 | An empty saucer: two ellipses + shade | Shop with everything maxed; endless with no best yet |
| 120 | `sys/spinner` | 24×24 | A 270° arc stroke 2 units, rotating 360° / 900 ms linear | Purchase in flight, save load |

### 9.13 Totals

| Group | Count |
|---|---|
| Ingredients | 7 |
| Dishes | 8 |
| Machines | 6 |
| Customer parts | 30 |
| Barista parts | 9 |
| Environment layers | 6 |
| UI glyphs | 28 |
| UI primitives | 7 |
| Effects | 9 |
| Wordmark | 2 |
| Store and launch | 5 |
| Empty / system | 3 |
| **Total** | **120** |

**115 in-game, 5 store and launch.** Every one is authored in-repo as vector code, so the entire
list is re-colourable from the token tables in §2.3 and restyleable by editing the rules in §2.5 —
a change of look is a global edit, not a re-draw (§2.11).

### 9.14 Audio, for completeness

Not art, and the one category bought rather than authored: **29 SFX + 2 ambience loops + 1 music
bed**, itemised in §6.8. All library-licensable; `art-plan.md` prices a library licence at USD
50–200, which is the only external spend in this entire specification.

---

## 10. Motion, empty and error states, and the first 30 seconds

### 10.1 Motion principles

Four rules that govern every animation in §6, so that a new one can be written without asking.

| # | Rule | Consequence |
|---|---|---|
| **M1** | **Motion explains causality.** Anything that moves is showing where something came from or where it went. Nothing moves for decoration. | The bin → plate arc exists to teach that stock becomes plate contents. The coin burst arcs toward the HUD because that is where the money goes |
| **M2** | **Duration is inversely proportional to frequency.** A thing that happens 40× a shift gets ≤ 260 ms. A thing that happens once a shift may take 900 ms. A thing that happens once a day may take 1400 ms | Item travel 260 ms; payment 850 ms; day transition 520 ms; wave banner 1400 ms |
| **M3** | **Nothing blocks input.** The only animations that gate the player are the day start (420 ms) and the resume countdown (1800 ms), both of which are also pauses in the simulation. No reward animation ever stops the player from acting | A payment count-up never delays the next tap |
| **M4** | **Arrivals overshoot; departures accelerate away.** `e-out`/`e-pop`/`e-snap` in, `e-in` out. Universally | Gives the whole game one consistent sense of weight without any physics simulation |

### 10.2 Empty states

| Where | Condition | What is shown |
|---|---|---|
| Plate well | No ingredients | Dashed edge, three ghost slot outlines, `body-s` `cream-600` "Tap a bin to start a dish." Becomes "Tap a machine below" for the first shift only |
| Ticket card | Seat unoccupied | Dashed 1 pt `#2A221E` edge, no contents, and an **empty stool** drawn in the café band below it. The empty card is deliberately quiet — an empty seat is not a problem, it is headroom |
| Bin | Live, stock 0, nothing cooking | Pips all grey. **No error styling.** An empty bin is a normal state, not a failure |
| Order rail | All seats empty, > 6 s since the last customer | The barista plays an extended idle (wiping the counter, 2.4 s). No UI message — quiet moments are the game's only rest |
| Upgrade shop | Everything maxed | `sys/nothing-here` at 64 pt, `display-m` "Nothing left to buy.", `body-m` "The café is as good as it gets. Go make some money." Primary button becomes "Open day {n+1}" |
| Endless best card | No run recorded | `body-m` `cream-400` "No run yet." with the 3-life icons shown full |
| Recipes screen | Nothing locked | No empty state needed — the list is always populated |
| Store | Already purchased | The screen is not reachable; the Home utility row hides the bag icon entirely |

### 10.3 Error states

The game runs offline and owns its own save, so there are exactly four error surfaces.

| Error | Screen | Message | Recovery |
|---|---|---|---|
| Purchase failed / store unreachable | S-17 | "The store didn't answer." — `state-soon` warning glyph, **not red** | "Try again" / "Not now". The game remains fully playable |
| Nothing to restore | S-17 | "Nothing to restore on this account." + one line explaining store accounts | "Try again" / "Not now" |
| Save unreadable | S-21 | "We couldn't read your save." + "nothing you paid for is lost either way" | "Try again" / "Start fresh" (two-step confirm naming the day it erases) |
| Save write failed (disk full) | Toast | A 48 pt toast under the HUD: "Couldn't save — check your storage." 4 s, `state-soon` left bar | Non-blocking. The shift continues; the game retries on the next screen change |

**Rules for all four:** no error codes in the headline (a reference string may sit at the bottom in
`num-s` `cream-600`); no red unless the state is genuinely unrecoverable; never a dead end — every
error screen offers at least one way forward; and the game **never loses the current shift** to an
error. If something fails mid-shift, it is a toast, not a modal.

### 10.4 The first thirty seconds

What a first-time player sees, second by second. This is the sequence the whole onboarding design
is optimised for, and its goal is narrow: **the player must experience the game's actual skill —
starting something before they need it — inside thirty seconds.**

| Time | On screen | Player does | What they learn |
|---|---|---|---|
| **0:00** | S-01 splash: wordmark, karak glass, one steam puff | Nothing | The tone: warm, dark, quiet, unhurried |
| **0:01** | S-19 language picker (first run only), two large cards | Taps one | The game knows where it is set |
| **0:02** | S-02 home: the café, lit, the barista wiping the counter; DAY 1; one bright button | Reads "Open the café" | This is a place, and they run it |
| **0:04** | Tap → S-03 briefing. Target **190 AED**, 90 seconds, 3 seats, two dishes on the menu with their recipes drawn as chips | Skims | The contract, and that dishes are made of parts |
| **0:07** | Tap "Let's go" → the bins rise into place from below, staggered, 420 ms. `sfx_shutter`. Clock **not running** | Watches | Something is beginning |
| **0:08** | **OB-1.** Everything dims to 35% except the Shot bin's `+`, ringed and pulsing. A caption: "Start a shot. Machines cook on their own. Tap +." A hand taps it every 1.2 s. One customer is already seated, wanting an espresso, and **cannot leave** | Taps `+` | **Verb 1: start a cook.** Light haptic, `sfx_machine_start`, the cook bar begins filling |
| **0:10** | **OB-2.** The dim lifts. The cook bar fills in `state-calm` over 2.2 s in full view. Caption: "It cooks while you do other things." | Watches it fill | **Cooking takes time, and it happens by itself.** This is the game's entire premise, shown in two seconds |
| **0:12** | The pip fills with a pop, a ring pulses, steam rises off the shelf machine, `sfx_cook_done`, light haptic. The bin lights up. Caption: "Now tap the bin to put it on the plate." | Taps the bin | **Verb 2: take stock.** The sprite arcs to the plate over 260 ms and lands with a bounce |
| **0:14** | **OB-3.** The plate goes `complete-wanted`: `cream-50` ring, `amber-400` glow, "Espresso" types on, `sfx_dish_ready`, soft double-tick. The seated customer's ticket gains a ring and a bobbing caret | Taps the customer | **Verb 3: serve.** Barista `serve` pose, dish flies to their hands, `+14` floats up in `ok-500`, 6 coins burst toward the HUD, EARNED counts up, `sfx_coins` → `sfx_till`, medium haptic |
| **0:16** | **The clock starts.** The coach disappears entirely. `amb_cafe` fades in. A second customer arrives with a door chime, wanting mint tea | Looks at the recipe chips on the new ticket | They already know what the two chips mean, because they just used both verbs |
| **0:19** | They tap `+` on Tea, then `+` on Syrup. Two cook bars fill side by side | Waits, watching bars | **Two things can happen at once.** The simultaneity `rush-pivot.md` identifies as the whole game |
| **0:22** | A third customer arrives, wanting espresso — and the Shot bin is **empty**, because they used it | Taps `+` on Shot, then assembles the mint tea while it cooks | **The lesson.** They are now cooking one thing while serving another, which is the skill |
| **0:24** | **OB-4** slides down as a non-blocking banner for 3.5 s: "Start the next thing before you need it. Pastry takes four seconds." | Reads it while playing | The strategy, stated once, at the exact moment it becomes true |
| **0:27** | Mint tea completes and is served. Streak chip appears at ×2 with a pop and a rising note | Notices the chip | **There is a reward for not dropping the ball** |
| **0:30** | Three seats occupied, two bins cooking, one patience bar crossing into amber with its stripes fading in | Triaging | They are playing the game. No tutorial remains on screen |

**The design commitments this sequence makes:**

- **No text wall.** The prototype's `!S.seen` card is deleted. Every rule is taught by a gated tap.
- **No customer can be lost during OB-1 to OB-3**, and the clock does not start until the player has
  personally completed all three verbs. The first failure a player experiences should be their own.
- **The first payment lands before 0:16.** The full reward chain — float, coins, count-up, till,
  haptic — fires on the very first serve, at full strength. Nothing is held back for later.
- **Onboarding is skippable from the first frame** via a text button, and never appears again once
  `S.seen` is set.
- **By 0:30 there is no UI on screen that was not there at 0:16.** The game teaches itself and then
  gets out of the way — which is, finally, the whole point of P1.
