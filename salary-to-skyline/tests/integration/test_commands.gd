extends TestCase

## Command validation at the application boundary.
## Covers acceptance cases T03 and T04, and the spendable/restricted cash rules
## in ECONOMY_SPEC E2.

const SLOT: int = 91

var engine: GameEngine
var store: SaveStore


func before_each() -> void:
	store = SaveStore.new()
	store.delete_slot(SLOT)
	var loaded: Dictionary = ContentLibrary.load_from()
	engine = GameEngine.create(loaded["value"], store)
	engine.autosave_enabled = false
	assert_ok(engine.new_game("fresh_work", {"display_name": "Commander"}, 20260915), "start a life")


func after_each() -> void:
	store.delete_slot(SLOT)


func test_t04_a_stale_revision_is_refused_without_partial_mutation() -> void:
	var stale_revision: int = engine.state.state_revision
	# The player leaves a purchase sheet open while the month advances.
	var advance := Command.create(
		engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
	assert_ok(engine.execute(advance), "advance a month behind the open sheet")

	var cash_before: int = engine.state.spendable_cash()
	var revision_before: int = engine.state.state_revision
	var entries_before: int = engine.state.ledger.entry_count()

	var stale := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		stale_revision, {"amount_minor": "50000", "choice_id": "stale_choice"})
	assert_err(engine.execute(stale), "stale_revision", "the stale action is refused")
	assert_money(engine.state.spendable_cash(), cash_before, "no money moved")
	assert_eq(engine.state.state_revision, revision_before, "the revision did not change")
	assert_eq(engine.state.ledger.entry_count(), entries_before, "no journal entry was written")
	assert_false(engine.state.ledger.has_command(stale.id), "the refused command is not recorded")

	# Re-preparing the same action against the current revision works.
	var fresh := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "50000", "choice_id": "stale_choice"})
	assert_ok(engine.execute(fresh), "the re-prepared action succeeds")
	assert_money(engine.state.spendable_cash(), cash_before - 50000, "the amount is spent exactly once")


func test_t03_a_double_tapped_command_id_spends_once() -> void:
	var command_id: String = engine.next_command_id("cmd")
	var revision: int = engine.state.state_revision
	var first := Command.create(command_id, Command.TYPE_SPEND_DISCRETIONARY, revision,
		{"amount_minor": "120000", "choice_id": "city_evening"})
	assert_ok(engine.execute(first), "the first tap is applied")
	var cash_after_first: int = engine.state.spendable_cash()

	# The same command replayed, both at the old revision and the new one.
	var replay_stale := Command.create(command_id, Command.TYPE_SPEND_DISCRETIONARY, revision,
		{"amount_minor": "120000", "choice_id": "city_evening"})
	assert_err(engine.execute(replay_stale), "stale_revision", "a replay at the old revision is refused")
	var replay_current := Command.create(command_id, Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "120000", "choice_id": "city_evening"})
	assert_err(engine.execute(replay_current), "duplicate_command", "a replayed command id is refused")
	assert_money(engine.state.spendable_cash(), cash_after_first, "the purchase happened once")


func test_a_month_command_cannot_be_replayed() -> void:
	var command_id: String = engine.next_command_id("cmd")
	var advance := Command.create(command_id, Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
	assert_ok(engine.execute(advance), "advance one month")
	var month_after: int = engine.state.month_index
	var cash_after: int = engine.state.spendable_cash()

	var replay := Command.create(command_id, Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
	assert_err(engine.execute(replay), "duplicate_command", "the month command cannot run twice")
	assert_eq(engine.state.month_index, month_after, "the calendar did not move")
	assert_money(engine.state.spendable_cash(), cash_after, "no second salary was paid")


func test_commands_are_validated_before_they_touch_money() -> void:
	var cash_before: int = engine.state.spendable_cash()
	var invalid_type := Command.create(engine.next_command_id("cmd"), "grant_free_apartment",
		engine.state.state_revision, {})
	assert_err(engine.execute(invalid_type), "unknown_command", "an unknown command type is refused")

	var bad_id := Command.create("not a valid id", Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "100"})
	assert_err(engine.execute(bad_id), "invalid_command_id", "an invalid command id is refused")

	var no_revision := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		-1, {"amount_minor": "100"})
	assert_err(engine.execute(no_revision), "missing_revision", "a command without a revision is refused")

	var float_amount := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": 1234.5})
	assert_err(engine.execute(float_amount), "float_rejected", "a float amount is refused")

	var negative := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "-5000"})
	assert_err(engine.execute(negative), "invalid_amount", "a negative spend is refused")

	var too_much := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "99999999"})
	assert_err(engine.execute(too_much), "insufficient_cash", "spending beyond cash is refused")

	assert_money(engine.state.spendable_cash(), cash_before, "no refused command moved money")
	assert_true(engine.state.ledger.is_balanced(), "the journal balances")


