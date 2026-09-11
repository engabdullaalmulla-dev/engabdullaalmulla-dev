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

**The name is Marble Ultimate Football.** 24 characters, inside the App Store's
30-character limit, and it says what the game is on a cold store listing.

Availability was checked against the domain registries over RDAP and against the
App Store's own name index:

| | Status |
|---|---|
| `marbleultimatefootball.com` / `.app` / `.gg` / `.io` | all free |
| `marbleultimate.com` / `.app` / `.gg` / `.io` | all free |
| `ultimatemarblefootball.com`, `marbleultimatefc.com` | free |
| App Store exact name | no collision |

### The two things to know

**The `Marble *` shelf is crowded.** Marble Master, Marble Legend, Marble Woka
Woka, Marble Blast — the App Store's marble names are dominated by bubble
shooters and match-three games. A "Marble" name puts us on that shelf, so the
icon, screenshots and subtitle have to do the work of saying *this is a football
tournament, not a puzzler*. Lead the screenshots with a group table and a
scoreboard, not with a marble.

**"Marble Race Ultimate" already exists** (Serhii Nuzhdov) — the same three words
rearranged. Not a blocker, but expect search bleed in both directions, and it is
the first thing a trademark search should look at.

### Subtitle candidates

The subtitle is where discoverability is won, and it has its own 30-character
limit:

- *Nations. Marbles. Real rules.* (29)
- *Follow your nation to glory* (27)
- *Real tournaments, marble physics* (32 — needs a trim)

### What is still outstanding

Domain and App Store availability is **not** trademark clearance. A proper search
— USPTO, EUIPO and the UAE register — has not been done, and it is the one thing
that can stop the name after money has gone into branding. It belongs with the
competition-naming review in [10-rights.md](10-rights.md), and both should
happen before the App Store record is created, because either can change the
name.

### Names considered and rejected

| Name | Why not |
|---|---|
| **Glassball** | Best pure brand word, but `glassball.com` is taken and only `.app` was free |
| **Glass Nations** | Clean sweep of domains and no collision, but less legible on a cold listing |
| **Marble Glory**, **Orb Nations**, **Roll Glory** | All available; none said "football" clearly enough |

## Road to Glory

The headline mode, and the one the whole engine was built to reach: **start in
the Asian first round and, if you are good enough, finish at the World Cup**.

Five qualifying rounds over two years. The fifth-round winner does not qualify —
it wins the right to play the inter-confederation play-off, and losing that is
the end of the road. Get through, and you walk into a World Cup draw where the
eight Asian nations in the field are the eight *your* qualifying produced, not
the ones who qualified in real life.

334 matches, around thirty of them yours to watch. It is the longest thing in the
game and the only one where the trophy means you came from the very bottom.

## Core loop

```
Choose competition and edition   (Road to Glory / World Cup / Asian Qualification)
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
