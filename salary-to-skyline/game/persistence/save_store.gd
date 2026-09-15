class_name SaveStore
extends RefCounted

## Versioned, validated, atomically-replaced snapshots (brief section 27).
##
## Write sequence for every save:
##   1. serialize and checksum the payload;
##   2. write it to a temporary file and close the handle;
##   3. re-read the temporary file and rebuild the whole GameState from it —
##      a snapshot that cannot be loaded is never promoted;
##   4. copy the current save to the backup slot;
##   5. rename the temporary file over the current save.
##
## An interruption before step 5 leaves the previous valid save in place, so a
## reload returns either the prior state or the fully committed one, never half a
## turn (acceptance case T33). A corrupted current save falls back to the backup
## with an explicit notice (T34).
##
## Loading uses JSON only. No script, scene, resource path or `str_to_var` is
## ever evaluated from a save file, so an edited save cannot instantiate
## anything (T36). A checksum detects accidental corruption; it does not make an
## offline save cheat-proof, and this build does not claim that.

const SAVE_DIRECTORY: String = "user://saves"
const MAX_SAVE_BYTES: int = 8 * 1024 * 1024
const ENVELOPE_VERSION: int = 1

## Test hooks. Both default to false in normal play.
var simulate_crash_after_temp_write: bool = false
var simulate_crash_before_backup: bool = false

var last_notice: String = ""


static func current_path(slot: int) -> String:
	return "%s/slot_%d.json" % [SAVE_DIRECTORY, slot]


static func backup_path(slot: int) -> String:
	return "%s/slot_%d.backup.json" % [SAVE_DIRECTORY, slot]


static func temp_path(slot: int) -> String:
	return "%s/slot_%d.writing.json" % [SAVE_DIRECTORY, slot]


static func _ensure_directory() -> Dictionary:
	if DirAccess.dir_exists_absolute(SAVE_DIRECTORY):
		return Money.ok_value(true)
	var error: int = DirAccess.make_dir_recursive_absolute(SAVE_DIRECTORY)
	if error != OK:
		return Money.err("io_error", "cannot create save directory (error %d)" % error)
	return Money.ok_value(true)


## The payload is embedded as a JSON *string* and the checksum covers exactly
## those bytes. Checksumming a re-parsed object would not work: JSON turns every
## number back into a float, so the re-serialized text would differ from what was
## written even when the file is perfectly intact.
func build_envelope(state: GameState) -> Dictionary:
	var canonical: String = JSON.stringify(state.to_dict(), "", true)
	return {
		"envelope_version": ENVELOPE_VERSION,
		"engine_version": Engine.get_version_info()["string"],
		"rules_version": GameState.RULES_VERSION,
		"content_version": GameState.CONTENT_VERSION,
		"save_schema_version": GameState.SAVE_SCHEMA_VERSION,
		"state_revision": str(state.state_revision),
		"month_index": state.month_index,
		"checksum_sha256": canonical.sha256_text(),
		"payload_json": canonical,
	}


func save_state(state: GameState, slot: int = 0) -> Dictionary:
	last_notice = ""
	if state == null:
		return Money.err("no_state", "there is no state to save")
	var directory: Dictionary = _ensure_directory()
	if not directory["ok"]:
		return directory

	var envelope: Dictionary = build_envelope(state)
	var text: String = JSON.stringify(envelope, "", true)
	if text.length() > MAX_SAVE_BYTES:
		return Money.err("too_large", "save payload is larger than the permitted size")

	var temp: String = temp_path(slot)
	var file := FileAccess.open(temp, FileAccess.WRITE)
	if file == null:
		return Money.err("io_error", "cannot open '%s' (error %d)" % [temp, FileAccess.get_open_error()])
	file.store_string(text)
	file.flush()
	file.close()

	if simulate_crash_after_temp_write:
		return Money.err("simulated_crash", "interrupted after writing the temporary save")

	# Step 3: prove the snapshot loads before it is allowed to replace anything.
	var verified: Dictionary = _read_and_validate(temp)
	if not verified["ok"]:
		DirAccess.remove_absolute(temp)
		return Money.err("verification_failed",
			"refusing to promote an unreadable save: %s" % verified.get("message", ""))

	if FileAccess.file_exists(current_path(slot)):
		if simulate_crash_before_backup:
			return Money.err("simulated_crash", "interrupted before rotating the backup")
		var copied: int = DirAccess.copy_absolute(current_path(slot), backup_path(slot))
		if copied != OK:
			return Money.err("io_error", "cannot rotate backup (error %d)" % copied)

	var renamed: int = DirAccess.rename_absolute(temp, current_path(slot))
	if renamed != OK:
		return Money.err("io_error", "cannot promote temporary save (error %d)" % renamed)
	return Money.ok_value({
		"path": current_path(slot),
		"state_revision": state.state_revision,
		"bytes": text.length(),
	})


