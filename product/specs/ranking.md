# C2 — How levels work

**The one thing to get right:** these are **two separate numbers doing two separate jobs.** Merging them breaks both.

| Number | Job | Moves | Resets | Visible as |
|---|---|---|---|---|
| **Level** | Makes the game fair — drives matchmaking and team balancing | Slowly | Never | A tier, 1–7 |
| **Reliability** | Decides who gets the good games | On attendance | Never | A percentage |

If Reliability affects Level, a flaky good player gets mismatched into games that are too easy. If Level is used to gate access, people stop playing to protect it. Keep them apart.

**No divisions, no league table, no season reset.** Level progression is the only ladder. One number to understand, one bar to fill.

---

## 1. Level — the skill rating

### What it is
A hidden number, shown only as a tier. It exists to answer one question: *who should this person play with?*

### Tiers

| Tier | Who |
|---|---|
| 1 | New to organised football |
| 2 | Casual, still finding it |
| 3 | Regular social player |
| 4 | Good social player |
| 5 | Strong — played at a decent standard |
| 6 | Semi-pro or academy background |
| 7 | Pro or ex-pro |

Games are posted as a **band** — "Level 3–4", "Level 4–5" — never a single tier.

Each tier is **100 rating points wide**, on a scale starting around 1000:

| Tier | Rating |
|---|---|
| 1 | below 1000 |
| 2 | 1000–1099 |
| 3 | 1100–1199 |
| 4 | 1200–1299 |
| 5 | 1300–1399 |
| 6 | 1400–1499 |
| 7 | 1500+ |

### How it moves

Standard Elo, applied to sides rather than individuals.

```
Team rating   = mean of the checked-in players' ratings on that side
Expected      E = 1 / (1 + 10^((R_opponent − R_own) / 400))
Actual        S = 1 win · 0.5 draw · 0 loss
Base change   Δ = K × (S − E)
```

Beating a side you were expected to beat moves you barely at all. Beating one you were expected to lose to moves you properly. That is the whole point of the formula and it is worth explaining to players in those words if they ask.

**K by experience — converge fast, then settle:**

| Games played | K | Why |
|---|---|---|
| 1–5 | 60 | Placement. Find the right tier quickly. |
| 6–20 | 32 | Still settling. |
| 21+ | 16 | Stable. A bad night shouldn't move you. |

**Cap:** total movement per game is capped so no single result can swing a tier.

### Three layers, in order of weight

Nothing here requires a player to do anything. The rating is automatic; the other two layers only make it converge faster.

**Layer 1 — the result. Always on, no input required.**
Everyone on the winning side gains, weighted by how unexpected the win was. This alone is correct *in the long run*: because sides are reshuffled every week, being carried by a strong team and being let down by a weak one cancel out over roughly thirty games. It is simply slow, and in the short run it will occasionally be unfair to someone who played brilliantly in a losing side.

**Layer 2 — the host read. Secret, three taps.**
The person running the game is the only calibrated observer on the pitch. At half time or full time they tap anyone who **played above their level tonight** and anyone who **looked off**. Most games that is two to four taps. Skipping is allowed and nothing breaks.

This is what shortens convergence. One expert observation is worth several games of noisy results — which is why it matters most during placement, where it can take a new player from five games to about two.

**Layer 3 — teammate votes.** Man-of-the-match and thumbs (G5), at a deliberately smaller weight than the host read. Peer voting has a popularity bias — people vote for friends, for the loudest player, and often don't vote at all — so it is a useful cross-check on the host, not a primary signal.

| Layer | Weight on Δ | Needs input from | Fails safe? |
|---|---|---|---|
| Result | 100% baseline | Nobody | n/a |
| Host read | up to ±40% (higher during placement) | The host, 3 taps | Yes — skip is normal |
| Teammate votes | up to ±15% | Players | Yes — no votes, no adjustment |

### Making the host read trustworthy

A secret input with no accountability is an integrity risk — a host could quietly suppress a rival. Three mitigations, all automatic:

**Calibration.** Each host carries a weight derived from their track record. A host who flags eight of fourteen players every week is not discriminating, and their weight falls. A host whose flags correlate with where players eventually settle gains weight. New hosts start at low weight and earn it.

**Blindness in both directions.** The host never sees the effect of their input. The player never sees they were flagged. Neither can see the other's contribution. This kills lobbying, arguing on the touchline, and reciprocal flagging between hosts who play in each other's games.

**Audit, not punishment.** A host whose reads diverge systematically from outcomes is flagged for human review, the same way sandbagging is. Nothing is auto-reversed and nobody is accused by an algorithm.

