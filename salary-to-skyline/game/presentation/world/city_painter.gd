extends Node2D

## Old Quay, alive.
##
## Everything here is decoration: cars, boats, people on the promenade, the sun
## crossing the sky, the crane turning. None of it touches the simulation, and
## removing any of it would not change a single dirham (brief section 23).
## The player's character walks real routes through real streets, the camera
## follows, and the month is something you watch happen rather than a figure
## that changes.

signal arrived(place_id: String)

const TW: float = 32.0
const TH: float = 16.0

var map: CityMap
var canvas_size: Vector2 = Vector2(240, 214)

var camera: Vector2 = Vector2.ZERO
var camera_target: Vector2 = Vector2.ZERO
var camera_lead: float = 0.0

## 0-24. Fixed while you are deciding; it moves while a month plays out.
var hour: float = 17.5
var hour_speed: float = 0.0

var tick: float = 0.0
var player: Dictionary = {
	"cell": Vector2(2.0, 13.2),
	"route": [],
	"step": 0,
	"speed": 2.6,
	"walking": false,
	"facing": Vector2(1, 0),
	"place": "home",
}
var cars: Array = []
var boats: Array = []
var walkers: Array = []
var birds: Array = []

var _sky_top: Color = Color.BLACK
var _sky_low: Color = Color.BLACK
var _night: float = 0.0


func setup(city: CityMap) -> void:
	map = city
	_spawn_traffic()
	place_player("home")
	camera = _world_of(player["cell"])
	camera_target = camera

# --- movement -----------------------------------------------------------------

func place_player(place_id: String) -> void:
	if map == null or not map.places.has(place_id):
		return
	var place: Dictionary = map.places[place_id]
	player["cell"] = Vector2(float(place["i"]), float(place["j"]))
	player["place"] = place_id
	player["route"] = []
	player["walking"] = false


func travel_to(place_id: String) -> bool:
	if map == null or not map.places.has(place_id):
		return false
	if String(player["place"]) == place_id and not bool(player["walking"]):
		return false
	var path: Array = map.route(String(player["place"]), place_id)
	if path.size() < 2:
		return false
	player["route"] = path
	player["step"] = 1
	player["walking"] = true
	player["destination"] = place_id
	return true


func is_walking() -> bool:
	return bool(player["walking"])


func current_place() -> String:
	return String(player["place"])


## Screen-space hit test for the pins floating over each landmark.
func place_at(point: Vector2) -> String:
	if map == null:
		return ""
	var best: String = ""
	var best_distance: float = 26.0
	for place_id in map.places.keys():
		var place: Dictionary = map.places[place_id]
		var screen: Vector2 = _screen_of(Vector2(float(place["i"]), float(place["j"]))) + Vector2(0, -34)
		var distance: float = screen.distance_to(point)
		if distance < best_distance:
			best_distance = distance
			best = String(place_id)
	return best


func _process(delta: float) -> void:
	tick += delta
	hour = fposmod(hour + hour_speed * delta, 24.0)
	_advance_player(delta)
	_advance_traffic(delta)
	camera_target = _world_of(player["cell"])
	camera = camera.lerp(camera_target, clampf(delta * 3.0, 0.0, 1.0))
	queue_redraw()


func _advance_player(delta: float) -> void:
	if not bool(player["walking"]):
		return
	var route: Array = player["route"]
	var step: int = int(player["step"])
	if step >= route.size():
		player["walking"] = false
		player["place"] = String(player.get("destination", player["place"]))
		arrived.emit(String(player["place"]))
		return
	var target: Vector2 = route[step]
	var cell: Vector2 = player["cell"]
	var to_target: Vector2 = target - cell
	var distance: float = to_target.length()
	var travel: float = float(player["speed"]) * delta
	if distance <= travel or distance < 0.001:
		player["cell"] = target
		player["step"] = step + 1
	else:
		var direction: Vector2 = to_target / distance
		player["cell"] = cell + direction * travel
		player["facing"] = direction

