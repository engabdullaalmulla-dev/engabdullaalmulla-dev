# EMBER

A memory card game for phones. Four cards face down, two of which you saw once.
Keep the smallest pile at the table, and call it before anyone beats you to it.

Play the bots on your own, take a seat at a public table, or open a private one
and send the code to your friends.

<p align="center">
  <img src="assets/icon.png" width="96" alt="">
</p>

Expo (React Native) and TypeScript on the phone, Node and `ws` on the server,
one rules engine shared by both.

## Running it

```bash
npm install
npm start          # scan the QR code with Expo Go
npm run ios        # or a simulator
npm run android
npm run web        # also runs in a browser
```

The app plays against bots with no server at all. For online play, point it at
one and start it:

```bash
cd server && npm install && npm run dev     # http://localhost:8787

# in the app, from ember/
EXPO_PUBLIC_EMBER_SERVER=http://localhost:8787 npm start
```

To hand someone a link rather than an app, pack the whole thing into one file:

```bash
npm run bundle:web    # dist/ember.html — 600 KB, loads nothing from the network
```

That build plays the bots only and says so on its home screen. Point it at a
server to keep online play:

```bash
EXPO_PUBLIC_EMBER_SERVER=https://your-server npm run bundle:web
```

```bash
npm test              # the rules, checked from plain node
npm run typecheck
npm run art           # redraws the icons, the felt, and every sound effect
cd server && npm test # accounts, rooms, and the redaction, end to end
```

## The rules as implemented

Two decks, 108 cards including four jokers. Three to five players in any mix of
people and bots. Everyone is dealt four cards face down and may memorise two of
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

## Playing other people

**Quick match** drops you at whichever public table is filling up. If nobody
else arrives within twenty seconds, bots take the empty seats rather than
leaving you in a queue.

**Private tables** get a six-character code — no B, I, O, S, Z, 0, 1, 2 or 5, so
nobody mistypes it — which you can share straight from the room screen. The host
adds bots, clears them out, and deals.

**Nobody can stall the table.** Every move has a clock; when it runs out the
server plays a sensible move for whoever wandered off, using what that player
had actually been shown. Lose signal and your seat is covered the same way until
you come back to it — the app reconnects on its own, with the seat marked *away*
in the meantime.

## Saying something

There is no chat box and there is not going to be one. Instead there are fifteen
faces and sixteen fixed lines, and that is the whole vocabulary. Tap a seat and
an emoji flies across the table and lands on them; tap a phrase and it appears in
a bubble over your own cards.

The lines come in two halves. *Nicely* is what you send when you mean it —
“Well played”, “لعب صح”. *Not so nicely* is the half people actually use:
“Any day now”, “I'll put the kettle on”, “Nobody is that lucky”, and in Arabic
«متى بتلعب؟»، «نمت ولا شفيك؟»، «بسوّي شاي لين تخلّص». Both halves are jokes,
which is the other reason there is no way to write your own.

What crosses the wire is an id out of a fixed list — never text — so a phrase
sent from an Arabic phone arrives in English on an English one, and a table with
both at it works without either player reading the other's alphabet. It also
means there is nothing to moderate: the list is the list. The server checks the
id, ignores any claim about who is sending it, and holds everyone to five things
in twelve seconds with a breath between them.

Bots at an offline table use the same vocabulary. They react to what just
happened rather than to a timer, a beat late, and each one keeps quiet for a
while after speaking — a clap for a knock that stuck, a clown for one that
missed. Sit on your own turn for fifteen seconds and one of them will ask
whether you fell asleep.

## Ranks, seasons and the board

Finishing a match against **other people** earns season points — first place
pays the same at a two-handed table as at a five, the places between slide
evenly across, and last place costs a little. A table of one person and four
bots is a fine way to spend an evening and earns nothing, which is what stops
the board being farmed.

Points make a rank: **Ash → Spark → Ember → Blaze → Inferno**. Seasons run a
quarter each, so a board is never so old that the people on it stopped playing,
and never so short that it resets before anyone has climbed it.

The rankings screen has two boards — this season, ranked on points, and all
time, ranked on win rate with enough matches behind it to mean something. Your
own row is pinned wherever you are on it.

## Your profile

A **mark** beside your name: one of six shapes in one of six colours, chosen on
the profile screen and shown at the table, in the room and on the board. Anyone
who has not picked one gets a mark derived from who they are, so no seat is ever
a blank circle — the bots included.

A **title** underneath it, taken from how you actually play rather than how
much: burn most of what you touch and you are *The Arsonist*; knock and make it
stick and you have *Cold Hands*.

And ten **badges**, each a count against a target, so a locked one still shows
how close it is.

## Arabic — Emirati, not "Gulf"

