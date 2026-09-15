# Getting from grey-box to that screenshot

## First, split the reference

The Cooking-Madness-style screenshot is two different problems wearing one coat.

**Mechanics — roughly 10% of what you are looking at, and now built:**

| In the screenshot | Status |
|---|---|
| Order tickets across the top with timers | Built — seats with patience bars |
| Ingredient trays with **+** buttons and visible stocks | Built — bins, tap **+** to cook into stock |
| Assembled dishes on plates | Built — plate assembles from ingredient stock |
| Bottom row of prep actions | Built — the bin grid |
| Upgrade economy between levels | Built — speed, slots, bin size, seats, chairs |

**Presentation — roughly 90%, and none of it built:** two painted characters with idle
and reaction animations, a painted café interior, a sprite for every ingredient and every
assembled dish, equipment art, a full UI kit (buttons, panels, ribbons, popups, coin and
star iconography), particle effects, and sound.

So "I need it like this" is mostly an art-production question, not a design question.

## The mechanic that was genuinely missing

The reference has a layer the prototype did not: **ingredients and dishes are separate.**
Machines produce ingredients on background timers into stocks; dishes are assembled from
those stocks. Assembly is instant, cooking is not.

That is the whole game, and it is why those screenshots always show trays of pre-made
components. The skill is not tapping fast — it is having a stock of steamed milk *before*
the latte order arrives. Pastry takes four seconds; starting it when the order lands is
already too late.

The prototype now works this way: six ingredients, six dishes, ingredients unlocking as
the dishes that need them appear. Day one runs on three bins, day five on all six.

## What art actually costs

Rough freelance ranges for mobile casual 2D. Treat as order-of-magnitude and get real
quotes before planning around them.

| Item | Rough range (USD) |
|---|---|
| Character illustration + simple animation set | 300–900 each |
| Ingredient / dish sprite | 25–80 each |
| Background scene | 250–800 |
| Full UI kit | 1,000–3,000 |
| SFX set and music loop | 300–1,500, or 50–200 for a library licence |

A vertical slice at that quality — one room, two characters, ~12 item sprites, a complete
UI — lands somewhere around **USD 4,000–12,000**. A full game of the reference's scope is
plausibly **USD 25,000–80,000+**.

The UI kit is the line people forget. It is invisible until you try to make one, and it is
often the largest single cost.

## The economics problem, stated plainly

Work the arithmetic backwards. At AED 30 with the 30% store cut, you net about AED 21 a
sale. An art budget of AED 40,000 (≈ USD 11,000, a *slice*) needs roughly **1,900 sales to
pay for the art alone** — before your time, before marketing, before the engine.

Cooking Madness and Cooking Fever can afford that art because they are free-to-play and a
small fraction of players spend heavily. Their art budget is amortised over millions of
installs and funded by exactly the mechanics your target player rejected.

This is the real conflict in the project, and it is a business-model conflict, not a taste
one. You have three honest options:

1. **Match the art to premium economics.** Pick a style one person can execute
   consistently and cheaply. Kairosoft — the game recommended in the very thread you are
   designing for — sells premium pixel-art management sims, repeatedly, to this audience.
   A consistent cheap style beats an inconsistent expensive one, every time.
2. **Keep the art ambition and change the model.** Free with a single generous unlock. No
   energy, no gems, no ads. You would still need the art budget up front.
3. **Stage it.** Ship a smaller premium game in an achievable style, use the revenue and
   the proof to fund the next one's art. This is how most solo developers who make it
   actually get there.

I would take route 1 or 3. Route 2 asks you to fund a five-figure art budget before you
know whether anyone wants the game.

## Sequence: art is last, and it is not refundable

Every hour of art is spent against a design that might still change. Commission nothing
until the loop is proven — if the assembly layer turns out not to be fun, painted
ingredient sprites become worthless, and you cannot get the money back.

Order of operations:

1. Playtest the grey-box. Answer whether the loop holds.
2. **Juice pass** — see below. Costs nothing but code, closes a surprising amount of the
   perceived gap.
3. Lock the design. Only now write the art brief, because only now do you know how many
   sprites and which states.
4. Commission one ingredient, one dish, one character and one button as a paid style test
   from two or three artists before committing to any of them.

## The juice pass, which is free

Before any art, most of the difference between "prototype" and "game" is feel, and it is
all code:

- **Squash and stretch** on every tap — a button that deforms reads as physical
- **Tweened motion** — items should *travel* from bin to plate, not teleport
- **Particles** — steam off a fresh shot, a coin burst on payment
- **Sound** — 20–30 short SFX plus one loop. The single highest return per unit of effort
  in this entire list, and library sound is cheap
- **Haptics** — a light tap on collect, a heavier one on serve
- **Anticipation and reward** — a customer leaning in as patience drops, a stamp on the
  day's takings

Do this before you spend a dirham. If the game does not feel good in grey-box with juice,
art will not save it — and if it does feel good, you will brief the artist far better.

## What I can and cannot do

I can build all the mechanics, the UI structure, the animation and feel, the juice pass,
and the tuning. I cannot produce painted character art or a hand-drawn UI kit — that needs
an illustrator, and pretending otherwise would waste your money.

What I can do next, if you want it: the juice pass on the current prototype, and a written
art brief you can send to freelancers — sprite list, required states, dimensions, style
references, and the questions to ask before hiring.
