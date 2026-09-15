class_name GameState
extends RefCounted

## The authoritative simulation state.
##
## Nothing in this class touches a Node, a scene, or wall-clock time: the
## simulation runs headlessly (brief section 26). The UI observes committed state
## and can never mutate a balance directly — every money movement goes through a
## validated command posted to the ledger.

const SAVE_SCHEMA_VERSION: int = 1
const RULES_VERSION: String = "0.1.0-m0"
const CONTENT_VERSION: String = "0.1.0-m0"

const MAX_NOTICES: int = 64

var game_id: String = ""
var state_revision: int = 0
var month_index: int = 0
var start_month_index: int = 0
var start_id: String = ""

## display_name, dream_id, avatar_id, age_months_at_start
var player: Dictionary = {}

## job_id, monthly_salary_minor, active_from_month, experience_months
var employment: Dictionary = {}

## program_id, monthly_tuition_minor, duration_months, months_completed,
## graduated, focus_per_month
var study: Dictionary = {}

## Education facility: monthly_draw_minor, draw_months, draws_taken,
## maximum_facility_minor, repayment_annual_rate_bps, repayment_term_months
var education_funding: Dictionary = {}

var monthly_stipend_minor: int = 0
var monthly_essentials_minor: int = 0
var focus_capacity: int = 100

var ledger: Ledger = null
var rng: RngStreams = null

var next_command_sequence: int = 1
var notices: Array[Dictionary] = []
var last_recap: Dictionary = {}


static func create(new_game_id: String, master_seed: int) -> GameState:
	var state := GameState.new()
	state.game_id = new_game_id
	state.ledger = Ledger.new()
	state.rng = RngStreams.create(master_seed)
	return state

# --- Derived finance views (ECONOMY_SPEC E2) ----------------------------------

## Cash the player can actually spend now.
## Restricted deposit cash and voluntary earmarks live in their own accounts, so
## they are never inside this number and can never be deducted twice.
func spendable_cash() -> int:
	return ledger.balance(Accounts.CASH_OPERATING)


## Everything the player owns in cash form, including restricted balances.
func liquid_cash_total() -> int:
	var total: int = 0
	for account in Accounts.CASH_ACCOUNTS:
		total += ledger.balance(String(account))
	return total


func restricted_cash() -> int:
	return liquid_cash_total() - spendable_cash()


func total_debt() -> int:
	return -ledger.balance_of_kind(Accounts.KIND_LIABILITY)


func arrears() -> int:
	return ledger.display_balance(Accounts.BILLS_DUE_ARREARS)


## Book-value net worth: assets minus recognised liabilities.
func net_worth() -> int:
	return ledger.balance_of_kind(Accounts.KIND_ASSET) + ledger.balance_of_kind(Accounts.KIND_LIABILITY)


func is_employed() -> bool:
	return not employment.is_empty() and month_index >= int(employment.get("active_from_month", 0))


func monthly_salary() -> int:
	return int(employment.get("monthly_salary_minor", 0)) if is_employed() else 0


func is_studying() -> bool:
	return not study.is_empty() and not bool(study.get("graduated", false))


func monthly_tuition() -> int:
	return int(study.get("monthly_tuition_minor", 0)) if is_studying() else 0


func education_draw_remaining() -> int:
	if education_funding.is_empty():
		return 0
	return maxi(0, int(education_funding.get("draw_months", 0)) - int(education_funding.get("draws_taken", 0)))


func monthly_education_draw() -> int:
	if education_draw_remaining() <= 0 or not is_studying():
		return 0
	return int(education_funding.get("monthly_draw_minor", 0))


## Labelled forward estimate, not this month's cash movement.
## Returns { surplus_minor, income_minor, outgoing_minor, assumptions: Array[String] }.
func normal_monthly_surplus() -> Dictionary:
	var assumptions: Array[String] = []
	var income: int = 0
	if is_employed():
		income += monthly_salary()
		assumptions.append("Salary %s continues each month." % Money.format(monthly_salary()))
	if monthly_stipend_minor > 0:
		income += monthly_stipend_minor
		assumptions.append("Study stipend %s continues while enrolled." % Money.format(monthly_stipend_minor))
	var outgoing: int = monthly_essentials_minor
	assumptions.append("Essential living costs %s each month." % Money.format(monthly_essentials_minor))
	if monthly_tuition() > 0:
		outgoing += monthly_tuition()
		assumptions.append("Tuition %s each month until the programme ends." % Money.format(monthly_tuition()))
	if monthly_education_draw() > 0:
		assumptions.append(
			"Education loan draw %s is excluded: borrowed money is debt, not income."
			% Money.format(monthly_education_draw()))
	assumptions.append("Excludes one-off spending, and any month with an unusual event.")
	return {
		"surplus_minor": income - outgoing,
		"income_minor": income,
		"outgoing_minor": outgoing,
		"assumptions": assumptions,
	}


