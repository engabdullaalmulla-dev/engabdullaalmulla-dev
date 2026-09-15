extends TestCase

## Persistence: atomic promotion, validation, backup recovery, safe import.
## Covers acceptance cases T33, T34, T35 (rejection half) and T36.

const SLOT: int = 90

var engine: GameEngine
var store: SaveStore


func before_each() -> void:
	store = SaveStore.new()
	store.delete_slot(SLOT)
	var loaded: Dictionary = ContentLibrary.load_from()
	engine = GameEngine.create(loaded["value"], store)
	engine.autosave_enabled = false
	assert_ok(engine.new_game("fresh_work", {"display_name": "Saver"}, 20260915), "start a life")


func after_each() -> void:
	store.delete_slot(SLOT)


func _advance(count: int) -> void:
	for i in count:
		var command := Command.create(
			engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
		assert_ok(engine.execute(command), "advance a month")


func test_snapshot_round_trip_preserves_every_authoritative_value() -> void:
	_advance(7)
	var before: Dictionary = engine.state.to_dict()
	assert_ok(store.save_state(engine.state, SLOT), "save the state")

	var loaded: Variant = assert_ok(store.load_state(SLOT), "load the state")
	if loaded == null:
		return
	var restored: GameState = (loaded as Dictionary)["state"]
	assert_eq(JSON.stringify(restored.to_dict(), "", true), JSON.stringify(before, "", true),
		"the reloaded state is byte-identical")
	assert_money(restored.spendable_cash(), engine.state.spendable_cash(), "cash survives")
	assert_eq(restored.month_index, engine.state.month_index, "the month survives")
	assert_eq(restored.state_revision, engine.state.state_revision, "the revision survives")
	assert_eq(restored.rng.state_fingerprint(), engine.state.rng.state_fingerprint(),
		"random streams survive")
	assert_false(bool((loaded as Dictionary)["recovered_from_backup"]), "no recovery was needed")


func test_t33_an_interrupted_commit_never_loads_half_a_month() -> void:
	_advance(2)
	assert_ok(store.save_state(engine.state, SLOT), "save month 2")
	var safe_cash: int = engine.state.spendable_cash()
	var safe_month: int = engine.state.month_index

	# Advance a month in memory, then lose power while the new snapshot is still
	# in its temporary file.
	_advance(1)
	store.simulate_crash_after_temp_write = true
	assert_err(store.save_state(engine.state, SLOT), "simulated_crash", "the save was interrupted")
	store.simulate_crash_after_temp_write = false

	var loaded: Variant = assert_ok(store.load_state(SLOT), "reload after the interruption")
	if loaded == null:
		return
	var restored: GameState = (loaded as Dictionary)["state"]
	assert_eq(restored.month_index, safe_month, "the previous complete month is restored")
	assert_money(restored.spendable_cash(), safe_cash, "no half-applied money movement survived")
	assert_true(restored.ledger.is_balanced(), "the restored journal balances")

	# The next successful save promotes the complete state.
	assert_ok(store.save_state(engine.state, SLOT), "save again once the app is running")
	var reloaded: Dictionary = store.load_state(SLOT)["value"]
	assert_eq((reloaded["state"] as GameState).month_index, safe_month + 1,
		"the completed month is now the saved state")


func test_t34_a_corrupted_newest_save_recovers_the_previous_one() -> void:
	_advance(1)
	assert_ok(store.save_state(engine.state, SLOT), "save month 1")
	var previous_month: int = engine.state.month_index
	_advance(1)
	assert_ok(store.save_state(engine.state, SLOT), "save month 2 and rotate the backup")

	# Corrupt the newest save the way a truncated write would.
	var file := FileAccess.open(SaveStore.current_path(SLOT), FileAccess.WRITE)
	file.store_string('{"envelope_version": 1, "payload": {"save_schema_version": 1')
	file.close()

	var loaded: Variant = assert_ok(store.load_state(SLOT), "recover from the backup")
	if loaded == null:
		return
	assert_true(bool((loaded as Dictionary)["recovered_from_backup"]), "recovery is reported")
	assert_false(String((loaded as Dictionary)["notice"]).is_empty(), "the player is told what happened")
	assert_eq(((loaded as Dictionary)["state"] as GameState).month_index, previous_month,
		"the known-good previous save is restored")


func test_a_checksum_mismatch_is_detected() -> void:
	assert_ok(store.save_state(engine.state, SLOT), "save the state")
	var file := FileAccess.open(SaveStore.current_path(SLOT), FileAccess.READ)
	var envelope: Dictionary = JSON.parse_string(file.get_as_text())
	file.close()
	# Edit a balance without updating the checksum, the way a save editor would.
	var payload: Dictionary = JSON.parse_string(String(envelope["payload_json"]))
	((payload["ledger"] as Dictionary)["balances"] as Dictionary)[Accounts.CASH_OPERATING] = "999999999"
	envelope["payload_json"] = JSON.stringify(payload, "", true)
	var out := FileAccess.open(SaveStore.current_path(SLOT), FileAccess.WRITE)
	out.store_string(JSON.stringify(envelope, "", true))
	out.close()

	# With no backup yet, the load fails with the exact reason rather than
	# silently accepting the edited balance.
	assert_err(store.load_state(SLOT), "checksum_mismatch", "an edited save will not load")


func test_t36_an_imported_save_cannot_instantiate_anything() -> void:
	# A hostile payload: script paths, resource paths, and a nested object where
	# the loader expects plain data. Nothing here may be evaluated.
	var hostile: Dictionary = {
		"save_schema_version": 1,
		"game_id": "game-1",
		"state_revision": "1",
		"month_index": 0,
		"player": {"display_name": "res://game/core/money.gd"},
		"employment": {},
		"study": {},
		"education_funding": {},
		"monthly_stipend_minor": "0",
		"monthly_essentials_minor": "320000",
		"ledger": {"entries": [], "balances": {}, "applied_commands": {}, "next_transaction_sequence": "1"},
		"rng": RngStreams.create(1).to_dict(),
		"notices": [],
		"last_recap": {},
		"script": "res://game/core/money.gd",
		"@path": "res://game/core/money.gd",
		"resource_path": "res://game/core/money.gd",
	}
	var result: Variant = assert_ok(GameState.from_dict(hostile), "a plain-data save still loads")
	if result != null:
		var state: GameState = result
		assert_eq(typeof(state.player.get("display_name")), TYPE_STRING,
			"a script path inside a save stays an inert string")
		assert_money(state.spendable_cash(), 0, "no balances were conjured")

	# Invalid identifiers, wrong types and oversized content fail safely.
	var bad_id: Dictionary = hostile.duplicate(true)
	bad_id["game_id"] = "../../etc/passwd"
	assert_err(GameState.from_dict(bad_id), "invalid_game_id", "a path-like game id is refused")

	var bad_month: Dictionary = hostile.duplicate(true)
	bad_month["month_index"] = 999999
	assert_err(GameState.from_dict(bad_month), "invalid_month", "an out-of-range month is refused")

	var bad_money: Dictionary = hostile.duplicate(true)
	bad_money["monthly_essentials_minor"] = 320000.5
	assert_err(GameState.from_dict(bad_money), "float_rejected", "a float money field is refused")

	var too_many: Dictionary = hostile.duplicate(true)
	var notices: Array = []
	for i in GameState.MAX_NOTICES + 5:
		notices.append({"code": "spam"})
	too_many["notices"] = notices
	assert_err(GameState.from_dict(too_many), "too_large", "an oversized notice list is refused")

	var not_a_dict: Dictionary = hostile.duplicate(true)
	not_a_dict["player"] = "not a dictionary"
	assert_err(GameState.from_dict(not_a_dict), "type_rejected", "a wrong-typed block is refused")


func test_t35_an_unknown_schema_version_is_refused_not_guessed() -> void:
	var data: Dictionary = engine.state.to_dict()
	data["save_schema_version"] = GameState.SAVE_SCHEMA_VERSION + 1
	var result: Dictionary = GameState.from_dict(data)
	assert_err(result, "schema_version", "a newer save is refused rather than misread")
	assert_true(String(result.get("message", "")).contains("not supported"),
		"the refusal explains itself; a migration must be written before the version changes")


func test_a_save_that_cannot_be_reloaded_is_never_promoted() -> void:
	assert_ok(store.save_state(engine.state, SLOT), "write a good save")
	var good_revision: int = engine.state.state_revision
	# Corrupt the in-memory state so that serializing it produces something the
	# loader will reject, and confirm the good file survives.
	engine.state.month_index = SimCalendar.MAX_MONTH_INDEX + 50
	assert_err(store.save_state(engine.state, SLOT), "verification_failed",
		"an unloadable snapshot is refused before it replaces the good save")
	var loaded: Dictionary = store.load_state(SLOT)
	assert_ok(loaded, "the previous good save is still there")
	assert_eq((loaded["value"]["state"] as GameState).state_revision, good_revision,
		"the good save was not overwritten")
