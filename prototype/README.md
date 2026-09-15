# Prototypes

Two grey-box prototypes of the same café, testing two different games. Neither has art
or audio. See `../docs/rush-pivot.md` for why there are two.

- **`frenzy.html` — Café Rush.** Real-time. Machines cook on background timers, three to
  five seats fill at once, food spoils if you leave it, customers walk out if you are
  slow. Ninety-second shifts against an earnings target, upgrades in between. This is the
  cooking-frenzy loop.
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

- `ITEMS` — price, cook time, and the day each unlocks
- `dayCfg()` — spawn rate, order size, patience, and the earnings target. The target is
  *derived* from what a day can physically produce rather than hand-drawn, so the
  difficulty does not flatten once upgrades start landing; `share` is the dial
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
