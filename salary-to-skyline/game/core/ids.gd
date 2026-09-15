class_name Ids
extends RefCounted

## Stable, validated identifiers.
##
## Content IDs (jobs, units, districts) are authored lowercase snake_case and
## must stay stable across content versions, because saves refer to them.
## Runtime IDs (commands, transactions) are generated from a saved counter plus
## the game ID, never from wall-clock time, so a replayed session is reproducible
## and a command ID cannot collide after a reload.

const MAX_ID_LENGTH: int = 64


static func is_valid_content_id(id: String) -> bool:
	if id.is_empty() or id.length() > MAX_ID_LENGTH:
		return false
	for i in id.length():
		var c: int = id.unicode_at(i)
		var is_lower: bool = c >= 97 and c <= 122
		var is_digit: bool = c >= 48 and c <= 57
		var is_underscore: bool = c == 95
		if not (is_lower or is_digit or is_underscore):
			return false
	return not id.begins_with("_") and not id.ends_with("_")


static func is_valid_runtime_id(id: String) -> bool:
	if id.is_empty() or id.length() > MAX_ID_LENGTH:
		return false
	for i in id.length():
		var c: int = id.unicode_at(i)
		var is_lower: bool = c >= 97 and c <= 122
		var is_digit: bool = c >= 48 and c <= 57
		var is_sep: bool = c == 95 or c == 45 or c == 46
		if not (is_lower or is_digit or is_sep):
			return false
	return true


## Deterministic runtime ID: "<game_id>.<kind>.<sequence>".
static func make_runtime_id(game_id: String, kind: String, sequence: int) -> String:
	return "%s.%s.%d" % [game_id, kind, sequence]


## New-game identifier. This is the only place a real clock is read, and it only
## names the save; no simulation value is ever derived from it.
static func make_game_id(seed_value: int) -> String:
	return "game-%d" % absi(seed_value)
