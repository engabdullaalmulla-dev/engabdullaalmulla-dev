# Screen designs

All 21 screens of Café Rush at 390×844, drawn to `../docs/design-spec.md`.

Its **zone heights and colour tokens are lifted exactly**. The **type scale is close but
not identical** — these mockups run a slightly larger display ramp than the spec's
(HUD 19 against 17, screen titles 32 against 29), which is a deliberate legibility choice
at mockup scale and should be reconciled one way or the other before build. The in-play
11 pt floor from spec §2.4 *is* honoured: nothing the player reads while the clock runs
is smaller.

The food and customers are the baked 3D sprites from `../art/kit3d.html`, exported to
`../art/sprites/` so the mockups show the real art at real size.

## Regenerating

```sh
python3 gen2.py        # imports gen.py; writes all 21 *.dc.html
```

Then assemble the canvas (one artboard per screen, two pages, laid out by `canvas.json`):

```sh
BASE=<claude design skill dir>
ARGS=""; for f in Main Splash Home Briefing Pause Countdown ResultPass ResultFail \
  UnlockCard Shop EndlessIntro EndlessResult Settings Store Recipes PurchaseSuccess \
  PurchaseError Onboarding Language Credits SaveError; do ARGS="$ARGS --artboard $f.dc.html"; done
IMGS=""; for i in ../art/sprites/*.png; do IMGS="$IMGS --image $i"; done
node "$BASE/seed-canvas.mjs" --template "$BASE/payload.template.html" \
  --out cafe-rush-screens.html --title "Café Rush Screens" $ARGS $IMGS --canvas canvas.json
```

`gen.py` holds the tokens and the shared components (HUD, order ticket, café band, plate
strip, bin grid, stat rows) plus the first twelve screens; `gen2.py` holds the remaining
nine and writes every file. Changing a colour or a zone height is a one-line edit in
`gen.py` that propagates to every screen — which is the point of generating them rather
than hand-writing twenty-one files.

The assembled `cafe-rush-screens.html` is git-ignored: it is ~2.9 MB, almost all of it
the canvas editor payload, and it rebuilds from the sources above.
