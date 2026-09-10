# EMBER

A memory card game for phones. Four cards face down, two of which you saw once.
Keep the smallest pile at the table, and call it before anyone beats you to it.

Built with Expo (React Native), TypeScript, and no game engine — the rules are a
pure reducer, the table is plain React Native.

<p align="center">
  <img src="assets/icon.png" width="96" alt="">
</p>

## Running it

```bash
npm install
npm start          # then scan the QR code with Expo Go
npm run ios        # or a simulator
npm run android
npm run web        # also runs in a browser
```

```bash
npm test           # the rules, checked from plain node
npm run typecheck
npm run icons      # redraws every app icon from scripts/generate-icons.js
```

## The rules as implemented

Two decks, 108 cards including four jokers. Three to five players — you plus
two to four bots. Everyone is dealt four cards face down and may memorise two of
them before play begins.

| Card | Points |
| --- | --- |
| K♥ K♦ | 0 |
| A | 1 |
| 2–10 | face value |
| J | 11 |
| Q | 12 |
| K♠ K♣ | 13 |
| Joker | 15 |

**A turn.** Draw the top of the stock, or take the face-up discard. A card taken
from the discard must go into your pile. A card drawn from the stock can either
be swapped in — the card it replaces goes face up on the discard — or thrown
away.

**Powers.** Throwing a card away from the stock lets you use it instead of
keeping it, which is the game's central trade: points now, or information now.

| Thrown | Power | Effect |
| --- | --- | --- |
| 7 · 8 | Peek | Look at one of your own cards |
| 9 · 10 | Spy | Look at one of a rival's cards |
| J · Q | Swap | Trade one of yours for one of theirs, sight unseen |
| K♠ K♣ | Look & Swap | Look at a rival's card, then take it if you want it |
| Joker | Ember | Force a rival to take a card from the stock |

A red King is already worth nothing, so it has no power to spend.

**Burning.** Whenever a card lands face up, anyone may burn a card of the same
rank out of their own pile — it is gone, and nothing replaces it. Get the rank
wrong and you take a penalty card on top of what you already had. Burn your pile
down to nothing and the round ends immediately, scoring you zero.

**Knocking.** At the start of your turn you may knock. Everyone else takes one
last turn, then all cards are turned over. Lowest pile at the table and the
knock costs you nothing; beaten or tied by anyone and it costs your pile plus
ten.

**The match.** Round scores accumulate. Once any player reaches 100 the match
ends and the lowest total wins.

## How it is put together

```
src/game/     the rules — pure data and pure functions, no React
  types.ts      state, actions, cards
  cards.ts      the 108-card deck, values, powers
  rng.ts        seeded shuffling, so a match can be replayed exactly
  engine.ts     reduce(state, action) — every rule lives here
  ai.ts         the bots: what they remember, what they forget, what they do
src/ui/       the table
  useEmber.ts   binds the engine to React, runs bot timing and the burn clock
  screens/      home, rules, table, round summary
  components/   cards, piles, the burn meter, the mark
tests/        the rules, exercised from node
scripts/      draws the app icons
```

The split matters for one reason in particular: the bots decide from a memory of
what they have actually been shown, not from the game state. They forget, and
the weaker ones forget more. A face-down card is not rendered face-up-and-hidden
either — the face is not in the view tree at all until the card is genuinely
turned over.

`npm test` runs 85 checks over the deck, every power, knock scoring, burning,
ash-outs, and sixty complete bot-versus-bot matches — asserting along the way
that no card is ever lost or duplicated and that a seed always replays exactly.

## Shipping it

The project has no custom native code, so `npx expo start` and Expo Go cover
day-to-day development. For store builds:

```bash
npx eas build --platform ios
npx eas build --platform android
```

Bundle identifier and package name are `dev.almulla.ember` in `app.json` —
change them before submitting anywhere.
