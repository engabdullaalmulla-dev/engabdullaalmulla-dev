# 9. Release scope

## What the prototype already does

Everything the brief asked the first playable to demonstrate, and the Asian
qualification journey on top of it:

- one complete World Cup finals campaign, draw to trophy, 104 matches;
- single- and multiple-nation following, up to six;
- a valid constrained draw with host placement, confederation rules and
  bracket-pathway separation;
- group standings with edition-correct tiebreakers and the separating criterion
  named;
- a functioning knockout bracket including the eight best third-placed teams,
  extra time and penalty shoot-outs;
- six genuinely different arenas plus the penalty challenge;
- elimination and victory states, with plain-language consequences;
- save and resume, verified to finish identically after a reload;
- authentic and arcade modes, with a retry that restores state consistently;
- the full five-round AFC qualification journey, 226 matches, with the eight
  direct places and the one play-off place kept distinct;
- a test harness covering fairness, termination, draw constraints, bracket
  integrity and determinism.

## Version 1.0 — what ships

**Competitions:** World Cup 2026 finals, and World Cup 2026 qualification (AFC),
both at ruleset 2026.x with sources upgraded to governing-body regulations.

**Modes:** Authentic and Arcade.

**Arenas:** the six head-to-head arenas, the penalty challenge, and the
multi-marble **Survival Bowl** for arcade play — many nations in one bowl,
knocked out gradually until one is left. Designed, not yet built.

**Platform:** iPhone, portrait, offline-capable core. No account, no server, no
multiplayer.

**Commerce:** free with ads, one non-consumable premium upgrade.

### Work remaining for 1.0

| Area | Work |
|---|---|
| Rulesets | Re-source both editions to FIFA and AFC regulation documents plus amendments; replace the approximate AFC seeding order with the published ranking; resolve or retain the Annex C flag |
| Arenas | Build Survival Bowl; a second variation pass on Grand Arena; audio design |
| Platform | Port simulation and tournament layers to Swift against golden-file tests; SpriteKit renderer; SwiftUI screens |
| Commerce | StoreKit integration with all purchase states and restore |
| Accessibility | VoiceOver pass on every screen; colour-blind verification of the follow cues; dynamic type |
| Rights | Complete the review in [10-rights.md](10-rights.md) |
| Live ops | Crash reporting, anonymous funnel analytics. No live service. |

## Version 1.1 — the rest of the qualifying systems

CAF, CONMEBOL, CONCACAF, OFC and UEFA qualification for the 2026 cycle, each as
its own verified edition ruleset with its own tiebreakers, its own round
structure and its own flags. The inter-confederation play-off tournament, which
finally lets an AFC campaign that reached it play it out.

These are independent modules; they do not share a "qualifying" template, because
they are not the same competition. Until one is verified and complete it does not
appear in the picker.

**A mode is never called "full global qualification" while any pathway in it is
substituted.** If five confederations are done and one is not, the app offers
five confederations.

## Version 1.2 — continental competitions

Asian Cup, European Championship, Africa Cup of Nations, Copa América, CONCACAF
Gold Cup, OFC Nations Cup. Each a specific edition with a verified ruleset.

Continental tournaments differ from each other in group size, third-place rules,
knockout entry and tiebreakers, so each is researched on its own terms.

## Later

- **Other categories.** The competition module interface already carries
  `category: 'Senior men's international'`; women's and youth competitions are
  new modules, not a flag on existing ones.
- **Android**, sharing the simulation and tournament layers.
- **Historical editions** — the same competition at an earlier edition, with that
  edition's rules, newly simulated.
- **Cosmetics** — marble finishes, arena themes, trophy-room customisation.

## Explicitly not planned

Accounts, multiplayer, live services, seasonal passes, energy systems, loot
boxes, currencies, betting, wagering or cash-out of any kind.

## Order of work, and why

1. **World Cup finals** — the shortest path to the acceptance test. If following
   one nation through a finals tournament is not gripping, nothing downstream
   matters.
2. **Asian qualification** — the longest and most emotionally invested journey in
   the brief, and the hardest structural test of the engine: two entry stages,
   two-legged ties, groups of four, six and three, and an outcome that is
   deliberately not qualification. Getting this right proved the rules engine is
   general enough for everything after it.
3. **Everything else**, one verified edition at a time.
