class_name MockStoreAdapter
extends StoreAdapter

## *** MOCK. NOT COMMERCE. ***
##
## This adapter exists so the purchase-state machine (success, pending,
## cancelled, failed, restored, revoked) can be exercised in tests before any
## native billing plugin is integrated. It never contacts a store, never
## produces a real receipt, and refuses to operate outside a debug build, so a
## shipped build cannot accidentally hand out a paid unlock (acceptance T37).
##
## Do not present any result from this class as evidence of a working purchase.

var scripted_state: int = StoreAdapter.PurchaseState.SUCCESS
var available: bool = true

## Set true in tests to prove the mock refuses to grant anything in a release
## build without having to produce an exported template.
var simulate_release_build: bool = false


func adapter_name() -> String:
	return "mock (no real commerce)"


func is_production() -> bool:
	return false


func is_available() -> bool:
	return available and _debug_allowed()


func _debug_allowed() -> bool:
	return OS.is_debug_build() and not simulate_release_build


func query_product(product_id: String) -> Dictionary:
	if not _debug_allowed():
		return Money.err("mock_disabled", "the mock store is disabled outside debug builds")
	if product_id != StoreAdapter.PRODUCT_FULL_CAMPAIGN:
		return Money.err("unknown_product", "unknown product '%s'" % product_id)
	# Deliberately not a localized price: a real price string comes from the
	# store, and this one is labelled so it can never be mistaken for one.
	return Money.ok_value({
		"product_id": product_id,
		"price_text": "MOCK PRICE — no store connected",
		"currency_code": "",
		"title": "Full campaign (mock)",
	})


func purchase(product_id: String) -> Dictionary:
	if not _debug_allowed():
		return Money.err("mock_disabled", "the mock store cannot grant a product outside a debug build")
	if product_id != StoreAdapter.PRODUCT_FULL_CAMPAIGN:
		return Money.err("unknown_product", "unknown product '%s'" % product_id)
	return Money.ok_value({
		"state": scripted_state,
		"receipt": {
			"product_id": product_id,
			"source": "mock",
			"verified": false,
		},
	})


func restore_purchases() -> Dictionary:
	if not _debug_allowed():
		return Money.err("mock_disabled", "the mock store cannot restore outside a debug build")
	return Money.ok_value({
		"state": StoreAdapter.PurchaseState.RESTORED,
		"receipt": {"product_id": StoreAdapter.PRODUCT_FULL_CAMPAIGN, "source": "mock", "verified": false},
	})
