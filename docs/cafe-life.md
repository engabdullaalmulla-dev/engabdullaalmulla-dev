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

### One man and one woman, re-dressed

The cast came back wearing far fewer faces than it has characters. Comparing only the
eyes-nose-mouth box, with skin tone and lighting normalised away, p6 and p13 score **0.972**
where two plainly different people score around **−0.35**. p6, p13, p15, p19 and p21 are one
man; p4, p9, p14, p17 and p22 are one woman.

This matters here more than it would almost anywhere else. The game's whole claim is that you
come to know six people across thirty years, and the ageing pass exists so you still recognise
them at the end. None of that survives haddad's face walking in as a taxi driver who orders
once and leaves. **A face may belong to a regular or to strangers, never to both.**

So `WALKIN` now excludes every portrait that collides with a regular, which cost seven faces
and gained two new ones. The worst score left in the pool is 0.743, and that pair is a false
positive: the metric reads brow and nose geometry, so it happily scores a bleached-blond young
man against a grey man with a moustache. It earns a shortlist to look at, never a verdict —
every cut here was confirmed by eye first.

## What is made but never drawn

140 sprites exist. The prototype can reach 58 of them. This is not an art backlog — it is
wiring, and some of it changes how the game reads at the table.

| Family | Made | Never drawn | What that costs |
|---|---|---|---|
| Dishes & ingredients | 32 | 19 → **8** | ~~See invention, below~~ **done** |
| Fittings | 32 | 18 | Half the furniture cannot be bought |
| Rooms | 13 | 9 → **2** | ~~No weather, no era~~ **done** |
| Branches | 6 | ~~**6**~~ **0** | ~~Branches are a text row~~ **done** |
| Machines | 6 | **6** | The whole family is unwired |
| Aged portraits | 21 | 15 | Expected — only six regulars age |
| Portraits | 25 | 7 | The face-collision cuts |

The two rooms still unused are right to be: `room_counter` is a close crop of a counter top
with no room behind it, and `room_back` is a *different room* rather than a state of the main
one, so it needs a screen before it has anywhere to go. The eight remaining dishes are
ingredients — milk, ice, dough, a shot — and the game does not model ingredients.

**Invented recipes draw an emoji.** `invent()` mints `own<n>_<gen>` and never writes
`SPRITE[k]`, so `dishArt` falls through to the recipe's `ic`. Recipe invention is one of the
two uncapped sinks — the thing a player does forever — and it is the one part of the game
that visibly stops being made of art. Eleven finished dish sprites are sitting unused:
kunafa, balaleet, chebab, khameer, basbousa, jallab, roselem, camelcap, sahlab, maamoul,
qahwa. Handing the first eleven inventions a real sprite each is a dictionary and a lookup.

**Branches have no art at all.** Six plates exist — Jumeirah, Satwa, Deira, Karama, the mall,
the airport — and the branch list draws a name and a cash figure. Branches are the other
uncapped sink and the clearest sign that the café outgrew the street. `branch.f` also picks
from five name strings that do not correspond to the six plates, so wiring it means pairing
them up rather than just adding an `<img>`.

**Rooms have seasons and decades that never arrive.** `roomPlate()` returns one of four by
seat count. `room_rain`, `room_summer`, `room_1990s` and `room_2030s` are never chosen, in a
game whose premise is that you watch a room change across thirty years. Night is a CSS wash —
`rgba(12,10,8,.45)` over the day plate — rather than `room_night`, which is a defensible
choice but not an informed one while the real plate has never been compared against it.

The ranking is by what the player loses: invented dishes first (it is the forever loop and it
degrades to emoji), branches second, era and weather plates third, fittings fourth.

## The wall at year 13, and what was behind it

`tools/sim.js` plays the game to the end of a dynasty. It found that `upstairs`, `manager`,
`branch` and `freehold` were **never affordable in any run under any play style** — the whole
late game was content nobody would reach.

**A correction to my own first measurement.** The first version of this note said the café went
bankrupt, 2,865 in the red by year 30. That number was wrong: the bot's build order listed
`stool` once, so it bought one stool and stalled at eight seats. A bot with a plausible build
order ends year 30 at **+1,908** and twenty seats. The café stalled; it did not collapse. The
unreachable late game was real and is what mattered.

### The cause was a lie in the shop, not a number

A barista's card says *"Serves alongside you."* Nothing in the game read `G.staff` except the
wage bill. A barista cost 120 a season, rising with inflation, and did **nothing**. Two of them
plus a manager was a 500-a-season hole, and it landed exactly when a player was trying to save
for the second floor:

