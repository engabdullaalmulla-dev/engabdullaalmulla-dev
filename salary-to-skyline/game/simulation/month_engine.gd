class_name MonthEngine
extends RefCounted

## Resolves one simulated month (ECONOMY_SPEC E3).
##
## `AdvanceMonth` never mutates the live state. It builds a proposed S(m+1) on a
## deep clone and returns it; the caller (GameEngine) persists it atomically. A
## preview runs the identical code path with `commit = false`, so a preview and
## the real month cannot disagree, and running a preview twice changes neither
## the authoritative state nor any random stream (acceptance case T32).
##
## M0 implements steps 1, 2, 5 and 8 of the spec sequence. Steps 3-4 (rent and
## business operations), 6 (settlements and construction) and 7 (market update)
## have no content yet and are marked in the code below; they are M1-M3 work, not
## silently skipped behaviour.

const REASON_SALARY: String = "monthly_salary"
const REASON_STIPEND: String = "study_stipend"
const REASON_EDUCATION_DRAW: String = "education_loan_draw"
const REASON_ESSENTIALS: String = "essential_living_costs"
const REASON_TUITION: String = "tuition"
const REASON_ARREARS_DEFER: String = "bill_deferred_to_arrears"
const REASON_ARREARS_REPAY: String = "arrears_repayment"


