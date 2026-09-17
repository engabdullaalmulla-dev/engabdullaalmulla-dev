# Bundled fonts

Bricolage Grotesque, DM Mono and DM Sans, latin and latin-ext subsets only, embedded as
data URIs in `fonts.css`.

They are bundled rather than linked because a WebView given `source={{ html }}` in aeroplane
mode cannot reach fonts.googleapis.com, and the game would silently fall back to the system
face — which is the one situation nobody tests. `tools/build-native.py` asserts the finished
bundle contains no outbound URL at all.

All three are licensed under the SIL Open Font License 1.1. Regenerate with the font block in
`tools/build-native.py`'s history if the families ever change; otherwise this file is fixed
input and needs no network at build time.
