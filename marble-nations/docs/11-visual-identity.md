# Visual identity — "Midnight & Gold"

The art direction the prototype is built to. It is a contract, not a mood board:
the tokens and class names below are what `prototype/styles.css` defines and what
`prototype/src/app.js` uses. Anything not listed here does not exist.

The reference is broadcast football presentation — a floodlit stadium at night,
gold trophy furniture, a condensed metallic wordmark — carried onto a phone. Two
rules hold everywhere:

1. **Navy is the room, gold is the prize.** Gold marks the thing you are playing
   for: the primary action, the champion, a qualification place, the active tab.
   If everything is gold, nothing is. Roughly one gold element per viewport.
2. **The marbles are the photography.** Every nation already renders its flag on
   a glass sphere. The chrome stays flat and dark so the marbles are the only
   glossy, saturated objects on screen.

---

## 1. Colour

```
--void      #04080F   behind the phone frame
--navy-900  #070E1A   app background
--navy-850  #0A1524   frame / bars
--navy-800  #0E1B2C   surface (cards)
--navy-700  #142438   surface raised (chips, inputs, pressed)
--navy-600  #1C3148   hover

--line      #1B2C42   hairline
--line-2    #26405C   hairline, raised

--text      #F1F6FC
--muted     #93A8C0
--dim       #5E7690

--gold      #F2C14E   primary accent
--gold-hi   #FBE7A8   top of the gold gradient
--gold-lo   #C08A18   bottom of the gold gradient
--gold-ink  #241703   text on gold

--emerald   #2FBF6B   secondary confirm (Continue, Next match)
--emerald-ink #04240F
--sky       #4DA3FF   information, third-place lane
--danger    #FF5C5C
--warn      #FFB648
```

Gradients, as tokens:

```
--grad-gold    linear-gradient(180deg, #FBE7A8 0%, #F2C14E 46%, #C08A18 100%)
--grad-silver  linear-gradient(180deg, #FFFFFF 0%, #D4E1EF 52%, #8CA3BC 100%)
--grad-surface linear-gradient(180deg, #16263B 0%, #0D1A2A 100%)
--grad-bar     linear-gradient(180deg, #132339 0%, #0A1524 100%)
```

Two atmospheric effects carry the stadium, both procedural — no image assets:

- **Floodlight**: a large soft radial at the top of the frame,
  `radial-gradient(120% 60% at 50% -8%, rgba(77,143,255,.20), transparent 62%)`.
- **Pitch glow**: a low, wide emerald/gold wash at the bottom of hero surfaces.

## 2. Type

Loaded from Google Fonts with a system fallback (the prototype must still read
offline):

- **Display** — `Saira Condensed` 700/800, uppercase, letter-spacing `.02em` to
  `.14em` depending on size. Wordmark, screen titles, scores, tab labels, table
  headers, stat numbers.
- **Body** — `IBM Plex Sans` 400/500/600/700. Everything that is a sentence.

| Role | Spec |
|---|---|
| Wordmark | display 800, 26px, `.03em`, silver gradient + gold second line |
| Screen title (`h2`) | display 800, 27px, `.01em` |
| Section label (`h3`) | display 700, 12px, `.16em`, uppercase, `--dim` |
| Card title | body 700, 16px |
| Body | body 400, 13.5px, line-height 1.5, `--muted` |
| Micro | body 600, 11px, `.06em` |
| Score | display 800, tabular-nums |

`.ttl-gold` and `.ttl-silver` clip the gradient to text
(`background-clip:text; -webkit-text-fill-color:transparent`) with a plain
colour fallback declared first.

## 3. Shape, depth, motion

- Radii: `--r-lg 20px` (cards, hero), `--r 14px` (rows, inputs), `--r-sm 10px`
  (chips), `999px` (buttons, pills).
- Every raised surface: 1px `--line` border, `--grad-surface` fill, and
  `box-shadow: 0 10px 30px -12px rgba(0,0,0,.8)`. No glow on ordinary cards.
- Gold elements get `box-shadow: 0 6px 20px -8px rgba(242,193,78,.55)`.
- Press: `transform: scale(.985)` over 90ms. Tap targets ≥ 44px.
- Everything inside `@media (prefers-reduced-motion: reduce)` drops to 0.01ms —
  the existing rule stays.

## 4. Component contract

Class names `app.js` may use. Where a class exists today it keeps its name so
the diff stays readable.

