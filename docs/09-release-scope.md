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
- **Road to Glory**: Asian qualification, the inter-confederation play-off and
  the World Cup finals as one continuous 334-match campaign, with the finals
  field built from the qualifiers the campaign actually produced;
- twenty-five genuinely different arenas plus the penalty challenge, each with
  its own mechanic, palette and arena card, and each auto-calibrated to its
  target scoring rate;
- flag marbles for 107 nations, drawn procedurally, identified by FIFA trigramme;
- an interactive live arena — tap to follow a marble, drag and pinch the camera,
  tap to cheer, tap a goal to watch it again — none of which can alter a result;
- elimination and victory states, with plain-language consequences;
- save and resume, verified to finish identically after a reload;
- authentic and arcade modes, with a retry that restores state consistently;
- the full five-round AFC qualification journey, 226 matches, with the eight
  direct places and the one play-off place kept distinct;
- a test harness covering structural symmetry, fairness, termination, draw
  constraints, bracket integrity and determinism.

## Version 1.0 — what ships

**Competitions:** Road to Glory (the full Asian road to the finals), the World
Cup 2026 finals on their own, and Asian qualification on its own — all at ruleset
2026.x with sources upgraded to governing-body regulations.

**Modes:** Authentic and Arcade.

**Arenas:** the twenty-five head-to-head arenas, the penalty challenge, and the
multi-marble **Survival Bowl** for arcade play — many nations in one bowl,
knocked out gradually until one is left. Designed, not yet built.

**Platform:** iPhone, portrait, offline-capable core. No account, no server, no
multiplayer.

**Commerce:** free with ads, one non-consumable premium upgrade.

### Work remaining for 1.0

| Area | Work |
|---|---|
| Rulesets | Re-source both editions to FIFA and AFC regulation documents plus amendments; replace the approximate AFC seeding order with the published ranking; resolve or retain the Annex C flag |
| Arenas | Build Survival Bowl; per-arena audio beds; a playtest pass to cut or rework any arena that reads as a variant of another |
| Flags | Review the stylised central charges (Mexico, Iran, Wales, Sri Lanka, Bhutan, Afghanistan, Serbia, Egypt, Oman, Brunei, Vanuatu) and upgrade the ones that read poorly at marble scale; add the abstract-marble accessibility/rights fallback |
| Platform | Port simulation and tournament layers to Swift against golden-file tests; SpriteKit renderer; SwiftUI screens |
| Commerce | StoreKit integration with all purchase states and restore |
| Accessibility | VoiceOver pass on every screen; colour-blind verification of the follow cues; dynamic type |
| Rights | Complete the review in [10-rights.md](10-rights.md) |
| Live ops | Crash reporting, anonymous funnel analytics. No live service. |

## Version 1.1 — the rest of the qualifying systems

CAF, CONMEBOL, CONCACAF, OFC and UEFA qualification for the 2026 cycle, each as
its own verified edition ruleset with its own tiebreakers, its own round
structure and its own flags — and a Road to Glory for each of them, since the
composition pattern is already built and the play-off tournament already works.

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