**The scaling caveat, stated plainly.** The platform thesis is that most games are eventually host-run (HOST > 50%), and a community host is a player too — biased, distracted, and mid-game. That is exactly why the host read is a *modifier with earned weight*, not an authority. If host reads turn out to be noise at scale, the calibration weights collapse toward zero on their own and the system degrades gracefully back to Layer 1. **Design it so that host input being worthless is survivable.**

### Worked example

You are on 1284 — Level 4, 84% of the way to Level 5. Thirty games played, so K=16.

Thursday's sides are balanced at check-in. Yours averages 1250, theirs averages 1290. You are slight underdogs.

```
E = 1 / (1 + 10^((1290 − 1250) / 400))
  = 1 / (1 + 10^0.1)
  = 0.44          ← we expect you to take 0.44 from this game
```

**You win.** S = 1.

```
Δ = 16 × (1 − 0.44) = +8.9
```

Two teammates voted you up, so +15%: **+10.3**. You go to **1294** and the bar moves 84% → 94%. Two more nights like that and you are Level 5.

**Had you lost:** Δ = 16 × (0 − 0.44) = **−7.1**. Down to 1277, bar back to 77%. A bad night costs you less than a good night earns, because you were the underdog.

Now the same win against different opposition:

| Their side averages | Expected | You win | Why |
|---|---:|---:|---|
| 1400 — much stronger | 0.30 | **+11.3** | You did something the model didn't expect |
| 1290 — evenly matched | 0.44 | **+8.9** | Mild surprise |
| 1100 — much weaker | 0.70 | **+4.7** | You did what was expected of you |

**A tier takes roughly 30–40 games to cross** at K=16 — six months to a year at three or four games a month. That is deliberate. A level you can win in a month isn't worth having, and a tier that moves quickly breaks matchmaking for everyone else in it.

### Placement, for a new player

They sign up and self-assess as "I play regularly" → seeded at 1150, Level 3, K=60.

| Game | Result | Δ | Rating |
|---|---|---:|---|
| 1 | Wins against a stronger side, man of the match | +52 | 1202 → **Level 4** |
| 2 | Wins again | +36 | 1238 |
| 3 | Loses to an even side | −30 | 1208 |
| 4 | Wins | +28 | 1236 |
| 5 | Draws | −2 | 1234 |

Five games in they are settled around 1234 and K drops to 32. The swings are large on purpose — a badly-placed player should not spend a month in the wrong games. After twenty games K drops to 16 and the number stops jumping.

### What does *not* feed Level

| Excluded | Why |
|---|---|
| Goals and assists | Rewards forwards, punishes defenders and keepers. A back four would be permanently underrated. |
| Attendance | That is Reliability's job. |

### Placement
Self-assessment at signup seeds a starting rating. The first five games run at K=60.

**The host read carries extra weight during placement** — this is where one trained eye beats several games of noisy results. With a host read on game one, a badly-placed player is usually in the right tier by their **second** game rather than their fifth. Without one, the old five-game path still works.

A host can also flag *"this person is nowhere near this level"*, which raises K for their next two games. It never sets the rating directly.

### Keepers
A keeper cannot be rated on the scoreline; conceding four in a game their side lost 4–5 says nothing. **Keepers are rated almost entirely on the host read**, with the result component weighted right down and teammate votes as a secondary check. The host is standing on the touchline watching the saves — this is the case the host read exists for. Ties to the keeper programme (L6).

### Decay
Away for eight weeks or more: widen the uncertainty band, **do not drop the rating.** You do not get worse by not playing — we just become less sure, so the next few games carry a higher K again.

### Anti-gaming
- **Sandbagging** — peer votes persistently far above the rating, or dominating a lower band. Flags for human review.
- **Boosting** — only ever playing the same weak opposition. Flags for human review.
- Neither auto-punishes. A false accusation costs more than a slow correction.

### Promotions are loud, demotions are silent
Crossing a tier boundary upward is a moment: a notification, the player card updates, the progress bar resets. Crossing downward requires a **sustained** drop plus a buffer, so nobody yo-yos — and it happens **without a notification.** Being told you have got worse at football is a churn event, not a feature.

---

## 2. Reliability — the access ladder

Specified in E1–E4. Not part of ranking, and must never touch Level. It gates entry to oversubscribed games and earns priority booking and a free game every tenth attendance.

Late cancellations that do not resell count against it (see the cancellation policy). Cancellations more than 24h out do not.

---

## The player-facing mechanism

A number that moves for reasons a player can't see is the thing that makes a rating system feel arbitrary. **Comprehension and hiding the machinery are not the same goal** — the fix is not to expose the maths, it is to make cause and effect legible in plain words. Designed in `design/Level.dc.html`.

### The one sentence

> *Your level goes up when you do better than we expected — and when the people you played with say you played well.*

Every player should be able to repeat that after one reading. Everything below is detail.

### The three rules, as a player reads them

