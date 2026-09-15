class_name Ledger
extends RefCounted

## Append-only double-entry journal plus running balances (ECONOMY_SPEC E2).
##
## Rules enforced here:
##  * every transaction balances to zero in debit-positive convention;
##  * a command ID posts at most once, so replaying a command cannot duplicate a
##    purchase, loan, refund or salary (acceptance case T03);
##  * posting is all-or-nothing: a rejected transaction changes no balance
##    (acceptance cases T04 and T10).

const MAX_ENTRIES: int = 200_000
const MAX_LINES_PER_TRANSACTION: int = 64

var _entries: Array[Dictionary] = []
var _balances: Dictionary = {}
var _applied_commands: Dictionary = {}
var _next_transaction_sequence: int = 1


func entry_count() -> int:
	return _entries.size()


func entries() -> Array[Dictionary]:
	return _entries.duplicate(true)


func recent_entries(limit: int) -> Array[Dictionary]:
	var start: int = maxi(0, _entries.size() - limit)
	return _entries.slice(start, _entries.size()).duplicate(true)


func has_command(command_id: String) -> bool:
	return _applied_commands.has(command_id)


func transaction_for_command(command_id: String) -> String:
	return String(_applied_commands.get(command_id, ""))


## Internal debit-positive balance.
func balance(account: String) -> int:
	return int(_balances.get(account, 0))


## Player-facing balance (credit accounts flipped positive).
func display_balance(account: String) -> int:
	return Accounts.display_balance(account, balance(account))


func balance_of_kind(kind: String) -> int:
	var total: int = 0
	for account in _balances.keys():
		if Accounts.kind_of(account) == kind:
			total += int(_balances[account])
	return total


## Posts one balanced transaction.
## `lines` is an Array of { "account": String, "amount": int, "entity_id": String? }.
## Returns a Money-style Result whose value is the transaction ID.
func post(
	game_id: String,
	command_id: String,
	month_index: int,
	reason: String,
	lines: Array,
	related_ids: Dictionary = {}
) -> Dictionary:
	if not Ids.is_valid_runtime_id(command_id):
		return Money.err("invalid_command_id", "command id '%s' is not a valid runtime id" % command_id)
	if _applied_commands.has(command_id):
		return Money.err("duplicate_command",
			"command '%s' already posted transaction '%s'" % [command_id, _applied_commands[command_id]])
	if lines.is_empty():
		return Money.err("empty_transaction", "a transaction needs at least one line")
	if lines.size() > MAX_LINES_PER_TRANSACTION:
		return Money.err("too_many_lines", "transaction has %d lines" % lines.size())
	if _entries.size() + lines.size() > MAX_ENTRIES:
		return Money.err("journal_full", "journal entry limit reached")
	if not SimCalendar.is_valid_month_index(month_index):
		return Money.err("invalid_month", "month index %d is out of range" % month_index)

	var checked_lines: Array[Dictionary] = []
	var signed_total: int = 0
	for raw_line in lines:
		if typeof(raw_line) != TYPE_DICTIONARY:
			return Money.err("type_rejected", "journal line is not a dictionary")
		var line: Dictionary = raw_line
		var account: String = String(line.get("account", ""))
		if not Accounts.exists(account):
			return Money.err("unknown_account", "unknown account '%s'" % account)
		var amount_variant: Variant = line.get("amount", null)
		if typeof(amount_variant) != TYPE_INT:
			return Money.err("type_rejected", "journal amount for '%s' is not an integer" % account)
		var amount: int = int(amount_variant)
		var amount_check: Dictionary = Money.check_amount(amount, "journal amount for '%s'" % account)
		if not amount_check["ok"]:
			return amount_check
		var running: Dictionary = Money.add(signed_total, amount)
		if not running["ok"]:
			return running
		signed_total = int(running["value"])
		# Reject a posting that would push a balance outside the money range
		# BEFORE anything is written.
		var projected: Dictionary = Money.add(balance(account), amount)
		if not projected["ok"]:
			return projected
		checked_lines.append({
			"account": account,
			"amount": amount,
			"entity_id": String(line.get("entity_id", "")),
		})
	if signed_total != 0:
		return Money.err("unbalanced",
			"transaction does not balance; debit-positive total is %d" % signed_total)

	var transaction_id: String = Ids.make_runtime_id(game_id, "txn", _next_transaction_sequence)
	for line in checked_lines:
		var account: String = String(line["account"])
		var amount: int = int(line["amount"])
		_balances[account] = balance(account) + amount
		_entries.append({
			"transaction_id": transaction_id,
			"command_id": command_id,
			"month_index": month_index,
			"account": account,
			"amount": amount,
			"reason": reason,
			"entity_id": String(line["entity_id"]),
			"related": related_ids.duplicate(true),
		})
	_applied_commands[command_id] = transaction_id
	_next_transaction_sequence += 1
	return Money.ok_value(transaction_id)


