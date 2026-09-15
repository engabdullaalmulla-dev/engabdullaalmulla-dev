# 0005 — Visual direction: the room is the interface

**Status:** accepted · **Date:** 15 September 2026 · **Supersedes:** the first M0 shell

## What was wrong with the first attempt

The first M0 interface was a stack of dark rounded cards, three stat tiles across the top, and rows of
label-and-figure. It was readable, and it was the wrong game. `MASTER_BUILD_BRIEF.md` §1 names that failure
directly — "do not replace the requested experience with a dashboard" — and the owner rejected it on sight as
a copy of a generic finance app. Nothing was wrong with the numbers underneath; the face on them was
borrowed rather than designed.

## The direction

**You are looking at a room in a city, not at an account.**

1. **The world is full-bleed and on top.** An original isometric pixel-art room fills the upper half of the
   screen: warm plaster walls, sand floor tiles, a rug, a mattress, a desk with a lamp, a plant, and a window
   onto a skyline you cannot afford yet. It is drawn into a 180×160 logical viewport and magnified exactly 4×
   with nearest-neighbour filtering, so the pixels are real pixels, never a smooth shape imitating them. The
   ground tile is the documented 40×20 diamond (2:1).

2. **One number, one sentence, one ambition, one action.** Below the world: the cash you can actually spend,
   a plain sentence about what that means ("After everything you must pay, about 2,000.00 a month is yours to
   aim with"), a brass line that fills as the first-home fund grows, and a single wide commitment —
   *Live this month*. Nothing else competes.

3. **The statement is one tap away, and only one tap away.** Every figure the simulation knows — restricted
   versus spendable cash, the surplus with its assumptions, net worth, dated commitments, the cash journal —
   lives in a Ledger sheet that rises over the world. A player who wants the arithmetic gets all of it. A
   player who does not is never handed a dashboard. The brief requires both; the ordering is the design.

4. **Sheets rise, they do not replace.** Set aside, Spend, the month note and the recap all slide up from the
   bottom with the room still visible above. The world never disappears behind a document.

5. **Months are written as consequences, not invoices.** The preview says "You earn · Salary", "You borrow ·
   Education loan drawn (adds to debt, not income)", "You owe · Essential living costs", and ends with what
   you would be holding afterwards. The recap says "You kept 2,000.00" and what it cost you.

6. **The economy shows up as objects.** The deposit fund is a jar on the desk that visibly fills. An unpaid
   bill is a letter dropped on the floor, not a red badge in a menu. The hour of day shifts month to month so
   no two months look identical.

## Palette

Warm, not corporate: plaster `#e9d3b0`, sand `#e2bd8b`, terracotta `#b8643f`, dusk sky, turquoise water
`#1d6b70`, brass `#e3a94e` for anything you are working toward, and a plum night `#15122a` behind it all.
Type stays high-resolution over the pixel world — UI text is never baked into the art.

## What is still placeholder

The room is code-drawn programmer art: correct in geometry, palette and mood, and not a substitute for an
artist. It exists to prove the direction and to make M1/M2 judgeable. Commissioned or hand-authored tiles,
the character's animation set, housing tiers above the rented room, and the city view itself are still to
come. Judge the direction here; do not judge the final art from it.