## Dated obligations for the next `months` months (ECONOMY_SPEC E2).
## A positive net worth must never hide one of these.
func upcoming_commitments(months: int = 12) -> Array[Dictionary]:
	var rows: Array[Dictionary] = []
	var due_now: int = arrears()
	if due_now > 0:
		rows.append({
			"month_index": month_index,
			"label": "Unpaid bills carried forward",
			"amount_minor": due_now,
			"kind": "arrears",
		})
	for offset in range(months):
		var target_month: int = month_index + offset
		var amount: int = monthly_essentials_minor
		var label: String = "Essential living costs"
		var tuition: int = monthly_tuition()
		if tuition > 0 and offset < remaining_study_months():
			amount += tuition
			label = "Essential living costs and tuition"
		if amount <= 0:
			continue
		rows.append({
			"month_index": target_month,
			"label": label,
			"amount_minor": amount,
			"kind": "living",
		})
	return rows


func remaining_study_months() -> int:
	if not is_studying():
		return 0
	return maxi(0, int(study.get("duration_months", 0)) - int(study.get("months_completed", 0)))


func add_notice(code: String, title: String, body: String, severity: String = "info") -> void:
	notices.append({
		"code": code,
		"title": title,
		"body": body,
		"severity": severity,
		"month_index": month_index,
	})
	while notices.size() > MAX_NOTICES:
		notices.pop_front()

# --- Serialization ------------------------------------------------------------
#
# Every field is written with an explicit type. Money is a decimal string;
# counters and indices are integers; flags are booleans. Nothing relies on JSON
# number handling, and nothing that the UI can recompute (the last recap) is
# persisted, so a reload cannot introduce a float where an integer belongs.

func to_dict() -> Dictionary:
	var notices_out: Array = []
	for notice in notices:
		notices_out.append({
			"code": String(notice.get("code", "")),
			"title": String(notice.get("title", "")),
			"body": String(notice.get("body", "")),
			"severity": String(notice.get("severity", "info")),
			"month_index": int(notice.get("month_index", 0)),
		})
	return {
		"save_schema_version": SAVE_SCHEMA_VERSION,
		"rules_version": RULES_VERSION,
		"content_version": CONTENT_VERSION,
		"game_id": game_id,
		"state_revision": str(state_revision),
		"month_index": month_index,
		"start_month_index": start_month_index,
		"start_id": start_id,
		"player": {
			"display_name": String(player.get("display_name", "")),
			"dream_id": String(player.get("dream_id", "")),
			"avatar_id": String(player.get("avatar_id", "")),
			"age_months_at_start": int(player.get("age_months_at_start", 216)),
		},
		"employment": _employment_to_dict(),
		"study": _study_to_dict(),
		"education_funding": _education_to_dict(),
		"monthly_stipend_minor": Money.to_minor_string(monthly_stipend_minor),
		"monthly_essentials_minor": Money.to_minor_string(monthly_essentials_minor),
		"focus_capacity": focus_capacity,
		"next_command_sequence": str(next_command_sequence),
		"ledger": ledger.to_dict(),
		"rng": rng.to_dict(),
		"notices": notices_out,
	}


func _employment_to_dict() -> Dictionary:
	if employment.is_empty():
		return {}
	return {
		"job_id": String(employment.get("job_id", "")),
		"monthly_salary_minor": Money.to_minor_string(int(employment.get("monthly_salary_minor", 0))),
		"active_from_month": int(employment.get("active_from_month", 0)),
		"experience_months": int(employment.get("experience_months", 0)),
	}


func _study_to_dict() -> Dictionary:
	if study.is_empty():
		return {}
	return {
		"program_id": String(study.get("program_id", "")),
		"monthly_tuition_minor": Money.to_minor_string(int(study.get("monthly_tuition_minor", 0))),
		"duration_months": int(study.get("duration_months", 0)),
		"months_completed": int(study.get("months_completed", 0)),
		"graduated": bool(study.get("graduated", false)),
		"focus_per_month": int(study.get("focus_per_month", 0)),
	}


