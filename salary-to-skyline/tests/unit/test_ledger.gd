extends TestCase

## Double-entry journal: balance, idempotency, all-or-nothing posting.
## Covers acceptance case T03 and the posting half of T04/T10.

var ledger: Ledger


func before_each() -> void:
	ledger = Ledger.new()
	ledger.post("game-1", "cmd.open", 0, "opening_balance", [
		{"account": Accounts.CASH_OPERATING, "amount": 2000000},
		{"account": Accounts.OWNER_CAPITAL, "amount": -2000000},
	])


func test_t03_replaying_a_command_id_cannot_post_twice() -> void:
	var before: int = ledger.balance(Accounts.CASH_OPERATING)
	var lines: Array = [
		{"account": Accounts.CASH_OPERATING, "amount": 520000},
		{"account": Accounts.REVENUE_SALARY, "amount": -520000},
	]
	assert_ok(ledger.post("game-1", "cmd.salary", 0, "monthly_salary", lines), "first salary posting")
	assert_money(ledger.balance(Accounts.CASH_OPERATING), before + 520000, "salary was credited once")

	assert_err(ledger.post("game-1", "cmd.salary", 0, "monthly_salary", lines),
		"duplicate_command", "the same command id is refused")
	assert_money(ledger.balance(Accounts.CASH_OPERATING), before + 520000,
		"the refused replay changed no balance")
	assert_eq(ledger.entry_count(), 4, "the refused replay wrote no journal entries")


func test_t03_a_command_without_money_movement_is_still_recorded_once() -> void:
	assert_ok(ledger.register_command("cmd.month.1", "advance_month"), "register a month command")
	assert_true(ledger.has_command("cmd.month.1"), "the command is remembered")
	assert_err(ledger.register_command("cmd.month.1", "advance_month"),
		"duplicate_command", "replaying the month command is refused")


func test_unbalanced_or_invalid_transactions_change_nothing() -> void:
	var before_cash: int = ledger.balance(Accounts.CASH_OPERATING)
	var before_entries: int = ledger.entry_count()

	assert_err(ledger.post("game-1", "cmd.bad1", 0, "broken", [
		{"account": Accounts.CASH_OPERATING, "amount": 100},
		{"account": Accounts.REVENUE_SALARY, "amount": -99},
	]), "unbalanced", "an unbalanced transaction is refused")

	assert_err(ledger.post("game-1", "cmd.bad2", 0, "broken", [
		{"account": "asset_not_a_real_account", "amount": 100},
		{"account": Accounts.REVENUE_SALARY, "amount": -100},
	]), "unknown_account", "an unknown account is refused")

	assert_err(ledger.post("game-1", "cmd.bad3", 0, "broken", [
		{"account": Accounts.CASH_OPERATING, "amount": 1.5},
		{"account": Accounts.REVENUE_SALARY, "amount": -100},
	]), "type_rejected", "a float amount is refused")

	assert_err(ledger.post("game-1", "cmd.bad4", 0, "broken", []), "empty_transaction",
		"an empty transaction is refused")
	assert_err(ledger.post("game-1", "not a valid id", 0, "broken", [
		{"account": Accounts.CASH_OPERATING, "amount": 100},
		{"account": Accounts.REVENUE_SALARY, "amount": -100},
	]), "invalid_command_id", "an invalid command id is refused")

	assert_money(ledger.balance(Accounts.CASH_OPERATING), before_cash, "cash is unchanged")
	assert_eq(ledger.entry_count(), before_entries, "no partial entries were written")
	assert_true(ledger.is_balanced(), "the journal still balances")
	for command_id in ["cmd.bad1", "cmd.bad2", "cmd.bad3", "cmd.bad4"]:
		assert_false(ledger.has_command(command_id), "%s was not recorded as applied" % command_id)


func test_display_balances_read_naturally_for_credit_accounts() -> void:
	ledger.post("game-1", "cmd.loan", 0, "education_loan_draw", [
		{"account": Accounts.CASH_OPERATING, "amount": 150000},
		{"account": Accounts.DEBT_EDUCATION, "amount": -150000},
	])
	assert_money(ledger.balance(Accounts.DEBT_EDUCATION), -150000, "debt is credit-normal internally")
	assert_money(ledger.display_balance(Accounts.DEBT_EDUCATION), 150000, "debt reads as a positive amount")
	assert_true(ledger.is_balanced(), "the journal balances after borrowing")
	assert_money(
		ledger.balance_of_kind(Accounts.KIND_ASSET) + ledger.balance_of_kind(Accounts.KIND_LIABILITY),
		2000000, "borrowing does not change net worth")


func test_journal_survives_a_serialization_round_trip() -> void:
	ledger.post("game-1", "cmd.salary", 0, "monthly_salary", [
		{"account": Accounts.CASH_OPERATING, "amount": 520000},
		{"account": Accounts.REVENUE_SALARY, "amount": -520000},
	])
	var text: String = JSON.stringify(ledger.to_dict(), "", true)
	var restored: Variant = assert_ok(Ledger.from_dict(JSON.parse_string(text)), "reload the journal")
	if restored == null:
		return
	var copy: Ledger = restored
	assert_money(copy.balance(Accounts.CASH_OPERATING), ledger.balance(Accounts.CASH_OPERATING),
		"cash survives the round trip")
	assert_eq(copy.entry_count(), ledger.entry_count(), "entry count survives the round trip")
	assert_true(copy.has_command("cmd.salary"), "applied command ids survive the round trip")
	assert_err(copy.post("game-1", "cmd.salary", 0, "monthly_salary", [
		{"account": Accounts.CASH_OPERATING, "amount": 520000},
		{"account": Accounts.REVENUE_SALARY, "amount": -520000},
	]), "duplicate_command", "a reloaded save still refuses a replayed command")


func test_rejects_a_tampered_journal() -> void:
	var data: Dictionary = ledger.to_dict()
	(data["balances"] as Dictionary)[Accounts.CASH_OPERATING] = "999999999"
	assert_err(Ledger.from_dict(data), "unbalanced_ledger", "an edited balance fails the balance check")

	var data2: Dictionary = ledger.to_dict()
	(data2["balances"] as Dictionary)["asset_invented_account"] = "100"
	assert_err(Ledger.from_dict(data2), "unknown_account", "an invented account is refused")

	var data3: Dictionary = ledger.to_dict()
	(data3["balances"] as Dictionary)[Accounts.CASH_OPERATING] = 2000000.5
	assert_err(Ledger.from_dict(data3), "float_rejected", "a float balance is refused")
