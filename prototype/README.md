# Prototypes

Two grey-box prototypes of the same café, testing two different games. Neither has art
or audio. See `../docs/rush-pivot.md` for why there are two.

- **`frenzy.html` — Café Rush.** Real-time, two layers. Machines cook *ingredients* on
  background timers into stock bins; *dishes* are assembled from stock. Assembly is
  instant, cooking is not, so the skill is having steamed milk ready before the latte
  order walks in. Three to five seats fill at once, customers walk out if you are slow.
  Ninety-second shifts against an earnings target, upgrades in between, and an endless
  rush unlocked after day three that ramps until three people walk out.
- **`cafe.html` — Little Street Café.** Calm. One customer at a time, no timers in
  relaxed mode, a menu you plan each morning against fewer board spaces than you have
  recipes, and regulars whose stories advance. See `../docs/vertical-slice.md`.

## Running them

Each file is authored without the `<!doctype>/<html>/<head>/<body>` wrapper so the same
file can be published as a shareable link for phone testing. To open one locally:

```sh
./build.sh            # both -> cafe.local.html, frenzy.local.html
./build.sh frenzy     # just one
```

The `*.local.html` files are generated and git-ignored. Edit the sources.

## Where the tuning lives

Everything a playtest will want to change is a plain data object at the top of each
script. No game rule is hard-coded anywhere else, so re-tuning between sessions is a
number change — and the numbers carry over to whichever engine you pick.

**`frenzy.html`**

- `ING` — the six ingredients and their cook times
- `DISHES` — what each drink is made of, its price, and the day it unlocks. Ingredients
  unlock implicitly: a bin goes live when some unlocked dish needs it, so day one runs on
  three bins and day five on all six
- `dayCfg()` — spawn rate, order size, patience, and the earnings target. The target is
  *derived* from what a day can physically produce rather than hand-drawn, so the
  difficulty does not flatten once upgrades start landing; `share` is the dial
- `waveCfg()` / `WAVE` / `LIVES` — the endless ramp. Steeper than the campaign on
  purpose: seats cap how many customers fit in the café at once, so spawn rate alone
  never kills you — the wall is patience shrinking below the time an order takes to cook
- `BURN` / `CLEAN` / `DAYLEN` — how long finished food survives, how long a spoiled slot
  stays blocked, shift length
- the `*_COST` arrays — the upgrade economy

**`cafe.html`**

- `RECIPES` — name, price, ingredient cost, appeal weight, station sequence
- `REGULARS` — the three recurring customers, their one order, three story beats each,
  the line they say when you are not serving what they came for, and their payoff
- `UPGRADES`, `RENT`, `LAST_DAY` — the economy
- `customerCount()` — shift length

Both save to `localStorage`; each has a restart control on screen.

The rush build's layout mirrors the commercial reference: orders pinned to the top, prep
pinned to the bottom, and an empty band between them. That band is the counter — the slot
the café and character art occupies if this design survives playtesting. See
`../docs/art-plan.md` for what filling it actually costs.
