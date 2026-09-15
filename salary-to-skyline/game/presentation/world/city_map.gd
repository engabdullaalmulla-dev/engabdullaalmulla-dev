class_name CityMap
extends RefCounted

## A walkable slice of Old Quay.
##
## The map is generated once from a fixed seed, so the district is the same
## district every time you open the game. This is decorative geometry only — it
## has no economic effect, and the simulation never reads it.

const W: int = 18
const H: int = 18

const SAND: int = 0
const ROAD: int = 1
const PAVE: int = 2
const WATER: int = 3
const PARK: int = 4
const QUAY: int = 5

## Streets: one across, one down, and the promenade along the water.
const ROAD_ROW: int = 11
const ROAD_COL: int = 8
const PROMENADE_ROW: int = 14
const WATER_FROM: int = 15

var tiles: Array = []
var buildings: Array = []
var props: Array = []
var places: Dictionary = {}


static func build(seed_value: int = 20260915) -> CityMap:
	var map := CityMap.new()
	map._lay_ground()
	map._raise_buildings(seed_value)
	map._scatter_props(seed_value)
	map._mark_places()
	return map


func tile_at(i: int, j: int) -> int:
	if i < 0 or j < 0 or i >= W or j >= H:
		return WATER
	return int((tiles[j] as Array)[i])


func _lay_ground() -> void:
	for j in H:
		var row: Array = []
		for i in W:
			var kind: int = SAND
			if j >= WATER_FROM:
				kind = WATER
			elif j == PROMENADE_ROW:
				kind = QUAY
			elif j == ROAD_ROW or i == ROAD_COL:
				kind = ROAD
			elif j == ROAD_ROW - 1 or j == ROAD_ROW + 1 or i == ROAD_COL - 1 or i == ROAD_COL + 1:
				kind = PAVE
			elif i >= 2 and i <= 4 and j >= 2 and j <= 4:
				kind = PARK
			row.append(kind)
		tiles.append(row)


func is_walkable(i: int, j: int) -> bool:
	var kind: int = tile_at(i, j)
	return kind == ROAD or kind == PAVE or kind == QUAY


