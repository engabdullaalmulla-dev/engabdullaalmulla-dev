# 1. Concept and core experience

## The pitch

Forty-eight glass marbles, each carrying its nation's flag and its three-letter
code, and a tournament that is genuinely the tournament — real pots, real draw
restrictions, real tiebreakers, real bracket. You pick who you are following.
Then you watch.

The appeal is not skill. It is **investment**: you chose Saudi Arabia, Saudi
Arabia is one point off qualifying, and there are ninety seconds left in a match
you cannot influence. That is the whole game. Everything in this design exists to
make that ninety seconds mean something and to make the outcome trustworthy.

Two things have to be true at once, and they pull against each other:

- The **format** must be real. A player who knows that the 2026 World Cup has
  twelve groups of four and eight qualifying third-placed teams will notice
  immediately if it does not, and will stop believing any of it.
- The **results** must be genuinely new. Nothing is replayed from the record
  books; every scoreline is produced by marbles in an arena, right now.

## Naming

"Marble Nations" is descriptive and works, but it reads as a category rather than
a product. Shortlist, in order of preference:

| Name | Why | Risk |
|---|---|---|
| **Glassball** | One word, owns "glass marble" and "football" at once, says sport without saying soccer, easy to say in any market, likely clearable | Slightly abstract on a cold store listing — needs a strong subtitle |
| **Roll of Nations** | Plays on "roll of honour", feels like a trophy | Longer; weaker as an icon word |
| **Marble Nations** | Immediately legible, good search behaviour | Generic; hard to own |
| **Orbit Cup** | Short, ownable | Says nothing about football |

**Recommendation:** ship as **Glassball**, subtitle *Marble Nations Football*.
The subtitle does the search work; the name does the brand work. Keep "Marble
Nations" as the working title until a trademark search on Glassball is done in
the target markets.

## Core loop

```
Choose competition and edition
   ↓
Choose the nations you follow  (one, or up to six)
   ↓
Watch the draw                 (pots, restrictions, your nation's group)
   ↓
Watch a match                  (45–55 seconds, or fast-forward, or skip)
   ↓
See the consequence            ("Still in contention." / "Eliminated on aggregate.")
   ↓
Advance                        (standings, bracket, next fixture)
   ↓
Win, or go out                 → start another journey
```

The loop is deliberately short at the bottom and long at the top: a single match
is under a minute, a World Cup campaign is seven matches for your nation and 104
in the tournament around it.

Each match opens with an arena card naming which of the twenty-five challenges
you are about to watch, and the arena itself is interactive: tap a marble to follow it,
drag and pinch the camera, tap to cheer, tap a goal in the ticker to see it
again. None of that can change the score, which is the point.

### Following several nations

Following more than one nation means you see more of their matches and their
fixtures are surfaced first. It does not create a second competition, does not
seed anybody differently, and does not change a single simulation. Every other
eligible nation still enters and still plays every fixture; matches you are not
watching are simulated by exactly the same code, at the same moment, with the
same seeds they would have had anyway.

When all of your nations are out, the app says so plainly and offers three
things: keep watching, adopt a nation that is still in, or start again. It never
pretends your run is still alive.

## Entry at the correct stage

A nation enters where its competition says it enters. Japan is in the 2026 World
Cup finals; Nepal is not, and choosing Nepal in a finals-only competition is not
offered at all — Nepal appears in Asian Qualification, entering at the first
round, and the setup screen says so before you start. There is no silent
insertion of an ineligible nation into a finals field, and no unlabelled
"custom" scenario dressed up as the real thing.

## Acceptance test

The design is working when a player can say all four of these after one run:

1. I know why my nation went through or went out — I can point at the match.
2. The draw felt like a draw: I was waiting to see who we got.
3. The scoreline came from what I watched, not from a number generator.
4. I want to start another one right now.

Everything in the rest of these documents is downstream of those four sentences.
