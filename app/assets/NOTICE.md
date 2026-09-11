# Bundled third-party assets

## Fonts

Both families are licensed under the **SIL Open Font License, Version 1.1**,
which permits bundling and redistribution inside an application. The full
licence text is in `fonts/OFL.txt`.

| Family | Files | Copyright |
|---|---|---|
| IBM Plex Sans | `ibm-plex-sans.woff2` (variable, weights 100–700) | © 2017 IBM Corp., Reserved Font Name "Plex" |
| Saira Condensed | `saira-condensed-{600,700,800}.woff2` | © The Saira Project Authors, Reserved Font Name "Saira" |

Only the **Latin** subsets are bundled, which is what the app uses. Total 92 KB.

They are bundled rather than fetched from a font CDN because the core of the game
must run with no network at all. `scripts/build-www.mjs` asserts that the built
web bundle contains no outbound URLs, so this cannot silently regress.

Nothing else in the app is third-party: the marbles, the flags, the arenas, the
sounds and the code are all original. See `../docs/10-rights.md`.
