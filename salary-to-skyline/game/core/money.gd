class_name Money
extends RefCounted

## Money API for Salary to Skyline.
##
## All authoritative amounts are signed 64-bit integer MINOR UNITS.
## VDh 1.00 == 100 minor units. Nothing in this file converts an authoritative
## balance to float. Serialization is a signed decimal string of minor units,
## because Godot's JSON parser returns every number as a float and would lose
## integers above 2^53 (see tests/unit/test_money.gd::round_trip_9007199254740993).
##
## Rounding for monetary division/ratio results is HALF AWAY FROM ZERO.
##
## Every checked operation returns a Result dictionary:
##   { "ok": true,  "value": <int> }
##   { "ok": false, "code": "<error_code>", "message": "<human text>" }
## Callers must not substitute 0 for a rejected operation.

const MINOR_PER_MAJOR: int = 100

## Largest absolute value any in-game amount may hold. 1e17 minor units
## (VDh 1,000,000,000,000,000). Chosen to leave ~92x headroom below INT64_MAX so
## intermediate sums cannot wrap; multiplication is separately overflow-checked.
const LIMIT_MINOR: int = 100_000_000_000_000_000

const INT64_MAX: int = 9_223_372_036_854_775_807
const INT64_MIN: int = -9_223_372_036_854_775_808

const BPS_DENOMINATOR: int = 10_000

const CURRENCY_CODE: String = "VDH"
const CURRENCY_DISPLAY: String = "VDh"

# --- Result helpers -----------------------------------------------------------

static func ok(value: int) -> Dictionary:
	return {"ok": true, "value": value}


static func err(code: String, message: String) -> Dictionary:
	return {"ok": false, "code": code, "message": message}


## Success result carrying a non-integer payload (an ID, an array of shares...).
static func ok_value(value: Variant) -> Dictionary:
	return {"ok": true, "value": value}


## Unwraps a Result that the caller has already proven valid.
## Fails loudly in debug builds instead of silently returning 0.
static func unwrap(result: Dictionary) -> int:
	if not result.get("ok", false):
		var message: String = "Money.unwrap on failed result: %s (%s)" % [
			result.get("code", "unknown"), result.get("message", "")
		]
		push_error(message)
		assert(false, message)
		return 0
	return int(result["value"])

# --- Validation ---------------------------------------------------------------

static func is_valid_amount(amount: int) -> bool:
	return amount >= -LIMIT_MINOR and amount <= LIMIT_MINOR


static func check_amount(amount: int, label: String = "amount") -> Dictionary:
	if not is_valid_amount(amount):
		return err("out_of_range", "%s %d is outside the permitted money range" % [label, amount])
	return ok(amount)


## Accepts only the forms this game serializes: a decimal minor-unit string, or
## an int already in range. Floats (including NAN/INF), bools, null, and
## containers are rejected rather than coerced.
static func from_variant(value: Variant, label: String = "value") -> Dictionary:
	match typeof(value):
		TYPE_STRING, TYPE_STRING_NAME:
			return parse_minor_string(String(value))
		TYPE_INT:
			return check_amount(int(value), label)
		TYPE_FLOAT:
			return err("float_rejected",
				"%s was a float; authoritative money must be an integer minor-unit string" % label)
		_:
			return err("type_rejected", "%s has unsupported type %d for money" % [label, typeof(value)])

# --- Decimal-string serialization --------------------------------------------

## Strict parse of a signed integer minor-unit string, e.g. "-280603".
## Rejects empty text, whitespace, "+", "1e5", "1.5", "NaN", "inf", and
## anything outside LIMIT_MINOR.
static func parse_minor_string(text: String) -> Dictionary:
	if text.is_empty():
		return err("empty", "empty money string")
	var body: String = text
	var negative: bool = false
	if body.begins_with("-"):
		negative = true
		body = body.substr(1)
	if body.is_empty():
		return err("malformed", "money string '%s' has no digits" % text)
	if body.length() > 19:
		return err("out_of_range", "money string '%s' has too many digits" % text)
	for i in body.length():
		var c: int = body.unicode_at(i)
		if c < 48 or c > 57:
			return err("malformed", "money string '%s' contains a non-digit" % text)
	var magnitude: int = body.to_int()
	# Defensive: to_int() saturates on overflow, so re-render and compare.
	if str(magnitude) != body.lstrip("0") and not (magnitude == 0 and body.lstrip("0").is_empty()):
		return err("out_of_range", "money string '%s' does not round-trip as an integer" % text)
	var value: int = -magnitude if negative else magnitude
	return check_amount(value, "money string '%s'" % text)


