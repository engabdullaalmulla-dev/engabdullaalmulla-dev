extends SceneTree

## Project-level headless test runner (BUILD_PLAN_AND_ACCEPTANCE B4).
##
##   godot --headless --path . --script res://tests/test_runner.gd
##   godot --headless --path . --script res://tests/test_runner.gd -- --filter=money
##
## Exits 0 only when every test passed; any failure or load error exits 1.

const TEST_DIRECTORIES: Array = ["res://tests/unit", "res://tests/integration"]

var _total_tests: int = 0
var _total_assertions: int = 0
var _failures: Array[String] = []
var _files_run: int = 0


func _initialize() -> void:
	var filter: String = _argument("--filter", "")
	var started_at: int = Time.get_ticks_msec()

	print("Salary to Skyline — headless test run")
	print("  engine         : %s" % Engine.get_version_info()["string"])
	print("  build          : %s" % Engine.get_version_info().get("hash", "unknown"))
	print("  rules version  : %s" % GameState.RULES_VERSION)
	print("  content version: %s" % GameState.CONTENT_VERSION)
	print("  save schema    : %d" % GameState.SAVE_SCHEMA_VERSION)
	print("  content seed   : %s" % _content_seed_text())
	if not filter.is_empty():
		print("  filter         : %s" % filter)
	print("")

	for directory in TEST_DIRECTORIES:
		for path in _scripts_in(directory):
			if not filter.is_empty() and not path.contains(filter):
				continue
			_run_file(path)

	var elapsed: int = Time.get_ticks_msec() - started_at
	print("")
	print("files: %d   tests: %d   assertions: %d   failures: %d   time: %d ms"
		% [_files_run, _total_tests, _total_assertions, _failures.size(), elapsed])
	if _failures.is_empty():
		print("RESULT: PASS")
		quit(0)
		return
	print("")
	for failure in _failures:
		print("  FAIL  %s" % failure)
	print("RESULT: FAIL")
	quit(1)


func _content_seed_text() -> String:
	var loaded: Dictionary = ContentLibrary.load_from()
	return str((loaded["value"] as ContentLibrary).default_seed()) if loaded["ok"] else "unavailable"


func _argument(name: String, fallback: String) -> String:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with(name + "="):
			return argument.substr(name.length() + 1)
	return fallback


func _scripts_in(directory: String) -> Array:
	var paths: Array = []
	var dir := DirAccess.open(directory)
	if dir == null:
		return paths
	for file_name in dir.get_files():
		var name: String = file_name.trim_suffix(".remap")
		if name.begins_with("test_") and name.ends_with(".gd"):
			paths.append("%s/%s" % [directory, name])
	paths.sort()
	return paths


func _run_file(path: String) -> void:
	var script: Script = load(path)
	if script == null:
		_failures.append("%s: could not be loaded" % path)
		return
	_files_run += 1
	var suite_failures: int = 0
	var suite_tests: int = 0
	var method_names: Array = []
	for method in script.get_script_method_list():
		var method_name: String = String(method["name"])
		if method_name.begins_with("test_") and not method_names.has(method_name):
			method_names.append(method_name)
	method_names.sort()

	for method_name in method_names:
		var instance: TestCase = script.new()
		instance.set_current_test(method_name)
		instance.before_each()
		instance.call(method_name)
		instance.after_each()
		suite_tests += 1
		_total_tests += 1
		_total_assertions += instance.assertions
		for failure in instance.failures:
			_failures.append("%s :: %s" % [path.get_file(), failure])
			suite_failures += 1

	var status: String = "ok  " if suite_failures == 0 else "FAIL"
	print("  [%s] %-44s %2d test(s)" % [status, path.get_file(), suite_tests])