# --- traffic ------------------------------------------------------------------

func _spawn_traffic() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 424242
	cars.clear()
	boats.clear()
	walkers.clear()
	for k in 5:
		cars.append({
			"axis": "row", "i": rng.randf_range(0.0, float(CityMap.W)),
			"j": float(CityMap.ROAD_ROW) + (0.25 if k % 2 == 0 else -0.25),
			"speed": rng.randf_range(1.6, 2.6) * (1.0 if k % 2 == 0 else -1.0),
			"color": [Color("d6d2c8"), Color("9fb0bd"), Color("c58b6a"), Color("7f8fa6")][k % 4],
		})
	for k in 3:
		cars.append({
			"axis": "col", "i": float(CityMap.ROAD_COL) + (0.25 if k % 2 == 0 else -0.25),
			"j": rng.randf_range(0.0, float(CityMap.PROMENADE_ROW)),
			"speed": rng.randf_range(1.4, 2.2) * (1.0 if k % 2 == 0 else -1.0),
			"color": [Color("e0dacb"), Color("8fa8b5"), Color("b9714f")][k % 3],
		})
	for k in 4:
		boats.append({
			"i": rng.randf_range(0.0, float(CityMap.W)),
			"j": rng.randf_range(float(CityMap.WATER_FROM) + 0.6, float(CityMap.H) - 0.6),
			"speed": rng.randf_range(0.25, 0.6) * (1.0 if k % 2 == 0 else -1.0),
			"size": rng.randf_range(0.8, 1.5),
		})
	for k in 8:
		walkers.append({
			"i": rng.randf_range(1.0, float(CityMap.W) - 1.0),
			"j": float(CityMap.PROMENADE_ROW) + rng.randf_range(-0.2, 0.3),
			"speed": rng.randf_range(0.5, 0.9) * (1.0 if k % 2 == 0 else -1.0),
			"tint": [Color("e7d9c3"), Color("cbb9d6"), Color("bcd2c8"), Color("e3c4b0")][k % 4],
		})
	for k in 3:
		birds.append({"i": rng.randf_range(0.0, 18.0), "j": rng.randf_range(2.0, 12.0),
			"lift": rng.randf_range(38.0, 62.0), "speed": rng.randf_range(0.9, 1.5)})


func _advance_traffic(delta: float) -> void:
	for car in cars:
		if String(car["axis"]) == "row":
			car["i"] = fposmod(float(car["i"]) + float(car["speed"]) * delta, float(CityMap.W))
		else:
			car["j"] = fposmod(float(car["j"]) + float(car["speed"]) * delta, float(CityMap.PROMENADE_ROW))
	for boat in boats:
		boat["i"] = fposmod(float(boat["i"]) + float(boat["speed"]) * delta, float(CityMap.W) + 2.0) - 1.0
	for walker in walkers:
		var next: float = float(walker["i"]) + float(walker["speed"]) * delta
		if next < 0.5 or next > float(CityMap.W) - 0.5:
			walker["speed"] = -float(walker["speed"])
			next = clampf(next, 0.5, float(CityMap.W) - 0.5)
		walker["i"] = next
	for bird in birds:
		bird["i"] = fposmod(float(bird["i"]) + float(bird["speed"]) * delta, float(CityMap.W) + 4.0) - 2.0

# --- projection ---------------------------------------------------------------

func _world_of(cell: Vector2) -> Vector2:
	return Vector2((cell.x - cell.y) * TW * 0.5, (cell.x + cell.y) * TH * 0.5)


func _screen_of(cell: Vector2) -> Vector2:
	return _world_of(cell) - camera + canvas_size * Vector2(0.5, 0.58)


func _depth(cell: Vector2) -> float:
	return cell.x + cell.y

# --- painting -----------------------------------------------------------------

func _draw() -> void:
	if map == null:
		return
	_compute_light()
	_draw_sky()
	_draw_ground()
	_draw_world_objects()
	_draw_pins()
	_draw_weather()


