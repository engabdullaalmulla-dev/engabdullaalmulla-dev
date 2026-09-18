# Build 8: decisions with a next chapter

This content change adds 29 scenes and 58 English/Arabic choices. The complete catalogue now has 85 authored scenes and 188 choices: 38 character scenes and 47 neighbourhood events. Alternative branches are included in those totals; one café cannot experience every alternative.

## The first year remembers its beginnings

Each founding regular now has two different follow-up situations, selected by the player's first chapter decision. Choosing the wrong prerequisite cannot open the other situation, including through a direct engine `CHOOSE` action.

| Game day | Regular | Earlier choice | Follow-up |
| --- | --- | --- | --- |
| 70 | Mariam | Breakfast or picnic | A successful reunion must make room for a newcomer. |
| 70 | Mariam | Tasting | Four friends disagree about who should receive credit for the saffron recipe. |
| 104 | Noor | Sign | A second client wants an exact copy of her first design. |
| 104 | Noor | Gallery | The first buyer brings a drawing of his own and asks whether it belongs. |
| 142 | Hassan | Map | A neighbour finds her mother's stall missing from the remembered street. |
| 142 | Hassan | Coffee | A former workmate remembers a different harbour coffee. |
| 180 | Salma | Flowers on tables or gifts | An early gift returns as a packet of seeds. |
| 180 | Salma | Rose drink | A guest remembers a different family version of the drink. |
| 218 | Omar | Listen | His first listener returns with a tune and needs advice that preserves her voice. |
| 218 | Omar | Coffee | The tribute drink has become better known than its composer. |
| 260 | Um Saeed | Learn beside her | The player catches themself giving the same vague instructions they once needed explained. |
| 260 | Um Saeed | Compare breakfasts | A new generation asks for another vote; the family can choose a more useful conversation. |

These are different future situations, not different descriptions attached to one universally available scene. Each produces its own permanent family-book memory and people, recipe, or street identity contribution. The two approaches within each new scene have equal cash and reputation rewards, and neither requires spending or takes away an ability.

Two optional friendship scenes use the engine's persistent satisfaction score, with a threshold of 6:

- `noor-familiar-corner`, from day 90 after `noor-1`: Noor trusts the café enough to bring a nervous classmate.
- `hassan-remembered-cup`, from day 120 after `hassan-1`: Hassan brings a friend who misses his old neighbourhood.

The threshold can be reached through recommended manual service or delegated service. These are optional scenes; ordinary trade, the main stories, and advancing the day remain available without them. Preferences and relationship progress do not decay.

## A real direction for the second year

`first-year-together` is available on game day 365. It offers a complete anniversary moment within the free first year, then records a direction for the next year. This file contains no entitlement check; purchase enforcement belongs outside narrative content.

| Day | Kitchen direction | Neighbourhood direction |
| --- | --- | --- |
| 365 | Invite people to teach what they know. | Begin a guide made by the street's people. |
| 390 | Combine measured and sensory instructions, or exchange teaching methods. | Bring the neighbourhood to a table, or make a short route with places to pause. |
| 510 | A reader corrects the guide, or the teaching exchange returns with a recipe and questions. | A new shopkeeper challenges a guide focused on the past, or a discovered courtyard asks to preserve its character. |
| 700 | A former beginner prepares to teach the next cook. | People who followed the guide help shape its next edition. |

The day 390 and 510 scenes use exact `requiresChoices` gates. The day 700 scene follows the anniversary direction and requires that direction's first project scene. A player may read outstanding scenes later; the game does not require every event to be cleared before continuing.

This is eight branch-specific second-year scenes in the catalogue and three on one chosen path. Six additional shared scenes form a sequential chain alongside that project:

| Day | Scene | Continuity |
| --- | --- | --- |
| 420 | Another counter, a familiar idea | After the anniversary, another café asks what is useful to share. |
| 465 | Someone else's regular | The other café sends a guest with habits and comparisons of her own. |
| 555 | The recipe with no name at the top | Filing that guest's notes reveals a recipe of uncertain authorship. |
| 605 | Two tables, the same request | The recipe's many accounts encourage the player to ask what two groups mean by “special.” |
| 650 | What made this a good day? | The groups' thank-you notes prompt the team to record a measure of success beyond money. |
| 680 | The book needs more than your voice | Reviewing those pages reveals whose voices have been missing from the café's account. |

The paid-year content added here therefore contains fourteen authored scenes, with nine available along a chosen project path. Each has two approaches and a permanent outcome. The shared chain is open to either anniversary direction. Its prose remembers completed scenes while allowing either earlier answer; it does not pretend those answers change a later branch when they only change a keepsake and identity.

## Scope and checks

- Existing IDs, 20 base recipes, six founding regulars, four original chapters per regular, and previous save choices are preserved.
- No duplicate recipe grants are presented as new discoveries. The added recipe-related outcomes are annotated pages, comparisons, or teaching memories, not extra playable dishes.
- Notes, signs, maps, photographs, and books in the prose are permanent memories. They are not claims of new movable furniture, a controllable walking route, a teaching minigame, or an independently managed business.
- Character scenes appear in the character's `arcs` catalogue and use that character's portrait and memory grouping. Neighbourhood event prerequisites are remapped by the engine to the current generation's event decisions.
- Every new scene and choice ID is unique. Every dependency and accepted choice ID resolves to actual content.
- All 58 added choices were applied through the real engine after naturally advancing and earning the optional bonds. Each produced its expected stored choice and memory, preserved existing recipes/venues/upgrades/staff/knowledge, and survived exact save export/import.
- The engine's persistent regression checks cover the twelve alternative regular scenes, all four day-510 project branches, day-700 direction, second-generation decision isolation, and both friendship scenes.
- The complete content catalogue contains 1,045 English/Arabic text pairs. The whole-app localization gate passed after this change; its total also includes interface and daily-brief text owned elsewhere.

This is a bounded narrative expansion, not evidence of one real week of retention or a finished premium campaign. The new paid-year scenes are nine reading-and-choice moments per path. The value of an AED 19.99 unlock still needs to come from the surrounding daily decisions, customer relationships, café creation, progression, and testing with people outside the team. Narrative alternatives alone cannot establish that value.
