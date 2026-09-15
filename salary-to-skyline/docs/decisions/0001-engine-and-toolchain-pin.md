# 0001 — Engine and toolchain pin

**Status:** accepted at M0 · **Date:** 2026-09-15 · **Ticket:** SYS-002

## Decision

Pin **Godot 4.7.2 stable, official build `ed1daf0bf001b61586d9930840f2f1394092c079`**, typed GDScript, 2D,
`gl_compatibility` renderer, portrait.

| Artefact | SHA-256 |
|---|---|
| `Godot_v4.7.2-stable_linux.x86_64.zip` | `cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4` |
| `Godot_v4.7.2-stable_linux.x86_64` (binary) | `8d106cbe6144c2dc7e881d61d2429c1a8a76e6b22ef48bd5e48dcf934953f71e` |
| `Godot_v4.7.2-stable_export_templates.tpz` | `f298490b8d44d934be425a5a65a51bf15f422428b229a06a6e11d9ffea248011` |

`tools/fetch_godot.sh` downloads and checksums the same build.

## Why

`CLAUDE.md` and `starter_balance.json` nominate 4.7.2 stable as the candidate. It was verified locally rather
than assumed: the engine runs headless, imports the project, executes the test runner, and exports a signed
Android APK (both with the prebuilt template and through a Gradle build). No third-party engine plugin is used
at M0, so nothing else constrains the version yet.

## Project settings that matter

* `display/window/handheld/orientation=1` (portrait), viewport 720×1280, `canvas_items` stretch, `expand` aspect.
* `renderer/rendering_method="gl_compatibility"` on desktop and mobile — the widest phone support, and the only
  renderer the iOS simulator supports.
* `rendering/textures/vram_compression/import_etc2_astc=true` — **required**; the Android exporter refuses to
  export without it. This was found by running the export, not by reading about it.
* `internationalization/rendering/text_driver="TextServerAdvanced"` so Arabic shaping and bidirectional text are
  possible later. No Arabic strings exist yet and none are claimed.

## Consequences and constraints

* Upgrading the engine requires re-running `tools/run_tests.sh` and both export paths, and re-recording the
  hashes here. Do not upgrade to chase a feature without an evidenced problem (CLAUDE.md).
* Determinism claims are scoped to this engine and rules version. `RngStreams` saves seed and state, but the
  brief's rule holds: identical random sequences are not promised across arbitrary engine changes.
* The build machine used for M0 is Linux x86_64 headless. That is sufficient for Android, and insufficient for
  iOS packaging (see decision 0004).