## One warm-to-cold curve drives the sky, the shadows and every lit window.
func _compute_light() -> void:
	var t: float = hour
	if t < 5.0 or t >= 20.0:
		_night = 1.0
	elif t < 7.0:
		_night = 1.0 - (t - 5.0) / 2.0
	elif t < 17.5:
		_night = 0.0
	else:
		_night = (t - 17.5) / 2.5
	_night = clampf(_night, 0.0, 1.0)

	var day_top := Color("4f8fc0")
	var day_low := Color("bcd9e0")
	var dusk_top := Color("3b3c74")
	var dusk_low := Color("e5924f")
	var night_top := Color("10132e")
	var night_low := Color("2a2b56")
	if hour >= 17.0 and hour < 20.5:
		var k: float = clampf((hour - 17.0) / 2.0, 0.0, 1.0)
		_sky_top = day_top.lerp(dusk_top, k)
		_sky_low = day_low.lerp(dusk_low, k)
		var k2: float = clampf((hour - 19.0) / 1.5, 0.0, 1.0)
		_sky_top = _sky_top.lerp(night_top, k2)
		_sky_low = _sky_low.lerp(night_low, k2)
	elif hour >= 20.5 or hour < 5.0:
		_sky_top = night_top
		_sky_low = night_low
	elif hour < 7.5:
		var k3: float = clampf((hour - 5.0) / 2.5, 0.0, 1.0)
		_sky_top = night_top.lerp(day_top, k3)
		_sky_low = dusk_low.lerp(day_low, k3)
	else:
		_sky_top = day_top
		_sky_low = day_low


func _draw_sky() -> void:
	var horizon_y: float = canvas_size.y * 0.42
	var bands: int = 14
	var band_height: float = horizon_y / float(bands)
	for row in bands:
		var k: float = float(row) / float(bands - 1)
		# Contiguous bands, each drawn a pixel long, so no seam shows.
		draw_rect(Rect2(0.0, floor(float(row) * band_height), canvas_size.x, ceil(band_height) + 1.0),
			_sky_top.lerp(_sky_low, k))
	# Open sea fills everything below the horizon; the district sits on top of it.
	var sea: Color = _tint(Color("17636b"))
	draw_rect(Rect2(0.0, horizon_y, canvas_size.x, canvas_size.y - horizon_y), sea)
	draw_rect(Rect2(0.0, horizon_y - 1.0, canvas_size.x, 2.0), _sky_low.lerp(sea, 0.35))
	for k in 30:
		var y: float = horizon_y + 5.0 + float(k) * 7.0
		if y > canvas_size.y:
			break
		if sin(tick * 0.9 + float(k) * 1.3) < 0.2:
			continue
		draw_rect(Rect2(fposmod(float(k) * 53.0 + tick * 5.0, canvas_size.x), y, 5.0, 1.0),
			Color("9fe3dd", 0.16))

	# Sun or moon tracks the hour across the sky.
	var day_fraction: float = clampf((hour - 5.5) / 13.0, 0.0, 1.0)
	var arc_x: float = canvas_size.x * (0.1 + 0.8 * day_fraction)
	var arc_y: float = canvas_size.y * 0.42 - sin(day_fraction * PI) * canvas_size.y * 0.30
	if _night < 0.95:
		draw_circle(Vector2(arc_x, arc_y), 6.0, Color("ffd98a").lerp(Color("ff9f5a"), _night))
	else:
		draw_circle(Vector2(canvas_size.x * 0.22, canvas_size.y * 0.16), 4.5, Color("e9e7f5"))

	# Far skyline: the rest of the city, parallaxed so it drifts as you walk.
	var drift: float = -camera.x * 0.18
	var rng := RandomNumberGenerator.new()
	rng.seed = 991
	var horizon: float = canvas_size.y * 0.42
	var x: float = -40.0
	while x < canvas_size.x + 60.0:
		var width: float = rng.randf_range(10.0, 22.0)
		var height: float = rng.randf_range(12.0, 46.0)
		var px: float = fposmod(x + drift, canvas_size.x + 120.0) - 60.0
		var tint: Color = _sky_low.lerp(Color("2b2c4e"), 0.55 + 0.2 * _night)
		draw_rect(Rect2(px, horizon - height, width, height + 2.0), tint)
		x += width + rng.randf_range(3.0, 10.0)