## Records a command that legitimately moves no money (for example the parent
## AdvanceMonth command in a month where nothing was earned or owed), so that
## replaying it is still rejected as a duplicate.
func register_command(command_id: String, marker: String = "no-financial-effect") -> Dictionary:
	if not Ids.is_valid_runtime_id(command_id):
		return Money.err("invalid_command_id", "command id '%s' is not a valid runtime id" % command_id)
	if _applied_commands.has(command_id):
		return Money.err("duplicate_command",
			"command '%s' was already applied" % command_id)
	_applied_commands[command_id] = marker
	return Money.ok_value(marker)


## Debit-positive balances must sum to zero across the whole chart, or the books
## are broken. Checked after every committed month.
func is_balanced() -> bool:
	var total: int = 0
	for account in _balances.keys():
		total += int(_balances[account])
	return total == 0


func to_dict() -> Dictionary:
	var entries_out: Array = []
	for entry in _entries:
		entries_out.append({
			"transaction_id": entry["transaction_id"],
			"command_id": entry["command_id"],
			"month_index": int(entry["month_index"]),
			"account": entry["account"],
			"amount": Money.to_minor_string(int(entry["amount"])),
			"reason": entry["reason"],
			"entity_id": entry["entity_id"],
		})
	var balances_out: Dictionary = {}
	var accounts: Array = _balances.keys()
	accounts.sort()
	for account in accounts:
		balances_out[account] = Money.to_minor_string(int(_balances[account]))
	var applied_out: Dictionary = {}
	var commands: Array = _applied_commands.keys()
	commands.sort()
	for command_id in commands:
		applied_out[command_id] = _applied_commands[command_id]
	return {
		"entries": entries_out,
		"balances": balances_out,
		"applied_commands": applied_out,
		"next_transaction_sequence": str(_next_transaction_sequence),
	}


static func from_dict(data: Dictionary) -> Dictionary:
	var ledger := Ledger.new()
	if typeof(data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "ledger block is not a dictionary")
	var raw_entries: Variant = data.get("entries", [])
	if typeof(raw_entries) != TYPE_ARRAY:
		return Money.err("type_rejected", "ledger entries is not an array")
	if (raw_entries as Array).size() > MAX_ENTRIES:
		return Money.err("too_large", "ledger has too many entries")
	for raw_entry in raw_entries as Array:
		if typeof(raw_entry) != TYPE_DICTIONARY:
			return Money.err("type_rejected", "ledger entry is not a dictionary")
		var entry: Dictionary = raw_entry
		var account: String = String(entry.get("account", ""))
		if not Accounts.exists(account):
			return Money.err("unknown_account", "saved entry uses unknown account '%s'" % account)
		var amount_result: Dictionary = Money.from_variant(entry.get("amount", null), "entry amount")
		if not amount_result["ok"]:
			return amount_result
		var month_index: int = int(entry.get("month_index", -1))
		if not SimCalendar.is_valid_month_index(month_index):
			return Money.err("invalid_month", "saved entry has month index %d" % month_index)
		ledger._entries.append({
			"transaction_id": String(entry.get("transaction_id", "")),
			"command_id": String(entry.get("command_id", "")),
			"month_index": month_index,
			"account": account,
			"amount": int(amount_result["value"]),
			"reason": String(entry.get("reason", "")),
			"entity_id": String(entry.get("entity_id", "")),
			"related": {},
		})
	var raw_balances: Variant = data.get("balances", {})
	if typeof(raw_balances) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "ledger balances is not a dictionary")
	for account in (raw_balances as Dictionary).keys():
		if not Accounts.exists(String(account)):
			return Money.err("unknown_account", "saved balance uses unknown account '%s'" % account)
		var balance_result: Dictionary = Money.from_variant(
			(raw_balances as Dictionary)[account], "balance for '%s'" % account)
		if not balance_result["ok"]:
			return balance_result
		ledger._balances[String(account)] = int(balance_result["value"])
	var raw_applied: Variant = data.get("applied_commands", {})
	if typeof(raw_applied) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "ledger applied_commands is not a dictionary")
	for command_id in (raw_applied as Dictionary).keys():
		if not Ids.is_valid_runtime_id(String(command_id)):
			return Money.err("invalid_command_id", "saved command id '%s' is invalid" % command_id)
		ledger._applied_commands[String(command_id)] = String((raw_applied as Dictionary)[command_id])
	var sequence_result: Dictionary = RngStreams._parse_int64(String(data.get("next_transaction_sequence", "1")))
	if not sequence_result["ok"]:
		return sequence_result
	ledger._next_transaction_sequence = int(sequence_result["value"])
	if not ledger.is_balanced():
		return Money.err("unbalanced_ledger", "saved ledger balances do not sum to zero")
	return {"ok": true, "value": ledger}
