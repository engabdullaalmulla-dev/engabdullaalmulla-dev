# 7. Modes, free tier and premium

## Two modes, one app

### Authentic Tournament

The verified competition rules, start to finish. No retries, no revives, no lives
and no way to alter a result that has happened. When your nations are out, you can
keep watching the tournament or start a new campaign — and the app says which of
those you are doing.

A defeat is a defeat. That is the entire product promise, and everything sold in
the app is arranged so that nothing can be bought that touches it.

### Arcade Tournament

The same competitions and the same simulation, with **three retries**.

**A retry is one clearly-identified checkpoint restore plus a fresh simulation.**
Specifically:

1. Restore the whole campaign to the snapshot taken when the current round began.
2. Increment a retry salt, giving every fixture in that round a **new seed**.
3. Play the round again.

It is not a re-roll of the same match and it is not a guaranteed win. The app
says so in the button's own copy: *"a fresh attempt, not a guaranteed win."*
Because the restore is a whole-campaign snapshot, tournament state is consistent
by construction — no duplicated nations, no orphaned bracket slots, no
half-updated table. The test suite checks exactly this after a retry: 48 unique
nations, the round's fixtures reset, round count unchanged, seeds changed.

**A normal group-stage defeat never consumes a life.** A retry is offered only
when every nation you follow has actually been eliminated, and only if you have
one left, and only if you choose it.

Arcade runs are labelled `arcade` in the result screens, the campaign history and
the trophy cabinet, permanently.

## Free and premium

| | **Free** | **Premium** |
|---|---|---|
| Competitions | All of them, complete | All of them, complete |
| Authentic mode | Full | Full |
| Arcade retries per campaign | 3 | 10 |
| Rewarded ad for an extra arcade retry | Available, capped at 2 per campaign | **Not needed and not shown** |
| Interstitial ads | Between rounds only, max 1 per 3 minutes | None, permanently |
| Marble trails, arena themes, trophy-room customisation | — | Included |

A free player gets a complete tournament experience: every competition, every
arena, the full authentic campaign, the trophy. Premium removes interruption and
adds decoration. It does not unlock content and it does not buy results.

### Ad rules

Ads appear **only at a round break**. Never during live marble action, never
during a decisive replay, never over a trophy celebration, never inside a shoot-
out. Frequency cap: one interstitial per three minutes, and at most one per
round. The prototype implements this rule literally — `canShowAd()` is the gate
and the ad sheet only ever renders from a round-complete transition.

Premium players **never see a rewarded-ad prompt for something premium already
includes.** Their larger retry allowance is simply there.

### Proposed starting allowances for testing

| Lever | Start at | Watch for |
|---|---|---|
| Free arcade retries | 3 per campaign | Do free players finish a campaign, or abandon at the round of 32? |
| Premium arcade retries | 10 per campaign | Is 10 effectively unlimited? If so it can come down. |
| Rewarded-ad retries (free) | 2 per campaign, on top of the 3 | Is this read as generous or as pressure? |
| Interstitial cap | 1 per 3 minutes | Session length against ad load |
| Premium price | One-time, mid-tier for the market | Conversion from the ad break vs from the collection screen |

## iOS product model

**One non-consumable** — *Marble Ultimate Football Premium*. Permanent, restorable, tied to
the Apple ID, not depleted by use. Apple distinguishes non-consumables from
products consumed through use, and the permanent upgrade must be the former.

Any future consumable (a retry pack, say) would be a **separate product** with
its own identifier. It is not in version 1 and is not required for version 1 to
work.

Explicitly **not** in the first version:
- subscriptions,
- loot boxes, paid random rewards or gacha of any kind,
- multiple currencies, soft currency, or any conversion between them,
- betting, wagering, cash prizes or cash-out mechanics of any kind.

Purchase states that must be designed, not left to a default alert:

- purchase succeeded — benefits visibly applied, confirmation names what changed;
- purchase cancelled — silent return, nothing lost;
- purchase failed (network, payment, parental) — a message that says what went
  wrong and what to do, with a retry that does not double-charge;
- **restore purchases** — a first-class, always-visible button, with distinct
  success and "nothing to restore" outcomes;
- pending / deferred (Ask to Buy) — a clear waiting state rather than a failure;
- entitlement verified on launch, with a grace path if verification is offline.

## What is never for sale

- A result that has already happened.
- A retry in authentic mode.
- Any advantage for a nation, in either mode.