func _draw_ground() -> void:
	# The land itself, as one plate, then only the tiles that differ from sand.
	var corners := PackedVector2Array([
		_screen_of(Vector2(0, 0)), _screen_of(Vector2(CityMap.W, 0)),
		_screen_of(Vector2(CityMap.W, CityMap.H)), _screen_of(Vector2(0, CityMap.H))])
	draw_colored_polygon(corners, _tint(Color("d8bb90")))

	for j in CityMap.H:
		for i in CityMap.W:
			var kind: int = map.tile_at(i, j)
			if kind == CityMap.SAND:
				continue
			var color: Color
			match kind:
				CityMap.ROAD:
					color = Color("6f6a63")
				CityMap.PAVE:
					color = Color("c3b49c")
				CityMap.QUAY:
					color = Color("cbb493")
				CityMap.PARK:
					color = Color("6f9a5f")
				_:
					color = Color("1c6a72")
			var screen: Vector2 = _screen_of(Vector2(i, j))
			if screen.x < -TW or screen.x > canvas_size.x + TW \
					or screen.y < -TH * 3 or screen.y > canvas_size.y + TH * 3:
				continue
			_tile(i, j, _tint(color))
			if kind == CityMap.WATER:
				_water_sparkle(i, j)
			elif kind == CityMap.ROAD and (i == CityMap.ROAD_COL) != (j == CityMap.ROAD_ROW):
				_road_markings(i, j)


func _tile(i: float, j: float, color: Color) -> void:
	draw_colored_polygon(PackedVector2Array([
		_screen_of(Vector2(i, j)), _screen_of(Vector2(i + 1, j)),
		_screen_of(Vector2(i + 1, j + 1)), _screen_of(Vector2(i, j + 1))]), color)


func _water_sparkle(i: int, j: int) -> void:
	var phase: float = sin(tick * 1.4 + float(i) * 0.9 + float(j) * 1.7)
	if phase < 0.55:
		return
	var point: Vector2 = _screen_of(Vector2(float(i) + 0.35, float(j) + 0.55))
	draw_rect(Rect2(point.x, point.y, 3, 1), Color("9fe3dd", 0.5))


func _road_markings(i: int, j: int) -> void:
	var a: Vector2 = _screen_of(Vector2(float(i) + 0.5, float(j) + 0.15))
	var b: Vector2 = _screen_of(Vector2(float(i) + 0.5, float(j) + 0.85))
	if j == CityMap.ROAD_ROW:
		a = _screen_of(Vector2(float(i) + 0.15, float(j) + 0.5))
		b = _screen_of(Vector2(float(i) + 0.85, float(j) + 0.5))
	draw_line(a, b, Color("cbbf9f", 0.5), 1.0)


## Buildings, props and everything that moves, drawn back to front together so a
## car on a far street passes behind the block in front of it.
func _draw_world_objects() -> void:
	var queue: Array = []
	for building in map.buildings:
		queue.append({"depth": float(building["i"]) + float(building["j"])
			+ float(building["si"]) * 0.5 + float(building["sj"]) * 0.5,
			"kind": "building", "data": building})
	for prop in map.props:
		queue.append({"depth": float(prop["i"]) + float(prop["j"]), "kind": "prop", "data": prop})
	for car in cars:
		queue.append({"depth": float(car["i"]) + float(car["j"]), "kind": "car", "data": car})
	for boat in boats:
		queue.append({"depth": float(boat["i"]) + float(boat["j"]), "kind": "boat", "data": boat})
	for walker in walkers:
		queue.append({"depth": float(walker["i"]) + float(walker["j"]), "kind": "walker", "data": walker})
	var cell: Vector2 = player["cell"]
	queue.append({"depth": cell.x + cell.y + 0.01, "kind": "player", "data": player})
	queue.sort_custom(func(a, b): return float(a["depth"]) < float(b["depth"]))

	for item in queue:
		var data: Dictionary = item["data"]
		var anchor: Vector2 = _screen_of(Vector2(float(data.get("i", 0.0)), float(data.get("j", 0.0)))) \
			if String(item["kind"]) != "player" else _screen_of(cell)
		if anchor.x < -120.0 or anchor.x > canvas_size.x + 120.0 \
				or anchor.y < -160.0 or anchor.y > canvas_size.y + 90.0:
			continue
		match String(item["kind"]):
			"building":
				_draw_building(data)
			"prop":
				_draw_prop(data)
			"car":
				_draw_car(data)
			"boat":
				_draw_boat(data)
			"walker":
				_draw_walker(data)
			"player":
				_draw_player()


