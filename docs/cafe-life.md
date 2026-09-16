# Café Life — the forever pivot

**Status** Supersedes the thirty-day structure in `docs/requirements.md` §4 and the
"five chapters" spine. Everything in `docs/design-spec.md` about the *shift* stands
unchanged. `docs/target-player.md` is unaffected and is the reason this pivot is correct.

---

## 1. The instruction, and what it does not mean

> "You know how BitLife lasts forever, it continues, you can do many things. I want this
> app to be the same. Call it Café Life not Café Rush. I want a long lasting forever game."

**What changes:** the game stops being thirty authored days with an ending. It becomes a
life, and then the next life, in the same café.

**What does not change:** the ninety-second rush. The player rejected the calm prototype in
one sentence — *"this is boring"* — and asked for Cooking Madness by name. "Lasts forever"
modifies the *structure*, not the verb. Removing the rush to make a menu-driven text sim
would answer this instruction by contradicting the last three.

So: **the rush is the verb. The life is the frame.** Ninety seconds behind the counter,
eighty years behind the café.

---

## 2. Why "forever" usually fails, and the one move that fixes it

Endless games die in one of two ways.

**Infinite but identical.** Endless Rush is this. Wave 40 is wave 4 with the numbers turned
up. You have seen everything it has in four minutes. Endless is a *score attack*, and score
attacks are a mode, not a game.

**Infinite but flat.** A treadmill of numbers going up. Prestige, reset, repeat. It lasts
forever the way a corridor lasts forever.

BitLife avoids both with two engines: **breadth** (career × crime × family × health, all
interacting) and **re-randomisation** (you die, and the next person is dealt a different
hand). What it does *not* have is **consequence that outlives the run** — your previous lives
are a list on a menu. Nothing you did in life four is present in life five.

**That absence is our opening.** In Café Life the run ends and the *café does not*.

> You die. Your daughter opens the same shutters the next morning. Your machines are still
> there, worn. Your karak recipe is still on the board. The regular who knew you is older and
> still comes in. The rent you refused to convert to a freehold in 1994 is now someone else's
> problem, and it is hers.

Generation 8 plays a completely different café from generation 1 — but it is *the same café*,
carrying what every generation before left in it. That is the forever engine, and it is a
better one than BitLife's because each run raises the stakes of the next instead of clearing
the board.

---

## 3. Three nested clocks

| Clock | Length | What happens | Who it is for |
|---|---|---|---|
| **The shift** | 90 seconds | The rush, exactly as specified today | The hands |
| **The year** | 3–8 minutes | Work some shifts, then rent, events, decisions | The head |
| **The life** | 30–50 years | You age, marry, raise an heir, hand it over, die | The gut |

A session is any number of years. A year is a complete, satisfying unit — which is what makes
this a game you can put down for a fortnight, which is the thing she asked for.

### The year, concretely

1. **Work the season.** You have *stamina* shifts this year. Play them, or delegate to staff.
   A delegated shift auto-resolves on staff skill and always earns less than playing it well.
   Skipping is allowed and costs money, never progress. Nothing expires.
2. **Books.** Rent or mortgage, wages, ingredient costs, what is left is yours.
3. **Events.** One to three cards. The landlord, the inspector, a chain opening opposite, a
   blogger, Ramadan, your son wanting tuition money, your knees.
4. **Decisions.** Hire, fire, buy a machine, invent a recipe, buy the building, extend,
   marry, have a child, retire.

---

## 4. Ageing, and the best idea in this document

In BitLife your age is a number that gates menu options. In Café Life **your age is in your
hands.**

From your mid-forties, a short recovery lock lands after every tap — you cannot fire the next
input for a moment. It starts at nothing and grows:

The curve was tuned against measured play rather than drawn. Driving the prototype at two
rates — a calm 3.3 taps/s, and an 8 taps/s burst, which is what three seats going red at once
actually looks like — gives this:

| Age | Lock | Taps landed, calm | Taps landed, in a burst |
|---|---|---|---|
| 30 | 0 ms | 30 / 30 | 30 / 30 |
| 45 | 80 ms | 30 / 30 | 30 / 30 |
| 55 | 240 ms | 30 / 30 | **15 / 30** |
| 65 | 400 ms | **15 / 30** | **8 / 30** |
| 75 | 420 ms | 15 / 30 | 8 / 30 |

**This is the shape the mechanic needed.** Ageing costs you nothing while the café is calm,
and costs you half your hands the moment it is busy. You do not notice getting older until
there is a rush on — which is exactly how it works, and it is not something a stat screen can
say. The first pass bit only from 65 and left the years between 42 and 60 identical; twenty
wasted years of a fifty-year life, and worth catching before any of it was written up.

Stamina falls alongside it: five shifts a year at 25, one at 72.

