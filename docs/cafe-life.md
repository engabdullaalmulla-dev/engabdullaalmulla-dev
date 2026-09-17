# Café Life — the design

**Status** Supersedes the thirty-day campaign in `docs/requirements.md` §4 *and* the
rush-wrapped-in-a-life design that briefly replaced it. `docs/design-spec.md` stands for
colour, type and readability. `docs/target-player.md` is unchanged and is the evidence base.

---

## 1. What changed, and why the research already said so

The game is a **management sim**, not a time-pressure game. You build a café from a counter
and two stools, and the people who keep coming back have lives that happen in it.

I had the emphasis wrong. `docs/target-player.md` line 13 records the genres the reference
player named: *story, cooking, farming, building, tycoon*. The Dash reference was one line
inside that list, and I built three iterations on it. The same document's most-upvoted reply
recommends **Kairosoft** — premium-priced management sims — from someone who owns five of
them, and §"What the top comment adds" already concluded:

> Kairosoft's longevity does not come from content volume. It comes from deep interlocking
> systems that reward optimisation, so the game outlives its own content. That is the cheaper
> route to "lasts a while" for a small team than simply authoring more levels.

That is the brief. Management, not triage.

**The risk, named honestly:** the very first prototype was calm and was rejected as boring.
The difference is not tone. That build was *sequential and flat* — seven days, no growth, no
ownership, nothing to build toward. Nothing you did on day three changed day four. What is
here instead is a compounding economy, a room that visibly fills up, and people whose stories
only move if you pay attention to them. Calm was never the problem; having nothing to decide
was the problem.

---

## 2. The loop

**The season is the unit.** Four a year.

1. **The board.** You own more recipes than you have slots to show. The season moves what
   people want. Each regular has a usual. This is the whole decision, and everything else
   feeds it.
2. **Open.** About twenty seconds, watched, not fought. People come in, order, pay, leave.
   Some are regulars and you know their faces. Occasionally it stops and asks you something.
3. **Close.** Takings, rent, wages. Whose story moved. Then you spend.

**Nothing can be failed.** There is no timer, no walkout meter, no lose state. A bad season
is a thin one.

### The inversion that makes it work

In the rush build, tapping was triage — you tapped to stop someone leaving. Here, **tapping
is attention.** Tap a guest and you go over and say something. It is worth a rounding error
on the till, and it is the only thing that moves a regular's story. The mechanic is
generosity rather than damage control, and it is the reason the loop is pleasant to sit in.

---

## 3. The regulars, which are the forever engine

Six named people, each with a five-beat arc, each with a usual. They are how a café stops
being a spreadsheet.

- **You meet them by what is on the board.** Put espresso up and Mr Haddad starts coming.
  Never buy the date shake and you never meet Aisha.
- **Warmth accrues** from serving them and, much faster, from noticing them.
- **Beats are gated on the café.** Noor needs somewhere quieter than the counter before her
  story can continue; Aisha needs something a child would want at a birthday; Khalid's
  freehold beat needs you to be able to come near the number. A story you cannot yet hold
  sits and waits, and the close screen says so.
- **A finished arc does not empty the chair.** Four seasons later somebody new is sitting in
  it ordering the same thing.

Arcs run over decades, so the café outlives the people in it: Mr Haddad's last beat is his
son coming in to tell you, and Aisha's daughter goes from six years old and two straws to
sixteen and asking whether you are hiring.

---

## 4. What the bot runs actually showed

Driven by a policy bot for 120 seasons — thirty years — reinvesting greedily each season.

| Year | Cash | Served | Missed | Seats | Slots | Recipes | Branches | Story beats |
|---|---|---|---|---|---|---|---|---|
| 1999 | 253 | 11 | 4 | 4 | 2 | 3 | 0 | 1 |
| 2002 | 1,069 | 30 | 11 | 14 | 3 | 3 | 0 | 6 |
| 2005 | 10,925 | 78 | 7 | 27 | 8 | 11 | 2 | 18 |
| 2008 | 37,840 | 85 | 2 | 27 | 8 | 12 | 7 | 16 |
| 2014 | 59,147 | 85 | 2 | 27 | 8 | 12 | 14 | 9 |
| 2020 | 74,595 | 86 | 1 | 27 | 8 | 12 | 19 | 9 |
| 2026 | 96,694 | 85 | 2 | 27 | 8 | 12 | 23 | 17 |

**Years 1–8 are the good game.** Tight, slow, every dirham decided. Seats 4 → 27, missed
customers falling as the board gets wide enough to answer the season.

**Years 9–12 open up** — recipes complete, slots max, branches start.

**Years 13–30 are flat, and this is the honest limit of the current build.** Seats, slots
and recipes are all at their ceiling and never move again. What still moves is branches and
the regulars cycling. Cash grows about 4% a year rather than compounding — the fixes below
did that much — but the *café* is finished around year twelve.

### Three balance bugs the runs caught, and what fixed them

1. **Six customers a season.** A shown face was one cup. A face is now one person's whole
   season of visits — a regular is 22–80 visits, a walk-in one to three — which is what makes
   a café a café.
2. **Cash hit 751,000 by 2026** on flat rent. Rent and wages now scale with seats and
   branches, supply costs inflate slightly faster than prices, trade is capped by seating,
   and the landlord takes 7% of takings until you buy the freehold. That last one is both
   the permanent sink and the reason the freehold is a goal.