## Blocks of buildings, with the landmarks placed by hand so the district has
## somewhere to live, somewhere to work, and something to want.
func _raise_buildings(seed_value: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value

	var blocks: Array = [
		{"i0": 0, "i1": 6, "j0": 0, "j1": 9, "low": 16, "high": 30},
		{"i0": 10, "i1": 17, "j0": 0, "j1": 9, "low": 26, "high": 58},
		{"i0": 0, "i1": 6, "j0": 12, "j1": 13, "low": 12, "high": 20},
		{"i0": 10, "i1": 17, "j0": 12, "j1": 13, "low": 14, "high": 24},
	]
	for block in blocks:
		var i: int = int(block["i0"])
		while i <= int(block["i1"]) - 1:
			var j: int = int(block["j0"])
			while j <= int(block["j1"]) - 1:
				if rng.randf() < 0.22 or _reserved(i, j):
					j += 2
					continue
				var footprint: int = 2 if rng.randf() < 0.7 else 1
				if i + footprint - 1 > int(block["i1"]) or j + footprint - 1 > int(block["j1"]):
					footprint = 1
				var height: float = rng.randf_range(float(block["low"]), float(block["high"]))
				buildings.append(_make_building(i, j, footprint, footprint, height, rng, ""))
				j += footprint + 1
			i += 2

	# Landmarks.
	buildings.append(_make_building(1, 12, 2, 2, 22.0, rng, "home"))
	buildings.append(_make_building(12, 6, 3, 3, 46.0, rng, "work"))
	buildings.append(_make_building(14, 12, 2, 2, 26.0, rng, "studio"))
	var site: Dictionary = _make_building(4, 5, 3, 3, 40.0, rng, "site")
	site["under_construction"] = true
	buildings.append(site)

	buildings.sort_custom(func(a, b): return int(a["i"]) + int(a["j"]) < int(b["i"]) + int(b["j"]))


func _reserved(i: int, j: int) -> bool:
	# Keep the landmark footprints clear of procedural blocks.
	var spots: Array = [[1, 12, 2, 2], [12, 6, 3, 3], [14, 12, 2, 2], [4, 5, 3, 3]]
	for spot in spots:
		if i < int(spot[0]) + int(spot[2]) + 1 and i + 2 > int(spot[0]) \
				and j < int(spot[1]) + int(spot[3]) + 1 and j + 2 > int(spot[1]):
			return true
	return false


func _make_building(i: int, j: int, si: int, sj: int, height: float,
		rng: RandomNumberGenerator, landmark: String) -> Dictionary:
	var palettes: Array = [
		[Color("d9bc94"), Color("b2926c"), Color("c7a57e")],  # warm plaster
		[Color("e7ded0"), Color("b6ada0"), Color("cfc6b8")],  # whitewash
		[Color("c07a52"), Color("8d573a"), Color("a86846")],  # terracotta
		[Color("9fb6c4"), Color("6f8593"), Color("869dac")],  # glass and steel
		[Color("cdb49b"), Color("a08770"), Color("b79e86")],
		[Color("8fb5a8"), Color("62857a"), Color("789e91")],  # sea-green trim
	]
	var shades: Array = palettes[rng.randi() % palettes.size()]
	if landmark == "studio":
		shades = [Color("e6cda4"), Color("bb9d72"), Color("d3b489")]
	elif landmark == "work":
		shades = [Color("9fb6c4"), Color("6f8593"), Color("869dac")]
	return {
		"i": i, "j": j, "si": si, "sj": sj,
		"height": height,
		"top": shades[0], "left": shades[1], "right": shades[2],
		"landmark": landmark,
		"under_construction": false,
		"window_seed": rng.randi(),
		"roof": rng.randf() < 0.4,
	}


func _scatter_props(seed_value: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value + 77
	# Palms along the promenade and the park.
	for i in range(1, W - 1, 2):
		props.append({"kind": "palm", "i": float(i) + 0.5, "j": float(PROMENADE_ROW) + 0.15,
			"height": rng.randf_range(11.0, 16.0)})
	for k in 6:
		props.append({"kind": "palm", "i": rng.randf_range(2.2, 4.6), "j": rng.randf_range(2.2, 4.6),
			"height": rng.randf_range(10.0, 14.0)})
	# Street lamps down the two streets.
	for j in range(1, PROMENADE_ROW, 3):
		props.append({"kind": "lamp", "i": float(ROAD_COL) - 0.7, "j": float(j)})
	for i in range(1, W - 1, 3):
		props.append({"kind": "lamp", "i": float(i), "j": float(ROAD_ROW) - 0.7})
	# Mooring posts along the quay.
	for i in range(0, W, 2):
		props.append({"kind": "post", "i": float(i) + 0.5, "j": float(WATER_FROM) - 0.12})


## Somewhere to go, and a reason to go there.
func _mark_places() -> void:
	places = {
		"home": {
			"name": "Your room", "i": 2.0, "j": 13.2, "access": Vector2(2.0, ROAD_ROW + 1),
			"line": "Rented, small, and paid for every month whether you are in it or not.",
		},
		"work": {
			"name": "The office", "i": 13.0, "j": 8.6, "access": Vector2(13.0, ROAD_ROW),
			"line": "Where the salary comes from. Being here is not a choice you make monthly.",
		},
		"studio": {
			"name": "Old Quay 101", "i": 15.0, "j": 13.2, "access": Vector2(15.0, PROMENADE_ROW),
			"line": "A studio with a strip of water from the window. Someone else owns it.",
		},
		"site": {
			"name": "The tower site", "i": 5.5, "j": 6.4, "access": Vector2(5.5, ROAD_ROW),
			"line": "Concrete and a crane. It will be finished long before you can pay for it.",
		},
		"quay": {
			"name": "The promenade", "i": 9.0, "j": 14.4, "access": Vector2(9.0, PROMENADE_ROW),
			"line": "Boats, lights, and the cheapest way to feel like the city is yours.",
		},
	}


## A walking route between two places, along streets and the promenade.
## The network is deliberately simple: one avenue, one street, one promenade.
func route(from_place: String, to_place: String) -> Array:
	var a: Dictionary = places.get(from_place, {})
	var b: Dictionary = places.get(to_place, {})
	if a.is_empty() or b.is_empty():
		return []
	var start := Vector2(float(a["i"]), float(a["j"]))
	var finish := Vector2(float(b["i"]), float(b["j"]))
	var access_a: Vector2 = a["access"]
	var access_b: Vector2 = b["access"]

	var path: Array = [start, access_a]
	path.append_array(_along_streets(access_a, access_b))
	path.append(access_b)
	path.append(finish)
	return path


## Moves along the street grid: reach the avenue, run down it, then turn off.
func _along_streets(a: Vector2, b: Vector2) -> Array:
	var steps: Array = []
	if is_equal_approx(a.y, b.y):
		return steps
	var junction_a := Vector2(float(ROAD_COL), a.y)
	var junction_b := Vector2(float(ROAD_COL), b.y)
	steps.append(junction_a)
	steps.append(junction_b)
	return steps
