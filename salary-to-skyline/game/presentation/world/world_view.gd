class_name WorldView
extends SubViewportContainer

## Hosts the pixel-art world at a fixed low resolution and magnifies it with
## nearest-neighbour filtering, so the world is chunky pixels while the text over
## it stays high resolution (brief section 23).
##
## Two views live here: the district you walk around, and the room you live in.
## Both are drawn by code into the same sub-viewport.

signal arrived(place_id: String)

const CITY_SCALE: int = 3
const ROOM_SCALE: int = 4

var city: Node2D
var room: Node2D
var mode: String = "city"

var _viewport: SubViewport
var _backdrop: ColorRect
var _map: CityMap


func _init() -> void:
	stretch = true
	stretch_shrink = CITY_SCALE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_viewport = SubViewport.new()
	_viewport.transparent_bg = false
	_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	add_child(_viewport)

	_backdrop = ColorRect.new()
	_backdrop.color = Palette.NIGHT
	_viewport.add_child(_backdrop)

	city = preload("res://game/presentation/world/city_painter.gd").new()
	_viewport.add_child(city)
	room = preload("res://game/presentation/world/room_painter.gd").new()
	_viewport.add_child(room)

	_map = CityMap.build()
	city.setup(_map)
	city.arrived.connect(func(place_id: String) -> void: arrived.emit(place_id))
	set_mode("city")
	resized.connect(_fit)


func _ready() -> void:
	_fit()


func map() -> CityMap:
	return _map


func set_mode(new_mode: String) -> void:
	mode = new_mode
	stretch_shrink = ROOM_SCALE if new_mode == "room" else CITY_SCALE
	city.visible = new_mode == "city"
	city.set_process(new_mode == "city")
	room.visible = new_mode == "room"
	room.set_process(new_mode == "room")
	_fit()


## Converts a tap anywhere on this control into the low-resolution coordinates
## the painters draw in.
func to_logical(point: Vector2) -> Vector2:
	return (point - global_position) / float(stretch_shrink)


func _fit() -> void:
	var logical := Vector2(_viewport.size)
	if logical.x <= 0.0:
		return
	_backdrop.size = logical
	city.canvas_size = logical
	room.canvas_size = logical


## Daylight, the savings jar and the dropped letter all follow the simulation.
func reflect(hour: float, savings_fill: float, unpaid: bool) -> void:
	if not city.is_walking():
		city.hour = hour
	room.time_of_day = _room_hour(hour)
	room.savings_fill = savings_fill
	room.has_unpaid_bill = unpaid


static func _room_hour(hour: float) -> String:
	if hour < 7.0:
		return "dawn"
	if hour < 16.0:
		return "day"
	if hour < 19.5:
		return "dusk"
	return "night"