| | 2010 (before hiring) | 2015 (after) |
|---|---|---|
| profit | 985 | 938 |
| wages | 150 | 671 |
| **net** | **+341** | **−291** |

Baristas now add to the day's custom, which is what their card always claimed.

### The rest of the retune

- **Rent inflated at 2% against prices at 1.8%.** Nobody chose that; it was a quiet squeeze
  compounding for thirty years. The rates now match.
- **A seat cost 11 a season to keep.** A seat buys trade, so it has to be worth more than it
  costs, and at 11 the ladder to a full room barely paid for itself. Now 9.
- **The trade cap was `seats*3+6`**, which bound from the first season, so the queue formula
  never got to say anything. It is a backstop against runaway trade, not the thing that should
  set the day's custom. Now `seats*5+6`.
- **The four unlocks were priced for an economy that never existed**: 1800 / 1400 / 4200 / 9000
  against a café clearing a few hundred a season. Now 1200 / 1050 / 1900 / 4200.

### Where it lands

Sixteen runs, a bot that plays the board to the season, taps guests, and saves for the next
tier. Every unlock is now reached in **every run**:

| unlock | affordable | target |
|---|---|---|
| upstairs | 2004 | 2003 |
| manager | 2004 | 2005 |
| branch | 2015 | 2010 |
| freehold | 2020 | 2017 |

Growth stays linear rather than exponential — year 30 ends around 6,500, year 60 around 65,000
with six branches. That is a long way from the 751,000-by-year-30 runaway an earlier fix was
written to kill, and it does not overshoot into the stall that fix caused.

**A careless player still fails.** The greedy bot — never matching the board to the season,
never tapping anyone — ends year 30 at −2,225 with reputation at −58 and reaches none of the
late game. Demanding, as asked for.

### Three more items that did nothing

The barista was not alone. `G.mood` and `G.ac` were written by the radio, the plants and the
air conditioning and **read by nothing at all** — 1,140 AED of shop items with no effect, and
`G.margin` was a dead field besides. A room people like is a room they sit in longer, so mood
now feeds dwell. Air conditioning needed summer to be worth escaping first, so summer now cuts
footfall to 72%, or 88% with an awning, and not at all with cooling. The awning's card always
said *"Summer stops being a dead season"*; now there is a dead season for it to stop.

### The fittings, and why only six went in the shop

Sixteen fittings had no shop entry. Six became things you buy, each doing one thing the shop
did not already do — a second item that adds mood is padding, not depth:

| | effect |
|---|---|
| Padded stools | dwell +0.08 |
| A long table ×2 | +2 seats, mood |
| Tables outside | +3 seats, footfall |
| A juicer | cold drinks worth 25% more |
| A dallah | hot drinks worth 6% more |
| Pendant lights | mood +2 |

The other ten are **dressing**: they are not for sale and appear when the café has earned
them — a rug once there are six seats, a sink once somebody else is working the counter, a
planter once there is an awning outside. A café accumulates things nobody decided to buy.
Every fitting is now drawn.

### The real runaway engine, found at last

Adding the invention sink to the bot made sixty years reach **1.19 million**. The cause was in
`invent()`: the base recipe was picked from everything you know, **including previous
inventions**. Each invention is priced at 1.35+ times its base, so a chain of them compounds
geometrically and a café that keeps inventing ends up selling a 400 AED cup of tea.

This is almost certainly the engine behind the original 751,000-by-year-30. The earlier fix
went after rent, wages and trade caps — all linear, and no linear fix can catch a geometric
series. Inventions now take their base from the book only, never from another invention, and
sixty years lands around 100,000 with the invention cost curve absorbing the surplus.

### Where it lands

| unlock | affordable | target |
|---|---|---|
| upstairs | 2006 | 2003 |
| manager | 2004 | 2005 |
| branch | 2011 | 2010 |
| freehold | 2015 | 2017 |

All four in 16/16 runs. A careless player — never matching the board to the season, never
tapping — still ends year 30 at −6,550 with reputation at −62 and reaches none of it.

## The service is a scene now — and two measurements that were worthless

### What changed

A season was up to 164 guests at 620ms each: **102 seconds of watching a list**, and the
better the café did the longer you sat there. Three changes:

- **Nine people, not a hundred and sixty.** Every regular who came, plus enough walk-ins to
  fill the scene. The rest of the day is resolved off screen and counted the same; the close
  screen says how many came and went while you worked. A season is about seven seconds.
- **Three visits a season.** Tapping had no limit and no cost, so the optimal play was to tap
  all 12,892 people across a dynasty. A choice with one dominant option is a chore with a
  heart on it. Three is a decision.
