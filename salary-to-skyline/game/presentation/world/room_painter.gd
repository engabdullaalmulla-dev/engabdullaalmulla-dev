extends Node2D

## The room you actually live in, drawn as original isometric pixel art.
##
## Everything here is code-drawn into a 180x160 logical viewport which is then
## scaled up with nearest-neighbour filtering, so the result is genuinely chunky
## pixels rather than smooth vector shapes pretending to be pixel art. The tile
## geometry (36x18 diamond, 2:1) is the project's documented ground tile.
##
## This layer reads simulation state and never writes it. Nothing drawn here
## changes a number; the room is a view of the numbers, not a source of them.

const TILE_W: float = 40.0
const TILE_H: float = 20.0
const FLOOR_TILES: int = 4
const WALL_HEIGHT: float = 54.0

## Logical pixel size of the viewport this paints into; the room centres in it.
var canvas_size: Vector2 = Vector2(180, 160)

## "dawn" | "day" | "dusk" | "night"
var time_of_day: String = "dusk"
## 0 rented room · 1 studio · 2 apartment · 3 better home (only 0 exists at M0)
var housing_tier: int = 0
## 0.0-1.0 fill of the savings jar on the desk
var savings_fill: float = 0.0
## An unpaid bill puts a letter on the floor instead of hiding in a menu
var has_unpaid_bill: bool = false
## Advances the idle animation; presentation only, never an economic input
var tick: float = 0.0


func _process(delta: float) -> void:
	tick += delta
	queue_redraw()


func origin() -> Vector2:
	return Vector2(round(canvas_size.x * 0.5), 58.0)


func iso(i: float, j: float) -> Vector2:
	return origin() + Vector2((i - j) * TILE_W * 0.5, (i + j) * TILE_H * 0.5)


func _draw() -> void:
	_draw_backdrop()
	_draw_room_shell()
	_draw_window()
	_draw_floor_dressing()
	_draw_bed()
	_draw_desk()
	_draw_plant()
	if has_unpaid_bill:
		_draw_dropped_letter()
	_draw_character()
	_draw_light()

## A soft floor shadow under the room so it sits in the dark rather than floating.
func _draw_backdrop() -> void:
	var drop := Vector2(0, 6)
	draw_colored_polygon(PackedVector2Array([
		iso(0, 0) + drop, iso(FLOOR_TILES, 0) + drop,
		iso(FLOOR_TILES, FLOOR_TILES) + drop, iso(0, FLOOR_TILES) + drop]),
		Color(0, 0, 0, 0.22))


# --- shell --------------------------------------------------------------------

func _draw_room_shell() -> void:
	var top := iso(0, 0)
	var right := iso(FLOOR_TILES, 0)
	var bottom := iso(FLOOR_TILES, FLOOR_TILES)
	var left := iso(0, FLOOR_TILES)
	var rise := Vector2(0, -WALL_HEIGHT)

	# Back-right wall (the one with the window), lit.
	draw_colored_polygon(PackedVector2Array([top, right, right + rise, top + rise]),
		Palette.PLASTER)
	# Back-left wall, in shade.
	draw_colored_polygon(PackedVector2Array([left, top, top + rise, left + rise]),
		Palette.PLASTER_SHADE)
	# Skirting lines give the plaster a little thickness.
	draw_line(top, right, Palette.PLASTER_SHADE.darkened(0.25), 1.0)
	draw_line(left, top, Palette.PLASTER_SHADE.darkened(0.35), 1.0)

	# Floor tiles, alternating warm stone.
	for i in FLOOR_TILES:
		for j in FLOOR_TILES:
			var shade: Color = Palette.SAND if (i + j) % 2 == 0 else Palette.SAND.darkened(0.10)
			draw_colored_polygon(PackedVector2Array([
				iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1)]), shade)
	# Floor outline, slightly darker, keeps the diamond readable.
	draw_polyline(PackedVector2Array([top, right, bottom, left, top]),
		Palette.SAND.darkened(0.3), 1.0)


func _sky_colors() -> Array:
	match time_of_day:
		"dawn":
			return [Color("4a5a91"), Color("b98a86"), Color("f0b473")]
		"day":
			return [Color("4f86b8"), Color("79b3cf"), Color("bcd9e0")]
		"night":
			return [Color("161a3c"), Color("232a56"), Color("36406e")]
		_:
			return [Palette.DUSK_HIGH, Color("8a5f82"), Palette.DUSK_LOW]


