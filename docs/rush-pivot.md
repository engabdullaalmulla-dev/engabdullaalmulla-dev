# Why the first prototype was boring, and what the second one changes

## The diagnosis

It was not boring because it was cozy. It was boring because it was **sequential**.

In `cafe.html` one customer stands at the counter. You tap Grinder, then Brew, then
Serve. Each tap resolves instantly. Then the next customer. At no point are two things
asking for you at the same time, so there is no decision about *what to do first* —
only about what to do next, and the ticket already tells you that.

Time pressure does not fix this. The busy mode in that build has a countdown, and it is
still dull, because a stopwatch on a queue is just a queue you have to hurry through.

## What the genre actually runs on

Cooking Fever, Cooking Frenzy, Diner Dash: the engine is **simultaneity**, not speed.
Machines cook on their own timers in the background. You start a croissant now for an
order that has not landed yet. While it bakes you pull two espressos, collect a latte
before it goes cold, and notice seat three is turning red.

The skill being tested is attention management under overlapping deadlines. Speed is
how that skill gets expressed, not the thing itself. Any design where the player's taps
resolve instantly and in sequence will be boring no matter how fast you make the clock.

So the second prototype puts every source of pressure on an independent timer:

| | `cafe.html` | `frenzy.html` |
|---|---|---|
| Customers | one at a time | 3–5 seats filling at once, each with its own patience |
| Cooking | instant on tap | real cook times running in the background |
| Failure | apologise, move on | food spoils if not collected; customers walk out |
| Orders | one item | up to three, fulfilled piecemeal |
| Counter space | unlimited | 4–6 slots, and a full counter blocks collection |
| Loop | 60 s of reading | 90 s of triage |

The counter limit is the piece that is easy to leave out and should not be. Without it,
the optimal strategy is "cook everything constantly", which is not a decision. With it,
starting the wrong thing costs you the slot you needed.

## Difficulty is derived, not hand-drawn

The first pass used a flat target curve (`110 + 85·day`). A bot playing perfectly cleared
day one with 428 against a target of 110, having served every customer who walked in,
spoiling nothing. The day was spawn-limited: there was no pressure to feel.

Targets are now computed from what a day can physically produce — how many customers fit
in 90 seconds at that day's spawn rate, how big their orders are, what the unlocked menu
pays — and then set to a rising share of it, from 50% on day one to 72%. Day one asks for
190, day seven for 1190. The share is the difficulty dial; the ceiling keeps it honest as
upgrades land.

## The commercial problem this pivot creates

Cooking Fever and Cooking Frenzy are free-to-play. Their pacing is tuned around energy
timers, gem currencies and upgrade walls — precisely what the CozyGamers request in your
original brief rejected, and what your premium price was a reaction against.

So the pivot puts a real question on the table: **you cannot copy the frenzy loop's
pacing and keep the premium promise, because that pacing exists to sell gems.** A rush
loop tuned for a paid game has to be satisfying at a fair difficulty rather than
frustrating at a monetisable one.

That game exists and sells: *Cook, Serve, Delicious!* is high-intensity, premium-priced,
no free-to-play economy, and has shipped three instalments. It is a better commercial
reference for what you are now building than Good Pizza, Great Pizza — and a better one
for a paid mobile title than Cooking Fever, whose 100M-download figure is a free-install
number that does not transfer to willingness to pay.

## What survives from the first design

The regulars are not incompatible with the rush. Diner Dash has done exactly this for
twenty years: named customers who tip more, who have preferences, whose stories move
between shifts rather than during them. The story layer belongs in the calm moments — the
intro card, the upgrade screen — not in the ninety seconds where you are triaging.

Keeping both prototypes is deliberate. You now have the same café as a calm game and as a
rush, and the question in front of you is not which one I prefer.

## What to test now

Give a tester the rush build first, then the calm one, and watch for the honest tell:
which one do they pick up again unprompted.

Three specific things to watch in the rush build:

1. **Do they start slow items early?** The moment a player begins baking a croissant
   before anyone has ordered one, the game has taught its core skill. If nobody does this
   by day three, the cook times are not separated enough to be worth planning around.
2. **Does the counter limit ever bite?** If testers never hit a full counter, raise the
   spawn rate or shrink it — that constraint is what makes starting the wrong machine a
   mistake rather than a delay.
3. **Where does it stop being fun — day 2 or day 6?** Frenzy games die of sameness, not
   difficulty. If day six feels like day two with bigger numbers, the answer is a new
   *verb* (an order that needs two machines, a customer who changes their mind), not a
   faster clock.
