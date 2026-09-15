# Little Street Café — the first slice

## What the prototype encodes

The brief describes the session as: choose today's menu → serve a shift → earn money →
improve the café → advance a customer story. The prototype implements exactly that,
grey-box, no art, seven days long.

One design decision was made on top of the brief, and it is the part worth testing
hardest.

### The menu is the tension, not the throughput

"Regular customers with continuing stories" is the stated differentiator. A story that
only ever pays out when you serve correctly is a reward, not a mechanic — it adds
warmth but it does not make you think.

So in the prototype every regular comes in for exactly one item, and your menu board has
fewer spaces than you have recipes. Layla comes for karak chai. Hisham comes for filter
coffee. Um Faisal comes for date cake. If you drop someone's order to make room for a
higher-margin item, they still walk in — and you have to apologise to them, watch them
leave, and lose standing.

That converts the business decision into a decision about people. It is the one
mechanic that would make this game not-Good-Pizza. Everything else in the design is
competent genre work; this is the part that is yours.

The payoff closes the loop: finish Um Faisal's story and she gives you her recipe, which
is the highest-margin item in the game. Kindness compounds into economics.

### Relaxed and busy are genuinely different, not a difficulty slider

The cited April 2026 review of *Good Pizza, Great Pizza* — "less relaxing than expected
because of confusing orders and the consequences of mistakes" — is one player's account,
but it points at something structural. Cozy presentation over punishing systems reads as
a broken promise.

So the two modes differ in *kind*:

- **Relaxed** shows every step on the ticket, has no timer, and will not let you serve a
  wrong drink. Mistakes cost the seconds to redo them and nothing else.
- **Busy** gives you the item name only — you make it from memory — and people leave if
  you take too long.

Relaxed is not busy-with-the-timer-off. It removes the recall burden as well as the time
pressure. That is the difference between "cozy mode" and cozy.

## What to do with the build

Put it in front of five to eight people who play cozy games. Watch, do not explain.
Afterwards ask the three questions the end screen lists, in that order:

1. **Did choosing the menu feel like a decision?** If they picked the same four items
   every morning without thinking, the business layer is not carrying weight yet.
2. **What happened when a regular was turned away?** If nobody flinched, the regulars
   need to matter more before anything else gets built. This is the go/no-go.
3. **Would you have played an eighth day?** Not "was it fun" — would they have kept
   going. That is the repetition risk, answered honestly.

The instrumentation you want is already visible in the ledger: remakes, walkouts and
regulars turned away are counted and shown at close of day. If testers finish the week
with zero regulars turned away, the menu constraint is too loose — cut a board space.

## Known tuning dials

These are deliberately unbalanced pending playtest, and all live in the data objects at
the top of `prototype/cafe.html`:

| Dial | Current | Effect if wrong |
|---|---|---|
| Menu slots | 4 of 8 recipes | Too many and the regulars-vs-margin tension disappears |
| Rent | 60/day | The floor under every menu decision |
| Base customers | 7 + regard | Sets shift length; long shifts are where repetition shows |
| Upgrade costs | 250–400 | Tuned so a week affords about two — forces a choice |
| Story beats | 3 per regular | Short enough that a 7-day test completes all three arcs |

An automated seven-day playthrough currently finishes with 98 orders served, all three
arcs complete, and 722.50 banked having bought nothing — so a real player has room for
roughly two upgrades across the week.

## First version scope

The brief's scope is right and should not grow: one café, eight recipes, around a dozen
recurring customers, a limited decoration system. Two notes on sequencing.

**Build the decoration system last, and build it small.** It is the most expensive thing
per unit of proven value, and the prototype deliberately omits it. Buying "a small thing
for the room" is a line item and a number, because until testers say the serving loop
holds, an art pipeline is a liability.

**Twelve customers is eleven more than you need to validate.** Three complete arcs, as
in the prototype, tell you whether the story layer works. Write the other nine after a
tester tells you unprompted what happened to Hisham.

## One commercial caution, stated once

The 100 million-plus downloads on *Good Pizza, Great Pizza* is a free-to-play number.
It demonstrates appetite for the genre; it does not demonstrate willingness to pay
up front, and those two are not close to the same market. AED 29.99–39.99 is roughly
USD 8–11, which is at the top of the premium mobile range rather than in the middle.

That is not an argument against the model — the brief's reasoning about owning a
complete experience is sound, and "I do not mind paying" is a real sentiment in that
community. It is an argument for testing the price separately from the design, and for
making sure the free opening chapter ends at a moment someone actually wants to pay
past: the end of a regular's first story beat is a stronger wall than an arbitrary day
count.

## Suggested sequence

1. **Now — 2 weeks.** Playtest this prototype. Answer the three questions. Re-tune the
   dials between sessions; each change is a number, not a rewrite.
2. **Then.** Pick the engine (see `engine-decision.md`). The decision is easier once
   you know whether the game is menu-decision-led or serving-led.
3. **6–8 weeks.** Vertical slice: one room with real art, eight recipes, three complete
   regulars, and the smallest decoration system that reads as personalisation.
4. **Then.** Marketing test on the transformation shot — "this empty room became my
   favourite little café" — before building the remaining nine customers.