## An isometric cuboid. `base` lifts it off the ground, so a water tank sits on
## a roof instead of growing out of the pavement as a full-height column.
func _box(i: float, j: float, si: float, sj: float, height: float,
		top: Color, left: Color, right: Color, base: float = 0.0) -> void:
	var floor_lift := Vector2(0, -base)
	var rise := Vector2(0, -height)
	var a: Vector2 = _screen_of(Vector2(i, j)) + floor_lift
	var b: Vector2 = _screen_of(Vector2(i + si, j)) + floor_lift
	var c: Vector2 = _screen_of(Vector2(i + si, j + sj)) + floor_lift
	var d: Vector2 = _screen_of(Vector2(i, j + sj)) + floor_lift
	draw_colored_polygon(PackedVector2Array([b, c, c + rise, b + rise]), right)
	draw_colored_polygon(PackedVector2Array([c, d, d + rise, c + rise]), left)
	draw_colored_polygon(PackedVector2Array([a + rise, b + rise, c + rise, d + rise]), top)


func _draw_building(building: Dictionary) -> void:
	var i: float = float(building["i"])
	var j: float = float(building["j"])
	var si: float = float(building["si"])
	var sj: float = float(building["sj"])
	var height: float = float(building["height"])

	if bool(building["under_construction"]):
		_draw_construction(i, j, si, sj, height)
		return

	_box(i, j, si, sj, height, _tint(building["top"]), _tint(building["left"]), _tint(building["right"]))

	# Windows. They light up in the evening, one building at a time.
	var rng := RandomNumberGenerator.new()
	rng.seed = int(building["window_seed"])
	var rows: int = int(height / 9.0)
	var glow: Color = Color("ffd489")
	for row in rows:
		var y: float = -8.0 - float(row) * 9.0
		if -y > height - 4.0:
			break
		for k in 2:
			var t: float = 0.28 + float(k) * 0.42
			var lit: bool = _night > 0.25 and rng.randf() < 0.55 + 0.3 * _night
			var color: Color = glow if lit else _tint(Color(building["right"]).darkened(0.35))
			var p0: Vector2 = _screen_of(Vector2(i + si, j + sj * t)) + Vector2(0, y)
			var p1: Vector2 = _screen_of(Vector2(i + si, j + sj * (t + 0.18))) + Vector2(0, y)
			draw_colored_polygon(PackedVector2Array([
				p0, p1, p1 + Vector2(0, 4.5), p0 + Vector2(0, 4.5)]), color)
			var q0: Vector2 = _screen_of(Vector2(i + si * (1.0 - t), j + sj)) + Vector2(0, y)
			var q1: Vector2 = _screen_of(Vector2(i + si * (1.0 - t - 0.18), j + sj)) + Vector2(0, y)
			var side: Color = glow if (lit and rng.randf() < 0.7) else _tint(Color(building["left"]).darkened(0.3))
			draw_colored_polygon(PackedVector2Array([
				q0, q1, q1 + Vector2(0, 4.5), q0 + Vector2(0, 4.5)]), side)

	if bool(building["roof"]):
		_box(i + si * 0.3, j + sj * 0.3, si * 0.4, sj * 0.4, 6.0,
			_tint(Color(building["top"]).darkened(0.1)),
			_tint(Color(building["left"]).darkened(0.1)),
			_tint(Color(building["right"]).darkened(0.1)), height)
	# Water tanks and air conditioning: the clutter that makes a roof look used.
	if rng.randf() < 0.7:
		_box(i + si * 0.58, j + sj * 0.12, si * 0.22, sj * 0.22, 4.0,
			_tint(Color("b9b2a6")), _tint(Color("857f75")), _tint(Color("9e978c")), height)
	if rng.randf() < 0.45:
		_box(i + si * 0.1, j + sj * 0.62, si * 0.24, sj * 0.2, 2.5,
			_tint(Color("a9b3b8")), _tint(Color("767f84")), _tint(Color("8f989d")), height)
	if String(building["landmark"]) == "studio":
		# A lit window, always: someone else is living in the flat you want.
		var p: Vector2 = _screen_of(Vector2(i + si, j + sj * 0.45)) + Vector2(0, -height + 9.0)
		draw_rect(Rect2(p.x - 1, p.y, 3, 5), Color("ffd489"))


