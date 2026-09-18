# Putting Café Life in front of people

The loop has been played by a bot and by two people who built it. Every number in
`docs/cafe-life.md` came from simulation. None of it tells you whether the game is any good,
and no amount of further tuning will.

This is the cheapest it will ever be to find out: there is a link, it opens on a phone, it
needs no install and no account, and a café can be started and abandoned in four minutes.

## What to send

The artifact link, and nothing else. **Do not explain the game first.** Whatever you say in
the message is the tutorial you will not be able to ship, and the first thing worth learning
is what somebody does when nobody has told them anything.

Five to eight people. They do not need to like management games — two who do not are worth
more here than five who do, because a genre player will forgive things a normal person will
not.

Suggested message, in full:

> Here's a café game I've been building. No instructions on purpose — play for ten minutes and
> tell me what you thought. It saves, so you can come back to it.

## What to watch for

You will be tempted to ask "did you like it". That gets you politeness. Ask instead:

1. **Where did you stop?** Not *did you finish* — nobody finishes. The month they put it down
   is the number that matters, and it is the only one that predicts anything.
2. **What were you trying to do?** If they cannot name a goal, the Next card and the Ambitions
   are not doing their job.
3. **Did you widen the board?** This is the game's central tension and it has now been missed
   twice — once by the design, once by my first fix. If a player reaches their second year on
   a two-slot board, it is still broken.
4. **Who did you recognise?** Six regulars have names, usual orders and stories. If nobody can
   name one, the people are decoration and the game is a spreadsheet with a nice room.
5. **What did you think the money was for?** Cash with nothing to want is the failure mode
   this build has had twice, in both directions.
6. **Did anything feel slow?** A watched day is 2.9 seconds and a month can be handed over in
   one tap. If it still drags, it is not the clock — it is that nothing is at stake.

## What not to do with the answers

Do not fix the first thing five people mention. Five people mentioning the same thing on the
same screen is a signal; one person's idea for a feature is not. The useful output of a
playtest is **where they stopped and what they were confused by**, not a feature list.

And do not tune the economy off it. That is what the bot is for; people cannot feel a 4%
margin change, and they will blame the wrong thing when they do notice.

## What this build cannot tell you

It is the web build. Nobody is testing the native shell: app launch, backgrounding,
memory-pressure recovery, how it sits in the hand as an installed app. Those need a TestFlight
build and physical devices, and `docs/11-ios-release.md` in `marble-ultimate-football` lists
the checks that repository requires before a submission.

## The one thing not to add

**No analytics.** Not for a playtest, not temporarily. `games/cafe-life/privacy.html` on
barmajja.com states as verified fact that the app makes no network requests of any kind, and
`tools/check-native.js` enforces it per build. Watching over someone's shoulder and asking the
six questions above is better data anyway — it tells you *why* they stopped, which a funnel
never will.
