class_name Entitlements
extends RefCounted

## What the player is entitled to play, and why.
##
## An entitlement is only honoured when it came from a receipt a production
## adapter verified. A mock receipt is remembered for development but is ignored
## unless this is a debug build, so neither a missing cache nor a debug switch
## can unlock a paid product in a shipped build (acceptance case T37).
##
## Offline policy: a previously verified entitlement stays usable while offline.
## The cache is not the authority — it is a remembered verification — and it is
## re-checked whenever the store is reachable. This is a documented policy, not a
## tested platform behaviour: it has not been exercised on a device.

const SOURCE_VERIFIED: String = "verified_receipt"
const SOURCE_MOCK: String = "mock"

var _granted: Dictionary = {}


func grant_from_receipt(receipt: Dictionary) -> Dictionary:
	var product_id: String = String(receipt.get("product_id", ""))
	if product_id.is_empty():
		return Money.err("invalid_receipt", "a receipt must name a product")
	var verified: bool = bool(receipt.get("verified", false))
	var source: String = SOURCE_VERIFIED if verified else String(receipt.get("source", SOURCE_MOCK))
	_granted[product_id] = {"source": source, "verified": verified}
	return Money.ok_value(_granted[product_id])


func revoke(product_id: String) -> void:
	_granted.erase(product_id)


func clear_cache() -> void:
	_granted.clear()


## The only question the game should ask.
func is_unlocked(product_id: String) -> bool:
	if not _granted.has(product_id):
		return false
	var entry: Dictionary = _granted[product_id]
	if bool(entry.get("verified", false)) and String(entry.get("source", "")) == SOURCE_VERIFIED:
		return true
	# A mock or unverified entitlement is a development convenience only.
	return OS.is_debug_build() and _allow_mock_unlocks


## Test/development switch. It can only ever LOOSEN behaviour inside a debug
## build; it is ignored in an exported build because is_unlocked() requires
## OS.is_debug_build() as well.
var _allow_mock_unlocks: bool = true


func set_mock_unlocks_allowed(allowed: bool) -> void:
	_allow_mock_unlocks = allowed


func describe(product_id: String) -> String:
	if not _granted.has(product_id):
		return "not owned"
	var entry: Dictionary = _granted[product_id]
	return "owned (%s%s)" % [
		String(entry.get("source", "unknown")),
		"" if bool(entry.get("verified", false)) else ", UNVERIFIED",
	]
