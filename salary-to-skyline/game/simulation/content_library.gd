class_name ContentLibrary
extends RefCounted

## Loads and validates the fictional balance data.
##
## The file shipped at M0 is the owner's `starter_balance.json` fixture set. It
## is illustrative content, not validated balance, and every money field in it is
## a decimal minor-unit string that is parsed through the Money API — never
## through JSON's float conversion.

const DEFAULT_PATH: String = "res://content/balance/starter_balance.json"
const MAX_FILE_BYTES: int = 4 * 1024 * 1024

var data: Dictionary = {}
var starts: Dictionary = {}
var jobs: Dictionary = {}
var study_programs: Dictionary = {}
var source_path: String = ""


static func load_from(path: String = DEFAULT_PATH) -> Dictionary:
	if not FileAccess.file_exists(path):
		return Money.err("missing_content", "content file '%s' does not exist" % path)
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return Money.err("unreadable_content", "cannot open '%s' (error %d)" % [path, FileAccess.get_open_error()])
	if file.get_length() > MAX_FILE_BYTES:
		return Money.err("too_large", "content file '%s' is too large" % path)
	var text: String = file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return Money.err("malformed_content", "content file '%s' is not a JSON object" % path)

	var library := ContentLibrary.new()
	library.source_path = path
	library.data = parsed

	for raw_start in _array_of(parsed, "starts"):
		if typeof(raw_start) != TYPE_DICTIONARY:
			return Money.err("malformed_content", "a start entry is not an object")
		var start: Dictionary = raw_start
		var id: String = String(start.get("id", ""))
		if not Ids.is_valid_content_id(id):
			return Money.err("invalid_content_id", "start id '%s' is invalid" % id)
		library.starts[id] = start
	if library.starts.is_empty():
		return Money.err("malformed_content", "content file defines no starts")

	for raw_job in _array_of(parsed, "job_examples"):
		if typeof(raw_job) != TYPE_DICTIONARY:
			return Money.err("malformed_content", "a job entry is not an object")
		var job: Dictionary = raw_job
		var job_id: String = String(job.get("id", ""))
		if not Ids.is_valid_content_id(job_id):
			return Money.err("invalid_content_id", "job id '%s' is invalid" % job_id)
		library.jobs[job_id] = job

	for raw_program in _array_of(parsed, "study_program_examples"):
		if typeof(raw_program) != TYPE_DICTIONARY:
			return Money.err("malformed_content", "a study programme entry is not an object")
		var program: Dictionary = raw_program
		var program_id: String = String(program.get("id", ""))
		if not Ids.is_valid_content_id(program_id):
			return Money.err("invalid_content_id", "study programme id '%s' is invalid" % program_id)
		library.study_programs[program_id] = program

	return Money.ok_value(library)


static func _array_of(source: Dictionary, key: String) -> Array:
	var value: Variant = source.get(key, [])
	return value if typeof(value) == TYPE_ARRAY else []


func start_ids() -> Array:
	var ids: Array = starts.keys()
	ids.sort()
	return ids


func has_start(start_id: String) -> bool:
	return starts.has(start_id)


func start(start_id: String) -> Dictionary:
	return starts.get(start_id, {})


func job(job_id: String) -> Dictionary:
	return jobs.get(job_id, {})


func study_program(program_id: String) -> Dictionary:
	return study_programs.get(program_id, {})


func education_funding() -> Dictionary:
	var value: Variant = data.get("education_funding_example", {})
	return value if typeof(value) == TYPE_DICTIONARY else {}


func technical() -> Dictionary:
	var value: Variant = data.get("technical", {})
	return value if typeof(value) == TYPE_DICTIONARY else {}


func reference_fixtures() -> Dictionary:
	var value: Variant = data.get("reference_fixtures", {})
	return value if typeof(value) == TYPE_DICTIONARY else {}


func default_seed() -> int:
	return int(technical().get("seed", 20260915))


## Money field accessor: rejects a missing or malformed value instead of
## defaulting it to zero.
func money_field(source: Dictionary, key: String, required: bool = true) -> Dictionary:
	if not source.has(key) or source[key] == null:
		if required:
			return Money.err("missing_field", "content is missing money field '%s'" % key)
		return Money.ok(0)
	return Money.from_variant(source[key], key)
