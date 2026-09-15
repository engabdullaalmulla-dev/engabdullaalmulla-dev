class_name SimCalendar
extends RefCounted

## The authoritative clock is `month_index`: an integer count of simulated
## months since the campaign epoch. Wall-clock time never appears here, so no
## amount of real-world waiting, device-clock editing, or app backgrounding can
## move the simulation (acceptance cases T02 and T40).

const EPOCH_YEAR: int = 1
const MONTHS_PER_YEAR: int = 12
const MAX_MONTH_INDEX: int = 12_000  # 1,000 simulated years; far beyond a campaign.


static func is_valid_month_index(month_index: int) -> bool:
	return month_index >= 0 and month_index <= MAX_MONTH_INDEX


## Simulated year number (1-based) for a month index.
static func year_of(month_index: int) -> int:
	return EPOCH_YEAR + month_index / MONTHS_PER_YEAR


## Simulated month within the year, 1..12.
static func month_of_year(month_index: int) -> int:
	return month_index % MONTHS_PER_YEAR + 1


static func label(month_index: int) -> String:
	return "Year %d · Month %d" % [year_of(month_index), month_of_year(month_index)]


static func short_label(month_index: int) -> String:
	return "Y%d M%d" % [year_of(month_index), month_of_year(month_index)]


## Whole simulated years elapsed between two month indices.
static func years_between(from_month: int, to_month: int) -> int:
	return (to_month - from_month) / MONTHS_PER_YEAR


## Character age in years from an age expressed in months.
static func age_years(age_months: int) -> int:
	return age_months / MONTHS_PER_YEAR