This is worth more than any number on a stat screen, because it makes every meta decision
land at the right emotional moment. You hire staff *because you can feel yourself slowing
down*. You teach your daughter the karak recipe *because you can no longer make sixty a day*.
You retire *because the shift you used to clear now beats you*. The game tells you it is time
by making your own hands unreliable, and that is a thing a text sim cannot do.

**It must never read as a bug.** The locked control dims for its lock and the HUD shows your
age beside the clock, so the player always knows the game did not drop the input — they did.

---

## 5. The systems (the "many things")

| System | What it gives | Persists past death? |
|---|---|---|
| **The menu** | Invent recipes by combining ingredients. Quality rolls against your skill | **Yes — the family cookbook** |
| **The machines** | The existing upgrade tree: speed, slots, bins, seats, chairs | Yes, and they wear |
| **The building** | Rent → long lease → freehold → extend → upstairs → second branch | Yes. The single biggest generational decision |
| **Staff** | Hire, train, they age, quit, steal, or marry into the family | Partly — the good ones stay |
| **The street** | Other shops open and close. Footfall rises and falls. A mall gets built | Yes. It has a life without you |
| **The family** | Marriage, children, who wants the café and who does not | Yes — it *is* the succession |
| **The body** | Stamina and the hand lock | No. That is the point |
| **Reputation** | The street's memory of you and your parents | Yes |

**The cookbook is the collection engine.** A recipe you invent in 1997 is still earning in
2090, under your great-granddaughter, labelled with the year and the name of whoever made it.
It is the single strongest reason to keep playing, and it costs almost nothing to build
because a recipe is a row of ingredients and a price.

### Succession, and the good dark bit

Your heir is not you. Different starting skill, different temperament, and **they might not
want it.** You can lean on them (they take it, and resent you — a permanent trait), let them
go (the café passes to someone else, or is sold), or fail to raise one at all.

If it is sold, **you play the buyer.** The café continues without your family, your cookbook
becomes "the previous family's recipes," and you may keep them on the board or take them off.
Taking them off is free. It is also the only genuinely sad thing in the game.

---

## 6. What this does to the commercial model

It makes it stronger, not weaker. "Buy once, own forever" and "a game that lasts forever" are
the same promise said twice.

Content economics improve too. Thirty authored days is a fixed cost that buys a fixed number
of hours. A systemic life sim is mostly tables and text — BitLife's entire content advantage
is that its content is cheap — and the 41 art assets already made cover it, because the
*shift* is where the art is and the shift is unchanged.

**Candidate promise lines**, to replace "A ninety-second cooking rush you buy once and own
forever":

1. **Ninety seconds behind the counter. Eighty years behind the café.**
2. Run the café. Then your daughter runs it. One price, no ads, forever.
3. A café that outlives you.

Line 1 carries both clocks and is the recommendation.

---

## 7. What this invalidates

**Survives untouched:** the shift loop and its prototype, all 41 art assets, the colour,
type, zone and readability systems in `docs/design-spec.md`, the fonts, the tokens, the icon
(a glass of karak — no text on it).

**Dead:** thirty days in five chapters. The day-target curve as a *campaign* — it survives as
the within-year difficulty function, driven now by street footfall and reputation rather than
by a day number. Endless Rush as the endgame; the life is the endgame, and Endless becomes
what it always was, a score-attack side mode.

**Needs rewriting:** `docs/requirements.md` §4 and everything downstream of "30 days" — the
promise line, the positioning statement, the store description, and roughly forty mentions
across `brand/strategy.md`.

**The rename is cheap in tooling and expensive in copy.** The wordmark, both marketing
graphics, the swatch sheets and the guidelines PDF are all generated by scripts, so they
re-render from a string change. The icon needs nothing. What actually costs is the writing:
the promise, the positioning, the store listing, the rules that mention thirty days.

**Do not rewrite the brand kit yet.** The lesson of this project is that the calm prototype
was only obviously wrong once it was playable. Prove the life loop first, then write the copy
once, against a structure that has survived contact.

---

## 8. Open questions worth deciding early

1. **The name.** "Café Life" signals the genre immediately, which is most of its value. It
   also echoes BitLife closely enough that a trademark check is worth doing *before* the
   wordmark and store listing are locked — renaming after launch costs far more than renaming
   now. Not a legal opinion; a scheduling one.
2. **Does the life ever end?** Recommendation: no hard cap, but a *dynasty* screen that names
   every generation, so "forever" has a visible spine rather than being a number that climbs.
3. **Real-time or turn-based years?** Turn-based. A real-time clock is the four-hour timer
   she uninstalled three games over.
4. **How much can be delegated?** Everything, eventually — and that is the reward for a long
   dynasty, not a paywall. A player who has built a five-branch chain should be able to play
   one shift a year and still run an empire.
