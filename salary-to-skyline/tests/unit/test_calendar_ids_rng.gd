extends TestCase

## Simulated clock, stable identifiers, and separated random streams.


func test_month_index_is_the_only_clock() -> void:
	assert_eq(SimCalendar.year_of(0), 1, "the campaign opens in simulated year 1")
	assert_eq(SimCalendar.month_of_year(0), 1, "month index 0 is month 1")
	assert_eq(SimCalendar.year_of(12), 2, "twelve months make a year")
	assert_eq(SimCalendar.month_of_year(13), 2, "month index 13 is year 2 month 2")
	assert_eq(SimCalendar.label(13), "Year 2 · Month 2", "readable label")
	assert_eq(SimCalendar.years_between(0, 36), 3, "three years of study")
	assert_eq(SimCalendar.age_years(216), 18, "a fresh start is 18 years old")
	assert_false(SimCalendar.is_valid_month_index(-1), "negative months are invalid")
	assert_false(SimCalendar.is_valid_month_index(SimCalendar.MAX_MONTH_INDEX + 1),
		"the calendar has an upper bound")


func test_content_ids_are_stable_and_validated() -> void:
	for good in ["unit_oq_101", "old_quay", "operations_assistant", "a1"]:
		assert_true(Ids.is_valid_content_id(good), "accepts content id '%s'" % good)
	for bad in ["", "Unit_OQ_101", "unit oq", "_leading", "trailing_", "unit-101", "üñî"]:
		assert_false(Ids.is_valid_content_id(bad), "rejects content id '%s'" % bad)


func test_runtime_ids_are_deterministic_not_clock_based() -> void:
	assert_eq(Ids.make_runtime_id("game-20260915", "cmd", 7), "game-20260915.cmd.7",
		"runtime ids are built from the saved counter")
	assert_true(Ids.is_valid_runtime_id("game-20260915.cmd.7"), "generated ids validate")
	assert_eq(Ids.make_game_id(20260915), "game-20260915", "game id derives from the seed")
	assert_false(Ids.is_valid_runtime_id("cmd 7"), "rejects a runtime id with a space")


func test_streams_are_independent_and_restore_exactly() -> void:
	var streams: RngStreams = RngStreams.create(20260915)
	var market_first: int = streams.stream("market").randi()
	var career_baseline: RngStreams = RngStreams.create(20260915)
	assert_eq(streams.stream("career").randi(), career_baseline.stream("career").randi(),
		"consuming the market stream does not move the career stream")
	assert_true(streams.is_economic("market"), "market is an economic stream")
	assert_false(streams.is_economic("decor"), "decorative randomness is separated")

	var restored: Variant = assert_ok(RngStreams.from_dict(streams.to_dict()), "restore rng from a save")
	if restored == null:
		return
	var copy: RngStreams = restored
	assert_eq(copy.state_fingerprint(), streams.state_fingerprint(), "stream state survives a save")
	assert_eq(copy.stream("market").randi(), streams.stream("market").randi(),
		"a reloaded stream continues the same sequence")
	assert_ne(market_first, 0, "the stream produced a value")


func test_rejects_a_damaged_rng_block() -> void:
	var data: Dictionary = RngStreams.create(1).to_dict()
	(data["streams"] as Dictionary).erase("market")
	assert_err(RngStreams.from_dict(data), "missing_stream", "a missing stream is refused")
	var data2: Dictionary = RngStreams.create(1).to_dict()
	data2["master_seed"] = 12.5
	assert_err(RngStreams.from_dict(data2), "type_rejected", "a float seed is refused")