The whole app is in Arabic as well as English — the table, the rules, sign-in,
the lobby, the scoring sheet, and every error the server can send. It opens in
whichever language the device is set to, and the toggle on the home screen
overrides that and is remembered.

The dialect is **Emirati**, written the way it is spoken in the UAE rather than
in the pan-Gulf register a translator reaches for. That means وايد for "very",
مب for "not", عيل for "so then", منو for "who", شقد for "how much", ربع for the
friends you would actually call, لين for "until", وية for "with", and هني for
"here". Where a ج turns into a ي in speech it is written the way it sounds —
يديد, الجولة الياية — and where a ك turns into a چ, that too: چاي, چذي.

The words on the buttons follow: knocking is **طق** rather than the dictionary's
اطرق, the tagline is «احفظ. احرق. طق.», and "how to play" is «شلون تلعب». The
rules screen asks «شقد تسوى الأوراق» and the sign-in screen says «سوّ لك واحد»
rather than «أنشئ حسابًا». Nothing in the Arabic is a translation of the English
sentence next to it; both were written for the thing they describe.

Arabic lays the app out right to left, which is a layout change rather than a
mirror image: rows, alignment and the back arrow all turn round, while the
playing cards stay exactly as they are, because a card reads the same in any
language. Numbers are written in Western digits in both languages: they are read
against the cards themselves — a 7 on the table, a score beside a name — and the
cards are printed 7.

The card names are the ones used at a table in the Emirates rather than the ones
in a dictionary: a King is **الشايب**, a Queen is **البنت**, a Jack is
**الولد**, and the suits are بستوني ♠، كبة ♥، ديناري ♦، شيريا ♣. Baloot's own
jargon (سبيت، هاص، ديمن، كلفس) is Najdi rather than Emirati, and game-specific
besides, so it is left alone. The faces of the cards keep the Latin A K Q J,
which is how decks sold here are printed; the rules screen puts the spoken name
under each one so the two connect.

The things players say to each other are Emirati first and translated second:
«مرحبا الساع»، «عفية عليك»، «يزاك الله خير» on the kind side, and «عيل متى
بتلعب؟»، «نمت ولا شو؟»، «بسوّي چاي لين تخلّص»، «ما أحد حظه چذي» on the other.

Two details worth knowing about how it is built:

- **The rules engine no longer writes sentences.** It records what happened —
  who did it, which card, which power — and the phone puts the sentence
  together. That is what makes a feed line translatable at all, and it is why
  the same match can be read in Arabic by one player and English by another at
  the same table.
- **Arabic conjugates for who is speaking and who is spoken about**, so your
  own moves read in the second person («رميتَ 7 بستوني») and everyone else's in
  the third, with the verb agreeing with them — «نورة بدّلت» and «راشد بدّل».
  A player online could be anyone, so an unfamiliar name takes the masculine,
  which is the ordinary fallback.

## The mark

A playing card with the fire knocked out of the middle of it. One shape that
says card game and says fire, and it still reads at 32px — which the flame on
its own did not, because a circle with a taper on top is a drop of water
however you colour it. The flame is a real outline, drawn by hand and smoothed
through a spline: a bowl at the bottom, a waist, a tip that hooks over, and a
second tongue licking up beside it.

In the wordmark the card stands in for the second E, so the logo works with the
letters or without them. The fire inside it is a hole rather than a fill, so
the mark takes its background from whatever it is set on — paper on the home
screen, cream in the app icon — and one white silhouette tinted at the point of
use covers every place it appears.

`npm run marks` redraws it into `src/ui/marks.ts`; `npm run icons` redraws the
app icons from the same outlines in `scripts/shapes.js`. The favicon drops the
card and keeps only the fire, which is the part that survives being 16px.

## How it looks, and why

EMBER is a card table, not a dashboard: baize with a visible weave, a light hung
over the middle of it, cream cards with the pip layouts a real deck uses — a
seven is not a six with one more in the middle — corner indices that read the
right way up from either end, and gold where a good deck has gilding. A card
only carries a point value where the card itself does not already say it: a
nine is worth nine, but a red King is worth nothing and a Joker fifteen.

Cards move. They are dealt out one at a time, fly from the stock into your
hand, are thrown onto the pile face up, cross the table on a blind swap, and
leave in a flash of ember when you burn one. `src/ui/motion` measures where
every pile and slot is, then flies real cards between them; it works from the
redacted view alone, which is why a card going into a rival's pile flies to
their seat rather than to the exact slot — which slot it went into is not
yours to know.

**None of the art is a binary blob.** The felt, the light over it, the lattice
on the back of a card, the app icons and all eight sound effects are drawn and
synthesised by the scripts in `scripts/`. Changing the colour of the baize or
how a burn crackles is a one-line edit and `npm run art`. It also means the
whole game packs into a single HTML file with nothing to fetch.

## How it is put together

