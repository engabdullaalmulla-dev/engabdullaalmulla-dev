# 0006 — The district is the screen

**Status:** accepted · **Date:** 15 September 2026 · **Extends:** 0005

## Why this exists

0005 made the room the interface, and the room was still a still life. Nothing
moved, nothing went anywhere, and the game read as numbers with a picture above
them. The owner's words: *"I need to live in a world."*

## The direction

**You stand in Old Quay, and the district goes on around you whether you act or not.**

1. **The world is the whole screen.** The city renders edge to edge at 240×426
   logical pixels, magnified 3× with nearest-neighbour filtering. The interface
   floats over it as two thin bands — what you are holding at the top, where you
   are standing at the bottom — and never covers the middle.

2. **The district is a real place, generated once from a fixed seed.** An
   18×18 tile island on a 32×16 diamond grid: an avenue, a cross street, a
   promenade along the water, blocks of plaster, whitewash, terracotta,
   sea-green and glass-and-steel buildings with rooftop water tanks and air
   conditioning, palms, street lamps, mooring posts, a park, and a tower under
   construction with a crane that swings.

3. **You walk.** Tap a marker and your character routes through the streets to
   it while the camera follows. Home, the office, the promenade, the tower site,
   and Old Quay 101 — the studio you are saving for, with someone else's light
   on in the window.

4. **Nothing waits for you.** Cars run both streets, boats drift past the quay,
   people walk the promenade, gulls cross, the water glitters, the crane turns.
   All of it is decoration on a separate visual layer: deleting every moving
   thing would not change one dirham, and the simulation never reads any of it.

5. **A month is something you watch happen.** Confirming a month commits and
   saves the simulation first, then plays it out: the sun crosses the sky, your
   character walks to work and home again, the windows come on at dusk, and only
   then does the recap appear.

6. **Each month looks different.** The settled hour cycles through morning,
   midday, late afternoon, sunset, dusk, night and dawn, so the same street is a
   different place in month 3 and month 6. One warm-to-cold light curve drives
   the sky, the tint on every surface, the street lamps, the car headlights and
   every lit window at once.

7. **The numbers did not go anywhere.** Where you stand tells you the one figure
   that matters there — the salary that lands at the office, the essentials that
   leave at home, the cash needed at the studio door. Everything else is in the
   Ledger sheet, one tap away.

## Cost and limits

Roughly 900 lines of presentation code and no change to the simulation: the
suite is untouched at 51 tests and 1196 assertions. The world is still
code-drawn programmer art — correct in geometry, palette, depth sorting and
mood, and not a substitute for an artist. Judge the direction from it, not the
final art.

Known rough edges: the district is one hand-placed island rather than the six
districts the brief describes; walking routes use a simple street network, not
pathfinding; the room interior is a separate view rather than a place you can
see into from outside; and there is no travel between districts yet.