static func to_minor_string(amount: int) -> String:
	return str(amount)


## Parses an authored major-unit decimal such as "2806.03" or "-0.5" into minor
## units. Used for content/fixture authoring, never for runtime balances.
static func parse_major_string(text: String) -> Dictionary:
	if text.is_empty():
		return err("empty", "empty money string")
	var body: String = text
	var negative: bool = false
	if body.begins_with("-"):
		negative = true
		body = body.substr(1)
	var parts: PackedStringArray = body.split(".")
	if parts.size() > 2:
		return err("malformed", "money string '%s' has more than one decimal point" % text)
	var whole_text: String = parts[0]
	var frac_text: String = parts[1] if parts.size() == 2 else ""
	if whole_text.is_empty() and frac_text.is_empty():
		return err("malformed", "money string '%s' has no digits" % text)
	if frac_text.length() > 2:
		return err("precision", "money string '%s' has more than 2 decimal places" % text)
	for source in [whole_text, frac_text]:
		for i in String(source).length():
			var c: int = String(source).unicode_at(i)
			if c < 48 or c > 57:
				return err("malformed", "money string '%s' contains a non-digit" % text)
	while frac_text.length() < 2:
		frac_text += "0"
	var whole_result: Dictionary = parse_minor_string(whole_text if not whole_text.is_empty() else "0")
	if not whole_result["ok"]:
		return whole_result
	var scaled: Dictionary = mul_ratio(int(whole_result["value"]), MINOR_PER_MAJOR, 1)
	if not scaled["ok"]:
		return scaled
	var total: Dictionary = add(int(scaled["value"]), frac_text.to_int())
	if not total["ok"]:
		return total
	return ok(-int(total["value"]) if negative else int(total["value"]))


static func to_major_string(amount: int) -> String:
	var sign_text: String = "-" if amount < 0 else ""
	var magnitude: int = absi(amount)
	return "%s%d.%02d" % [sign_text, magnitude / MINOR_PER_MAJOR, magnitude % MINOR_PER_MAJOR]

# --- Arithmetic ---------------------------------------------------------------

static func add(a: int, b: int) -> Dictionary:
	var a_check: Dictionary = check_amount(a, "left operand")
	if not a_check["ok"]:
		return a_check
	var b_check: Dictionary = check_amount(b, "right operand")
	if not b_check["ok"]:
		return b_check
	return check_amount(a + b, "sum")


static func sub(a: int, b: int) -> Dictionary:
	var b_check: Dictionary = check_amount(b, "right operand")
	if not b_check["ok"]:
		return b_check
	return add(a, -b)


static func sum(amounts: Array) -> Dictionary:
	var total: int = 0
	for raw in amounts:
		if typeof(raw) != TYPE_INT:
			return err("type_rejected", "sum() received a non-integer amount")
		var step: Dictionary = add(total, int(raw))
		if not step["ok"]:
			return step
		total = int(step["value"])
	return ok(total)


## amount * numerator / denominator, rounded half away from zero,
## with every intermediate product overflow-checked before it is computed.
static func mul_ratio(amount: int, numerator: int, denominator: int) -> Dictionary:
	var amount_check: Dictionary = check_amount(amount, "amount")
	if not amount_check["ok"]:
		return amount_check
	if denominator == 0:
		return err("zero_denominator", "ratio denominator must not be zero")
	if denominator < 0:
		return err("negative_denominator", "ratio denominator must be positive")
	var negative: bool = (amount < 0) != (numerator < 0)
	var abs_amount: int = absi(amount)
	var abs_numerator: int = absi(numerator)
	if abs_amount != 0 and abs_numerator > INT64_MAX / abs_amount:
		return err("overflow", "ratio product %d * %d would overflow 64 bits" % [amount, numerator])
	var product: int = abs_amount * abs_numerator
	var quotient: int = product / denominator
	var remainder: int = product % denominator
	if remainder > INT64_MAX / 2:
		return err("overflow", "rounding remainder %d is too large to compare" % remainder)
	if remainder * 2 >= denominator:
		quotient += 1
	var value: int = -quotient if negative else quotient
	return check_amount(value, "ratio result")


