# 2. How a football fixture becomes a marble contest

This is the design problem the whole product stands on. If the marble action and
the scoreline are not the same thing, nothing else matters.

## The rule that governs everything

> **A goal is recorded at the instant a marble's centre crosses its target goal
> line between the posts. The final score is the number of times that happened.**

There is no scoreline generator in this codebase. `src/sim/match.js` increments
`score[i]` in exactly one place, inside the physics loop, when `checkGoal()`
returns true. Grep the repository for anything that produces a football score
another way and you will not find one, because there isn't one.

## The arena, in one paragraph

Portrait pitch, 100 × 170 units, seen from directly overhead like a broadcast
tactical camera. **No gravity.** Two marbles, one per nation. Team A attacks the
top goal, team B the bottom. Each marble carries a constant *forward drive*
toward the end it is attacking — that is what turns a random walk into a contest
with intent, and it is why the two marbles meet in midfield instead of drifting.
Obstacles, hazards, force fields and moving parts sit between each marble and
the goal it wants. Each goal mouth is guarded by a **keeper**: a bright bar that slides
across the mouth on a fixed cycle.

Why overhead and gravity-free: gravity has a direction, and a portrait pitch has
two ends, so any gravity arena inherently favours one end. Removing gravity is
what makes the fairness argument in [08](08-fairness-and-testing.md) a proof
rather than a hope.

## The events a viewer can read

| On screen | What it means | Effect on the score |
|---|---|---|
| Marble crosses the goal line between the posts | **Goal** | +1, whistle, celebration, restart |
| Marble hits the keeper bar | **Save** | none — the keeper was in position, and you saw it |
| Marble clips a post | **Off the post** | none |
| Marble enters the attacking third and is turned away | **Chance** | none; counted in the match's "clear chances" |
| Marble drops into an open hazard | **Possession lost** | none — it restarts in its own half 1.2s later |
| Marble runs out of energy | **Urgency** | a nudge toward its own target goal, applied identically to both sides |

Two consequences of that table matter a lot:

- **A marble falling into a hazard never eliminates a nation.** It costs that
  attack and nothing else. There is no arena in authentic mode in which one bad
  bounce ends a group campaign.
- **The defending marble physically cannot enter the goal it is defending.** The
  goal mouth carries a wall that only the defender collides with. Own goals are
  impossible, so no result is ever ambiguous about who scored.

## Approach funnels — the change that made it football

The first working build finished almost every match 0-0. A 27-unit mouth at the
far end of a 170-unit pitch is not something a bouncing marble finds by accident.
The fix was to give each end an **approach funnel**: two angled rails running
from the posts out toward the side walls, so a marble that gets into the
attacking third with pace is channelled at goal, where the keeper decides it.

That single change is what turned the arena into a football pitch. It created the
attacking third as a real place, it made the keeper the thing that decides a
chance, and it put the outcome somewhere the viewer is already looking.

## Match structure and clock

| Period | Sim seconds | Shown as |
|---|---|---|
| First half | 19 + 0.6–2.2 stoppage | 1'–45'+ |
| Second half | 19 + 0.9–3.1 stoppage | 45'–90'+ |
| Extra time, two periods | 6.5 each + stoppage | 90'–120' |
| Penalty challenge | until decided | PENS |

Stoppage time is drawn per match from the match seed, so a late winner in the
93rd minute is a real thing that can happen to you.

**Measured watch time: 45–48 seconds mean at 1×, 56s worst case** across all nine
arenas — inside the 45–60 second target, and most matches are nearer 46s. Extra
time and a shoot-out extend a knockout tie, which is the point of them.
Fast-forward (2×, 4×) and skip run the same function more times per frame; they
cannot produce a different result.

## Restart to the conceding side

When a goal goes in, both marbles return to mirrored kick-off spots and the
**side that conceded gets a 16% stronger launch**. This is football's own
balancing device, it applies to whoever is behind, it is stated in the UI, and it
is symmetric by rule. It makes 4-0s rarer and comebacks more common without
anybody's favourite being helped. It is the only dynamic adjustment in the
simulation, and it is visible rather than hidden.

## Draws and deciding procedures

Group matches can and do finish level — measured draw rate is 22–33% depending on
arena, against roughly 24% in real World Cup group stages.

Knockout ties use the **competition's** deciding procedure, read from the
ruleset, not a house rule:

- extra time (two periods, same arena, keepers unchanged),
- then the **penalty challenge**.

Two-legged ties (the AFC first and fifth rounds) aggregate across both legs; the
second leg is simulated carrying the first leg's aggregate, so extra time and
penalties trigger on the aggregate score, not the second leg's own score.

## The penalty challenge

A deliberately different, deliberately simple picture: one marble, one goal, one
sliding keeper, no obstacles. The marble is launched at the goal with a seeded
angle; it goes in, hits the keeper, hits a post, or goes wide. Five each,
alternating, then sudden death — decided only when both sides have taken the same
number. The score card under the pitch fills in green and red as it goes.

It is simple because a shoot-out has to be the most legible thing in the game:
it is the moment a player is most likely to believe they were cheated, so nothing
in it is allowed to be ambiguous.

## Scoreline distribution

Pooled across all nine arenas:

```
1-0  17.6%   2-1  17.2%   1-1  13.6%   2-0  10.8%
3-1   7.7%   0-0   7.0%   2-2   5.7%   3-0   5.4%
```

Mean 1.9–2.9 goals per match depending on arena; real World Cup football runs
around 2.7. The shape is right: 1-0 and 2-1 dominate, 0-0 is uncommon but
possible, and a 7-1 exists somewhere in the tail where it belongs.

Halving the match length did not halve the scoring: the forward drive on each
marble was raised to compensate, which is a knob on the *environment* and applies
to both sides identically.
