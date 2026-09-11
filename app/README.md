# Kabatin

Pickup football, built around two numbers: how good you are, and whether you
turn up. They never touch.

Product specs live in the strategy repo under `product/specs/` — `ranking.md`
and `balancer.md` are the two this codebase implements, and the numbers in
their worked examples are the test suite here.

## Run it

Node 22.6+ runs TypeScript directly, so **the engine and its tests need no
install at all**:

```bash
npm test                # 57 tests, ~1s, zero dependencies
npm run replay fixtures/games.csv fixtures/appearances.csv
```

`npm install` is only needed for `npm run typecheck`.

## What is here

```
src/engine/     the two pure functions — the whole product's judgement
src/db/         schema.sql
src/import/     replay the R0 paper games through the rating model
fixtures/       made-up CSVs in the shape of the R0 spreadsheet
```

There is no web app yet, on purpose. R0 is a booking page and a WhatsApp
group; this is the part of R1 that is worth having early, because it is the
part that needs to be tested against real games before anyone trusts it.

## The three decisions that are expensive to undo

### 1. Rating events, not rating state

`rating_events` is append-only and keeps **every input** that produced each
movement — both side means, the expectation, K, the margin multiplier, the
modifier, the host weight, and which version of the weights was in force.
`player_ratings` is a cache of the fold over that table.

This exists because `ranking.md` R6 and R7 both say to tune the weights
against the first 500 games. You can only re-tune a model you can re-run over
history. Storing just `players.rating` would make the model permanently
un-retunable — you would have to throw the history away to change your mind.

Bump `WEIGHTS_VERSION` on every change to `weights.ts`.

### 2. The engines are pure

`computeDeltas()` and `pickSides()` touch no database, no clock, no network.
Everything arrives as an argument; everything decided comes back as a return
value.

That is what makes `ranking.md`'s reproducibility criterion testable, what
lets the balancer answer "why am I on this side?" from a stored cost
breakdown, and what makes `npm run replay` possible at all.

### 3. Phone, not email

`players.phone` is the identity. This runs on WhatsApp — email signup is
friction for no benefit, and the number is also the notification channel for
the 18:00 team-sheet drop.

## The engine, briefly

**Rating.** Three inputs and only three: who you played against, where you
already sit, and what happened.

```
E  = ½·E_own + ½·E_side        expectation is computed for YOU, not your team
Δ  = K × (S − E)
Δ  = Δ × M                     margin, host-confirmed scores only
Δ  = Δ + (host + peer) × |Δ|   modifiers ADD to the magnitude
```

The last line is the one that is easy to get wrong. If the modifiers
multiplied the signed delta, a positive host read on a *losing* night would
make the loss bigger. Adding a signed fraction of `|Δ|` means a good read
always pushes upward — and because the modifiers total less than 1, they can
never flip a result's sign. `assertInvariants()` fails at import if a weight
change ever breaks that.

**Balancer.** Up to 22 players it enumerates every legal split and takes the
lowest cost — 1,716 of them for 7-a-side, well under a second for 11-a-side.
The answer is therefore provably optimal, reproducible, and explainable. A
greedy draft buys nothing here and inherits blind spots.

Two things it does that a pure balance optimiser would not:

- **Variety.** A deterministic optimiser hands the same regulars the same
  split every week, which is how a weekly game dies. A small pair-history
  penalty keeps it deterministic *given history* while the sheet still
  changes, because the history changes.
- **Admitting defeat.** Some crowds do not split. Past a 40-point gap it
  returns `unbalanceable: true` and the host is told in words before kick-off.
  A confident green tick on a night it knows is lopsided burns the meter
  permanently.

It also works with **zero ratings in the system** — every mean gap is zero and
it falls through to keepers, crews and variety. That is the launch state, so
it is implemented deliberately and tested, not left to be discovered.

## One place the code departs from the spec

`ranking.md` lists "no single game can move a player across a tier boundary"
as an acceptance criterion. That contradicts its own placement example, where
game one takes a new player from 1150 to 1202 and promotes them — and a cap
that prevented crossing would freeze anyone sitting just below a boundary.

What the criterion is really protecting against is a single bad night
demoting someone, and that is the demotion buffer's job (`shouldDemote()`:
sustained drop past a buffer, no notification). `RATING.maxDeltaPerGame` is
left as a loose safety rail that never binds in normal play. See the comment
on it.

## Not built yet

Web app, auth, payments, WhatsApp delivery, admin. In order, after R0 clears
its three exit criteria — three consecutive sell-outs, a venue deal the
economics survive, and week-1 → week-2 return above a third.