## amount * basis points / 10000, rounded half away from zero.
static func mul_bps(amount: int, bps: int) -> Dictionary:
	return mul_ratio(amount, bps, BPS_DENOMINATOR)


## Rate of `part` within `whole`, in basis points, rounded half away from zero.
static func ratio_bps(part: int, whole: int) -> Dictionary:
	if whole == 0:
		return err("zero_denominator", "cannot express a ratio of zero")
	var negative: bool = (part < 0) != (whole < 0)
	var result: Dictionary = mul_ratio(absi(part), BPS_DENOMINATOR, absi(whole))
	if not result["ok"]:
		return result
	return ok(-int(result["value"]) if negative else int(result["value"]))


## Splits `total` across `weights_bps` without creating or destroying a minor
## unit. Weights must be non-negative; the remainder goes to the largest
## fractional parts, ties resolved by lowest index so the split is deterministic.
static func allocate(total: int, weights_bps: Array) -> Dictionary:
	var total_check: Dictionary = check_amount(total, "total")
	if not total_check["ok"]:
		return total_check
	if weights_bps.is_empty():
		return err("empty_weights", "allocation needs at least one weight")
	var weight_sum: int = 0
	for raw in weights_bps:
		if typeof(raw) != TYPE_INT:
			return err("type_rejected", "allocation weights must be integers")
		var weight: int = int(raw)
		if weight < 0:
			return err("negative_weight", "allocation weight %d is negative" % weight)
		weight_sum += weight
	if weight_sum <= 0:
		return err("zero_weights", "allocation weights sum to zero")
	var negative: bool = total < 0
	var magnitude: int = absi(total)
	var shares: Array[int] = []
	var remainders: Array[int] = []
	var allocated: int = 0
	for raw in weights_bps:
		var weight: int = int(raw)
		if magnitude != 0 and weight > INT64_MAX / magnitude:
			return err("overflow", "allocation product would overflow 64 bits")
		var product: int = magnitude * weight
		var share: int = product / weight_sum
		shares.append(share)
		remainders.append(product % weight_sum)
		allocated += share
	var leftover: int = magnitude - allocated
	while leftover > 0:
		var best_index: int = -1
		var best_remainder: int = -1
		for i in remainders.size():
			if remainders[i] > best_remainder:
				best_remainder = remainders[i]
				best_index = i
		if best_index < 0:
			break
		shares[best_index] += 1
		remainders[best_index] = -1
		leftover -= 1
	var result: Array[int] = []
	for share in shares:
		result.append(-share if negative else share)
	return {"ok": true, "value": result}

# --- Presentation -------------------------------------------------------------

## "VDh 2,806.03" / "VDh -2,806.03". The sign stays attached to the number so the
## currency label can be mirrored for Arabic without moving the sign.
static func format(amount: int, with_currency: bool = true) -> String:
	var sign_text: String = "-" if amount < 0 else ""
	var magnitude: int = absi(amount)
	var whole: int = magnitude / MINOR_PER_MAJOR
	var fraction: int = magnitude % MINOR_PER_MAJOR
	var digits: String = str(whole)
	var grouped: String = ""
	var count: int = 0
	for i in range(digits.length() - 1, -1, -1):
		grouped = digits[i] + grouped
		count += 1
		if count % 3 == 0 and i > 0:
			grouped = "," + grouped
	var body: String = "%s%s.%02d" % [sign_text, grouped, fraction]
	return "%s %s" % [CURRENCY_DISPLAY, body] if with_currency else body