## The window is a parallelogram lying in the back-right wall plane, so every
## band and tower inside it is drawn with the same slant and needs no clipping.
func _draw_window() -> void:
	var top := iso(0, 0)
	var right := iso(FLOOR_TILES, 0)
	var start: float = 0.30
	var end: float = 0.80
	var head: float = -46.0
	var sill: float = -16.0

	var edge := func(t: float, lift: float) -> Vector2:
		return top.lerp(right, t) + Vector2(0, lift)

	var bands: Array = _sky_colors()
	var rows: int = 9
	for row in rows:
		var a: float = head + (sill - head) * (float(row) / float(rows))
		var b: float = head + (sill - head) * (float(row + 1) / float(rows))
		var mix: float = float(row) / float(rows - 1)
		var color: Color = (bands[0] as Color).lerp(bands[1] as Color, minf(1.0, mix * 2.0))
		if mix > 0.5:
			color = (bands[1] as Color).lerp(bands[2] as Color, (mix - 0.5) * 2.0)
		draw_colored_polygon(PackedVector2Array([
			edge.call(start, a), edge.call(end, a), edge.call(end, b), edge.call(start, b)]), color)

	# Sun or moon.
	var disc_t: float = 0.62
	var disc_pos: Vector2 = edge.call(disc_t, head + 16.0)
	if time_of_day == "night":
		draw_circle(disc_pos, 4.0, Color("e8e6f2"))
		draw_circle(disc_pos + Vector2(2, -1), 3.0, bands[0])
	else:
		draw_circle(disc_pos, 5.0, Palette.SUN)

	# Distant towers: the skyline you cannot afford yet.
	var towers: Array = [
		[0.34, 0.06, 18.0], [0.41, 0.05, 26.0], [0.47, 0.07, 14.0],
		[0.56, 0.06, 22.0], [0.63, 0.05, 30.0], [0.70, 0.07, 17.0],
	]
	var tower_tint: Color = (bands[0] as Color).darkened(0.35)
	for tower in towers:
		var t0: float = tower[0]
		var t1: float = tower[0] + tower[1]
		var height: float = tower[2]
		var base: float = sill - 5.0
		draw_colored_polygon(PackedVector2Array([
			edge.call(t0, base - height), edge.call(t1, base - height),
			edge.call(t1, base), edge.call(t0, base)]), tower_tint)
		# A couple of lit windows in each tower.
		if time_of_day == "dusk" or time_of_day == "night":
			for k in 3:
				var lt: float = t0 + tower[1] * (0.3 + 0.3 * float(k % 2))
				var ly: float = base - height + 5.0 + float(k) * 6.0
				if ly < base - 2.0:
					draw_colored_polygon(PackedVector2Array([
						edge.call(lt, ly), edge.call(lt + 0.012, ly + 0.6),
						edge.call(lt + 0.012, ly + 3.0), edge.call(lt, ly + 2.4)]),
						Palette.SUN.lerp(Palette.PLASTER, 0.2))

	# Water strip along the bottom of the view.
	draw_colored_polygon(PackedVector2Array([
		edge.call(start, sill - 5.0), edge.call(end, sill - 5.0),
		edge.call(end, sill), edge.call(start, sill)]), Palette.WATER)

	# Frame.
	var frame: Color = Palette.PLASTER.darkened(0.30)
	draw_polyline(PackedVector2Array([
		edge.call(start, head), edge.call(end, head),
		edge.call(end, sill), edge.call(start, sill), edge.call(start, head)]), frame, 1.0)
	draw_line(edge.call((start + end) * 0.5, head), edge.call((start + end) * 0.5, sill), frame, 1.0)

# --- furnishing ---------------------------------------------------------------

## An isometric cuboid standing on the floor grid.
func _box(i: float, j: float, si: float, sj: float, height: float,
		top_color: Color, left_color: Color, right_color: Color) -> void:
	var rise := Vector2(0, -height)
	var a := iso(i, j)
	var b := iso(i + si, j)
	var c := iso(i + si, j + sj)
	var d := iso(i, j + sj)
	draw_colored_polygon(PackedVector2Array([b, c, c + rise, b + rise]), right_color)
	draw_colored_polygon(PackedVector2Array([c, d, d + rise, c + rise]), left_color)
	draw_colored_polygon(PackedVector2Array([a + rise, b + rise, c + rise, d + rise]), top_color)


func _draw_floor_dressing() -> void:
	# A worn rug: the one thing in the room that is yours.
	draw_colored_polygon(PackedVector2Array([
		iso(1.1, 1.2), iso(3.0, 1.2), iso(3.0, 3.0), iso(1.1, 3.0)]),
		Palette.TERRACOTTA.darkened(0.1))
	draw_colored_polygon(PackedVector2Array([
		iso(1.4, 1.5), iso(2.7, 1.5), iso(2.7, 2.7), iso(1.4, 2.7)]),
		Palette.TERRACOTTA_DEEP)


