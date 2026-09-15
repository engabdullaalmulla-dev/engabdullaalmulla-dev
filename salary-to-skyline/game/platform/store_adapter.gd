class_name StoreAdapter
extends RefCounted

## Interface for real-money commerce.
##
## NOTHING in this file talks to a store. It defines the shape that a native
## iOS StoreKit / Google Play Billing adapter must implement, so that the game
## can be written against it now and the native adapter can be dropped in once
## the platform spike (PLATFORM-001) and the owner's store credentials exist.
##
## The commercial model is a single non-consumable full-campaign unlock. There is
## no virtual currency, no paid bailout, and no purchasable advantage; those are
## owner-level product decisions recorded in CLAUDE.md, not adapter options.

const PRODUCT_FULL_CAMPAIGN: String = "full_campaign_unlock"

enum PurchaseState {
	SUCCESS,
	PENDING,
	CANCELLED,
	FAILED,
	RESTORED,
	REVOKED,
	UNAVAILABLE,
}


## Human-readable adapter name for the evidence log and the settings screen.
func adapter_name() -> String:
	return "abstract"


## True only for an adapter that talks to a real store with a real receipt.
## A mock must never return true.
func is_production() -> bool:
	return false


func is_available() -> bool:
	return false


## Localized price text must come from the store, never from a hard-coded label.
## Returns { ok, value: { product_id, price_text, currency_code, title } }.
func query_product(_product_id: String) -> Dictionary:
	return Money.err("not_implemented", "no store adapter is installed in this build")


## Returns { ok, value: { state: PurchaseState, receipt: Dictionary } }.
func purchase(_product_id: String) -> Dictionary:
	return Money.err("not_implemented", "no store adapter is installed in this build")


func restore_purchases() -> Dictionary:
	return Money.err("not_implemented", "no store adapter is installed in this build")


static func state_name(state: int) -> String:
	match state:
		PurchaseState.SUCCESS: return "success"
		PurchaseState.PENDING: return "pending"
		PurchaseState.CANCELLED: return "cancelled"
		PurchaseState.FAILED: return "failed"
		PurchaseState.RESTORED: return "restored"
		PurchaseState.REVOKED: return "revoked"
		_: return "unavailable"