func _draw_construction(i: float, j: float, si: float, sj: float, height: float) -> void:
	var concrete := _tint(Color("9d968c"))
	var dark := _tint(Color("6f6a62"))
	var floors: int = int(height / 8.0)
	for level in floors:
		# Each slab sits on the one below it, with the frame showing between.
		_box(i, j, si, sj, 2.0, concrete, dark, _tint(Color("8a847a")), float(level) * 8.0)
		for corner in [Vector2(0.06, 0.06), Vector2(si - 0.12, 0.06),
				Vector2(0.06, sj - 0.12), Vector2(si - 0.12, sj - 0.12)]:
			_box(i + corner.x, j + corner.y, 0.12, 0.12, 6.0,
				dark, dark, dark, float(level) * 8.0 + 2.0)
	# Crane: mast, slewing arm, hook.
	var base: Vector2 = _screen_of(Vector2(i + si * 0.5, j + sj * 0.5))
	var mast_top: Vector2 = base + Vector2(0, -height - 22.0)
	var mast_foot: Vector2 = base + Vector2(0, -height * 0.45)
	draw_line(mast_foot, mast_top, _tint(Color("d9a441")), 3.0)
	var rungs: int = int((mast_foot.y - mast_top.y) / 6.0)
	for rung in rungs:
		var y: float = mast_top.y + float(rung) * 6.0
		draw_line(Vector2(mast_top.x - 2.0, y), Vector2(mast_top.x + 2.0, y + 3.0),
			_tint(Color("b8862f")), 1.0)
	var swing: float = sin(tick * 0.25) * 0.9
	var arm: Vector2 = mast_top + Vector2(cos(swing) * 34.0, sin(swing) * 10.0)
	var tail: Vector2 = mast_top - Vector2(cos(swing) * 12.0, sin(swing) * 4.0)
	draw_line(tail, arm, _tint(Color("e8b856")), 2.0)
	draw_line(arm, arm + Vector2(0, 16.0), _tint(Color("cfc7bb")), 1.0)
	draw_rect(Rect2(arm.x - 1.5, arm.y + 16.0, 3, 3), _tint(Color("b8b0a4")))
	if _night > 0.3:
		draw_circle(mast_top, 2.0, Color("ff6a5a", 0.6 + 0.4 * sin(tick * 3.0)))