func test_earmarked_savings_leave_spendable_cash_but_stay_owned() -> void:
	var opening: int = engine.state.spendable_cash()
	var earmark := Command.create(engine.next_command_id("cmd"), Command.TYPE_EARMARK_SAVINGS,
		engine.state.state_revision, {"amount_minor": "500000", "choice_id": "first_home_fund"})
	assert_ok(engine.execute(earmark), "set aside VDh 5,000 toward a first home")

	assert_money(engine.state.spendable_cash(), opening - 500000, "earmarked cash is not spendable")
	assert_money(engine.state.restricted_cash(), 500000, "earmarked cash is shown as restricted")
	assert_money(engine.state.liquid_cash_total(), opening, "the player still owns all of it")
	assert_money(engine.state.net_worth(), opening, "earmarking does not change net worth")

	# Spendable cash is not reduced twice by the same reserved amount.
	assert_money(engine.state.spendable_cash() + engine.state.restricted_cash(),
		engine.state.liquid_cash_total(), "reserved cash is deducted exactly once")

	var overspend := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "1600000"})
	assert_err(engine.execute(overspend), "insufficient_cash",
		"earmarked savings cannot be spent without releasing them first")

	var release := Command.create(engine.next_command_id("cmd"), Command.TYPE_RELEASE_SAVINGS,
		engine.state.state_revision, {"amount_minor": "500000"})
	assert_ok(engine.execute(release), "release the savings back to spendable cash")
	assert_money(engine.state.spendable_cash(), opening, "released savings return in full")
	assert_money(engine.state.restricted_cash(), 0, "nothing stays restricted")

	var over_release := Command.create(engine.next_command_id("cmd"), Command.TYPE_RELEASE_SAVINGS,
		engine.state.state_revision, {"amount_minor": "100"})
	assert_err(engine.execute(over_release), "insufficient_balance",
		"an empty reserve cannot be released")


func test_the_first_home_goal_reports_real_cash_needed() -> void:
	var goal: Variant = assert_ok(engine.first_home_goal(), "read the first-home goal")
	if goal == null:
		return
	var target: Dictionary = goal
	# Studio at 280,000 with the content file's 80% LTV and 6% acquisition costs.
	assert_money(int(target["price_minor"]), 28000000, "the goal uses the listed asking price")
	assert_money(int(target["loan_minor"]), 22400000, "80% loan-to-value")
	assert_money(int(target["fees_minor"]), 1680000, "6% combined acquisition costs")
	assert_money(int(target["cash_needed_minor"]), 7280000,
		"cash needed is deposit plus fees, matching ECONOMY_SPEC E10")
	assert_money(int(target["shortfall_minor"]), 7280000, "a new life has saved nothing yet")

	var earmark := Command.create(engine.next_command_id("cmd"), Command.TYPE_EARMARK_SAVINGS,
		engine.state.state_revision, {"amount_minor": "1000000"})
	assert_ok(engine.execute(earmark), "save toward the goal")
	var updated: Dictionary = engine.first_home_goal()["value"]
	assert_money(int(updated["earmarked_minor"]), 1000000, "the fund reflects what was set aside")
	assert_money(int(updated["shortfall_minor"]), 6280000, "the shortfall falls by the same amount")


func test_progress_survives_closing_and_reopening_the_app() -> void:
	engine.autosave_enabled = true
	for i in 5:
		var command := Command.create(
			engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
		assert_ok(engine.execute(command), "advance a month with autosave on")
	var earmark := Command.create(engine.next_command_id("cmd"), Command.TYPE_EARMARK_SAVINGS,
		engine.state.state_revision, {"amount_minor": "300000"})
	assert_ok(engine.execute(earmark), "set money aside")
	var expected_cash: int = engine.state.spendable_cash()
	var expected_month: int = engine.state.month_index

	# A fresh engine, as if the app had been closed and reopened.
	var reopened: GameEngine = GameEngine.create(engine.content, store)
	var loaded: Variant = assert_ok(reopened.load_game(0), "reopen the saved life")
	if loaded == null:
		return
	assert_eq(reopened.state.month_index, expected_month, "the month is where it was left")
	assert_money(reopened.state.spendable_cash(), expected_cash, "cash is where it was left")
	assert_money(reopened.state.restricted_cash(), 300000, "the savings fund survived")
	assert_false(bool((loaded as Dictionary)["recovered_from_backup"]), "no recovery was needed")
