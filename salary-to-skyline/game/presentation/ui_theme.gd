class_name UiTheme
extends RefCounted

## Presentation constants and small builders for the portrait shell.
##
## The world layer will be low-resolution pixel art later; this UI layer stays
## high resolution with generous touch targets (brief sections 23 and 24).
## Warnings use text and an icon glyph as well as colour.

const BACKGROUND := Color(0.055, 0.067, 0.094)
const SURFACE := Color(0.098, 0.118, 0.161)
const SURFACE_RAISED := Color(0.137, 0.165, 0.220)
const OUTLINE := Color(0.220, 0.259, 0.329)
const TEXT := Color(0.918, 0.937, 0.965)
const TEXT_MUTED := Color(0.631, 0.671, 0.729)
const ACCENT := Color(0.180, 0.741, 0.639)
const ACCENT_DIM := Color(0.106, 0.400, 0.357)
const WARNING := Color(0.976, 0.714, 0.318)
const ALERT := Color(0.937, 0.451, 0.404)
const GOOD := Color(0.475, 0.827, 0.510)
const SAND := Color(0.847, 0.741, 0.573)

const TOUCH_TARGET: int = 48
const GUTTER: int = 16

const SIZE_DISPLAY: int = 40
const SIZE_TITLE: int = 26
const SIZE_BODY: int = 20
const SIZE_SMALL: int = 17


static func panel(background: Color = SURFACE, radius: int = 14, border: Color = OUTLINE) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.border_color = border
	style.set_border_width_all(1)
	style.content_margin_left = GUTTER
	style.content_margin_right = GUTTER
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	return style


static func card(title: String) -> VBoxContainer:
	var container := PanelContainer.new()
	container.add_theme_stylebox_override("panel", panel())
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 8)
	container.add_child(column)
	if not title.is_empty():
		column.add_child(label(title.to_upper(), SIZE_SMALL, TEXT_MUTED))
	column.set_meta("card_root", container)
	return column


static func label(text: String, size: int = SIZE_BODY, color: Color = TEXT,
		alignment: int = HORIZONTAL_ALIGNMENT_LEFT) -> Label:
	var node := Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size", size)
	node.add_theme_color_override("font_color", color)
	node.horizontal_alignment = alignment
	node.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	node.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return node


static func row(left: String, right: String, size: int = SIZE_BODY,
		right_color: Color = TEXT) -> HBoxContainer:
	var box := HBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	var left_label := label(left, size, TEXT_MUTED)
	var right_label := label(right, size, right_color, HORIZONTAL_ALIGNMENT_RIGHT)
	box.add_child(left_label)
	box.add_child(right_label)
	return box


static func button(text: String, primary: bool = false) -> Button:
	var node := Button.new()
	node.text = text
	node.custom_minimum_size = Vector2(0, TOUCH_TARGET)
	node.add_theme_font_size_override("font_size", SIZE_BODY)
	node.focus_mode = Control.FOCUS_NONE
	var base := panel(ACCENT_DIM if primary else SURFACE_RAISED, 10, ACCENT if primary else OUTLINE)
	node.add_theme_stylebox_override("normal", base)
	var hover := panel(ACCENT if primary else OUTLINE, 10, ACCENT)
	node.add_theme_stylebox_override("hover", hover)
	node.add_theme_stylebox_override("pressed", hover)
	var disabled := panel(SURFACE, 10, OUTLINE)
	node.add_theme_stylebox_override("disabled", disabled)
	node.add_theme_color_override("font_color", TEXT)
	node.add_theme_color_override("font_disabled_color", TEXT_MUTED)
	return node


static func separator() -> HSeparator:
	var line := HSeparator.new()
	var style := StyleBoxFlat.new()
	style.bg_color = OUTLINE
	style.content_margin_top = 1
	line.add_theme_stylebox_override("separator", style)
	return line


static func spacer(height: int) -> Control:
	var node := Control.new()
	node.custom_minimum_size = Vector2(0, height)
	return node


static func severity_color(severity: String) -> Color:
	match severity:
		"alert":
			return ALERT
		"warning":
			return WARNING
		"good":
			return GOOD
		_:
			return TEXT_MUTED


static func severity_glyph(severity: String) -> String:
	match severity:
		"alert":
			return "!"
		"warning":
			return "*"
		"good":
			return "+"
		_:
			return "-"