**Shell** — `.app`, `.topbar`, `.topbar h1`, `.topbar .sub`, `.iconbtn`,
`.screen`, `.pad`, `.tabbar`, `.tabbar button` (+ `aria-current`), `.brand`
(two-line wordmark lockup: `.brand b` silver, `.brand i` gold).

**Surfaces** — `.card`, `.card.tap`, `.card.flat` (no gradient), `.hero`
(full-bleed feature panel: floodlight, pitch glow, gold CTA),
`.hero .eyebrow` / `.hero h2` / `.hero p` / `.hero .cta`, `.tile` (competition
tile: 96px tall, left gold rule, trophy glyph right, chevron),
`.tile[data-conf]` tints the rule and wash per confederation
(`AFC` emerald, `UEFA` sky, `CONMEBOL` gold, `CAF` amber, `CONCACAF` violet,
`GLOBAL` gold), `.tile.lg` (hero tile), `.sheet` / `.sheet .inner` / `.grab`.

**Controls** — `.btn` (gold gradient pill), `.btn.green`, `.btn.ghost`,
`.btn.dark`, `.btn.sm`, `.btn:disabled`, `.seg` / `.seg button[aria-pressed]`,
`.search`, `.chips` / `.chip[aria-pressed]` (confederation filter row).

**Data** — `.pill` (+ `.ok .warn .bad .gold`), `.kv`, `.note` (+ `.warn`),
`.consequence` (+ `.bad .neutral`), `table` / `tr.qual` / `tr.third` / `tr.me`,
`.statrow` / `.stat` (label + big display number), `.meter` / `.meter i`
(progress bar), `.hr`, `.tiny`, `.mono`, `.muted`, `.dim`.

**Football furniture** — `.mb` (+ `.sm .lg .xl`, `.fav` gold ring), `.teamline`,
`.codechip`, `.fx` (fixture row: crest–score–crest, `.fx .sc`, `.fx.next`,
`.fx.mine`, `.fx .ft` full-time caption), `.grid` / `.ncell` (+ `.on` gold ring
and tick), `.pots` / `.pot`, `.groupgrid` / `.gcell`, `.bracket` / `.bcol` /
`.btie`, `.arow` (arena row, `.locked`), `.legcard` (+ `.bad`), `.trophy` /
`.trophy .cup`.

**Live match** — `.arena-wrap`, `.scoreboard` (broadcast bar: code, marble,
gold-framed score), `.clockline`, `.ticker` (+ `.goal`), `.controls`,
`.arenacard`, `.cutbadge`, `.bigflash`, `.hint`, `.ripple`.

**Icons** — a single inline-SVG set in `src/ui/icons.js`, 24px viewBox,
`currentColor`, 1.6 stroke. Names: `home, cup, flag, star, gear, chevron, back,
play, skip, replay, camera, speed, ball, globe, shield, bolt, target, medal,
lock, check, search, sparkle, chart`. No emoji in chrome — emoji may remain
only where it is decorative and enormous (the 🏆 on the champions screen is
replaced by the `cup` icon at 64px in gold).

## 5. Screens

Portrait, 430×932 frame. Four tabs: **Play · Journey · Collection · Settings**.

1. **Play (home)** — wordmark topbar; `Continue campaign` hero when a save
   exists (nation marbles, progress meter); competition tiles, the first one
   `.tile.lg`; ruleset note at the bottom.
2. **Setup** — competition header card, mode segmented control, confederation
   chip filter + search, nation grid of flag marbles with gold selection ring,
   sticky gold CTA.
3. **Draw** — pots, group grid filling live, commentary line, skip ghost button.
4. **Journey** — round header with progress meter; NEXT MATCH hero; segmented
   Fixtures / Tables / Bracket; tables with gold qualification lane and sky
   third-place lane.
5. **Live** — broadcast scoreboard, arena canvas, ticker, control bar.
6. **Result** — big score card, consequence banners, round summary.
7. **Champions** — gold radial burst, cup icon, champion marble at `.xl`,
   `CHAMPIONS` in gold gradient, stat rows.
8. **Collection** — trophy cabinet, arena index by tier, campaign history.
9. **Settings** — toggles, premium card, build info.

## 6. What this redesign does not do

The marketing comps show a coin economy, a shop, career-mode skill upgrades and
daily challenges. None of that exists in this prototype and none of it is
invented here: this is a visual redesign of the screens that exist. The tab bar
is four tabs, not five, for the same reason — a tab that leads nowhere is worse
than no tab.
