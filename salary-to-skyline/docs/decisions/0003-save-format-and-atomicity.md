# 0003 — Save format, atomicity and import safety

**Status:** accepted at M0 · **Date:** 2026-09-15 · **Ticket:** SIM-002

## Format

A save is an envelope: engine/rules/content/schema versions, state revision, month, a SHA-256 checksum, and the
payload **embedded as a JSON string**.

The payload is a string rather than a nested object for a concrete reason: JSON turns every number back into a
float on read, so re-serializing a re-parsed object produces different bytes from those written and the
checksum would fail on a perfectly intact file. Checksumming the exact bytes written removes that whole class
of false alarm. Inside the payload, money is a decimal string, counters are integers, flags are booleans, and
nothing that the UI can recompute (the last month recap) is stored at all.

## Write sequence

1. serialize and checksum;
2. write a temporary file and close it;
3. **re-read the temporary file and rebuild the entire `GameState` from it** — a snapshot that cannot be loaded
   is never promoted;
4. copy the current save to the backup slot;
5. rename the temporary file over the current save.

An interruption before step 5 leaves the previous valid save intact. A corrupted current save falls back to the
backup with a notice the player sees. Both paths are tested with injected failures, not asserted in prose.

**Limit of this claim:** the rename step is tested on Linux headless. `DirAccess.rename_absolute` behaviour on
iOS and Android has not been exercised on a device, and this build does not claim it is crash-proof there.

## Import safety

Loading uses JSON only. No script, scene, resource path or `str_to_var` is ever evaluated from a save, so an
edited file cannot instantiate anything: a `res://...` string in a save stays an inert string. Size limits,
ID formats, account names, money ranges, month range, notice count and block types are all validated, and an
unknown schema version is refused with an explanatory message rather than guessed — a migration must be written
before the version changes.

The checksum detects accidental corruption. It does **not** make an offline save cheat-proof, and nothing in
the product should claim that it does.
