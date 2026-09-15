# Screen designs

All 21 screens of Café Rush at 390×844, drawn to `../docs/design-spec.md` — its zone
heights, colour tokens and type ramp are lifted exactly, not approximated.

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
