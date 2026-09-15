class_name Palette
extends RefCounted

## Colour and type scale for Salary to Skyline.
##
## The world is warm: sand, plaster, terracotta, turquoise water, brass lamplight,
## a dusk sky over a Gulf coast. The interface sits ON that world rather than
## replacing it with a slate-grey finance app. There is no card-stack of rows
## here; numbers appear where a player is already looking.

# World / sky
const NIGHT := Color("15122a")
const NIGHT_SOFT := Color("221c3c")
const DUSK_HIGH := Color("3c4479")
const DUSK_LOW := Color("e08a4c")
const SUN := Color("f6c874")

# Surfaces made of material, not chrome
const PLASTER := Color("e9d3b0")
const PLASTER_SHADE := Color("c9a97f")
const TERRACOTTA := Color("b8643f")
const TERRACOTTA_DEEP := Color("8d472c")
const SAND := Color("e2bd8b")
const WATER := Color("1d6b70")
const TURQUOISE := Color("35c2ae")
const BRASS := Color("e3a94e")

# Type
const INK := Color("f7ecd9")
const INK_SOFT := Color("bda98f")
const INK_FAINT := Color("8d7f9c")
const GOOD := Color("7ecf92")
const WARN := Color("e8b45c")
const ALERT := Color("e46a5c")

const TOUCH := 56
const GUTTER := 20

const HERO := 52
const BIG := 30
const TITLE := 23
const BODY := 19
const SMALL := 16


static func text(body: String, size: int = BODY, color: Color = INK,
		alignment: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var node := Label.new()
	node.text = body
	node.add_theme_font_size_override("font_size", size)
	node.add_theme_color_override("font_color", color)
	node.horizontal_alignment = alignment
	node.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	node.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return node


## A sentence the player can act on, not a labelled figure.
static func sentence(body: String, size: int = BODY, color: Color = INK_SOFT) -> Label:
	return text(body, size, color)


static func fill(color: Color, radius: int = 0, margin_h: int = 0, margin_v: int = 0) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	if radius > 0:
		style.corner_radius_top_left = radius
		style.corner_radius_top_right = radius
		style.corner_radius_bottom_left = radius
		style.corner_radius_bottom_right = radius
	style.content_margin_left = margin_h
	style.content_margin_right = margin_h
	style.content_margin_top = margin_v
	style.content_margin_bottom = margin_v
	return style


## The one big commitment on a screen: warm, wide, unmistakable.
static func primary_action(body: String) -> Button:
	var node := Button.new()
	node.text = body
	node.custom_minimum_size = Vector2(0, 64)
	node.add_theme_font_size_override("font_size", TITLE)
	node.focus_mode = Control.FOCUS_NONE
	node.add_theme_stylebox_override("normal", fill(BRASS, 4, 18, 14))
	node.add_theme_stylebox_override("hover", fill(SUN, 4, 18, 14))
	node.add_theme_stylebox_override("pressed", fill(SUN, 4, 18, 14))
	node.add_theme_stylebox_override("disabled", fill(PLASTER_SHADE.darkened(0.4), 4, 18, 14))
	node.add_theme_color_override("font_color", Color("2a1c10"))
	node.add_theme_color_override("font_hover_color", Color("2a1c10"))
	node.add_theme_color_override("font_pressed_color", Color("2a1c10"))
	node.add_theme_color_override("font_disabled_color", INK_FAINT)
	return node


## A quieter choice: plaster, like a pressed tile.
static func choice(body: String, tinted: bool = false) -> Button:
	var node := Button.new()
	node.text = body
	node.custom_minimum_size = Vector2(0, TOUCH)
	node.add_theme_font_size_override("font_size", BODY)
	node.focus_mode = Control.FOCUS_NONE
	var base: Color = WATER if tinted else Color(1, 1, 1, 0.07)
	node.add_theme_stylebox_override("normal", fill(base, 3, 16, 10))
	node.add_theme_stylebox_override("hover", fill(TURQUOISE.darkened(0.35), 3, 16, 10))
	node.add_theme_stylebox_override("pressed", fill(TURQUOISE.darkened(0.35), 3, 16, 10))
	node.add_theme_stylebox_override("disabled", fill(Color(1, 1, 1, 0.03), 3, 16, 10))
	node.add_theme_color_override("font_color", INK)
	node.add_theme_color_override("font_disabled_color", INK_FAINT)
	return node


static func gap(height: int) -> Control:
	var node := Control.new()
	node.custom_minimum_size = Vector2(0, height)
	return node


static func severity(level: String) -> Color:
	match level:
		"alert":
			return ALERT
		"warning":
			return WARN
		"good":
			return GOOD
		_:
			return INK_SOFT