```
shared/         the rules, and the wire — imported by both the app and the server
  types.ts        state, actions, cards
  cards.ts        the 108-card deck, values, powers
  rng.ts          seeded shuffling, so a match can be replayed exactly
  engine.ts       reduce(state, action) — every rule lives here
  ai.ts           the bots: what they remember, what they forget, what they do
  autoplay.ts     bot timing, reveal timers, the burn clock
  view.ts         what one player is allowed to see, and who may act
  protocol.ts     every message either side can send
src/
  net/            the API client and the socket
  store/          where the sign-in token is kept
  ui/             screens, components, theme
    motion/         anchors, flying cards, the burst when one burns
    textures.ts     the felt and the card back, generated
server/
  src/            accounts, stats, rooms, the hub, the HTTP and socket surface
  Dockerfile      builds from ember/, because the rules are shared
  fly.toml
tests/          the rules, exercised from node
server/tests/   the server, exercised from node
scripts/        draws the icons and the felt, and synthesises the sounds
```

### Hidden cards

The server holds the game state and never sends it anywhere. Every player is
handed a `TableView` built by `shared/view.ts`, in which a card that seat has not
earned the right to see carries no rank, no suit and no value — not a value
flagged hidden, but nothing at all. The stock and the discard pile below the top
card are not sent either.

The offline table renders through the same function, so there is one path to the
screen and it is the redacted one. A face-down card is not in the view tree at
all: not readable from the DOM on the web, and not announced by a screen reader.

Moves are checked twice: `canAct` decides whether it is your move to make, and
the rules engine decides whether the move is legal. The client holds no rules of
its own, so a modified app cannot do anything but ask.

### Accounts

A name and a password, and nothing else — no email, no address book, no
analytics. That is a deliberate trade: a breach exposes names and scrypt hashes,
and **a forgotten password cannot be reset**. If you want recovery later, an
email column and a mail service are the missing pieces; nothing else has to
change.

Passwords are hashed with scrypt (N=16384, 16 MiB per hash) with a random salt
each and compared in constant time. Signing in does the same work whether or not
the name exists, so the form cannot be used to find out who has an account.
Session tokens are 32 random bytes, stored only as a SHA-256 hash, kept in the
device keychain on a phone. Sign-ups and sign-ins are rate limited per address
and per name.

## Testing

`npm test` at the root runs 131 checks over the deck, every power, knock scoring,
burning, ash-outs, and sixty complete bot-versus-bot matches — asserting that no
card is ever lost or duplicated and that a seed always replays exactly — plus the
expression list, the rank ladder, what a match is worth, seasons, titles, badges
and the marks beside people's names.

`cd server && npm test` runs 112 more: password and session handling, rate
limiting, stats, season points and the board, expression relay and its cooldown,
room and host rules, quick match filling with bots, and a full three-player match
during which **every broadcast** is checked for whether a seat was shown a card
it had no right to.

Both were also played through for real: two browser sessions at a private table,
with the WebSocket frames recorded and audited — across 34 table frames, no card
reached a phone that had no right to it.

## Deploying the server

```bash
# from ember/ — the build context has to include shared/
docker build -f server/Dockerfile -t ember-server .
docker run -p 8787:8787 -v ember-data:/data ember-server
```

On Fly:

```bash
fly launch --no-deploy --copy-config --config server/fly.toml
fly volumes create ember_data --size 1
fly deploy --config server/fly.toml
```

Then build the app against it:

```bash
EXPO_PUBLIC_EMBER_SERVER=https://your-app.fly.dev npx eas build --platform ios
```

Worth knowing before you scale it:

- **Rooms live in the server's memory.** Run exactly one machine. Two would
  split players across tables that cannot see each other. Moving rooms into
  Redis is the change that lifts that.
- **State is a SQLite file.** Put it on a mounted volume (`DATABASE_PATH`) or
  accounts vanish on the next deploy.
- **Terminate TLS in front of it.** Fly does this for you; anywhere else, put it
  behind a proxy that does. Tokens over plain `ws://` are tokens in the open.
- The container runs as root, which is the norm for a Fly VM but not for a
  shared host. Add a `USER node` and make `/data` writable by that user if your
  platform expects it.

Settings worth knowing, all environment variables: `PORT`, `DATABASE_PATH`,
`TURN_SECONDS`, `ROUND_BREAK_SECONDS`, `QUICK_MATCH_WAIT_SECONDS`, `MAX_SEATS`,
`MAX_ROOMS`, `SESSION_DAYS`, `TRUST_PROXY`, `CORS_ORIGINS`.

## Shipping the app

No custom native code, so `npx expo start` and Expo Go cover day-to-day work.
For store builds:

```bash
npx eas build --platform ios
npx eas build --platform android
```

Bundle identifier and package name are `dev.almulla.ember` in `app.json` —
change them before submitting anywhere.
