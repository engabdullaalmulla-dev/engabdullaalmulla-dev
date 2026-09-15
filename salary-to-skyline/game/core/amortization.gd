class_name Amortization
extends RefCounted

## Fixed-instalment loan mathematics (ECONOMY_SPEC E5).
##
## Quote: scheduled_payment = P * r / (1 - (1 + r)^-n), evaluated once in double
## precision and rounded once, half away from zero, into minor units.
## Monthly posting is pure integer arithmetic:
##   interest_m        = round_half_away(opening_principal * annual_bps / 120000)
##   principal_paid_m  = min(opening_principal, rounded_payment - interest_m)
##   closing_m         = opening_principal - principal_paid_m
## The loan balance is never derived by multiplying a displayed payment by months.
##
## Verified against MORT-A, MORT-B, EDU-A and ZERO-A in tests/unit/test_amortization.gd.

## Months per year times the basis-point denominator: bps/10000/12 == bps/120000.
const MONTHLY_BPS_DENOMINATOR: int = 120_000

## Above this principal a double cannot represent minor units exactly
## (2^53 ≈ 9.007e15 minor units). Quotes larger than this are rejected rather
## than silently losing precision; no game loan approaches it.
const MAX_QUOTE_PRINCIPAL_MINOR: int = 9_000_000_000_000

const MAX_TERM_MONTHS: int = 1_200

## If the unrounded payment lands this close to a .5 minor-unit boundary, the
## double evaluation cannot decide the rounding direction safely, so the quote is
## refused instead of guessed.
const ROUNDING_BOUNDARY_EPSILON: float = 1.0e-6


## Interest accrued for one month on `opening_principal` at `annual_rate_bps`.
static func monthly_interest(opening_principal: int, annual_rate_bps: int) -> Dictionary:
	if opening_principal < 0:
		return Money.err("negative_principal", "principal %d is negative" % opening_principal)
	if annual_rate_bps < 0:
		return Money.err("negative_rate", "annual rate %d bps is negative" % annual_rate_bps)
	return Money.mul_ratio(opening_principal, annual_rate_bps, MONTHLY_BPS_DENOMINATOR)


## Scheduled level payment for a new loan.
## Returns { ok, value: { payment_minor, principal_minor, annual_rate_bps,
##                        term_months, unrounded_payment } }.
static func quote(principal_minor: int, annual_rate_bps: int, term_months: int) -> Dictionary:
	if principal_minor <= 0:
		return Money.err("invalid_principal", "loan principal must be positive")
	if principal_minor > MAX_QUOTE_PRINCIPAL_MINOR:
		return Money.err("principal_too_large",
			"principal %d exceeds the precision-safe quote limit" % principal_minor)
	if annual_rate_bps < 0:
		return Money.err("negative_rate", "annual rate %d bps is negative" % annual_rate_bps)
	if term_months <= 0 or term_months > MAX_TERM_MONTHS:
		return Money.err("invalid_term", "term %d months is out of range" % term_months)

	var unrounded: float
	if annual_rate_bps == 0:
		unrounded = float(principal_minor) / float(term_months)
	else:
		var monthly_rate: float = float(annual_rate_bps) / 10000.0 / 12.0
		var discount: float = 1.0 - pow(1.0 + monthly_rate, -float(term_months))
		if discount <= 0.0 or is_nan(discount) or is_inf(discount):
			return Money.err("unsupported_configuration",
				"rate/term combination produces a degenerate annuity factor")
		unrounded = float(principal_minor) * monthly_rate / discount
	if is_nan(unrounded) or is_inf(unrounded):
		return Money.err("non_finite", "payment evaluation produced a non-finite value")

	var fraction: float = absf(unrounded - floor(unrounded) - 0.5)
	if fraction < ROUNDING_BOUNDARY_EPSILON:
		return Money.err("rounding_boundary",
			"payment %f sits on a rounding boundary; higher precision is required" % unrounded)
	var payment: int = int(floor(unrounded + 0.5))

	# A payment that cannot cover the first month's interest would grow the
	# balance. ECONOMY_SPEC E5 disallows that product in v1.
	var first_interest: Dictionary = monthly_interest(principal_minor, annual_rate_bps)
	if not first_interest["ok"]:
		return first_interest
	if payment <= int(first_interest["value"]) and term_months > 1:
		return Money.err("negative_amortization",
			"scheduled payment %d does not cover first interest %d" % [payment, int(first_interest["value"])])

	return Money.ok_value({
		"payment_minor": payment,
		"principal_minor": principal_minor,
		"annual_rate_bps": annual_rate_bps,
		"term_months": term_months,
		"unrounded_payment": unrounded,
	})


## Resolves one scheduled month.
## `remaining_months` is the number of instalments left including this one; when
## it reaches 1 the payment is adjusted to settle the exact balance plus interest,
## so no residual minor unit and no negative debt can survive (acceptance T08).
static func step(
	opening_principal: int,
	annual_rate_bps: int,
	payment_minor: int,
	remaining_months: int
) -> Dictionary:
	if opening_principal < 0:
		return Money.err("negative_principal", "opening principal %d is negative" % opening_principal)
	if payment_minor <= 0:
		return Money.err("invalid_payment", "scheduled payment must be positive")
	var interest_result: Dictionary = monthly_interest(opening_principal, annual_rate_bps)
	if not interest_result["ok"]:
		return interest_result
	var interest: int = int(interest_result["value"])

	var payment: int = payment_minor
	var is_final: bool = remaining_months <= 1 or payment - interest >= opening_principal
	if is_final:
		var final_payment: Dictionary = Money.add(opening_principal, interest)
		if not final_payment["ok"]:
			return final_payment
		payment = int(final_payment["value"])

	var principal_paid: int = mini(opening_principal, payment - interest)
	if principal_paid < 0:
		return Money.err("negative_amortization",
			"payment %d does not cover interest %d" % [payment, interest])
	var closing: int = opening_principal - principal_paid
	return Money.ok_value({
		"opening_principal": opening_principal,
		"interest_minor": interest,
		"principal_paid_minor": principal_paid,
		"payment_minor": payment,
		"closing_principal": closing,
		"is_final": is_final or closing == 0,
	})


## Runs a whole schedule. Used by tests and by the forward commitment calendar.
## Returns { ok, value: { months: Array[Dictionary], total_interest, total_paid } }.
static func schedule(principal_minor: int, annual_rate_bps: int, term_months: int) -> Dictionary:
	var quoted: Dictionary = quote(principal_minor, annual_rate_bps, term_months)
	if not quoted["ok"]:
		return quoted
	var payment: int = int((quoted["value"] as Dictionary)["payment_minor"])
	var opening: int = principal_minor
	var months: Array[Dictionary] = []
	var total_interest: int = 0
	var total_paid: int = 0
	for month in range(term_months):
		if opening == 0:
			break
		var stepped: Dictionary = step(opening, annual_rate_bps, payment, term_months - month)
		if not stepped["ok"]:
			return stepped
		var row: Dictionary = stepped["value"]
		months.append(row)
		total_interest += int(row["interest_minor"])
		total_paid += int(row["payment_minor"])
		opening = int(row["closing_principal"])
	if opening != 0:
		return Money.err("unsettled_schedule",
			"schedule ended with %d minor units outstanding" % opening)
	return Money.ok_value({
		"payment_minor": payment,
		"months": months,
		"total_interest_minor": total_interest,
		"total_paid_minor": total_paid,
	})
