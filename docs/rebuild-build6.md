# Café Life — build 6 review handoff

Review branch: `codex/cafe-life-daily-rebuild`
App version: `1.1` · iOS build: `6`

This branch replaces the old watched-day experience with a daily café routine: arrive, choose a plan, open, serve or delegate, review the day, and continue to the next morning. It keeps the UAE setting, family history, painted artwork and offline Expo/WebView delivery.

## What is implemented

- **Daily operation:** choose the menu, room arrangement, supplier and team before opening. The opening forecast fixes that day's accounts; changes during service prepare the following day. Four optional guest interactions make service tangible. Delegation settles the same business result immediately, without timers or a reward penalty.
- **Continuous play:** advance one day, delegate a week or 30 game days, or seek the next available story. Invitations and story choices are separate from day completion. Research is an immediate recipe workshop using a base, flavour and temperature.
- **Permanent progression:** recipes, purchased tools, spaces, staff and family knowledge stay owned. Daily take-home is floored at zero. There is no automatic borrowing, repossession, energy system or inheritance cash deduction. Optional purchases spend only an explicitly accepted price.
- **People and legacy:** connected character scenes save the selected outcome and keepsake once. Succession explicitly advances 20 game years and carries possessions and cash forward. Older regulars retire from active stories; subsequent visitors represent their families. The general event templates can return in later generations and are not counted as new authored scenes.
- **Presentation:** a persistent café scene, tap-based room/customer interactions, menu board, recipe workshop, people pages, family book, accounts and settings. The interface supports English and Arabic, changes document direction for RTL, localises dates/numbers and includes bilingual native loading, recovery and installed-app names.
- **Sound:** original music and short effects synthesised locally with Web Audio. Music, effects and supported haptics have separate settings. Playback begins after a gesture; backgrounding stops audio, and the next gesture can recover an interrupted context. Sound scheduling never controls game progress.
- **Brand:** the new icon is in `native/assets/icon.png`; the emblem and English/Arabic wordmark assets are in `art/brand/`.

### Authored content inventory

| Content | Count |
|---|---:|
| Recipes, including four starters | 20 |
| Founding regulars | 6 |
| Connected character scenes | 24 |
| General street/business scenes | 20 |
| Distinct choice outcomes across those 44 scenes | 94 |
| Permanent improvements | 10 |
| Room arrangements / suppliers / heirs | 3 each |
| Venues, including the starting café | 3 |
| Ambitions | 12 |

The recipe workshop adds player creations. Its combinations, generated family visitors and recurring event templates are not extra authored stories. Every authored title, description, choice, result and memory has English and Arabic copy. Player-entered names remain the player's text.

## Source and save contract

`prototype/cafelife.html` is the entry point. Its `game/` directory separates rules (`engine.js`), authored content (`content.js`), UI strings (`i18n.js`), presentation (`ui.js`, `styles.css`) and sound (`audio.js`). Edit these sources; regenerate `native/src/webapp/html.js` through the build tool.

The previous game source remains at `prototype/cafelife-build5-legacy.html`. New play uses the separate `cafelife_daily_6` save slot and a recoverable previous snapshot. The original `cafelife_mgmt_2` save is not overwritten. Migration preserves the original record for export, carries compatible progress into the new schema and retains older possessions in its archive. Restore validates a candidate before replacing the current café; a separate pre-restore archive is accessible through Settings for export and later restoration. Storage failures display a backup/export warning. Large inherited recipe collections and freehold rent exemption remain functional.

The native document embeds its scripts, styles, artwork and branding. Its Content Security Policy blocks runtime network connections. The stable local WebView origin remains `https://app.cafelife.local/`; no request is made to that origin. No accounts, advertisements, purchases or analytics were added. The optional web/PWA build uses local hosting assets for installation and caching.

## Validation commands

Use Python 3 with Pillow for the image bundlers. Run from the repository root:

```sh
node tools/test-engine.cjs
node tools/check-localization.cjs
python3 tools/build-native.py
node tools/check-native.js --static
```

For the full Chromium release gate, after installing the native project dependencies and Chromium:

```sh
npm --prefix native run check:setup
npm --prefix native run check
```

The engine checks cover shared service/delegation accounting, repeat-action safety, permanent ownership, calendars, recipe creation, stories, migration, invalid saves and extended simulated operation. Localization checks cover bilingual pairs, placeholders, literal UI keys and native app names. The native gate rejects stale generated output and unembedded/network resources; its browser stage checks image decoding, offline boot and native-origin save reload, including Arabic/RTL restoration.

`npm --prefix native run build:testflight` regenerates the document and runs the release gate before requesting an iOS build. `python3 tools/build-web.py` regenerates local web/PWA outputs. These commands do not establish that a build has been distributed.

## Verification completed on 18 September 2026

- 21 engine checks passed, including large legacy saves, service/delegation parity and 30 simulated years.
- 842 English/Arabic pairs and 151 literal UI keys passed localization checks.
- Native and web bundles regenerated as `cafe-life-34352cb8d6ba388a`; the static offline/freshness gate passed.
- Actual browser interactions verified setup names survive language switching; planning, serving, delegation, story choices, permanent purchases, custom recipes, succession, 30-day delegation, save export/import/reload and the pre-restore archive work. Malformed input left the current café unchanged.
- Arabic RTL at 320 pixels with 22-pixel root text had no horizontal overflow. All six planning screens in the embedded build rendered without broken images or console errors.
- `expo export --platform ios` compiled 588 modules to a roughly 12 MB Hermes bundle. This is a packaging check, not a signed IPA.
- The standalone Chromium release gate was not run in this session. Interactive verification used the actual browser separately.

## Remaining release evidence

This implementation and its automated checks do not replace physical-iPhone validation. Check VoiceOver focus and announcements, Arabic reading order, all text sizes, small-screen clipping, keyboard entry, audio interruption/resume, device mute behaviour, offline cold launch and WebView process recovery. Native iOS haptics are intentionally absent; Android uses short vibrations where supported. An iOS archive, signing and TestFlight installation require their own verification.

The seven-real-day objective still needs outside-team playtesting with unrestricted progress. Measure voluntary return on or after 168 hours, reasons to return, repetition and willingness to buy this actual build. There is no calendar gating and no guaranteed week of retention; content counts and successful simulations are not evidence of lasting enjoyment.