func _education_to_dict() -> Dictionary:
	if education_funding.is_empty():
		return {}
	return {
		"monthly_draw_minor": Money.to_minor_string(int(education_funding.get("monthly_draw_minor", 0))),
		"maximum_facility_minor": Money.to_minor_string(int(education_funding.get("maximum_facility_minor", 0))),
		"draw_months": int(education_funding.get("draw_months", 0)),
		"draws_taken": int(education_funding.get("draws_taken", 0)),
		"annual_rate_during_study_bps": int(education_funding.get("annual_rate_during_study_bps", 0)),
		"repayment_annual_rate_bps": int(education_funding.get("repayment_annual_rate_bps", 0)),
		"repayment_term_months": int(education_funding.get("repayment_term_months", 0)),
		"post_study_grace_months": int(education_funding.get("post_study_grace_months", 0)),
	}


## Strict reconstruction. Every money field must arrive as a decimal string and
## every ID must be well formed; anything else is rejected rather than coerced.
static func from_dict(data: Dictionary) -> Dictionary:
	if typeof(data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "save payload is not a dictionary")
	if int(data.get("save_schema_version", -1)) != SAVE_SCHEMA_VERSION:
		return Money.err("schema_version",
			"save schema version %s is not supported by this build (expected %d)"
			% [str(data.get("save_schema_version", "missing")), SAVE_SCHEMA_VERSION])
	var game_id_text: String = String(data.get("game_id", ""))
	if not Ids.is_valid_runtime_id(game_id_text):
		return Money.err("invalid_game_id", "save has invalid game id '%s'" % game_id_text)

	var rng_result: Dictionary = RngStreams.from_dict(data.get("rng", {}))
	if not rng_result["ok"]:
		return rng_result
	var ledger_result: Dictionary = Ledger.from_dict(data.get("ledger", {}))
	if not ledger_result["ok"]:
		return ledger_result

	var state := GameState.new()
	state.game_id = game_id_text
	state.rng = rng_result["value"]
	state.ledger = ledger_result["value"]

	var revision_result: Dictionary = RngStreams._parse_int64(String(data.get("state_revision", "0")))
	if not revision_result["ok"]:
		return revision_result
	state.state_revision = int(revision_result["value"])
	if state.state_revision < 0:
		return Money.err("invalid_revision", "state revision must not be negative")

	if typeof(data.get("month_index", null)) != TYPE_INT and typeof(data.get("month_index", null)) != TYPE_FLOAT:
		return Money.err("type_rejected", "month_index must be a number")
	var month_index_value: int = int(data.get("month_index", -1))
	if not SimCalendar.is_valid_month_index(month_index_value):
		return Money.err("invalid_month", "save month index %d is out of range" % month_index_value)
	state.month_index = month_index_value
	state.start_month_index = int(data.get("start_month_index", 0))
	state.start_id = String(data.get("start_id", ""))
	if not state.start_id.is_empty() and not Ids.is_valid_content_id(state.start_id):
		return Money.err("invalid_content_id", "save has invalid start id '%s'" % state.start_id)

	var player_data: Variant = data.get("player", {})
	if typeof(player_data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "player block is not a dictionary")
	state.player = {
		"display_name": String((player_data as Dictionary).get("display_name", "")),
		"dream_id": String((player_data as Dictionary).get("dream_id", "")),
		"avatar_id": String((player_data as Dictionary).get("avatar_id", "")),
		"age_months_at_start": int((player_data as Dictionary).get("age_months_at_start", 216)),
	}

	var employment_data: Variant = data.get("employment", {})
	if typeof(employment_data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "employment block is not a dictionary")
	if not (employment_data as Dictionary).is_empty():
		var salary_result: Dictionary = Money.from_variant(
			(employment_data as Dictionary).get("monthly_salary_minor", null), "monthly_salary_minor")
		if not salary_result["ok"]:
			return salary_result
		state.employment = {
			"job_id": String((employment_data as Dictionary).get("job_id", "")),
			"monthly_salary_minor": int(salary_result["value"]),
			"active_from_month": int((employment_data as Dictionary).get("active_from_month", 0)),
			"experience_months": int((employment_data as Dictionary).get("experience_months", 0)),
		}

	var study_data: Variant = data.get("study", {})
	if typeof(study_data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "study block is not a dictionary")
	if not (study_data as Dictionary).is_empty():
		var tuition_result: Dictionary = Money.from_variant(
			(study_data as Dictionary).get("monthly_tuition_minor", null), "monthly_tuition_minor")
		if not tuition_result["ok"]:
			return tuition_result
		state.study = {
			"program_id": String((study_data as Dictionary).get("program_id", "")),
			"monthly_tuition_minor": int(tuition_result["value"]),
			"duration_months": int((study_data as Dictionary).get("duration_months", 0)),
			"months_completed": int((study_data as Dictionary).get("months_completed", 0)),
			"graduated": bool((study_data as Dictionary).get("graduated", false)),
			"focus_per_month": int((study_data as Dictionary).get("focus_per_month", 0)),
		}

	var funding_data: Variant = data.get("education_funding", {})
	if typeof(funding_data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "education_funding block is not a dictionary")
	if not (funding_data as Dictionary).is_empty():
		var draw_result: Dictionary = Money.from_variant(
			(funding_data as Dictionary).get("monthly_draw_minor", null), "monthly_draw_minor")
		if not draw_result["ok"]:
			return draw_result
		var facility_result: Dictionary = Money.from_variant(
			(funding_data as Dictionary).get("maximum_facility_minor", null), "maximum_facility_minor")
		if not facility_result["ok"]:
			return facility_result
		state.education_funding = {
			"monthly_draw_minor": int(draw_result["value"]),
			"maximum_facility_minor": int(facility_result["value"]),
			"draw_months": int((funding_data as Dictionary).get("draw_months", 0)),
			"draws_taken": int((funding_data as Dictionary).get("draws_taken", 0)),
			"annual_rate_during_study_bps": int((funding_data as Dictionary).get("annual_rate_during_study_bps", 0)),
			"repayment_annual_rate_bps": int((funding_data as Dictionary).get("repayment_annual_rate_bps", 0)),
			"repayment_term_months": int((funding_data as Dictionary).get("repayment_term_months", 0)),
			"post_study_grace_months": int((funding_data as Dictionary).get("post_study_grace_months", 0)),
		}

	var stipend_result: Dictionary = Money.from_variant(
		data.get("monthly_stipend_minor", "0"), "monthly_stipend_minor")
	if not stipend_result["ok"]:
		return stipend_result
	state.monthly_stipend_minor = int(stipend_result["value"])

	var essentials_result: Dictionary = Money.from_variant(
		data.get("monthly_essentials_minor", "0"), "monthly_essentials_minor")
	if not essentials_result["ok"]:
		return essentials_result
	state.monthly_essentials_minor = int(essentials_result["value"])

	state.focus_capacity = int(data.get("focus_capacity", 100))

	var sequence_result: Dictionary = RngStreams._parse_int64(String(data.get("next_command_sequence", "1")))
	if not sequence_result["ok"]:
		return sequence_result
	state.next_command_sequence = int(sequence_result["value"])

	var notices_data: Variant = data.get("notices", [])
	if typeof(notices_data) != TYPE_ARRAY:
		return Money.err("type_rejected", "notices block is not an array")
	if (notices_data as Array).size() > MAX_NOTICES:
		return Money.err("too_large", "save contains too many notices")
	for raw_notice in notices_data as Array:
		if typeof(raw_notice) != TYPE_DICTIONARY:
			return Money.err("type_rejected", "notice is not a dictionary")
		state.notices.append({
			"code": String((raw_notice as Dictionary).get("code", "")),
			"title": String((raw_notice as Dictionary).get("title", "")),
			"body": String((raw_notice as Dictionary).get("body", "")),
			"severity": String((raw_notice as Dictionary).get("severity", "info")),
			"month_index": int((raw_notice as Dictionary).get("month_index", 0)),
		})

	return Money.ok_value(state)


## Deep copy used for previews and for proposing S(m+1) without touching live state.
## The last recap is presentation-only and is carried across directly.
func clone() -> GameState:
	var snapshot: Dictionary = to_dict()
	var restored: Dictionary = GameState.from_dict(snapshot)
	assert(restored["ok"], "GameState.clone failed: %s" % restored.get("message", ""))
	var copy: GameState = restored["value"]
	copy.last_recap = last_recap.duplicate(true)
	return copy
