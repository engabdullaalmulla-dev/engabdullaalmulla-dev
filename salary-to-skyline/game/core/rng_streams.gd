class_name RngStreams
extends RefCounted

## Named, separately saved random streams (ECONOMY_SPEC E3, brief section 26).
##
## Economic streams must never be advanced by presentation code, and a decorative
## stream must never be able to change an economic outcome. Every stream's seed
## and state serialize as decimal strings so a reload reproduces the exact
## sequence under the same engine and rules version.

const ECONOMIC_STREAMS: Array = ["market", "career", "construction", "narrative"]
const DECORATIVE_STREAMS: Array = ["decor"]

var _generators: Dictionary = {}
var _master_seed: int = 0


static func create(master_seed: int) -> RngStreams:
	var streams := RngStreams.new()
	streams._master_seed = master_seed
	for name in ECONOMIC_STREAMS:
		streams._generators[name] = streams._make_generator(name, master_seed)
	for name in DECORATIVE_STREAMS:
		streams._generators[name] = streams._make_generator(name, master_seed)
	return streams


func _make_generator(stream_name: String, master_seed: int) -> RandomNumberGenerator:
	var generator := RandomNumberGenerator.new()
	# Hashing the name keeps streams independent: consuming the market stream
	# cannot shift the career stream.
	generator.seed = hash("%s::%d" % [stream_name, master_seed])
	return generator


func master_seed() -> int:
	return _master_seed


func has_stream(stream_name: String) -> bool:
	return _generators.has(stream_name)


func stream(stream_name: String) -> RandomNumberGenerator:
	assert(_generators.has(stream_name), "unknown RNG stream '%s'" % stream_name)
	return _generators[stream_name]


func is_economic(stream_name: String) -> bool:
	return ECONOMIC_STREAMS.has(stream_name)


## Snapshot used by tests and previews to prove that an operation consumed no
## randomness (acceptance cases T31 and T32).
func state_fingerprint() -> String:
	var parts: PackedStringArray = PackedStringArray()
	var names: Array = _generators.keys()
	names.sort()
	for name in names:
		var generator: RandomNumberGenerator = _generators[name]
		parts.append("%s:%s:%s" % [name, str(generator.seed), str(generator.state)])
	return "|".join(parts)


func to_dict() -> Dictionary:
	var streams: Dictionary = {}
	var names: Array = _generators.keys()
	names.sort()
	for name in names:
		var generator: RandomNumberGenerator = _generators[name]
		streams[name] = {"seed": str(generator.seed), "state": str(generator.state)}
	return {"master_seed": str(_master_seed), "streams": streams}


static func from_dict(data: Dictionary) -> Dictionary:
	if typeof(data) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "rng block is not a dictionary")
	var master_text: Variant = data.get("master_seed", "")
	if typeof(master_text) != TYPE_STRING:
		return Money.err("type_rejected", "rng master_seed must be a decimal string")
	var master_parsed: Dictionary = _parse_int64(String(master_text))
	if not master_parsed["ok"]:
		return master_parsed
	var streams := RngStreams.create(int(master_parsed["value"]))
	var stored: Variant = data.get("streams", {})
	if typeof(stored) != TYPE_DICTIONARY:
		return Money.err("type_rejected", "rng streams block is not a dictionary")
	for name in streams._generators.keys():
		if not (stored as Dictionary).has(name):
			return Money.err("missing_stream", "saved rng is missing stream '%s'" % name)
		var entry: Variant = (stored as Dictionary)[name]
		if typeof(entry) != TYPE_DICTIONARY:
			return Money.err("type_rejected", "rng stream '%s' is not a dictionary" % name)
		var seed_parsed: Dictionary = _parse_int64(String((entry as Dictionary).get("seed", "")))
		var state_parsed: Dictionary = _parse_int64(String((entry as Dictionary).get("state", "")))
		if not seed_parsed["ok"]:
			return seed_parsed
		if not state_parsed["ok"]:
			return state_parsed
		var generator: RandomNumberGenerator = streams._generators[name]
		generator.seed = int(seed_parsed["value"])
		generator.state = int(state_parsed["value"])
	return {"ok": true, "value": streams}


## Full-range signed 64-bit parse. RNG state legitimately uses the whole range,
## so this is deliberately not Money.parse_minor_string.
static func _parse_int64(text: String) -> Dictionary:
	if text.is_empty():
		return Money.err("empty", "empty integer string")
	var body: String = text
	if body.begins_with("-"):
		body = body.substr(1)
	if body.is_empty() or body.length() > 20:
		return Money.err("malformed", "integer string '%s' is malformed" % text)
	for i in body.length():
		var c: int = body.unicode_at(i)
		if c < 48 or c > 57:
			return Money.err("malformed", "integer string '%s' contains a non-digit" % text)
	var value: int = text.to_int()
	if str(value) != text:
		return Money.err("out_of_range", "integer string '%s' does not round-trip" % text)
	return {"ok": true, "value": value}
