extends TestCase

## Entitlement rules around the (mock) store adapter.
## Covers acceptance case T37 and the local half of T38/T39. Real purchase,
## restore and refund behaviour can only be proven in a platform sandbox on a
## device; nothing here claims otherwise.

var store: MockStoreAdapter
var entitlements: Entitlements


func before_each() -> void:
	store = MockStoreAdapter.new()
	entitlements = Entitlements.new()


func test_t37_a_mock_receipt_cannot_unlock_a_release_build() -> void:
	var purchased: Variant = assert_ok(store.purchase(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
		"the mock completes a scripted purchase in a debug build")
	if purchased == null:
		return
	assert_ok(entitlements.grant_from_receipt((purchased as Dictionary)["receipt"]), "record the receipt")
	assert_eq(entitlements.describe(StoreAdapter.PRODUCT_FULL_CAMPAIGN), "owned (mock, UNVERIFIED)",
		"the entitlement is labelled unverified")

	# The same cached entitlement with mock unlocks disabled — the shipped path.
	entitlements.set_mock_unlocks_allowed(false)
	assert_false(entitlements.is_unlocked(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
		"an unverified receipt does not unlock the campaign")

	# And the mock itself refuses to operate outside a debug build.
	store.simulate_release_build = true
	assert_false(store.is_available(), "the mock store is unavailable in a release build")
	assert_err(store.purchase(StoreAdapter.PRODUCT_FULL_CAMPAIGN), "mock_disabled",
		"the mock cannot grant a product in a release build")
	assert_err(store.restore_purchases(), "mock_disabled", "the mock cannot restore in a release build")


func test_a_verified_receipt_unlocks_and_a_revocation_removes_it() -> void:
	assert_ok(entitlements.grant_from_receipt({
		"product_id": StoreAdapter.PRODUCT_FULL_CAMPAIGN, "verified": true, "source": "verified_receipt",
	}), "record a verified receipt")
	assert_true(entitlements.is_unlocked(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
		"a verified purchase unlocks the campaign")
	entitlements.revoke(StoreAdapter.PRODUCT_FULL_CAMPAIGN)
	assert_false(entitlements.is_unlocked(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
		"a refund or revocation removes the unlock")


func test_a_missing_cache_does_not_unlock_anything() -> void:
	entitlements.clear_cache()
	assert_false(entitlements.is_unlocked(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
		"an empty entitlement cache grants nothing")
	assert_eq(entitlements.describe(StoreAdapter.PRODUCT_FULL_CAMPAIGN), "not owned",
		"the state is reported honestly")
	assert_err(entitlements.grant_from_receipt({}), "invalid_receipt", "an empty receipt is refused")


func test_every_purchase_state_is_represented_and_named() -> void:
	for state in [StoreAdapter.PurchaseState.SUCCESS, StoreAdapter.PurchaseState.PENDING,
			StoreAdapter.PurchaseState.CANCELLED, StoreAdapter.PurchaseState.FAILED,
			StoreAdapter.PurchaseState.RESTORED, StoreAdapter.PurchaseState.REVOKED]:
		store.scripted_state = state
		var result: Variant = assert_ok(store.purchase(StoreAdapter.PRODUCT_FULL_CAMPAIGN),
			"the adapter reports state '%s'" % StoreAdapter.state_name(state))
		if result != null:
			assert_eq(int((result as Dictionary)["state"]), state, "the scripted state is returned")
		assert_false(StoreAdapter.state_name(state).is_empty(), "the state has a name for the UI")


func test_a_cancelled_purchase_spends_no_virtual_money() -> void:
	var loaded: Dictionary = ContentLibrary.load_from()
	var engine: GameEngine = GameEngine.create(loaded["value"])
	engine.autosave_enabled = false
	assert_ok(engine.new_game("fresh_work", {"display_name": "Shopper"}, 20260915), "start a life")
	var cash_before: int = engine.state.spendable_cash()
	var revision_before: int = engine.state.state_revision

	store.scripted_state = StoreAdapter.PurchaseState.CANCELLED
	var result: Dictionary = store.purchase(StoreAdapter.PRODUCT_FULL_CAMPAIGN)
	assert_eq(int((result["value"] as Dictionary)["state"]), StoreAdapter.PurchaseState.CANCELLED,
		"the purchase was cancelled")
	assert_money(engine.state.spendable_cash(), cash_before,
		"real-money commerce never touches simulated money")
	assert_eq(engine.state.state_revision, revision_before, "no command was applied")


func test_the_base_adapters_refuse_rather_than_pretend() -> void:
	var abstract := StoreAdapter.new()
	assert_false(abstract.is_production(), "the abstract adapter is not production")
	assert_err(abstract.purchase(StoreAdapter.PRODUCT_FULL_CAMPAIGN), "not_implemented",
		"the abstract adapter refuses to purchase")
	assert_false(store.is_production(), "the mock adapter never claims to be production")

	var share := ShareAdapter.new()
	assert_false(share.is_available(), "sharing is not available in this build")
	assert_err(share.share_image("res://none.png", "caption"), "not_implemented",
		"sharing refuses rather than pretending to post")