**1. Beating better teams counts more.** We work out who should win before kick-off. Win when you weren't supposed to and you move up faster. Beat a side you were meant to beat and you'll barely move.

**2. Your teammates and the person running the game both have a say.** They vote after the game; the host gives us a quiet read. It's the only way we can see the keeper who kept you in it, or the player whose side won despite them.

*We tell players the host read exists, and never show its content — the same deal as teammate voting. A system caught concealing an input loses the trust the whole number depends on, and hosts talk.*

**3. Goals don't count.** If they did, every defender and keeper would be stuck at the bottom forever. How often you play doesn't count either — that's reliability, which is a separate thing.

### The three promises

These exist to pre-empt the three complaints every rating system gets. They are guarantees, not tendencies, and they all hold under the maths above.

- **Winning never moves you down.** With S = 1, Δ is always positive.
- **Not playing never moves you down.** Absence widens uncertainty; it does not reduce the rating.
- **Your first five games move you a lot,** so we find your level fast rather than leaving you in the wrong games for a month.

One more that is true and worth saying if asked: *losing always costs something, but playing well costs you less* — peer votes shrink a negative delta, they never flip it.

### The progress bar is the teacher

It is the only place the mechanism becomes visible, so it must move **after every single game**, including small moves and downward ones. A bar that only moves on good nights teaches nothing and, worse, looks like it is hiding something.

After each game the player sees:

| Element | Example |
|---|---|
| The expectation they were under | "You were the underdogs" |
| The result | "You won 6–5" |
| The bar, animating from its old position | 84% → 94% |
| Each reason, in words | "Won as underdogs — that counts for more" · "Two teammates voted you up" |
| What's left | "3 more nights like that and you're Level 5" |

Reasons are shown as **words, not numbers**. The delta is a detail; the cause is the lesson.

### The number, on tap — a revision

The earlier version of this spec said the rating must never be shown. That was wrong. A hidden number is *more* likely to feel unfair than a visible one, because players correctly infer that something is being withheld.

**Corrected rule:** the tier and the bar are the default surface. The raw rating and the band it sits in are available on one tap, inside "How your level works" — not on the profile, not on the team sheet, not in any list where it could become a thing people compare. Anyone curious enough to tap is owed a straight answer.

### What is never shown

The K factor, the expected-score calculation, the per-game delta arithmetic, and any other player's rating.

### "Silent demotion" means quiet, not hidden

Crossing a tier downward fires no notification and no banner. It does **not** mean the bar lies. The bar shows the real position at all times, and a player who watches it will see the tier change. A system caught concealing a number loses the trust the number depends on.

---

## Acceptance criteria

- [ ] Level and Reliability are stored and calculated independently; no input feeds both.
- [ ] A player's Level after a game is reproducible from the inputs — same players, same result, same votes, same answer.
- [ ] Placement: a deliberately mis-seeded test player reaches the correct tier within five games.
- [ ] No single game can move a player across a tier boundary.
- [ ] Team assignment reads Level and only Level. Reliability must not influence it.
- [ ] A keeper's Level is stable across a run of heavy defeats where the host read is positive.
- [ ] A game with no host read and no votes still produces a correct Layer 1 rating change.
- [ ] Host read is invisible to players, and its effect is invisible to the host.
- [ ] A host who flags more than half the squad has their weight reduced automatically.
- [ ] Setting every host weight to zero degrades the system to Layer 1 without errors or gaps.
- [ ] A host cannot flag themselves.
- [ ] Eight weeks of absence widens uncertainty and raises K, and does not lower the rating.
- [ ] Tier promotion fires a notification; demotion does not.
- [ ] Demotion requires a sustained drop past a buffer, and a test that oscillates a player around a boundary never demotes them twice in a season.
- [ ] The rating number appears only in the "How your level works" view — never on a profile, team sheet, leaderboard or any list.
- [ ] No player can see another player's rating or tier progress.
- [ ] The progress bar moves after every rated game, including downward, and matches the stored rating exactly.
- [ ] Every rated game produces at least one plain-language reason; a game that produces none is a bug.
- [ ] The "how many more games" estimate is derived from current form, and is phrased as an estimate.

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| R1 | How many games before placement is trustworthy? Brief Q6 — validate against real data, not assumption. | R2 entry |
| R2 | Are seven tiers right, or does Dubai's spread need fewer? Check against the first 200 rated players. | R2 entry |
| R3 | Does the host read at ±40% under- or over-correct for keepers? | R2 exit |
| R5 | Do community hosts produce usable reads, or only staff? If community reads are noise, the calibration should show it within ~20 games each. | R3 entry |
| R4 | Is one ladder enough to carry G11 ("nothing is at stake"), or does something else need to? Watch FREQ after levels ship. | R3 entry |