## Resolves the current month.
## Returns { ok, value: { state: GameState, recap: Dictionary } }.
## With `commit = false` the returned state is a throwaway preview clone.
static func advance(state: GameState, command_id: String, commit: bool = true) -> Dictionary:
	# --- Step 1: validation and command uniqueness ---------------------------
	if state == null or state.ledger == null:
		return Money.err("invalid_state", "no state to advance")
	if not SimCalendar.is_valid_month_index(state.month_index + 1):
		return Money.err("calendar_limit", "the simulated calendar has reached its limit")
	if commit and state.ledger.has_command(command_id):
		return Money.err("duplicate_command", "month command '%s' was already applied" % command_id)

	var next: GameState = state.clone()
	var month: int = next.month_index

	# Obligations are fixed at the START of the month, before any progression is
	# applied. Tuition for the final month of a programme is still owed even
	# though the programme completes during that same month.
	var essentials_due: int = next.monthly_essentials_minor
	var tuition_due: int = next.monthly_tuition()
	# Only arrears carried in from earlier months are repaid automatically. A
	# bill deferred this month is not clawed back out of the same month's cash:
	# the player keeps something to act with, which is what makes the recovery
	# path playable rather than punitive (brief section 20).
	var arrears_carried_in: int = next.arrears()
	var opening_cash: int = next.spendable_cash()
	var opening_net_worth: int = next.net_worth()
	var rng_fingerprint_before: String = next.rng.state_fingerprint()

	var recap: Dictionary = {
		"month_index": month,
		"month_label": SimCalendar.label(month),
		"opening_cash_minor": opening_cash,
		"income_lines": [],
		"borrowing_lines": [],
		"expense_lines": [],
		"deferred_lines": [],
		"progress_lines": [],
		"notices": [],
		"is_preview": not commit,
	}

	if commit:
		var registered: Dictionary = next.ledger.register_command(command_id, "advance_month")
		if not registered["ok"]:
			return registered
	var posting_index: int = 0

	# --- Step 2: employment income and study/job progress --------------------
	if next.is_employed():
		var salary: int = int(next.employment.get("monthly_salary_minor", 0))
		if salary > 0:
			posting_index += 1
			var posted: Dictionary = _post(next, command_id, posting_index, month, REASON_SALARY, [
				{"account": Accounts.CASH_OPERATING, "amount": salary},
				{"account": Accounts.REVENUE_SALARY, "amount": -salary},
			])
			if not posted["ok"]:
				return posted
			recap["income_lines"].append({
				"label": "Salary", "amount_minor": salary, "kind": "salary",
			})
		next.employment["experience_months"] = int(next.employment.get("experience_months", 0)) + 1
		recap["progress_lines"].append({
			"label": "Relevant work experience",
			"detail": "%d month(s)" % int(next.employment["experience_months"]),
		})

	if next.monthly_stipend_minor > 0 and next.is_studying():
		var stipend: int = next.monthly_stipend_minor
		posting_index += 1
		var stipend_posted: Dictionary = _post(next, command_id, posting_index, month, REASON_STIPEND, [
			{"account": Accounts.CASH_OPERATING, "amount": stipend},
			{"account": Accounts.REVENUE_STIPEND, "amount": -stipend},
		])
		if not stipend_posted["ok"]:
			return stipend_posted
		recap["income_lines"].append({
			"label": "Study stipend", "amount_minor": stipend, "kind": "stipend",
		})

	# Education loan drawdown. This is DEBT, not income: it never appears in an
	# income line and never counts toward surplus.
	var draw: int = next.monthly_education_draw()
	if draw > 0:
		var facility: int = int(next.education_funding.get("maximum_facility_minor", 0))
		var drawn_so_far: int = -next.ledger.balance(Accounts.DEBT_EDUCATION)
		if facility > 0 and drawn_so_far + draw > facility:
			draw = maxi(0, facility - drawn_so_far)
			next.add_notice("education_facility_limit", "Education facility limit reached",
				"The remaining education facility no longer covers a full monthly draw.", "warning")
		if draw > 0:
			posting_index += 1
			var draw_posted: Dictionary = _post(next, command_id, posting_index, month, REASON_EDUCATION_DRAW, [
				{"account": Accounts.CASH_OPERATING, "amount": draw},
				{"account": Accounts.DEBT_EDUCATION, "amount": -draw},
			])
			if not draw_posted["ok"]:
				return draw_posted
			next.education_funding["draws_taken"] = int(next.education_funding.get("draws_taken", 0)) + 1
			recap["borrowing_lines"].append({
				"label": "Education loan drawn (adds to debt, not income)",
				"amount_minor": draw, "kind": "education_draw",
			})

	if next.is_studying():
		next.study["months_completed"] = int(next.study.get("months_completed", 0)) + 1
		var completed: int = int(next.study["months_completed"])
		var duration: int = int(next.study.get("duration_months", 0))
		recap["progress_lines"].append({
			"label": "Study progress",
			"detail": "%d of %d month(s)" % [completed, duration],
		})
		if duration > 0 and completed >= duration:
			next.study["graduated"] = true
			next.add_notice("graduation", "Programme complete",
				"Study programme '%s' is complete after %d simulated months."
				% [String(next.study.get("program_id", "")), duration], "good")
			recap["notices"].append({
				"code": "graduation", "title": "Programme complete", "severity": "good",
			})

	# --- Steps 3-4: rent, business operations, property operating costs ------
	# Not implemented at M0: no leases, businesses or owned property exist yet.
	# PROP-001/RENT-001 add them in M2 with their own tests.

	# --- Step 5: scheduled personal expenses and debt service ----------------
	var obligations: Array[Dictionary] = []
	if essentials_due > 0:
		obligations.append({
			"label": "Essential living costs",
			"amount_minor": essentials_due,
			"account": Accounts.EXPENSE_ESSENTIALS,
			"reason": REASON_ESSENTIALS,
		})
	if tuition_due > 0:
		obligations.append({
			"label": "Tuition",
			"amount_minor": tuition_due,
			"account": Accounts.EXPENSE_TUITION,
			"reason": REASON_TUITION,
		})

	for obligation in obligations:
		var amount: int = int(obligation["amount_minor"])
		if next.spendable_cash() >= amount:
			posting_index += 1
			var expense_posted: Dictionary = _post(
				next, command_id, posting_index, month, String(obligation["reason"]), [
					{"account": String(obligation["account"]), "amount": amount},
					{"account": Accounts.CASH_OPERATING, "amount": -amount},
				])
			if not expense_posted["ok"]:
				return expense_posted
			recap["expense_lines"].append({
				"label": String(obligation["label"]), "amount_minor": amount, "kind": "paid",
			})
		else:
			# The bill is never silently marked paid: it becomes a recorded
			# liability with a recovery notice (ECONOMY_SPEC E3 step 5).
			posting_index += 1
			var deferred: Dictionary = _post(
				next, command_id, posting_index, month, REASON_ARREARS_DEFER, [
					{"account": String(obligation["account"]), "amount": amount},
					{"account": Accounts.BILLS_DUE_ARREARS, "amount": -amount},
				])
			if not deferred["ok"]:
				return deferred
			recap["deferred_lines"].append({
				"label": String(obligation["label"]), "amount_minor": amount, "kind": "unpaid",
			})
			next.add_notice("unfunded_obligation", "A bill could not be paid",
				"%s of %s could not be paid this month and is recorded as arrears. No late fee is charged in this build."
				% [String(obligation["label"]), Money.format(amount)], "alert")
			recap["notices"].append({
				"code": "unfunded_obligation", "title": "A bill could not be paid", "severity": "alert",
			})

	# Clear carried-in arrears from whatever cash survived this month's bills.
	if arrears_carried_in > 0 and next.spendable_cash() > 0:
		var repayment: int = mini(arrears_carried_in, next.spendable_cash())
		posting_index += 1
		var repaid: Dictionary = _post(next, command_id, posting_index, month, REASON_ARREARS_REPAY, [
			{"account": Accounts.BILLS_DUE_ARREARS, "amount": repayment},
			{"account": Accounts.CASH_OPERATING, "amount": -repayment},
		])
		if not repaid["ok"]:
			return repaid
		recap["expense_lines"].append({
			"label": "Arrears cleared", "amount_minor": repayment, "kind": "arrears_repayment",
		})

	# --- Steps 6-7: settlements, construction milestones, market update ------
	# Not implemented at M0. PROP-002/PLAN-001 (M2) and the market model (M3).

	# --- Step 8: close the month --------------------------------------------
	next.month_index = month + 1
	next.state_revision = state.state_revision + 1
	recap["closing_cash_minor"] = next.spendable_cash()
	recap["net_cash_change_minor"] = next.spendable_cash() - opening_cash
	recap["opening_net_worth_minor"] = opening_net_worth
	recap["closing_net_worth_minor"] = next.net_worth()
	recap["arrears_minor"] = next.arrears()
	recap["total_debt_minor"] = next.total_debt()
	recap["next_month_label"] = SimCalendar.label(next.month_index)
	recap["unfunded"] = not (recap["deferred_lines"] as Array).is_empty()

	if not next.ledger.is_balanced():
		return Money.err("invariant_failed", "ledger did not balance after resolving month %d" % month)
	if next.rng.state_fingerprint() != rng_fingerprint_before:
		return Money.err("invariant_failed",
			"month resolution consumed randomness; M0 has no random economic events")

	next.last_recap = recap.duplicate(true)
	return Money.ok_value({"state": next, "recap": recap})


## Preview of the coming month. Returns the same recap shape with
## `is_preview = true`. Guarantees: the live state is not mutated, no random
## stream advances, and running it repeatedly returns identical values.
static func preview(state: GameState) -> Dictionary:
	var result: Dictionary = advance(state, "preview.not-committed", false)
	if not result["ok"]:
		return result
	return Money.ok_value((result["value"] as Dictionary)["recap"])


static func _post(
	state: GameState,
	command_id: String,
	index: int,
	month: int,
	reason: String,
	lines: Array
) -> Dictionary:
	return state.ledger.post(
		state.game_id, "%s.s%d" % [command_id, index], month, reason, lines)