func _draw_prop(prop: Dictionary) -> void:
	var anchor: Vector2 = _screen_of(Vector2(float(prop["i"]), float(prop["j"])))
	match String(prop["kind"]):
		"palm":
			var height: float = float(prop["height"])
			var sway: float = sin(tick * 0.8 + float(prop["i"])) * 1.5
			var top: Vector2 = anchor + Vector2(sway, -height)
			draw_line(anchor, top, _tint(Color("7a5a3a")), 2.0)
			for k in 5:
				var angle: float = -2.6 + float(k) * 0.55
				draw_line(top, top + Vector2(cos(angle), sin(angle)) * 9.0,
					_tint(Color("4f8f5c")), 2.0)
		"lamp":
			draw_line(anchor, anchor + Vector2(0, -16.0), _tint(Color("50565f")), 1.0)
			var bulb: Vector2 = anchor + Vector2(0, -17.0)
			if _night > 0.2:
				draw_circle(bulb, 5.0, Color("ffd489", 0.20 * _night))
				draw_circle(bulb, 1.6, Color("ffe6ad"))
			else:
				draw_circle(bulb, 1.4, _tint(Color("7c828b")))
		"post":
			draw_rect(Rect2(anchor.x - 1, anchor.y - 5, 2, 5), _tint(Color("8b7a5f")))


func _draw_car(car: Dictionary) -> void:
	var i: float = float(car["i"])
	var j: float = float(car["j"])
	var anchor: Vector2 = _screen_of(Vector2(i, j))
	draw_colored_polygon(PackedVector2Array([
		anchor + Vector2(-5, 0), anchor + Vector2(0, -2.5),
		anchor + Vector2(5, 0), anchor + Vector2(0, 2.5)]), Color(0, 0, 0, 0.18))
	_box(i - 0.18, j - 0.12, 0.36, 0.24, 4.0,
		_tint(car["color"]), _tint(Color(car["color"]).darkened(0.35)),
		_tint(Color(car["color"]).darkened(0.18)))
	if _night > 0.25:
		var direction: float = signf(float(car["speed"]))
		var lamp: Vector2 = anchor + Vector2(direction * 6.0, -2.0)
		draw_circle(lamp, 3.0, Color("ffeec0", 0.22 * _night))
		draw_circle(lamp, 1.0, Color("fff3d0", 0.8))


func _draw_boat(boat: Dictionary) -> void:
	var anchor: Vector2 = _screen_of(Vector2(float(boat["i"]), float(boat["j"])))
	var bob: float = sin(tick * 1.6 + float(boat["i"])) * 1.2
	var size: float = float(boat["size"])
	var hull := PackedVector2Array([
		anchor + Vector2(-7 * size, bob), anchor + Vector2(7 * size, bob),
		anchor + Vector2(4 * size, bob + 3.2), anchor + Vector2(-4 * size, bob + 3.2)])
	draw_colored_polygon(hull, _tint(Color("efe7d6")))
	draw_line(anchor + Vector2(0, bob), anchor + Vector2(0, bob - 10.0 * size), _tint(Color("d8cfbc")), 1.0)
	draw_colored_polygon(PackedVector2Array([
		anchor + Vector2(0, bob - 10.0 * size), anchor + Vector2(5.5 * size, bob - 1.0),
		anchor + Vector2(0, bob - 1.0)]), _tint(Color("f7f2e6")))
	draw_line(anchor + Vector2(-9 * size, bob + 4), anchor + Vector2(9 * size, bob + 4),
		Color("8fd8d0", 0.25), 1.0)


func _draw_walker(walker: Dictionary) -> void:
	var anchor: Vector2 = _screen_of(Vector2(float(walker["i"]), float(walker["j"])))
	var bob: float = 0.0 if fmod(tick * 3.0 + float(walker["i"]) * 2.0, 2.0) > 1.0 else -1.0
	draw_colored_polygon(PackedVector2Array([
		anchor + Vector2(-3, 0), anchor + Vector2(0, -1.5),
		anchor + Vector2(3, 0), anchor + Vector2(0, 1.5)]), Color(0, 0, 0, 0.15))
	draw_rect(Rect2(anchor.x - 2, anchor.y - 8 + bob, 4, 6), _tint(walker["tint"]))
	draw_rect(Rect2(anchor.x - 1.5, anchor.y - 11 + bob, 3, 3), _tint(Color("c08b62")))


