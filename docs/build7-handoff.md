# Café Life — build 7 handoff

Review branch: `codex/cafe-life-daily-rebuild`  
Configured app version: `1.1` · iOS build: `7`

Build 7 extends the daily café game with optional morning purposes, a permanent keepsake collection, more authored neighbourhood stories, and safer ways to keep and move several cafés. The unrestricted routine remains: plan, open, serve or delegate immediately, settle the day, and continue.

## Implemented source changes

- **Optional daily briefs:** each morning offers three deterministic choices drawn from eight kinds: warm, cool, familiar, sharing, variety, regular, room and supplier. Every offered brief can be prepared with the player's existing capabilities. The opening plan fixes the result. Manual service, delegation and skipped days use the same settlement path; a completed brief pays once. Choosing or clearing a brief pays nothing, and no selection is required to continue.
- **Eight permanent stamp kinds:** completing briefs grows the keepsake collection and its remembered counts. Stamps survive new mornings, save round trips and inheritance. They do not expire and do not depend on a real-world clock.
- **More neighbourhood life:** twelve events at game days 60–240 add thirty-six choices. Themes include shared languages, staff creativity, shade, repair, family recipes, quiet welcomes, local identity and return visits. Each new event has three different keepsake/identity outcomes with equal cash and reputation rewards. See [content notes](build7-content-notes.md).
- **Saved cafés:** players can keep snapshots, inspect and export them, return to an earlier snapshot, and begin another café. Opening another save first keeps the active café in the library. Explicit snapshot removal leaves the active game unchanged. Malformed imports and failures while preserving the current café prevent replacement.
- **Save files:** the browser offers file download and file selection alongside copy/paste. The native shell adds a share sheet and document picker. Selected files are validated and shown for review before restoration. Native callbacks use bounded message types and request IDs; temporary cache files are cleaned without deleting the player's original file.
- **Native feedback:** supported iOS and Android haptics use Expo Haptics with silent fallback. Music and sound remain locally synthesised and independently switchable. Appearance changes are sent to the shell as well as applied to the game.

English and Arabic remain complete supported interface/content languages, with RTL, localised dates and numbers, translated native copy, and adjustable text. User-entered names retain the player's text.

## Source, content and compatibility

The authored entry point is `prototype/cafelife.html`. It loads six JavaScript modules: `content.js`, `engine.js`, `audio.js`, `i18n.js`, `persistence.js` and `ui.js`, plus `styles.css`. Build tools embed these into the native HTML string and web output; generated outputs must not be edited manually.

| Authored content | Count |
| --- | ---: |
| Recipes | 20 |
| Founding regulars | 6 |
| Connected founding chapters | 24 |
| Street/business events | 32 |
| Total scenes | 56 |
| Choices across those scenes | 130 |
| Daily brief / collectible stamp kinds | 8 |
| Permanent improvements | 10 |
| Room layouts / suppliers / heirs | 3 each |
| Venues, including the first café | 3 |
| Ambitions | 12 |

Workshop combinations, procedural descendants and recurring event templates are not counted as extra authored scenes. All twenty base recipes are normally reachable by game day 27, so later recipe-themed stories create keepsakes and identity rather than promising exclusive new recipes.

Build 7 retains the version-6 save format and the `cafelife_daily_6` key. Older compatible saves gain unselected brief offers and an empty stamp collection without losing progress or receiving invented rewards. The other local keys are:

- `cafelife_daily_6_backup`: the previous valid automatic save.
- `cafelife_daily_6_before_restore`: the café before a replacement, retained for export.
- `cafelife_daily_6_library`: explicit saved-café snapshots.
- `cafelife_mgmt_2`: the original legacy save, still untouched.

The native package declares Expo SDK 57 at `~57.0.24`, up from `~57.0.23`; this is an SDK-57 patch update, not a major SDK migration. React remains 19.2.3, React Native 0.86.3 and WebView 13.16.1. Added Expo modules cover Document Picker, File System, Sharing and Haptics. App version remains 1.1, with iOS build number advanced to 7.

## Verified source checks

The following commands passed against the current source on 18 September 2026:

```sh
node tools/test-engine.cjs          # 28 checks
node tools/test-persistence.cjs     # 6 checks
node native/tests/saveBridge.cjs    # 13 checks
node tools/check-localization.cjs   # 1,092 bilingual pairs; 186 literal UI keys
```

The engine checks include brief determinism and attainability, optional continuation, frozen opening conditions, manual/delegated reward parity, duplicate-settlement prevention, stamp permanence and older-save migration. Persistence checks cover exact snapshot restoration, invalid replacement, quota failures, corrupt-save recovery and explicit snapshot removal. Bridge checks cover message validation, UTF-8 bounds, inert callback data, exact JSON preservation, cancellation, local picker files and temporary-file cleanup.

All thirty-six new narrative outcomes were separately exercised through the actual engine, checking their stored memory, identity contribution and save export/import round trip. Scene IDs, choice IDs, recipe references and the twelve event dates were checked.

## Browser interaction evidence

Using the actual development UI at a 320 × 844 viewport:

- Selected the variety daily brief, opened and instantly delegated a day; the 40 AED brief reward and earned stamp were correct and persisted.
- Began a second café, then restored the first snapshot with its closed day, 691.84 AED and earned stamp intact.
- Downloaded a `.cafelife.json` file through the browser and parsed the downloaded file through the engine; the café identity, phase and balance matched.
- Chose a synthetic save through the file picker. The active café stayed unchanged during review; only **Check and restore** applied the selected café.
- Switched to Arabic and extra-large text. The header remained legible and the page had no horizontal overflow at 320 pixels. Returned to English and standard text afterward.

These are browser checks, not physical iPhone evidence.

## Remaining build and release evidence

The native/web bundles were regenerated from the same authored source and the source-fingerprint/static offline gate passed. The embedded web output was then exercised through the actual browser UI: optional challenge selection, manual serving, instant team completion, the earned collection, and Arabic extra-large settings. No console errors appeared in that session.

Expo dependency compatibility passed. iOS JavaScript packaging succeeded with 617 modules. This is not a signed IPA. The standalone Chromium release gate was not run during this session; actual browser interaction used the connected browser instead. The complete distribution gate still applies before a TestFlight build. Historical build 6 evidence remains in [its unchanged handoff](rebuild-build6.md).

Actual iPhone operation remains unverified for this build: native file export/import, share-sheet cancellation, haptics, silent-mode behaviour, audio interruption/resume, offline cold launch, process recovery, keyboard entry, VoiceOver, Arabic reading order and all text sizes. A signed archive, TestFlight installation and distribution need their own evidence.

No check establishes a week of real-world engagement. That requires outside-team playtesting with unrestricted progression and evidence of voluntary return at or after 168 hours. The game introduces no calendar gates to manufacture that result.
