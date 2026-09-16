# Café Life — screen designs

Fourteen 390×844 artboards for the management sim in `docs/cafe-life.md`, drawn with the
real art from `art/sprites/` and the palette in `docs/design-spec.md` §2.3.

| # | Artboard | What it is for |
|---|---|---|
| 01 | `FirstRun` | The first screen. A counter, two stools, 420 AED, and the rules stated plainly |
| 02 | `Title` | The wordmark on the evening room |
| 03 | `Main` | The café — the room you built, the season, the board strip, the regulars |
| 04 | `Board` | The one decision: what is on today, with seasonal and "X's usual" marks |
| 05 | `Service` | Guests arriving. Tapped rows ring green, a missed regular greys out |
| 06 | `Moment` | The service pausing to ask you something |
| 07 | `Close` | Takings, the landlord's share, and whose story moved |
| 08 | `ShopBuild` | Fittings and staff, with the machine renders on lit tiles |
| 09 | `ShopRecipes` | Buy a recipe, or write one of your own |
| 10 | `Regulars` | The roster. Unmet people are greyed until you put their usual up |
| 11 | `Story` | One person's arc down the years, future beats dimmed |
| 12 | `Cookbook` | What this family wrote, with the name and year on each |
| 13 | `Branches` | The other cafés, and the cost of a fourth |
| 14 | `Succession` | Handing over |

## Regenerating

```sh
python3 gen.py          # writes the .dc.html artboards and canvas.json
```

`gen.py` holds the tokens and the shared pieces — `dish()`, `guest()`, `beat()`, `shoprow()`,
`tabbar()` — so a change to a component lands on every screen at once. Art is downsampled
into this folder: portraits at 144, dishes at 176, machines at 160, rooms as 720px JPEG,
because the canvas inlines every image and the 512 masters are ten times larger than any
screen shows.

`_prev/` is a throwaway preview build — the same artboards with the `<x-dc>` wrapper stripped
and the local embedded fonts swapped in, so they can be rendered and checked for clipping
before the canvas is seeded. It is gitignored.

## Casting

The twelve portraits are the twelve regulars. p5 is Noor, p6 Mr Haddad, p3 Khalid, p4 Aisha,
p9 Dana, p11 Samir; the rest are the half of the street you have not met yet.

## Superseded

`design/` holds the 21 artboards for the rush game — the HUD, bins, plate and ticket screens.
That game no longer exists. Those boards are kept for reference and are not the design.
