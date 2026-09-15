extends TestCase

## Money API: units, precision, serialization, rejection.
## Covers acceptance cases T05 and T06.


func test_t05_minor_units_round_trip_exactly_including_large_values() -> void:
	# The fixture value from starter_balance.json sits above 2^53, where a JSON
	# float would already have lost the last digit.
	var text: String = "9007199254740993"
	var parsed: Variant = assert_ok(Money.parse_minor_string(text), "parse large minor-unit string")
	assert_eq(parsed, 9007199254740993, "large value parses exactly")
	assert_eq(Money.to_minor_string(int(parsed)), text, "large value serializes back unchanged")

	# Demonstrates why the string path exists: JSON numbers lose this value.
	var through_json: Variant = JSON.parse_string('{"v": 9007199254740993}')
	assert_ne(str(int((through_json as Dictionary)["v"])), text,
		"JSON number path is lossy, which is why money is stored as a string")

	for sample in [0, 1, -1, 100, -280603, 48000000, -9007199254740993]:
		assert_eq(int(Money.parse_minor_string(Money.to_minor_string(sample))["value"]), sample,
			"round trip of %d" % sample)


func test_t06_rejects_malformed_and_non_finite_input() -> void:
	for bad in ["", " ", "+5", "1.5", "1e5", "NaN", "inf", "--5", "5 ", "0x10", "99999999999999999999"]:
		assert_false(Money.parse_minor_string(bad)["ok"], "rejects money string '%s'" % bad)
	assert_err(Money.from_variant(1.5, "float"), "float_rejected", "rejects a float amount")
	assert_err(Money.from_variant(NAN, "nan"), "float_rejected", "rejects NaN")
	assert_err(Money.from_variant(INF, "inf"), "float_rejected", "rejects infinity")
	assert_err(Money.from_variant(null, "null"), "type_rejected", "rejects null")
	assert_err(Money.from_variant([], "array"), "type_rejected", "rejects an array")
	assert_err(Money.from_variant(true, "bool"), "type_rejected", "rejects a boolean")


func test_t06_rejects_overflow_and_impossible_ratios() -> void:
	assert_err(Money.add(Money.LIMIT_MINOR, Money.LIMIT_MINOR), "out_of_range", "rejects a sum past the limit")
	assert_err(Money.check_amount(Money.LIMIT_MINOR + 1), "out_of_range", "rejects an amount past the limit")
	assert_err(Money.mul_ratio(1000, 1, 0), "zero_denominator", "rejects a zero denominator")
	assert_err(Money.mul_ratio(1000, 1, -10), "negative_denominator", "rejects a negative denominator")
	assert_err(Money.mul_ratio(Money.LIMIT_MINOR, Money.LIMIT_MINOR, 1), "overflow",
		"rejects a product that would overflow 64 bits")
	assert_err(Money.allocate(1000, []), "empty_weights", "rejects an empty allocation")
	assert_err(Money.allocate(1000, [5000, -5000]), "negative_weight", "rejects a negative weight")
	assert_err(Money.allocate(1000, [0, 0]), "zero_weights", "rejects weights that sum to zero")


func test_rounding_is_half_away_from_zero() -> void:
	# 2.5 minor units in each direction.
	assert_money(int(Money.mul_ratio(5, 1, 2)["value"]), 3, "positive half rounds away from zero")
	assert_money(int(Money.mul_ratio(-5, 1, 2)["value"]), -3, "negative half rounds away from zero")
	assert_money(int(Money.mul_ratio(7, 1, 3)["value"]), 2, "2.33 rounds down")
	assert_money(int(Money.mul_ratio(8, 1, 3)["value"]), 3, "2.67 rounds up")
	# Basis points: 5% of VDh 22,400.00 monthly interest basis.
	assert_money(int(Money.mul_bps(5400000, 500)["value"]), 270000, "5% of 54,000.00")
	assert_money(int(Money.mul_ratio(22400000, 500, 120000)["value"]), 93333,
		"monthly interest rounds half away from zero")


func test_allocation_conserves_every_minor_unit() -> void:
	var shares: Variant = assert_ok(Money.allocate(100, [3333, 3333, 3334]), "allocate 1.00 three ways")
	assert_eq(shares, [33, 33, 34], "largest remainder receives the odd unit")
	var total: int = 0
	for share in shares as Array:
		total += int(share)
	assert_money(total, 100, "allocation conserves the total")

	var offplan: Variant = assert_ok(
		Money.allocate(80000000, [2000, 1000, 1000, 1000, 1000, 4000]),
		"allocate an 800,000 off-plan payment plan")
	var offplan_total: int = 0
	for share in offplan as Array:
		offplan_total += int(share)
	assert_money(offplan_total, 80000000, "off-plan instalments reconcile to the contract price")
	assert_money(int((offplan as Array)[0]), 16000000, "booking instalment is 20%")
	assert_money(int((offplan as Array)[5]), 32000000, "handover instalment is 40%")

	var negative: Variant = assert_ok(Money.allocate(-100, [5000, 5000]), "allocate a negative total")
	assert_eq(negative, [-50, -50], "negative allocation splits symmetrically")


func test_ratio_bps_and_formatting() -> void:
	assert_eq(int(Money.ratio_bps(5400000, 60000000)["value"]), 900, "gross yield on price is 9%")
	assert_eq(int(Money.ratio_bps(3930000, 60000000)["value"]), 655, "net yield on price is 6.55%")
	assert_err(Money.ratio_bps(100, 0), "zero_denominator", "rejects a ratio of zero")
	assert_eq(Money.format(4400000), "VDh 44,000.00", "formats thousands separators")
	assert_eq(Money.format(-280603), "VDh -2,806.03", "formats a negative amount")
	assert_eq(Money.format(5, false), "0.05", "formats without the currency label")
	assert_eq(Money.format(100000000000), "VDh 1,000,000,000.00", "formats a large amount")


func test_major_string_authoring_round_trip() -> void:
	assert_money(int(Money.parse_major_string("2806.03")["value"]), 280603, "parses an authored decimal")
	assert_money(int(Money.parse_major_string("-0.5")["value"]), -50, "parses a negative single decimal")
	assert_money(int(Money.parse_major_string("600000")["value"]), 60000000, "parses a whole amount")
	assert_err(Money.parse_major_string("1.234"), "precision", "rejects more than two decimal places")
	assert_eq(Money.to_major_string(280603), "2806.03", "renders minor units as a decimal")
	assert_eq(Money.to_major_string(-5), "-0.05", "renders a small negative amount")