- **The regulars are always in the scene.** At a queue of 133 there was one regular in it,
  which is the exact opposite of a game about coming to know six people.

Also named `MANAGER_CUT`. A season run by the manager returned 72% of the profit and a season
you worked returned all of it — true, and reasonable, but it was a bare `0.72` in one of two
paths that otherwise looked identical.

### Two measurements that were worthless

**The bot never bought a recipe.** Recipes are bought on the shop screen, not out of `ITEMS`,
so every economy number in this document above was measured on a café selling karak, mint and
its own inventions — for thirty years. With the shop actually used, takings go from about
2,000 a season to **over 20,000**, and the entire cost side is priced for the wrong game.
**Year 30 lands at 520,000–780,000: the 751,000 runaway was never fixed, only hidden.**

**And five of the six regulars could never appear.** A regular only comes in when their usual
is on the board, and four usuals — espresso, iced, shake, saffron — are recipes you buy. A bot
that never bought one met Noor and nobody else. Every claim above about stories was made
against a café one person visited.

With recipes bought, all six are met and **all six stories finish by 2001**. Each regular has
five beats, gated on `warmth < (beat+1)*2`, and warmth climbs two or three a season — so
thirty beats of writing are consumed in five years of a game meant to run for thirty, and
after that the arcs recycle with a new face and a cycle number.

### What is actually fixed, and what is not

Fixed, and both were real design faults rather than numbers: a regular served something other
than their usual now comes far less often, so the board is a choice about people instead of a
sort by price; and a regular's season is capped at 30 visits rather than 80, so six faces can
no longer out-earn the hundred and sixty strangers behind them.

**Not fixed: the economy.** The late-game prices were moved again (upstairs 2,600, manager
3,200, branch 9,000, freehold 95,000 — the freehold removes 7% of takings forever and at
18,000 paid for itself in three years) but they are provisional. The cost side needs deriving
against a café that sells real recipes, not nudging. **Do not trust any number in the sections
above this one.**

**Not fixed: story pacing.** Thirty beats will not carry a thirty-year game.


## The economy, derived rather than guessed

Measured against a café that actually buys recipes. Four faults, in the order they mattered:

**Profit exceeded takings.** `dwell` multiplied the margin and not the till, so by 2006 the
café made 25,517 on takings of 17,709 — money that never crossed the counter. Dwell is people
staying longer and buying more, so it belongs on the *number of cups*. It does now, and it
shows up in both figures.

**Staff were optional and nearly free.** The whole payroll was 716 a season against takings of
35,664 — two per cent, where a real café spends about a third — and nothing forced you to hire
anyone, because throughput was capped by seats. Now one person serves 42 customers a season
and everyone past that walks: you, plus each barista, plus the manager. A wage also scales
with the room, because a barista in a thirty-two seat café is not doing the job a barista in a
room with two stools is doing. Baristas go to six.

**Nothing paid for the lights.** Rent, wages and what went in the cup were the only money
leaving, so the café kept 56% of everything it took. Real ones keep five to fifteen. Running
costs — power, water, gas, cleaning, licences, the things that break — are 15% of takings plus
a little per seat, and they are on the close screen by name.

**The freehold paid for itself in three years.** It removes 7% of takings forever; at 18,000
against takings of 20,000 a season that was the best purchase in the game by an order of
magnitude. A building costs 95,000 now, and a branch 34,000.

| unlock | affordable | target |
|---|---|---|
| upstairs | 2004 | 2003 |
| manager | 2004 | 2005 |
| branch | 2009 | 2010 |
| freehold | 2017 | 2017 |

All four in 16/16 runs. Year 30 ends near 130,000 against takings of 34,000 a season — about
four seasons of trade in the bank, where the old runaway was 751,000 against takings of 2,000.
A careless bot still ends year 30 at −2,511, stuck at four seats.

## Thirty beats across thirty years

Each regular has five beats, gated on `warmth < (beat+1)*2`. Warmth climbs about two a season,
so every story finished by 2001 and the arcs then recycled with a new face and a cycle number
— the whole of the writing spent in five years of a thirty-year game.

The gate is `(beat+1)*35` now. A beat lands every eight or nine years, so a story runs the
length of a working life. Measured over twelve runs: all six regulars are met, median first
meeting 2001 as the menu grows wide enough for them to come in, **five of six stories finish
inside thirty years, median 2022** — and one is still going when the generation turns over.

## The growth curve

Measured year by year rather than at five-year checkpoints, the shape was three phases and
only one of them was a game:

| | years | growth | what was happening |
|---|---|---|---|
| crawl | 1996–2000 | ×1.0 | two seats, rent and running costs taking half of everything |
| takeoff | 2001–2005 | ×1.6 to ×2.3 | the seat ladder, bought all at once the moment money appeared |
| **flat** | **2006–2022** | **×1.0** | thirty-two seats, 166 guests, seventeen years of nothing |

The flat stretch was the real problem — more than half the game, and nothing moving. The cause
was that **a branch earned a flat 180 a season** whatever the business had become, so opening
one on takings of 34,000 moved the books by half a per cent. There was simply nothing left to
grow once the room was full.

A branch is the same café on another street, so it now earns a share of what you have learned
to earn — 10% of the season's takings, each one after the first doing a little worse because
you are not standing in it. That makes expansion carry the second half of the game, which is
what an uncapped sink is supposed to do. At 30% it was a new runaway (8.4 million by year 60);
at 10%, with a branch at 48,000, the payback is about three years and year 60 lands near a
million on takings of 60,000.

The crawl was rent: a flat 80 a season for having a door, which a two-stool café taking 245
could not carry. It is 34 now, with more of the charge on the size of the room.

| | years | growth |
|---|---|---|
| climb | 1996–2000 | ×1.5 to ×1.6 |
| takeoff | 2001–2004 | ×1.9 to ×2.7 |
| the long middle | 2005–2022 | ×1.05 average, never flat |

The takeoff is still steep, and that is left alone on purpose: four years where the café
suddenly works is a thing happening, not a fault. The old shape's problem was the seventeen
years of nothing after it.

Unlocks after the change, 16/16 runs: upstairs 2002 (target 2003), manager 2002 (2005),
branch 2008 (2010), freehold 2016 (2017). Stories: all six met, **all six finished inside
thirty years**, median 2021. A careless bot still ends year 30 at −390 on five seats.

## Making it something you want to come back to

Three changes, all to the same problem: the game knew what mattered and never said so.

**The board is a people decision now.** Who a dish brought in was one line of small grey text
at the end of a row, so the screen read as a price list and the optimal play was to sort by
price. The regulars sit at the top of it: face, what this board means for each of them —
*comes in for Karak chai* in green, or *settles for whatever is up* in grey — and how far
through their story they are. Tapping a face puts their usual up, which is the move the
screen exists for.

**There is a next thing.** A season used to end and hand you another one with nothing near
that you wanted; a game you can put down at any point without losing a thread is one you put
down. The café screen and the close screen both carry a `Next` card that picks the closest of
three: a story a chapter from turning, the next seat count that visibly changes the room, and
whatever you are saving for. It names the move — *Put Regag roll on the board and they will
come* — rather than only showing a bar.

**The close screen points forward** instead of stopping at a total.

None of it adds a reward it did not already have. The pull was always the six people; it was
just never on screen at the moment you were making the decision about them.

## Fast, from the first minute

The brief was instant fun and fast progress — no long waits, no long hours. Measured as
*seasons until something happens*, at roughly fifteen seconds a season:

| | before | after |
|---|---|---|
| meet somebody | s1 | s2 |
| **first story beat** | **s13 · 3.3 min** | **s3 · 0.8 min** |
| four seats | s9 | s4 |
| second beat | s25 | s9 |
| the room grows a tier | s23 | s14 |
| third beat | — | s15 |
| the back room | s26 | s20 |
| upstairs | s28 | s22 |
| a first branch | s39 | s28 |
| a story finishes | — | s29 |
| the freehold | s56 · 14 min | s36 · 9 min |

Everything the café can become is now inside the first ten minutes, and something lands every
two to five seasons throughout. The first chapter of somebody's story arrives in under a
minute, where it used to take three and a half — and that chapter is the whole reason to be
here, so it should not be the last thing to show up.

What moved: the story gate is front-loaded (`4 + beat*17` rather than a flat `(beat+1)*35`),
starting cash is 640, the early shop is about a third cheaper, the stool escalator is 0.32
rather than 0.6 — a sixth stool cost four times the first — the room grows a tier at six seats
rather than eight, and a season plays in **5.6 seconds** rather than 102.

**The long game survives it.** Beats keep arriving because finished stories recycle with a new
face: 12.5 beats in the first five years and 15 to 19 in every five-year block after, out to
thirty years. The worry that front-loading would empty the game was wrong, and worth checking
rather than assuming. Cash does pile up late — about 2 million by year 60 against takings of
62,000 a season, with ten branches open — because the sinks thin out once the room is full.
That is a year-40 problem, not a first-session one.

A careless player still fails, harder than before: −4,737 by year 30 on seven seats.
