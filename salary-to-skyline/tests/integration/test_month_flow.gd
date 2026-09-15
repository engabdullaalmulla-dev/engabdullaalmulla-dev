extends TestCase

## The monthly simulation against the reference cash-flow fixtures in
## starter_balance.json. Covers acceptance cases T01, T02, T32 and T40.

var engine: GameEngine
var content: ContentLibrary


func before_each() -> void:
	var loaded: Dictionary = ContentLibrary.load_from()
	content = loaded["value"]
	engine = GameEngine.create(content)
	engine.autosave_enabled = false


func _start(start_id: String) -> void:
	var created: Dictionary = engine.new_game(start_id, {"display_name": "Test"}, 20260915)
	assert_ok(created, "start a fresh life on '%s'" % start_id)


func _advance_months(count: int) -> Dictionary:
	var last: Dictionary = {}
	for i in count:
		var command := Command.create(
			engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
		var result: Dictionary = engine.execute(command)
		if not result["ok"]:
			fail("advancing month %d failed: %s" % [i + 1, result.get("message", "")])
			return last
		last = result["value"]
	return last


func test_t01_twelve_months_of_salary_and_essentials_reconcile_exactly() -> void:
	_start("fresh_work")
	var fixture: Dictionary = content.reference_fixtures()["salary_12_month"]
	assert_money(engine.state.spendable_cash(), int(Money.parse_minor_string(
		String(fixture["opening_cash_minor"]))["value"]), "opening cash matches the fixture")

	_advance_months(int(fixture["months"]))

	var expected: int = int(Money.parse_minor_string(String(fixture["expected_closing_cash_minor"]))["value"])
	assert_money(engine.state.spendable_cash(), expected,
		"12 months of salary 5,200 less essentials 3,200 from 20,000")
	assert_eq(engine.state.month_index, 12, "twelve months were simulated")
	assert_money(engine.state.total_debt(), 0, "no debt was created")
	assert_money(engine.state.arrears(), 0, "no bill was missed")
	assert_true(engine.state.ledger.is_balanced(), "the journal still balances")
	assert_money(engine.state.ledger.display_balance(Accounts.REVENUE_SALARY), 6240000,
		"salary revenue totals 12 months of pay")
	assert_money(engine.state.ledger.balance(Accounts.EXPENSE_ESSENTIALS), 3840000,
		"essential expense totals 12 months of costs")
	assert_money(engine.state.net_worth(), expected, "net worth equals cash when nothing else is owned")
	assert_eq(int(engine.state.employment["experience_months"]), 12, "twelve months of experience accrued")


func test_funded_university_route_matches_its_fixture() -> void:
	_start("fresh_university")
	var fixture: Dictionary = content.reference_fixtures()["university_36_month_before_events"]
	_advance_months(int(fixture["months"]))

	assert_money(engine.state.spendable_cash(),
		int(Money.parse_minor_string(String(fixture["expected_closing_cash_minor"]))["value"]),
		"36 funded study months leave the fixture cash balance")
	assert_money(engine.state.total_debt(),
		int(Money.parse_minor_string(String(fixture["expected_debt_minor"]))["value"]),
		"36 monthly draws total the fixture education debt")
	assert_true(bool(engine.state.study.get("graduated", false)), "the programme completes")
	assert_money(engine.state.ledger.display_balance(Accounts.REVENUE_STIPEND), 6480000,
		"the stipend is income")
	assert_money(engine.state.ledger.display_balance(Accounts.REVENUE_SALARY), 0,
		"a student with no job earns no salary")
	assert_money(engine.state.net_worth(), -4120000,
		"borrowing to study leaves a negative book net worth, not a profit")


func test_work_study_route_matches_its_fixture() -> void:
	_start("fresh_work_study")
	var fixture: Dictionary = content.reference_fixtures()["work_study_48_month_before_events"]
	_advance_months(int(fixture["months"]))
	assert_money(engine.state.spendable_cash(),
		int(Money.parse_minor_string(String(fixture["expected_closing_cash_minor"]))["value"]),
		"48 work-study months leave the fixture cash balance")
	assert_money(engine.state.total_debt(), 0, "the work-study route borrows nothing")
	assert_true(bool(engine.state.study.get("graduated", false)), "the part-time programme completes")


func test_t02_reading_the_state_never_pays_a_salary() -> void:
	_start("fresh_work")
	var before_cash: int = engine.state.spendable_cash()
	var before_revision: int = engine.state.state_revision
	var before_month: int = engine.state.month_index

	for i in 25:
		engine.state.normal_monthly_surplus()
		engine.state.upcoming_commitments()
		engine.state.net_worth()
		engine.first_home_goal()
		MonthEngine.preview(engine.state)

	assert_money(engine.state.spendable_cash(), before_cash, "browsing paid nothing")
	assert_eq(engine.state.state_revision, before_revision, "browsing did not advance the revision")
	assert_eq(engine.state.month_index, before_month, "browsing did not advance the calendar")


func test_t40_no_wall_clock_api_can_reach_the_simulation() -> void:
	# A static check: if simulation, core or persistence code ever reads a real
	# clock, income could depend on elapsed real time. Nothing here may do that.
	var forbidden: Array = ["Time.get_", "OS.get_datetime", "OS.get_system_time", "Time.get_unix_time"]
	var directories: Array = ["res://game/core", "res://game/simulation", "res://game/persistence"]
	for directory in directories:
		var dir := DirAccess.open(directory)
		assert_true(dir != null, "can read %s" % directory)
		if dir == null:
			continue
		for file_name in dir.get_files():
			var name: String = file_name.trim_suffix(".remap")
			if not name.ends_with(".gd"):
				continue
			var path: String = "%s/%s" % [directory, name]
			var file := FileAccess.open(path, FileAccess.READ)
			assert_true(file != null, "can open %s" % path)
			if file == null:
				continue
			var source: String = file.get_as_text()
			file.close()
			for token in forbidden:
				assert_false(source.contains(String(token)),
					"%s must not read the wall clock (%s)" % [name, token])


func test_t32_preview_is_repeatable_and_changes_nothing() -> void:
	_start("fresh_work")
	_advance_months(3)
	var fingerprint_before: String = JSON.stringify(engine.state.to_dict(), "", true)
	var rng_before: String = engine.state.rng.state_fingerprint()

	var first: Variant = assert_ok(MonthEngine.preview(engine.state), "first preview")
	var second: Variant = assert_ok(MonthEngine.preview(engine.state), "second preview")
	assert_eq(JSON.stringify(first, "", true), JSON.stringify(second, "", true),
		"two previews of the same state are identical")
	assert_eq(JSON.stringify(engine.state.to_dict(), "", true), fingerprint_before,
		"preview did not mutate the authoritative state")
	assert_eq(engine.state.rng.state_fingerprint(), rng_before,
		"preview did not advance any random stream")
	assert_true(bool((first as Dictionary)["is_preview"]), "the preview is labelled as a preview")

	# The committed month must match what the preview promised.
	var recap: Dictionary = _advance_months(1)
	assert_money(int(recap["closing_cash_minor"]), int((first as Dictionary)["closing_cash_minor"]),
		"the committed month matches its preview")
	assert_money(int(recap["net_cash_change_minor"]), int((first as Dictionary)["net_cash_change_minor"]),
		"the cash movement matches its preview")


func test_recap_separates_income_borrowing_and_expenses() -> void:
	_start("fresh_university")
	var recap: Dictionary = _advance_months(1)
	assert_eq((recap["income_lines"] as Array).size(), 1, "one income line: the stipend")
	assert_eq(String(((recap["income_lines"] as Array)[0] as Dictionary)["label"]), "Study stipend",
		"the stipend is income")
	assert_eq((recap["borrowing_lines"] as Array).size(), 1, "the loan draw is reported separately")
	assert_true(String(((recap["borrowing_lines"] as Array)[0] as Dictionary)["label"]).contains("not income"),
		"the loan draw is labelled as debt rather than income")
	var surplus: Dictionary = engine.state.normal_monthly_surplus()
	assert_money(int(surplus["income_minor"]), 180000,
		"the forward surplus counts the stipend but not the loan draw")
	assert_money(int(surplus["surplus_minor"]), -170000,
		"the funded study route runs a monthly deficit before the loan draw")


func test_an_unfunded_month_records_arrears_instead_of_crashing() -> void:
	_start("fresh_work")
	# Spend nearly all cash, then remove the salary so essentials cannot be paid.
	var spend := Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision, {"amount_minor": "1900000", "choice_id": "test_drain"})
	assert_ok(engine.execute(spend), "spend most of the opening cash")
	engine.state.employment = {}

	var recap: Dictionary = _advance_months(1)
	assert_true(bool(recap["unfunded"]), "the month is reported as unfunded")
	assert_eq((recap["deferred_lines"] as Array).size(), 1, "the unpaid bill is listed, not hidden")
	assert_money(engine.state.arrears(), 320000, "the unpaid bill became recorded arrears")
	assert_money(engine.state.spendable_cash(), 100000, "cash was not driven negative")
	assert_true(engine.state.ledger.is_balanced(), "the journal still balances")

	var commitments: Array = engine.state.upcoming_commitments(1)
	assert_eq(String((commitments[0] as Dictionary)["kind"]), "arrears",
		"the arrears appear at the top of upcoming commitments")

	# With cash available again the arrears are repaid from what is left after
	# the month's own bills, and they are never forgotten.
	engine.state.employment = {
		"job_id": "operations_assistant", "monthly_salary_minor": 520000,
		"active_from_month": engine.state.month_index, "experience_months": 0,
	}
	_advance_months(1)
	assert_money(engine.state.arrears(), 20000, "most of the arrears are repaid from surplus cash")
	_advance_months(1)
	assert_money(engine.state.arrears(), 0, "the arrears clear completely")
	assert_money(engine.state.spendable_cash(), 180000, "cash recovers once the debt is settled")
	assert_true(engine.state.ledger.is_balanced(), "the journal balances after recovery")
