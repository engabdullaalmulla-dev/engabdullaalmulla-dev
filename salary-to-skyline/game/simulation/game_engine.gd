class_name GameEngine
extends RefCounted

## Application service that owns the authoritative GameState.
##
## The UI calls `execute()` and reads committed state; it never writes a balance.
## Every successful command increments the state revision and persists the state
## (ECONOMY_SPEC E3), so an interruption cannot lose a committed action.

const DEPOSIT_GOAL_UNIT_ID: String = "unit_oq_101"

var state: GameState = null
var content: ContentLibrary = null
var save_store: SaveStore = null
var last_error: Dictionary = {}

## Set false in tests that want to exercise the simulation without disk writes.
var autosave_enabled: bool = true


static func create(library: ContentLibrary, store: SaveStore = null) -> GameEngine:
	var engine := GameEngine.new()
	engine.content = library
	engine.save_store = store if store != null else SaveStore.new()
	return engine


## Builds a fresh life from one of the fixture starts.
func new_game(start_id: String, player: Dictionary, master_seed: int = -1) -> Dictionary:
	if content == null:
		return Money.err("no_content", "content library is not loaded")
	if not content.has_start(start_id):
		return Money.err("unknown_start", "start '%s' is not defined in content" % start_id)
	var start: Dictionary = content.start(start_id)
	var seed_value: int = master_seed if master_seed >= 0 else content.default_seed()

	var opening_result: Dictionary = content.money_field(start, "opening_cash_minor")
	if not opening_result["ok"]:
		return opening_result
	var essentials_result: Dictionary = content.money_field(start, "monthly_essentials_minor")
	if not essentials_result["ok"]:
		return essentials_result

	var fresh := GameState.create(Ids.make_game_id(seed_value), seed_value)
	fresh.start_id = start_id
	fresh.month_index = 0
	fresh.start_month_index = 0
	fresh.player = {
		"display_name": String(player.get("display_name", "New arrival")),
		"dream_id": String(player.get("dream_id", "own_first_apartment")),
		"avatar_id": String(player.get("avatar_id", "avatar_01")),
		"age_months_at_start": int(start.get("age_months", 216)),
	}
	fresh.monthly_essentials_minor = int(essentials_result["value"])
	fresh.focus_capacity = int(content.data.get("time_and_focus", {}).get("focus_capacity_per_simulated_month", 100))

	var job_id: Variant = start.get("active_job_id", null)
	if job_id != null and String(job_id) != "":
		var salary_result: Dictionary = content.money_field(start, "monthly_salary_minor")
		if not salary_result["ok"]:
			return salary_result
		fresh.employment = {
			"job_id": String(job_id),
			"monthly_salary_minor": int(salary_result["value"]),
			"active_from_month": 0,
			"experience_months": 0,
		}

	var program_id: Variant = start.get("study_program_id", null)
	if program_id != null and String(program_id) != "":
		var program: Dictionary = content.study_program(String(program_id))
		if program.is_empty():
			return Money.err("unknown_program", "study programme '%s' is not defined" % program_id)
		var tuition_result: Dictionary = content.money_field(start, "monthly_tuition_minor")
		if not tuition_result["ok"]:
			return tuition_result
		fresh.study = {
			"program_id": String(program_id),
			"monthly_tuition_minor": int(tuition_result["value"]),
			"duration_months": int(program.get("duration_months", 0)),
			"months_completed": 0,
			"graduated": false,
			"focus_per_month": int(program.get("focus_per_month", 0)),
		}
		var stipend_result: Dictionary = content.money_field(start, "monthly_stipend_minor", false)
		if not stipend_result["ok"]:
			return stipend_result
		fresh.monthly_stipend_minor = int(stipend_result["value"])
		var draw_result: Dictionary = content.money_field(start, "monthly_education_loan_draw_minor", false)
		if not draw_result["ok"]:
			return draw_result
		if int(draw_result["value"]) > 0:
			var funding: Dictionary = content.education_funding()
			var facility_result: Dictionary = content.money_field(funding, "maximum_facility_minor", false)
			if not facility_result["ok"]:
				return facility_result
			fresh.education_funding = {
				"monthly_draw_minor": int(draw_result["value"]),
				"draw_months": int(funding.get("loan_draw_months", 0)),
				"draws_taken": 0,
				"maximum_facility_minor": int(facility_result["value"]),
				"annual_rate_during_study_bps": int(funding.get("annual_rate_during_study_bps", 0)),
				"repayment_annual_rate_bps": int(funding.get("repayment_annual_rate_bps", 0)),
				"repayment_term_months": int(funding.get("repayment_term_months", 0)),
				"post_study_grace_months": int(funding.get("post_study_grace_months", 0)),
			}

	# Opening balance is owner capital, not earned income.
	var opening_posted: Dictionary = fresh.ledger.post(
		fresh.game_id, Ids.make_runtime_id(fresh.game_id, "cmd", 0), 0, "opening_balance", [
			{"account": Accounts.CASH_OPERATING, "amount": int(opening_result["value"])},
			{"account": Accounts.OWNER_CAPITAL, "amount": -int(opening_result["value"])},
		])
	if not opening_posted["ok"]:
		return opening_posted
	fresh.state_revision = 1
	fresh.add_notice("welcome", "A rented room and a plan",
		"Essential costs are already committed each month. What is left is what builds a future.", "info")

	state = fresh
	if autosave_enabled:
		var saved: Dictionary = save_store.save_state(state)
		if not saved["ok"]:
			return saved
	return Money.ok_value(state)