3. **Nothing to spend it on after year twelve.** Every axis had a `max`. Branches are now
   uncapped with a cost that compounds at 1.8× and a return that decays at 0.88×, and you can
   invent your own recipes forever at a compounding price. Both are sinks whose cost curve
   outruns their return, so they absorb money without breaking the economy.

**What is still missing to earn the word "forever":** the cast is six arcs on a loop and that
is visible by year fifteen. The shipping answer is a procedural cast — a role, a usual and a
beat set, assembled combinatorially — plus at least one more uncapped system besides branches.
That is real design work and it is not done. The current build is a strong twelve-year game
with an endless tail, and calling it more than that would be a lie.

---

## 5. Building from scratch

**Time of day does not multiply with growth stage, and mostly does not need to.** R-09, R-10
and R-11 are all painted on the *large* café, so as literal plates they only apply once the
player has extended. Tested whether the grade could be lifted off them — per-channel gain and
lift mapping `room_grown` onto each condition — and applied to an earlier stage instead:

| Condition | Gain (R,G,B) | Lift |
|---|---|---|
| night | 0.82 / 0.63 / 0.49 | −38 / −20 / −7 |
| rain | 0.89 / 0.68 / 0.57 | −30 / −16 / −12 |
| summer | 0.99 / 1.02 / 1.10 | −11 / −7 / −8 |

It half-works, and the half that fails is the informative one. Applied to `room_bare` or
`room_small` the grade gives a convincing **dusk** — warmer, dimmer, lamp-lit — which is a
fourth time of day on every growth stage for free. It cannot give night or rain, because the
sunlight through the window and the hard shadows on the floor are painted in, and no colour
transform removes them. A dark window is geometry, not grade.

So: use the grade for evening at any stage, and treat R-09 to R-11 as the large café only.
An early-stage night plate would have to be painted, and probably is not worth one.

**Placement, not more art, is what the room needs next.** With R-04 and twenty-nine fittings
in hand, compositing them exposes two things no additional asset fixes:

1. **Anchor points.** A fitting needs to know where on the plate it stands and at what
   baseline — a pastry case sits *on* the counter, a rug lies *under* a table, a sconce hangs
   on the wall. Dropped at arbitrary coordinates they clip through the counter and float.
   The room plate needs a small table of named slots, and each fitting a slot type.
2. **Ground shadows.** Every sprite carries its own baked contact shadow from a flat grey
   backdrop. In a room with hard directional sun they read as pasted on. A cheap elliptical
   shadow drawn under each placed object, angled to match the plate, closes most of the gap.

Neither is an art problem. Both are the difference between "the assets exist" and "the room
looks built".



Fifteen purchasables, and **every one appears in the room.** The first screen is a counter,
two stools and one machine, captioned as such. The awning, the sign, the pastry case, the
plants, the barista all show up where you put them. That visible accretion is the reward for
spending, and it is why the shop is not a stat screen.

Rooms → back room → upstairs → branches, each with its own street and its own yield.

---

## 6. What this retires

**Dead:** the ninety-second rush as the core loop. `prototype/frenzy.html` stays in the repo
as a reference — the engine is sound and the bug fix from last week is in it — but the game
is not built on it. The hand-lock ageing mechanic goes with it; ageing is now what makes you
hire a manager, not what makes you drop taps.

**Alive:** all 41 art assets — the prototype uses emoji placeholders to stay a single
portable file, and the shipped build swaps in `art/sprites/`. The colour, type and
readability systems. The generational frame: an owner ages, hands over, and the room, the
cookbook and the street's memory carry across.

**Stale, deliberately:** `brand/strategy.md` and `brand/guidelines.pdf`, which carry a
mid-pivot banner. The promise line needs rewriting again — *"Ninety seconds behind the
counter"* is no longer true of a game with no ninety seconds in it. Writing it a third time
before a human has played this loop is the waste.

---

## 7. Open questions

1. **Is watching enjoyable enough?** Twenty seconds of guests arriving, with tapping as
   generosity. Bots cannot answer this. It is the single thing a playtest must settle, and it
   is the same question the first calm prototype failed.
2. **How big must the cast be?** Six is demonstrably too few by year fifteen. Twenty authored
   arcs plus procedural assembly is the guess; it needs testing, not guessing.
3. **The name.** Still worth a trademark check against BitLife before anything locks.
4. **Price.** `docs/target-player.md` flags that AED 29.99 is above what the reference player
   signalled, and that the Kairosoft comparison is the argument for it. A management sim makes
   that comparison much easier to make than a frenzy clone did.

### The cut leaves dirt, and size is the wrong way to find it

The background cut floods in from the edges and stops at anything darker than `THRESH`, so a
dark fleck sitting in open backdrop is never reached and survives as an island. p22 shipped
with eight of them hanging in the air beside her head, and almost every sprite in the set had
a few.

The obvious fix — drop islands under some fraction of the subject's area — is wrong, and a
dry run over the whole set is what showed it: the wisp of steam above the milk jug is 483 px,
the steam off the karak glass is 286 px, and a size rule generous enough to catch a 143 px
fleck erases both. The urn's finial goes the same way.

What separates them is distance, not size. Measured across every sprite, the legitimate
detached pieces — steam, the finial, stray hair wisps — all sit **2 to 27 px** from the main
mass. The flecks sit **46 to 120 px** out. Nothing real was found in between, so `despeckle`
drops an island only when it is both smaller than 0.5% of the subject and more than 40 px
clear of it. Either condition alone is unsafe.