## Loads the newest valid save for a slot.
## Returns { ok, value: { state, recovered_from_backup, notice, envelope } }.
func load_state(slot: int = 0) -> Dictionary:
	last_notice = ""
	var primary: Dictionary = _read_and_validate(current_path(slot))
	if primary["ok"]:
		var value: Dictionary = primary["value"]
		value["recovered_from_backup"] = false
		value["notice"] = ""
		return Money.ok_value(value)

	if not FileAccess.file_exists(backup_path(slot)):
		return primary
	var fallback: Dictionary = _read_and_validate(backup_path(slot))
	if not fallback["ok"]:
		return Money.err("unrecoverable",
			"neither the current save nor its backup could be read (%s / %s)"
			% [primary.get("message", ""), fallback.get("message", "")])
	var recovered: Dictionary = fallback["value"]
	recovered["recovered_from_backup"] = true
	recovered["notice"] = (
		"The most recent save could not be read (%s). The previous saved month was restored."
		% primary.get("code", "unknown"))
	last_notice = String(recovered["notice"])
	return Money.ok_value(recovered)


func has_save(slot: int = 0) -> bool:
	return FileAccess.file_exists(current_path(slot)) or FileAccess.file_exists(backup_path(slot))


func delete_slot(slot: int = 0) -> void:
	for path in [current_path(slot), backup_path(slot), temp_path(slot)]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(path)


func _read_and_validate(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return Money.err("missing_save", "no save file at '%s'" % path)
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return Money.err("io_error", "cannot open '%s' (error %d)" % [path, FileAccess.get_open_error()])
	if file.get_length() > MAX_SAVE_BYTES:
		file.close()
		return Money.err("too_large", "save file '%s' exceeds the permitted size" % path)
	var text: String = file.get_as_text()
	file.close()

	var parsed: Variant = _parse_json(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return Money.err("malformed_save", "save file '%s' is not a JSON object" % path)
	var envelope: Dictionary = parsed
	if int(envelope.get("envelope_version", -1)) != ENVELOPE_VERSION:
		return Money.err("envelope_version",
			"save envelope version %s is not supported" % str(envelope.get("envelope_version", "missing")))
	var canonical: Variant = envelope.get("payload_json", null)
	if typeof(canonical) != TYPE_STRING:
		return Money.err("malformed_save", "save file '%s' has no payload" % path)
	var expected: String = String(envelope.get("checksum_sha256", ""))
	if expected.is_empty() or String(canonical).sha256_text() != expected:
		return Money.err("checksum_mismatch", "save file '%s' failed its checksum" % path)
	var payload: Variant = _parse_json(String(canonical))
	if typeof(payload) != TYPE_DICTIONARY:
		return Money.err("malformed_save", "save file '%s' has an unreadable payload" % path)

	var rebuilt: Dictionary = GameState.from_dict(payload)
	if not rebuilt["ok"]:
		return rebuilt
	return Money.ok_value({"state": rebuilt["value"], "envelope": envelope, "path": path})


## Quiet JSON parse. The instance form returns an error code instead of pushing
## an engine error, so a deliberately corrupted save does not fill the log with
## noise that looks like a crash.
static func _parse_json(text: String) -> Variant:
	var reader := JSON.new()
	if reader.parse(text) != OK:
		return null
	return reader.data
