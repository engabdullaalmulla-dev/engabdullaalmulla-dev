# C2 / G1–G3 — Level, division and reliability

**The one thing to get right:** these are **three separate numbers doing three separate jobs.** Merging any two of them breaks both.

| Number | Job | Moves | Resets | Visible as |
|---|---|---|---|---|
| **Level** | Makes the game fair — drives matchmaking and team balancing | Slowly | Never | A tier, 1–7 |
| **Division** | Makes next Thursday matter | Weekly | Every 8-week season | Table position |
| **Reliability** | Decides who gets the good games | On attendance | Never | A percentage |

If Level doubles as a ladder, people stop playing to protect it. If Division is driven by wins, it becomes a coin flip — because *we balance the teams*. If Reliability affects Level, a flaky good player gets mismatched. Keep them apart.

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

Games are posted as a **band** — "Level 3–4", "Level 4–5" — never a single tier. A band of roughly 100 rating points per tier.

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

### What does *not* feed Level

| Excluded | Why |
|---|---|
| Goals and assists | Rewards forwards, punishes defenders and keepers. A back four would be permanently underrated. |
| Attendance | That is Reliability's job. |
| Division standing | That is form, not skill. |

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

## 2. Division — the season ladder

### What it is
An 8-week competition, eight to ten players per division, seeded by Level so the competition means something. Public. Resets every season.

### The critical design constraint

**We balance the teams (D2). So a table driven by wins is a lottery.** Over eight weeks, a player's win record mostly reflects which side the algorithm put them on. Ranking on that would be both unfair and unsatisfying.

So points come from a mix of result, participation and peer standing:

| Event | Points |
|---|---|
| Played | +1 |
| Win | +2 |
| Draw | +1 |
| Man of the match | +2 |
| Voted up by teammates, above threshold | +1 |

Turning up reliably and playing well climbs the table even when your randomly-assigned side keeps losing. That is fair given balanced teams, and it drives exactly the behaviours worth having.

### Promotion and relegation
Top two up, bottom two down, as drawn in `design/Season.dc.html`. A player can sit in a division above or below what their Level alone would suggest — Division is this season's form, not their ceiling.

### What resets
Division standing resets each season. **Level does not.** Reliability does not.

---

## 3. Reliability — the access ladder

Specified in E1–E4. Not part of ranking, and must never touch Level. It gates entry to oversubscribed games and earns priority booking and a free game every tenth attendance.

Late cancellations that do not resell count against it (see the cancellation policy). Cancellations more than 24h out do not.

---

## What the player actually sees

| Number | Surface | Never shown |
|---|---|---|
| Level | "Level 4" and a progress bar to 5 | The rating number, the K factor, the delta |
| Division | Table position and points | The seeding maths |
| Reliability | A percentage on the profile and team sheet | The individual events behind it |

Per positioning rule 2: **show the conclusion, never the computation.** Exposing the rating number invites arguments about the rating number, and the raw figure is useless to the person it describes.

---

## Acceptance criteria

- [ ] Level, Division and Reliability are stored and calculated independently; no input feeds more than one.
- [ ] A player's Level after a game is reproducible from the inputs — same players, same result, same votes, same answer.
- [ ] Placement: a deliberately mis-seeded test player reaches the correct tier within five games.
- [ ] No single game can move a player across a tier boundary.
- [ ] Team assignment reads Level and only Level. Division and Reliability must not influence it.
- [ ] A keeper's Level is stable across a run of heavy defeats where peer votes are positive.
- [ ] Eight weeks of absence widens uncertainty and raises K, and does not lower the rating.
- [ ] Tier promotion fires a notification; demotion does not.
- [ ] Demotion requires a sustained drop past a buffer, and a test that oscillates a player around a boundary never demotes them twice in a season.
- [ ] Division points are awarded on the published table above, and a player who attends every game and is voted up regularly finishes mid-table or better despite a losing record.
- [ ] Division resets at season end; Level and Reliability carry over untouched.
- [ ] The rating number is not exposed in any API response reaching the client.

---

## Open questions

| # | Question | Needed by |
|---|---|---|
| R1 | How many games before placement is trustworthy? Brief Q6 — validate against real data, not assumption. | R2 entry |
| R2 | Are seven tiers right, or does Dubai's spread need fewer? Check against the first 200 rated players. | R2 entry |
| R3 | Does the peer-vote weighting of ±30% under- or over-correct for keepers? | R2 exit |
| R4 | Should divisions be seeded strictly by Level, or mixed slightly to keep crews together? Crews (F2) pull against strict seeding. | R3 entry |