func _draw_player() -> void:
	var anchor: Vector2 = _screen_of(player["cell"])
	var walking: bool = bool(player["walking"])
	var stride: float = fmod(tick * 6.0, 2.0)
	var bob: float = (-1.0 if stride > 1.0 else 0.0) if walking else (-1.0 if fmod(tick, 2.4) > 1.2 else 0.0)

	draw_colored_polygon(PackedVector2Array([
		anchor + Vector2(-5, 0), anchor + Vector2(0, -2.5),
		anchor + Vector2(5, 0), anchor + Vector2(0, 2.5)]), Color(0, 0, 0, 0.22))
	# A soft ring so you can always find yourself in the district.
	draw_arc(anchor, 8.0, 0.0, TAU, 18, Color("35c2ae", 0.35 + 0.15 * sin(tick * 2.2)), 1.0)

	var base: Vector2 = anchor + Vector2(0, bob)
	var leg_split: float = 1.6 if walking and stride > 1.0 else 0.8
	draw_rect(Rect2(base.x - leg_split - 0.8, base.y - 7, 1.6, 7), Color("2f3350"))
	draw_rect(Rect2(base.x + leg_split - 0.8, base.y - 7, 1.6, 7), Color("2f3350"))
	draw_rect(Rect2(base.x - 3, base.y - 15, 6, 8), Color("dcd6e8"))
	draw_rect(Rect2(base.x - 2.5, base.y - 20, 5, 5), Color("c98f63"))
	draw_rect(Rect2(base.x - 2.5, base.y - 21, 5, 2), Color("32262a"))


## Pins hang over the places you can go, and bob so they read as interactive.
func _draw_pins() -> void:
	for place_id in map.places.keys():
		var place: Dictionary = map.places[place_id]
		var anchor: Vector2 = _screen_of(Vector2(float(place["i"]), float(place["j"])))
		var lift: float = 34.0 + sin(tick * 2.0 + float(place["i"])) * 1.5
		var point: Vector2 = anchor + Vector2(0, -lift)
		if point.x < -20.0 or point.x > canvas_size.x + 20.0:
			continue
		var here: bool = String(player["place"]) == String(place_id) and not bool(player["walking"])
		var accent: Color = Color("e3a94e") if String(place_id) == "studio" else Color("35c2ae")
		if here:
			accent = Color("f7ecd9")
		draw_line(point + Vector2(0, 4), anchor + Vector2(0, -6), Color(0, 0, 0, 0.25), 1.0)
		draw_colored_polygon(PackedVector2Array([
			point + Vector2(0, 5), point + Vector2(-4, 0),
			point + Vector2(0, -5), point + Vector2(4, 0)]), accent)
		draw_colored_polygon(PackedVector2Array([
			point + Vector2(0, 2.4), point + Vector2(-2, 0),
			point + Vector2(0, -2.4), point + Vector2(2, 0)]), Color("15122a", 0.65))


func _draw_weather() -> void:
	for bird in birds:
		var anchor: Vector2 = _screen_of(Vector2(float(bird["i"]), float(bird["j"]))) \
			+ Vector2(0, -float(bird["lift"]))
		var flap: float = sin(tick * 6.0 + float(bird["i"])) * 2.0
		draw_line(anchor + Vector2(-3, flap), anchor, Color("2c2a3f", 0.5), 1.0)
		draw_line(anchor, anchor + Vector2(3, flap), Color("2c2a3f", 0.5), 1.0)
	if _night > 0.05:
		draw_rect(Rect2(Vector2.ZERO, canvas_size), Color("0d1436", 0.16 * _night))


## Shifts any colour toward evening, so the whole district changes together.
func _tint(color: Color) -> Color:
	var evening := Color("17204a")
	return Color(color).lerp(evening, 0.45 * _night).lerp(Color("ffd7a8"), 0.10 * (1.0 - _night) * _dusk_warmth())


func _dusk_warmth() -> float:
	if hour > 15.5 and hour < 19.5:
		return 1.0
	return 0.0