func next_command_id(kind: String) -> String:
	if state == null:
		return ""
	return Ids.make_runtime_id(state.game_id, kind, state.next_command_sequence)


## Executes a validated command against the live state.
## On any failure the live state is untouched.
func execute(command: Command) -> Dictionary:
	last_error = {}
	if state == null:
		return _fail(Money.err("no_state", "no game is loaded"))
	var validated: Dictionary = command.validate()
	if not validated["ok"]:
		return _fail(validated)
	if command.expected_revision != state.state_revision:
		return _fail(Money.err("stale_revision",
			"this action was prepared at revision %d but the game is at revision %d"
			% [command.expected_revision, state.state_revision]))
	if state.ledger.has_command(command.id):
		return _fail(Money.err("duplicate_command", "command '%s' was already applied" % command.id))

	var result: Dictionary
	match command.type:
		Command.TYPE_ADVANCE_MONTH:
			result = _advance_month(command)
		Command.TYPE_SPEND_DISCRETIONARY:
			result = _simple_transfer(command, Accounts.EXPENSE_DISCRETIONARY, "discretionary_spend", true)
		Command.TYPE_EARMARK_SAVINGS:
			result = _simple_transfer(command, Accounts.CASH_RESERVE_EARMARKED, "earmark_savings", true)
		Command.TYPE_RELEASE_SAVINGS:
			result = _simple_transfer(command, Accounts.CASH_RESERVE_EARMARKED, "release_savings", false)
		_:
			result = Money.err("unknown_command", "unknown command type '%s'" % command.type)
	if not result["ok"]:
		return _fail(result)

	if autosave_enabled:
		var saved: Dictionary = save_store.save_state(state)
		if not saved["ok"]:
			return _fail(saved)
	return result


func _advance_month(command: Command) -> Dictionary:
	var advanced: Dictionary = MonthEngine.advance(state, command.id, true)
	if not advanced["ok"]:
		return advanced
	var payload: Dictionary = advanced["value"]
	var next_state: GameState = payload["state"]
	next_state.next_command_sequence = state.next_command_sequence + 1
	state = next_state
	return Money.ok_value(payload["recap"])


