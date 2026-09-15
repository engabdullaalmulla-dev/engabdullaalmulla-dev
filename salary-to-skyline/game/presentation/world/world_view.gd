class_name WorldView
extends SubViewportContainer

## Hosts the pixel-art world at a fixed low resolution and scales it up with
## nearest-neighbour filtering, so the world stays crisp pixels while the
## interface text above it stays high resolution (brief section 23).

## One logical pixel is drawn at this many screen pixels. A whole number keeps
## every pixel square; a fractional zoom would shimmer.
const PIXEL_SCALE: int = 4

var painter: Node2D
var _viewport: SubViewport
var _backdrop: ColorRect


func _init() -> void:
	# stretch + stretch_shrink resizes the sub-viewport to container/scale, so the
	# world is genuinely rendered at low resolution and then magnified.
	stretch = true
	stretch_shrink = PIXEL_SCALE
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_viewport = SubViewport.new()
	_viewport.transparent_bg = false
	_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_viewport.canvas_item_default_texture_filter = Viewport.DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST
	add_child(_viewport)

	_backdrop = ColorRect.new()
	_backdrop.color = Palette.NIGHT_SOFT
	_viewport.add_child(_backdrop)

	painter = preload("res://game/presentation/world/room_painter.gd").new()
	_viewport.add_child(painter)
	resized.connect(_fit)


func _ready() -> void:
	_fit()


## Keeps the room centred whatever logical width the device produces.
func _fit() -> void:
	var logical := Vector2(_viewport.size)
	if logical.x <= 0.0:
		return
	_backdrop.size = logical
	painter.canvas_size = logical


func configure(time_of_day: String, savings_fill: float, unpaid: bool) -> void:
	painter.time_of_day = time_of_day
	painter.savings_fill = savings_fill
	painter.has_unpaid_bill = unpaid
	painter.queue_redraw()
