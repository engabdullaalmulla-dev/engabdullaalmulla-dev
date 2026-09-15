extends TestCase

## Loan mathematics against the independent reference fixtures in ECONOMY_SPEC E5.
## Covers acceptance cases T07, T08 and T09.

const FIXTURES: Array = [
	{"id": "MORT-A", "principal": 48000000, "bps": 500, "term": 300,
	 "payment": 280603, "interest": 200000, "principal_paid": 80603, "closing": 47919397},
	{"id": "MORT-B", "principal": 22400000, "bps": 500, "term": 300,
	 "payment": 130948, "interest": 93333, "principal_paid": 37615, "closing": 22362385},
	{"id": "EDU-A", "principal": 5000000, "bps": 800, "term": 120,
	 "payment": 60664, "interest": 33333, "principal_paid": 27331, "closing": 4972669},
	{"id": "ZERO-A", "principal": 1200000, "bps": 0, "term": 12,
	 "payment": 100000, "interest": 0, "principal_paid": 100000, "closing": 1100000},
]


func test_t07_reference_fixtures_match_the_documented_rounding_order() -> void:
	for fixture in FIXTURES:
		var quoted: Variant = assert_ok(
			Amortization.quote(int(fixture["principal"]), int(fixture["bps"]), int(fixture["term"])),
			"%s quote" % fixture["id"])
		if quoted == null:
			continue
		assert_money(int((quoted as Dictionary)["payment_minor"]), int(fixture["payment"]),
			"%s scheduled monthly payment" % fixture["id"])

		var stepped: Variant = assert_ok(
			Amortization.step(int(fixture["principal"]), int(fixture["bps"]),
				int((quoted as Dictionary)["payment_minor"]), int(fixture["term"])),
			"%s first month" % fixture["id"])
		if stepped == null:
			continue
		var row: Dictionary = stepped
		assert_money(int(row["interest_minor"]), int(fixture["interest"]),
			"%s month-1 interest" % fixture["id"])
		assert_money(int(row["principal_paid_minor"]), int(fixture["principal_paid"]),
			"%s month-1 principal" % fixture["id"])
		assert_money(int(row["closing_principal"]), int(fixture["closing"]),
			"%s month-1 closing principal" % fixture["id"])


func test_t07_rounded_payment_minus_rounded_interest_not_a_rounded_difference() -> void:
	# EDU-A is the fixture that exposes the wrong order: the unrounded payment is
	# 606.6379... and the unrounded interest is 333.3333..., whose difference
	# rounds to 273.30, while the specified order gives 273.31.
	var quoted: Dictionary = Amortization.quote(5000000, 800, 120)
	var payment: int = int((quoted["value"] as Dictionary)["payment_minor"])
	var interest: int = int(Amortization.monthly_interest(5000000, 800)["value"])
	assert_money(payment - interest, 27331, "principal uses rounded payment minus rounded interest")
	var wrong_order: int = int(round(
		float((quoted["value"] as Dictionary)["unrounded_payment"]) - 5000000.0 * 0.08 / 12.0))
	assert_ne(wrong_order, 27331, "the rounded-difference order would give a different answer")


func test_t08_final_payment_settles_exactly() -> void:
	for fixture in FIXTURES:
		var result: Variant = assert_ok(
			Amortization.schedule(int(fixture["principal"]), int(fixture["bps"]), int(fixture["term"])),
			"%s full schedule" % fixture["id"])
		if result == null:
			continue
		var schedule: Dictionary = result
		var months: Array = schedule["months"]
		assert_true(months.size() <= int(fixture["term"]),
			"%s does not exceed its term" % fixture["id"])
		var final_row: Dictionary = months[months.size() - 1]
		assert_money(int(final_row["closing_principal"]), 0,
			"%s settles to exactly zero" % fixture["id"])
		assert_true(bool(final_row["is_final"]), "%s marks its final instalment" % fixture["id"])
		for row in months:
			assert_true(int(row["closing_principal"]) >= 0,
				"%s never goes negative" % fixture["id"])


func test_t09_principal_and_interest_are_separate_amounts() -> void:
	var schedule: Dictionary = Amortization.schedule(1200000, 0, 12)["value"]
	assert_money(int(schedule["total_interest_minor"]), 0, "a zero-rate loan charges no interest")
	assert_money(int(schedule["total_paid_minor"]), 1200000,
		"a zero-rate loan repays exactly its principal")

	var mortgage: Dictionary = Amortization.schedule(48000000, 500, 300)["value"]
	var principal_repaid: int = 0
	for row in mortgage["months"] as Array:
		principal_repaid += int((row as Dictionary)["principal_paid_minor"])
	assert_money(principal_repaid, 48000000, "principal repayments total the original loan")
	assert_money(int(mortgage["total_paid_minor"]) - int(mortgage["total_interest_minor"]), 48000000,
		"payments split into principal and interest with nothing unaccounted for")
	assert_true(int(mortgage["total_interest_minor"]) > 0, "a 5% mortgage charges interest")


func test_rejects_unsupported_loan_configurations() -> void:
	assert_err(Amortization.quote(0, 500, 300), "invalid_principal", "rejects a zero principal")
	assert_err(Amortization.quote(-100, 500, 300), "invalid_principal", "rejects a negative principal")
	assert_err(Amortization.quote(48000000, -1, 300), "negative_rate", "rejects a negative rate")
	assert_err(Amortization.quote(48000000, 500, 0), "invalid_term", "rejects a zero term")
	assert_err(Amortization.quote(48000000, 500, 5000), "invalid_term", "rejects an absurd term")
	assert_err(Amortization.quote(Money.LIMIT_MINOR, 500, 300), "principal_too_large",
		"rejects a principal beyond precision-safe evaluation")
	# A 240-month loan at 60% nominal cannot amortise with a payment that small:
	# the product is disallowed rather than silently growing the balance.
	assert_err(Amortization.step(48000000, 6000, 100, 240), "negative_amortization",
		"rejects a payment that does not cover interest")
