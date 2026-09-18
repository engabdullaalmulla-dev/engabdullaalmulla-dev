# Build 7 content expansion

Added twelve English/Arabic street and business events in `prototype/game/content.js`, leaving all existing IDs and founding-character arcs intact.

| Game day | Event | The player's choice |
| --- | --- | --- |
| 60 | Two ways to say welcome | A page of greetings, an illustrated recipe card, or a neighbourhood phrasebook. |
| 72 | An idea from behind the counter | A team service promise, the team's own tasting card, or a shared order note. |
| 86 | A place in the shade | A welcoming seat, a cool-drink pairing, or a walking map. |
| 102 | The apron with a second chapter | Individual team patches, a recipe-card pattern, or a neighbourhood repair album. |
| 118 | A box with three addresses | Family voices, comparative cooking notes, or a recipe's travelling map. |
| 136 | A little less conversation | A quiet/chat table card, a picture-order card, or an easier-visit guide for nearby shops. |
| 154 | A postcard for this café | Everyday company, a recipe to take home, or the shopkeepers' street drawing. |
| 172 | What should this café be known for? | Belonging, thoughtful recipes, or being a good neighbour. |
| 190 | Why do you do it that way? | Interviews, a two-cook experiment, or lessons from nearby counters. |
| 208 | The book has become too tidy | Funny mistakes, recipe corrections, or candid street photographs. |
| 224 | You still remember the order | New and returning guests together, a two-taste comparison, or a then-and-now street map. |
| 240 | A first page for what comes next | An invitation, a sharing recipe, or the neighbours' next ideas. |

Each event has three authored choices. They produce distinct permanent memories and contribute to the existing people, recipe, or street identity. Within an event, cash and reputation rewards are equal: choosing a café identity does not require guessing which answer pays more. No choice requires a purchase, removes an ability, blocks further play, or introduces a real-time delay.

All twenty existing recipes are normally available by game day 27. These later recipe branches therefore retain the existing idempotent recipe grant and create a named recipe-related memory; they do not claim to unlock an exclusive dish. The described notes, cards, photographs and sketches are keepsakes in the family book, not new furnishings or separately implemented gameplay tools.

## Inventory and verification

- Six founding regulars, twenty-four founding chapters, thirty-two street events: fifty-six authored scenes in total.
- One hundred and thirty authored choices, including thirty-six added here.
- Seven hundred and fifty-five English/Arabic content pairs: each has nonempty English and Arabic, with Arabic script present.
- Checked scene and choice ID uniqueness, existing recipe references, and all twelve event days.
- Applied every new choice through the real game engine and checked its stored memory, identity contribution, and save export/import round trip.
- The whole-app localization gate passed with 1,010 English/Arabic pairs and 151 literal UI keys at the time of this change.

These are game-day opportunities. They do not measure or guarantee seven real days of engagement; that requires player testing.