func _draw_bed() -> void:
	# A mattress on a low frame, not a bedroom set.
	_box(0.15, 1.9, 1.5, 1.9, 5.0,
		Color("6d5a7a"), Color("463b53"), Color("57496a"))
	_box(0.25, 2.0, 1.3, 1.7, 8.0,
		Palette.PLASTER, Palette.PLASTER_SHADE.darkened(0.2), Palette.PLASTER_SHADE)
	_box(0.35, 2.1, 0.5, 0.7, 11.0,
		Color("f3e6d2"), Color("cdb69b"), Color("e0cdb2"))


func _draw_desk() -> void:
	_box(2.5, 0.25, 1.3, 0.85, 15.0,
		Color("8a5a38"), Color("59371f"), Color("6f462a"))
	# Lamp.
	_box(3.35, 0.45, 0.25, 0.25, 20.0, Palette.BRASS, Color("8a5f24"), Color("b07f32"))
	# The savings jar: the deposit fund, standing on the desk where you see it.
	var jar_base := iso(2.75, 0.55)
	var jar_top: Vector2 = jar_base + Vector2(0, -15.0)
	draw_rect(Rect2(jar_top.x - 4, jar_top.y - 1, 8, 13), Color("cfe6e2", 0.55))
	var fill_height: int = int(round(clampf(savings_fill, 0.0, 1.0) * 11.0))
	if fill_height > 0:
		draw_rect(Rect2(jar_top.x - 3, jar_top.y + 11 - fill_height, 6, fill_height), Palette.BRASS)
	draw_rect(Rect2(jar_top.x - 4, jar_top.y - 2, 8, 2), Palette.PLASTER_SHADE)


func _draw_plant() -> void:
	var pot := iso(3.55, 1.75)
	_box(3.4, 1.6, 0.4, 0.4, 7.0, Palette.TERRACOTTA, Palette.TERRACOTTA_DEEP, Color("a55636"))
	var leaf_base: Vector2 = pot + Vector2(0, -7)
	for k in 5:
		var angle: float = -2.45 + float(k) * 0.52
		var tip: Vector2 = leaf_base + Vector2(cos(angle), sin(angle)) * 10.0
		draw_line(leaf_base, tip, Color("4f8f5c"), 2.0)


func _draw_dropped_letter() -> void:
	var spot := iso(2.2, 3.35)
	draw_colored_polygon(PackedVector2Array([
		spot + Vector2(-7, 0), spot + Vector2(0, -3), spot + Vector2(7, 0), spot + Vector2(0, 3)]),
		Color("f1e4cc"))
	draw_line(spot + Vector2(-5, 0), spot + Vector2(0, 2), Palette.ALERT, 1.0)
	draw_line(spot + Vector2(5, 0), spot + Vector2(0, 2), Palette.ALERT, 1.0)


func _draw_character() -> void:
	var feet := iso(1.85, 1.55)
	var bob: float = -1.0 if fmod(tick, 2.2) > 1.1 else 0.0
	# Contact shadow first, so the figure sits on the floor instead of floating.
	draw_colored_polygon(PackedVector2Array([
		feet + Vector2(-6, 0), feet + Vector2(0, -3), feet + Vector2(6, 0), feet + Vector2(0, 3)]),
		Color(0, 0, 0, 0.18))
	var base: Vector2 = feet + Vector2(0, bob)
	# Legs, tunic, arms, head: deliberately small, a person in a room, not a hero.
	draw_rect(Rect2(base.x - 3, base.y - 9, 2, 9), Color("2f3350"))
	draw_rect(Rect2(base.x + 1, base.y - 9, 2, 9), Color("2f3350"))
	draw_rect(Rect2(base.x - 4, base.y - 19, 8, 11), Color("d9d3e6"))
	draw_rect(Rect2(base.x - 5, base.y - 18, 1, 8), Color("c3bbd4"))
	draw_rect(Rect2(base.x + 4, base.y - 18, 1, 8), Color("c3bbd4"))
	draw_rect(Rect2(base.x - 3, base.y - 25, 6, 6), Color("c98f63"))
	draw_rect(Rect2(base.x - 3, base.y - 26, 6, 3), Color("32262a"))


func _draw_light() -> void:
	# Lamplight pools on the desk; the rest of the room cools off at night.
	var lamp := iso(3.45, 0.55) + Vector2(0, -18)
	var warmth: float = 0.16 if time_of_day == "night" else 0.10
	draw_circle(lamp, 17.0, Palette.SUN * Color(1, 1, 1, warmth))
	draw_circle(lamp, 9.0, Palette.SUN * Color(1, 1, 1, warmth))
	if time_of_day == "night":
		draw_rect(Rect2(Vector2.ZERO, canvas_size), Color("101a3a", 0.22))
	elif time_of_day == "dusk":
		draw_rect(Rect2(Vector2.ZERO, canvas_size), Color("3a2350", 0.10))