## Moves cash between operating cash and one other account.
## `outgoing` true: operating cash decreases. False: operating cash increases.
func _simple_transfer(command: Command, other_account: String, reason: String, outgoing: bool) -> Dictionary:
	var amount_result: Dictionary = Money.from_variant(command.payload.get("amount_minor", null), "amount_minor")
	if not amount_result["ok"]:
		return amount_result
	var amount: int = int(amount_result["value"])
	if amount <= 0:
		return Money.err("invalid_amount", "amount must be positive")
	if outgoing and state.spendable_cash() < amount:
		return Money.err("insufficient_cash",
			"spendable cash %s is less than %s" % [Money.format(state.spendable_cash()), Money.format(amount)])
	if not outgoing and state.ledger.balance(other_account) < amount:
		return Money.err("insufficient_balance", "that balance does not hold %s" % Money.format(amount))

	var lines: Array = []
	if outgoing:
		lines = [
			{"account": other_account, "amount": amount},
			{"account": Accounts.CASH_OPERATING, "amount": -amount},
		]
	else:
		lines = [
			{"account": Accounts.CASH_OPERATING, "amount": amount},
			{"account": other_account, "amount": -amount},
		]
	var posted: Dictionary = state.ledger.post(
		state.game_id, command.id, state.month_index, reason, lines,
		{"choice_id": String(command.payload.get("choice_id", ""))})
	if not posted["ok"]:
		return posted
	state.state_revision += 1
	state.next_command_sequence += 1
	return Money.ok_value({
		"transaction_id": posted["value"],
		"amount_minor": amount,
		"spendable_cash_minor": state.spendable_cash(),
	})


func load_game(slot: int = 0) -> Dictionary:
	var loaded: Dictionary = save_store.load_state(slot)
	if not loaded["ok"]:
		return _fail(loaded)
	var payload: Dictionary = loaded["value"]
	state = payload["state"]
	return Money.ok_value(payload)


## Progress toward the cash needed for the fixture studio, using the lending
## defaults in the content file. Informational only: buying property is M2 work.
func first_home_goal() -> Dictionary:
	var units: Variant = content.data.get("ready_unit_examples", [])
	var target: Dictionary = {}
	if typeof(units) == TYPE_ARRAY:
		for raw_unit in units as Array:
			if typeof(raw_unit) == TYPE_DICTIONARY and String((raw_unit as Dictionary).get("id", "")) == DEPOSIT_GOAL_UNIT_ID:
				target = raw_unit
				break
	if target.is_empty():
		return Money.err("missing_content", "goal unit '%s' is not in the content file" % DEPOSIT_GOAL_UNIT_ID)
	var price_result: Dictionary = content.money_field(target, "asking_price_minor")
	if not price_result["ok"]:
		return price_result
	var price: int = int(price_result["value"])
	var lending: Dictionary = content.data.get("fictional_lending_defaults", {})
	var ltv_bps: int = int(lending.get("maximum_ltv_bps", 8000))
	var fee_bps: int = int(lending.get("combined_acquisition_cost_bps", 600))
	var loan_result: Dictionary = Money.mul_bps(price, ltv_bps)
	if not loan_result["ok"]:
		return loan_result
	var fees_result: Dictionary = Money.mul_bps(price, fee_bps)
	if not fees_result["ok"]:
		return fees_result
	var cash_needed: int = price - int(loan_result["value"]) + int(fees_result["value"])
	var saved_so_far: int = state.ledger.balance(Accounts.CASH_RESERVE_EARMARKED) if state != null else 0
	return Money.ok_value({
		"unit_id": DEPOSIT_GOAL_UNIT_ID,
		"price_minor": price,
		"loan_minor": int(loan_result["value"]),
		"fees_minor": int(fees_result["value"]),
		"cash_needed_minor": cash_needed,
		"earmarked_minor": saved_so_far,
		"shortfall_minor": maxi(0, cash_needed - saved_so_far),
	})


func _fail(result: Dictionary) -> Dictionary:
	last_error = result
	return result
