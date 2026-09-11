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

**Peer adjustment:** teammate votes and man-of-the-match (G5) adjust Δ by up to ±30%. This is not decoration — it is the only signal that catches the keeper who made five saves in a 2–6 defeat, and the player whose side won despite them.

**Cap:** total movement per game is capped so no single result can swing a tier.

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
Self-assessment at signup seeds a starting rating. The first five games run at K=60, so a badly-placed player is in roughly the right tier by their third game. A host can flag *"this person is nowhere near this level"*, which raises K for their next two games — it does not set the rating directly.

### Keepers
A keeper cannot be rated on the scoreline; conceding four in a game their side lost 4–5 says nothing. **Keepers are rated almost entirely on peer votes**, with the result component weighted down heavily. Ties to the keeper programme (L6).

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

## What the player actually sees

| Number | Surface | Never shown |
|---|---|---|
| Level | "Level 4" and a progress bar to 5 | The rating number, the K factor, the delta |
| Reliability | A percentage on the profile and team sheet | The individual events behind it |

Per positioning rule 2: **show the conclusion, never the computation.** Exposing the rating number invites arguments about the rating number, and the raw figure is useless to the person it describes.

---

## Acceptance criteria

- [ ] Level and Reliability are stored and calculated independently; no input feeds both.
- [ ] A player's Level after a game is reproducible from the inputs — same players, same result, same votes, same answer.
- [ ] Placement: a deliberately mis-seeded test player reaches the correct tier within five games.
- [ ] No single game can move a player across a tier boundary.
- [ ] Team assignment reads Level and only Level. Reliability must not influence it.
- [ ] A keeper's Level is stable across a run of heavy defeats where peer votes are positive.
- [ ] Eight weeks of absence widens uncertainty and raises K, and does not lower the rating.
- [ ] Tier promotion fires a notification; demotion does not.
- [ ] Demotion requires a sustained drop past a buffer, and a test that oscillates a player around a boundary never demotes them twice in a season.
- [ ] The rating number is not exposed in any API response reaching the client.

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| R1 | How many games before placement is trustworthy? Brief Q6 — validate against real data, not assumption. | R2 entry |
| R2 | Are seven tiers right, or does Dubai's spread need fewer? Check against the first 200 rated players. | R2 entry |
| R3 | Does the peer-vote weighting of ±30% under- or over-correct for keepers? | R2 exit |
| R4 | Is one ladder enough to carry G11 ("nothing is at stake"), or does something else need to? Watch FREQ after levels ship. | R3 entry |
