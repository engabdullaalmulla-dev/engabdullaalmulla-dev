# Build 9: choose the gathering, keep its mark

This authored content adds three replayable occasions, each with two approaches, and six distinct room souvenirs. The new catalogues contain 63 English/Arabic text pairs. They are consumed by the shared hosting engine and interface; writing the catalogue alone does not establish that the complete flow has passed playtesting.

The existing 85 story scenes and 188 story choices are unchanged. Occasions are a separate, freely chosen activity. They have no calendar prerequisites, fees, custom-recipe requirements or expiring invitations. Ordinary trade remains available.

## The six approaches

Every approach defines three ordered guests, one service intention for each guest, useful menu tags, a suggested room layout, an opening, an outcome, a souvenir and an immediate follow-up invitation. These are six authored approaches containing eighteen guest slots, not eighteen unique service minigames or a promise of eighteen different stories.

| Occasion | Approach | Ordered guests and intentions | Suggested plan | Souvenir | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Mariam’s reunion | Shared breakfast | Mariam: familiar; Um Saeed: sharing; Hassan: discovery | Familiar/shared dishes, welcome table | Reunion photograph | Illustrated tasting |
| Mariam’s reunion | Neighbourhood picnic | Hassan: sharing; Mariam: discovery; Salma: familiar | Quick/shared dishes, lively counter | Picnic hamper | Neighbourhood exhibition |
| Illustrated tasting | Familiar recipes in new company | Um Saeed: familiar; Hassan: sharing; Noor: discovery | Familiar/warm dishes, quiet corner | Illustrated menu | Reunion |
| Illustrated tasting | Introduce house favourites | Noor: discovery; Um Saeed: familiar; Omar: sharing | Special/shared dishes, welcome table | Tasting notes | Neighbourhood exhibition |
| Neighbourhood exhibition | Quiet viewing | Noor: familiar; Salma: discovery; Hassan: sharing | Warm/familiar dishes, quiet corner | Little Street drawing | Illustrated tasting |
| Neighbourhood exhibition | Shared drawing | Omar: discovery; Noor: sharing; Mariam: familiar | Shared/quick dishes, welcome table | Impossible boat sketch | Reunion |

Both approaches to every occasion change the guest sequence, guest intentions and useful dish tags. The reunion and exhibition also suggest different layouts. The stories connect the chosen activity to the object that remains in the room. A follow-up points to another already available occasion; it neither unlocks nor withholds permission to host it.

The tasting’s discovery approach accepts owned catalogue recipes. A custom recipe can participate, but is never required. The copy does not promise that a literal two-dish pairing or a drawing minigame exists: guests receive one selected dish each, while the shared drawing and menu are narrative outcomes.

## Three service intentions

`hostIntentions` contains the shared request and two result lines for each intention. Result lines interpolate the actual served dish through `{dish}` in both languages.

- **Familiar:** the regular’s usual, a remembered favourite or a dish tagged familiar.
- **Discovery:** something beyond that regular’s usual and previously remembered dishes.
- **Sharing:** a dish tagged for sharing.

The engine freezes the relevant recipe matches when service opens. Successful matches use equal relationship rewards; an alternative dish has no cash penalty and never removes the occasion’s souvenir. Fallback lines acknowledge the served dish without claiming that a new discovery or shared-table match happened. Manual and delegated service must use this same resolution.

This is a change of service purpose, with contextual requests and persistent outcomes. It is not a claim of a deep food-preparation simulation. Repeated occasions reuse these three intention types and their response templates. First-session playtests should establish whether players notice and enjoy the variation before more occasions are authored.

## Visible objects and honest migration

The six decoration records use dedicated artwork keys: `host_photo`, `host_picnic`, `host_menu`, `host_recipe`, `host_landscape`, and `host_sketch`. Their preferred display positions are wall, shelf or gathering corner. These positions are recommendations, with no financial or capability bonus. Collected objects remain owned when another is displayed.

Four earlier story decisions already described receiving an equivalent object, so their saved choice records can restore that ownership:

| Existing decision | Represented object |
| --- | --- |
| `mariam-1: breakfast` | Reunion photograph — Mariam explicitly left a copy for the café wall. |
| `noor-2: cups` | Illustrated menu — Noor signed the illustrated café tasting menu. |
| `noor-1: gallery` | Little Street drawing — the player put Noor’s street sketch on the wall. |
| `noor-2: workshop` | Shared boat sketch — Noor hung the participants’ boat beside her work. |

The original picnic story brought an introduction rather than ownership of a hamper, so it does not retroactively grant the new picnic display. An unlocked saffron recipe does not imply ownership of the new tasting-note artwork. The new objects do not rewrite the original story choice, replay its reward or erase another display.

## Catalogue validation

An independent Node check confirmed:

- Exactly three occasions, six globally unique approach IDs, six unique decoration IDs and three service-intention IDs.
- Three different existing guest IDs and the three valid intentions in every approach.
- All layout IDs, recipe tags, host portraits, next-occasion IDs, souvenir references and legacy choice references resolve.
- Both approaches within each occasion have different guest lists and useful menu tags.
- All 63 bilingual pairs are present, nonempty and use matching interpolation placeholders.

The whole-app localization check passed immediately after the catalogue change with 1,482 pairs and 209 literal interface keys. Later interface work can increase those totals. Dedicated souvenir-image packaging, the engine’s save/settlement/migration tests, English/Arabic visual checks and device behaviour are integration gates owned by the surrounding build.

Three occasions are the first playable slice in `product-fun-plan.md`. They do not demonstrate a real week of voluntary interest or complete the later recipe-project, venue and succession work. That requires the planned outside-player opening test and unrestricted 168-hour playtest.
