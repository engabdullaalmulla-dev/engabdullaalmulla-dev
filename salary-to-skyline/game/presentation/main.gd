extends Control

## The city is the screen.
##
## You stand in Old Quay. Cars run the avenue, boats drift past the quay, the
## sun crosses the sky and the windows come on at dusk. You tap a place and your
## character walks there; the camera follows. Living a month is something you
## watch happen to the district, not a figure that silently changes.
##
## The interface floats over the world and stays out of the way: where you are,
## what you can do here, and how much you are holding. Every other number is in
## the Ledger, one tap away.
##
## This layer reads committed state and issues validated commands. It cannot
## write a balance.

const SAVING_STEPS: Array = [100000, 250000, 500000]

const DISCRETIONARY_CHOICES: Array = [
	{"id": "city_evening", "label": "An evening on the promenade", "amount": 12000,
	 "note": "You will remember it. The fund will not notice."},
	{"id": "work_clothes", "label": "Clothes that fit the job", "amount": 45000,
	 "note": "Three weeks of setting money aside, spent in an afternoon."},
	{"id": "new_phone", "label": "The phone you keep looking at", "amount": 180000,
	 "note": "Two and a half months of everything you manage to save."},
]

## Roughly four seconds of simulated day per lived month.
const JOURNEY_SECONDS: float = 4.6
const JOURNEY_HOUR_SPEED: float = 4.2

var engine: GameEngine
var content: ContentLibrary

var _screen: String = "new_life"
var _sheet: String = ""
var _pending_preview: Dictionary = {}
var _last_recap: Dictionary = {}
var _message: String = ""
var _message_level: String = "info"

var _journey: bool = false
var _journey_time: float = 0.0
var _went_out: bool = false

var _world: WorldView
var _hud: VBoxContainer
var _dock: VBoxContainer
var _overlay: Control
var _scrim: ColorRect

var _shot_path: String = ""
var _shot_delay: int = 18
var _frames: int = 0


func _ready() -> void:
	_read_command_line()
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var loaded: Dictionary = ContentLibrary.load_from()
	if not loaded["ok"]:
		push_error("content failed to load: %s" % loaded.get("message", ""))
		return
	content = loaded["value"]
	engine = GameEngine.create(content)

	# The world sits behind everything, edge to edge.
	_world = WorldView.new()
	_world.set_anchors_preset(Control.PRESET_FULL_RECT)
	_world.arrived.connect(_on_arrived)
	add_child(_world)

	# A soft band under the top readout so it stays legible over a bright sky.
	var top_scrim := ColorRect.new()
	top_scrim.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top_scrim.offset_bottom = 150
	top_scrim.color = Color(0.04, 0.03, 0.10, 0.45)
	top_scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(top_scrim)

	# A soft scrim only under the bottom dock, so the city stays visible.
	_scrim = ColorRect.new()
	_scrim.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	_scrim.anchor_top = 0.66
	_scrim.offset_top = 0
	_scrim.offset_bottom = 0
	_scrim.color = Color(0.04, 0.03, 0.10, 0.62)
	_scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_scrim)

	var top := MarginContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.add_theme_constant_override("margin_left", Palette.GUTTER)
	top.add_theme_constant_override("margin_right", Palette.GUTTER)
	top.add_theme_constant_override("margin_top", 16)
	add_child(top)
	_hud = VBoxContainer.new()
	_hud.add_theme_constant_override("separation", 6)
	top.add_child(_hud)

	var bottom := MarginContainer.new()
	bottom.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bottom.anchor_top = 0.66
	bottom.offset_top = 0
	bottom.offset_bottom = 0
	bottom.add_theme_constant_override("margin_left", Palette.GUTTER)
	bottom.add_theme_constant_override("margin_right", Palette.GUTTER)
	bottom.add_theme_constant_override("margin_top", 12)
	bottom.add_theme_constant_override("margin_bottom", 18)
	add_child(bottom)
	_dock = VBoxContainer.new()
	_dock.add_theme_constant_override("separation", 8)
	bottom.add_child(_dock)

	_overlay = Control.new()
	_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_overlay)

	_apply_startup_actions()
	_rebuild()


func _read_command_line() -> void:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--shot="):
			_shot_path = argument.substr(7)
		elif argument.begins_with("--shot-delay="):
			_shot_delay = argument.substr(13).to_int()


func _apply_startup_actions() -> void:
	for argument in OS.get_cmdline_user_args():
		if not argument.begins_with("--actions="):
			continue
		for action in argument.substr(10).split("|", false):
			var parts: PackedStringArray = String(action).split(":")
			match parts[0]:
				"start":
					_begin_life(parts[1] if parts.size() > 1 else "fresh_work")
				"advance":
					for i in (parts[1].to_int() if parts.size() > 1 else 1):
						_commit_month()
					_screen = "city"
				"preview":
					_open_preview()
				"recap":
					_screen = "recap"
				"sheet":
					_sheet = parts[1] if parts.size() > 1 else ""
					_screen = "city"
				"save":
					_earmark(parts[1].to_int() if parts.size() > 1 else 100000)
				"goto":
					_world.city.place_player(parts[1] if parts.size() > 1 else "home")
					_screen = "city"
				"room":
					_world.set_mode("room")
					_screen = "city"
				"hour":
					_world.city.hour = float(parts[1].to_int() if parts.size() > 1 else 18)
				"walk":
					_world.city.travel_to(parts[1] if parts.size() > 1 else "studio")
					_screen = "city"
				"live":
					_pending_preview = MonthEngine.preview(engine.state).get("value", {})
					_confirm_month()

# --- input --------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if _screen != "city" or not _sheet.is_empty() or _journey:
		return
	if _world.mode != "city":
		return
	if not (event is InputEventScreenTouch or event is InputEventMouseButton):
		return
	var pressed: bool = event.pressed if event is InputEventMouseButton else event.pressed
	if not pressed:
		return
	var point: Vector2 = event.position
	var place_id: String = _world.city.place_at(_world.to_logical(point))
	if place_id.is_empty():
		return
	if _world.city.travel_to(place_id):
		_notify("Walking to %s." % String(_world.map().places[place_id]["name"]).to_lower(), "info")
		_rebuild()
	get_viewport().set_input_as_handled()


func _on_arrived(place_id: String) -> void:
	if _journey:
		if not _went_out:
			_went_out = true
			_world.city.travel_to("home")
		return
	_notify("", "info")
	_rebuild()


func _process(delta: float) -> void:
	_advance_journey(delta)
	_reflect_world()
	_capture(delta)


func _reflect_world() -> void:
	if engine.state == null:
		return
	var fill: float = 0.0
	var goal: Dictionary = engine.first_home_goal()
	if goal["ok"] and int((goal["value"] as Dictionary)["cash_needed_minor"]) > 0:
		fill = float((goal["value"] as Dictionary)["earmarked_minor"]) \
			/ float((goal["value"] as Dictionary)["cash_needed_minor"])
	# Each month settles at a different hour of the day, so you see the district
	# at dawn, at noon, at sunset and after dark as the year goes round.
	const HOURS: Array = [8.0, 12.5, 16.0, 18.3, 20.0, 22.0, 6.0]
	var settled_hour: float = float(HOURS[engine.state.month_index % HOURS.size()])
	if not _journey:
		_world.reflect(settled_hour, fill, engine.state.arrears() > 0)
	else:
		_world.reflect(_world.city.hour, fill, engine.state.arrears() > 0)


func _advance_journey(delta: float) -> void:
	if not _journey:
		return
	_journey_time += delta
	if _journey_time < JOURNEY_SECONDS:
		return
	_journey = false
	_world.city.hour_speed = 0.0
	_screen = "recap"
	_rebuild()


func _capture(_delta: float) -> void:
	if _shot_path.is_empty():
		return
	_frames += 1
	if _frames < _shot_delay:
		return
	get_viewport().get_texture().get_image().save_png(_shot_path)
	print("screenshot written: %s" % _shot_path)
	get_tree().quit(0)

# --- composition --------------------------------------------------------------

func _rebuild() -> void:
	for child in _hud.get_children():
		_hud.remove_child(child)
		child.queue_free()
	for child in _dock.get_children():
		_dock.remove_child(child)
		child.queue_free()
	for child in _overlay.get_children():
		_overlay.remove_child(child)
		child.queue_free()
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE

	if engine.state == null:
		_screen = "new_life"
		_sheet = ""

	_scrim.visible = _screen != "new_life"

	if _screen == "new_life":
		_build_new_life()
	else:
		_build_hud()
		_build_dock()

	if _screen == "preview":
		_build_preview_note()
	elif _screen == "recap":
		_build_recap_note()
	elif not _sheet.is_empty():
		_build_sheet()


func _build_new_life() -> void:
	var frame := PanelContainer.new()
	frame.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	frame.anchor_top = 0.42
	frame.offset_top = 0
	frame.offset_bottom = 0
	frame.add_theme_stylebox_override("panel", Palette.fill(Palette.NIGHT, 0, Palette.GUTTER, 18))
	_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_overlay.add_child(frame)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 8)
	frame.add_child(column)
	column.add_child(Palette.text("SALARY TO SKYLINE", Palette.BIG, Palette.INK))
	column.add_child(Palette.sentence(
		"A rented room in Old Quay, a salary, and a city that was not built for you yet.",
		Palette.BODY, Palette.INK_SOFT))

	if engine.save_store.has_save(0):
		var resume: Button = Palette.primary_action("Go back to your life")
		resume.pressed.connect(_continue_life)
		column.add_child(resume)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var routes := VBoxContainer.new()
	routes.add_theme_constant_override("separation", 10)
	routes.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(routes)
	column.add_child(scroll)

	for start_id in _ordered_start_ids():
		var route := VBoxContainer.new()
		route.add_theme_constant_override("separation", 2)
		route.add_child(Palette.text(_route_title(start_id), Palette.TITLE, Palette.INK))
		route.add_child(Palette.sentence(_route_line(start_id), Palette.SMALL, Palette.INK_SOFT))
		route.add_child(Palette.text(_route_monthly(start_id), Palette.SMALL, Palette.BRASS))
		route.add_child(Palette.gap(4))
		var begin: Button = Palette.choice("Start here", true)
		begin.pressed.connect(_begin_life.bind(start_id))
		route.add_child(begin)
		routes.add_child(route)

	routes.add_child(Palette.sentence(
		"Time only moves when you decide it does. Closing the app costs you nothing.",
		Palette.SMALL, Palette.INK_FAINT))


## A thin band over the sky: when it is, what you are holding, and the way in to
## everything else.
func _build_hud() -> void:
	var state: GameState = engine.state
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)

	var left := VBoxContainer.new()
	left.add_theme_constant_override("separation", 0)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_child(Palette.text(SimCalendar.label(state.month_index), Palette.SMALL, Palette.INK_SOFT))
	left.add_child(Palette.text(Money.format(state.spendable_cash()), Palette.BIG, Palette.INK))
	row.add_child(left)

	var ledger: Button = Palette.choice("Ledger")
	ledger.custom_minimum_size = Vector2(130, 44)
	ledger.size_flags_horizontal = Control.SIZE_SHRINK_END
	ledger.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	ledger.pressed.connect(_open_sheet.bind("ledger"))
	row.add_child(ledger)
	_hud.add_child(row)

	if not _message.is_empty():
		_hud.add_child(Palette.text(_message, Palette.SMALL, Palette.severity(_message_level)))


## What is under your feet, and what you can do about it.
func _build_dock() -> void:
	if _world.mode == "room":
		_build_room_dock()
		return
	var city: Node2D = _world.city
	var place_id: String = city.current_place()
	var places: Dictionary = _world.map().places

	if city.is_walking():
		_dock.add_child(Palette.text("On the way", Palette.TITLE, Palette.INK))
		_dock.add_child(Palette.sentence("Old Quay does not stop while you cross it.",
			Palette.SMALL, Palette.INK_FAINT))
		return

	var place: Dictionary = places.get(place_id, {})
	_dock.add_child(Palette.text(String(place.get("name", "Old Quay")), Palette.TITLE, Palette.INK))
	_dock.add_child(Palette.sentence(String(place.get("line", "")), Palette.SMALL, Palette.INK_SOFT))
	_dock.add_child(_place_detail(place_id))

	var breathe := Control.new()
	breathe.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_dock.add_child(breathe)

	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	for action in _actions_here(place_id):
		var button: Button = Palette.choice(String(action["label"]), bool(action.get("tinted", false)))
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.pressed.connect(action["run"])
		actions.add_child(button)
	if actions.get_child_count() > 0:
		_dock.add_child(actions)

	var live: Button = Palette.primary_action("Live this month")
	live.pressed.connect(_open_preview)
	_dock.add_child(live)
	_dock.add_child(Palette.sentence("Tap a marker to walk there.", Palette.SMALL, Palette.INK_FAINT))


func _build_room_dock() -> void:
	_dock.add_child(Palette.text("Inside", Palette.TITLE, Palette.INK))
	_dock.add_child(Palette.sentence(
		"Rent paid, jar on the desk, city outside the window.", Palette.SMALL, Palette.INK_SOFT))
	var breathe := Control.new()
	breathe.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_dock.add_child(breathe)
	var out: Button = Palette.choice("Step outside")
	out.pressed.connect(_leave_room)
	_dock.add_child(out)
	var live: Button = Palette.primary_action("Live this month")
	live.pressed.connect(_open_preview)
	_dock.add_child(live)


## The one line that matters wherever you are standing.
func _place_detail(place_id: String) -> Control:
	var state: GameState = engine.state
	match place_id:
		"studio":
			var goal_result: Dictionary = engine.first_home_goal()
			if not goal_result["ok"]:
				return Palette.gap(0)
			var goal: Dictionary = goal_result["value"]
			var column := VBoxContainer.new()
			column.add_theme_constant_override("separation", 4)
			var line := HBoxContainer.new()
			line.add_child(Palette.text("Cash needed at the door", Palette.SMALL, Palette.INK_FAINT))
			line.add_child(Palette.text(Money.format(int(goal["cash_needed_minor"])),
				Palette.BODY, Palette.BRASS, HORIZONTAL_ALIGNMENT_RIGHT))
			column.add_child(line)
			var track := ProgressBar.new()
			track.max_value = maxf(1.0, float(goal["cash_needed_minor"]))
			track.value = float(goal["earmarked_minor"])
			track.show_percentage = false
			track.custom_minimum_size = Vector2(0, 6)
			track.add_theme_stylebox_override("background", Palette.fill(Color(1, 1, 1, 0.10)))
			track.add_theme_stylebox_override("fill", Palette.fill(Palette.BRASS))
			column.add_child(track)
			column.add_child(Palette.sentence(_ambition_sentence(goal), Palette.SMALL, Palette.INK_FAINT))
			return column
		"work":
			return Palette.sentence(
				"%s lands here every month you hold the job." % Money.format(state.monthly_salary()),
				Palette.SMALL, Palette.GOOD)
		"home":
			return Palette.sentence(
				"%s of essentials leaves whatever you are holding, every month."
					% Money.format(state.monthly_essentials_minor), Palette.SMALL, Palette.INK_FAINT)
		"site":
			return Palette.sentence(
				"Off-plan towers are sold before they exist. Buying one is not built yet.",
				Palette.SMALL, Palette.INK_FAINT)
		_:
			return Palette.sentence("In the jar: %s" % Money.format(state.restricted_cash()),
				Palette.SMALL, Palette.BRASS)


func _actions_here(place_id: String) -> Array:
	match place_id:
		"home":
			return [
				{"label": "Go inside", "run": Callable(self, "_enter_room")},
				{"label": "Set aside", "run": Callable(self, "_open_sheet").bind("saving"), "tinted": true},
			]
		"studio":
			return [{"label": "Set money aside", "run": Callable(self, "_open_sheet").bind("saving"),
				"tinted": true}]
		"quay":
			return [{"label": "Spend something", "run": Callable(self, "_open_sheet").bind("spending")}]
		"work":
			return [{"label": "Set aside", "run": Callable(self, "_open_sheet").bind("saving"),
				"tinted": true}]
		_:
			return []

# --- sheets and notes ---------------------------------------------------------

func _rise(from: float, scrim: float) -> VBoxContainer:
	_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	var dim := ColorRect.new()
	dim.color = Color(0.03, 0.02, 0.08, scrim)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay.add_child(dim)

	var frame := PanelContainer.new()
	frame.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	frame.anchor_top = from
	frame.offset_top = 0
	frame.offset_bottom = 0
	frame.add_theme_stylebox_override("panel", Palette.fill(Palette.NIGHT_SOFT, 0, Palette.GUTTER, 18))
	_overlay.add_child(frame)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 8)
	frame.add_child(column)
	return column


func _build_sheet() -> void:
	match _sheet:
		"saving":
			_sheet_panel("Set money aside", _saving_body)
		"spending":
			_sheet_panel("Spend some of it", _spending_body)
		"ledger":
			_sheet_panel("The ledger", _ledger_body)


func _sheet_panel(title: String, body_builder: Callable) -> void:
	var column: VBoxContainer = _rise(0.30, 0.55)
	var header := HBoxContainer.new()
	header.add_child(Palette.text(title, Palette.TITLE, Palette.INK))
	var close: Button = Palette.choice("Close")
	close.custom_minimum_size = Vector2(120, Palette.TOUCH)
	close.size_flags_horizontal = Control.SIZE_SHRINK_END
	close.pressed.connect(_close_sheet)
	header.add_child(close)
	column.add_child(header)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 8)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(body)
	column.add_child(scroll)
	body_builder.call(body)


func _saving_body(body: VBoxContainer) -> void:
	var state: GameState = engine.state
	body.add_child(Palette.sentence(
		"Money you set aside is still yours. It simply stops being spendable, which is the whole point.",
		Palette.BODY, Palette.INK_SOFT))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	for step in SAVING_STEPS:
		var button: Button = Palette.choice("+ %s" % Money.format(int(step), false), true)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.disabled = state.spendable_cash() < int(step)
		button.pressed.connect(_earmark.bind(int(step)))
		row.add_child(button)
	body.add_child(row)
	body.add_child(Palette.text("In the jar: %s" % Money.format(state.restricted_cash()),
		Palette.BIG, Palette.BRASS))
	if state.restricted_cash() > 0:
		var release: Button = Palette.choice("Take it all back out")
		release.pressed.connect(_release.bind(state.restricted_cash()))
		body.add_child(release)
		body.add_child(Palette.sentence(
			"Allowed, and sometimes right. The studio just moves further away.",
			Palette.SMALL, Palette.INK_FAINT))


func _spending_body(body: VBoxContainer) -> void:
	body.add_child(Palette.sentence("A salary is not spare money. Some of it should still be a life.",
		Palette.BODY, Palette.INK_SOFT))
	for choice in DISCRETIONARY_CHOICES:
		var button: Button = Palette.choice("%s   %s" % [
			String(choice["label"]), Money.format(int(choice["amount"]), false)])
		button.disabled = engine.state.spendable_cash() < int(choice["amount"])
		button.pressed.connect(_spend.bind(choice))
		body.add_child(button)
		body.add_child(Palette.sentence(String(choice["note"]), Palette.SMALL, Palette.INK_FAINT))
		body.add_child(Palette.gap(2))


func _ledger_body(body: VBoxContainer) -> void:
	var state: GameState = engine.state
	body.add_child(_ledger_line("Spendable now", Money.format(state.spendable_cash()), Palette.INK))
	body.add_child(_ledger_line("Set aside", Money.format(state.restricted_cash()), Palette.BRASS))
	body.add_child(_ledger_line("Everything you hold", Money.format(state.liquid_cash_total()), Palette.INK_SOFT))
	if state.total_debt() > 0:
		body.add_child(_ledger_line("Owed", Money.format(state.total_debt()), Palette.WARN))
	if state.arrears() > 0:
		body.add_child(_ledger_line("Unpaid bills", Money.format(state.arrears()), Palette.ALERT))
	body.add_child(_ledger_line("Net worth, at book value", Money.format(state.net_worth()), Palette.INK))

	var surplus: Dictionary = state.normal_monthly_surplus()
	body.add_child(Palette.gap(6))
	body.add_child(Palette.text("If nothing changes", Palette.SMALL, Palette.INK_FAINT))
	body.add_child(_ledger_line("Coming in", Money.format(int(surplus["income_minor"])), Palette.GOOD))
	body.add_child(_ledger_line("Going out", Money.format(int(surplus["outgoing_minor"])), Palette.INK_SOFT))
	body.add_child(_ledger_line("Left over", Money.format(int(surplus["surplus_minor"])),
		Palette.GOOD if int(surplus["surplus_minor"]) >= 0 else Palette.ALERT))
	for assumption in surplus["assumptions"] as Array:
		body.add_child(Palette.sentence("· %s" % String(assumption), Palette.SMALL, Palette.INK_FAINT))

	body.add_child(Palette.gap(6))
	body.add_child(Palette.text("Already promised", Palette.SMALL, Palette.INK_FAINT))
	for raw in state.upcoming_commitments(4):
		var row: Dictionary = raw
		body.add_child(_ledger_line(
			"%s · %s" % [SimCalendar.short_label(int(row["month_index"])), String(row["label"])],
			Money.format(int(row["amount_minor"])),
			Palette.ALERT if String(row["kind"]) == "arrears" else Palette.INK_SOFT))

	body.add_child(Palette.gap(6))
	body.add_child(Palette.text("What moved", Palette.SMALL, Palette.INK_FAINT))
	var entries: Array = state.ledger.recent_entries(16)
	entries.reverse()
	var shown: int = 0
	for raw_entry in entries:
		var entry: Dictionary = raw_entry
		if String(entry["account"]) != Accounts.CASH_OPERATING:
			continue
		var amount: int = int(entry["amount"])
		body.add_child(_ledger_line(
			"%s · %s" % [SimCalendar.short_label(int(entry["month_index"])),
				String(entry["reason"]).replace("_", " ").capitalize()],
			Money.format(amount), Palette.GOOD if amount > 0 else Palette.INK_SOFT))
		shown += 1
		if shown >= 8:
			break


func _ledger_line(left: String, right: String, color: Color) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row.add_child(Palette.text(left, Palette.SMALL, Palette.INK_FAINT))
	row.add_child(Palette.text(right, Palette.BODY, color, HORIZONTAL_ALIGNMENT_RIGHT))
	return row


func _build_preview_note() -> void:
	var column: VBoxContainer = _rise(0.36, 0.55)
	var recap: Dictionary = _pending_preview
	column.add_child(Palette.text(String(recap.get("month_label", "")).to_upper(),
		Palette.SMALL, Palette.INK_FAINT))
	column.add_child(Palette.text("What this month does to you", Palette.TITLE, Palette.INK))
	column.add_child(Palette.gap(4))

	for line in recap["income_lines"] as Array:
		column.add_child(_note_line("You earn", String((line as Dictionary)["label"]),
			int((line as Dictionary)["amount_minor"]), Palette.GOOD))
	for line in recap["borrowing_lines"] as Array:
		column.add_child(_note_line("You borrow", String((line as Dictionary)["label"]),
			int((line as Dictionary)["amount_minor"]), Palette.WARN))
	for line in recap["expense_lines"] as Array:
		column.add_child(_note_line("You owe", String((line as Dictionary)["label"]),
			int((line as Dictionary)["amount_minor"]), Palette.INK_SOFT))
	for line in recap["deferred_lines"] as Array:
		column.add_child(_note_line("You cannot pay", String((line as Dictionary)["label"]),
			int((line as Dictionary)["amount_minor"]), Palette.ALERT))

	column.add_child(Palette.gap(6))
	column.add_child(Palette.text(Money.format(int(recap["closing_cash_minor"])), Palette.BIG, Palette.INK))
	column.add_child(Palette.sentence("what you would be holding afterwards",
		Palette.SMALL, Palette.INK_FAINT))
	column.add_child(Palette.sentence(
		"Amounts already agreed. Nothing here promises what the city does next.",
		Palette.SMALL, Palette.INK_FAINT))

	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(spacer)

	var go: Button = Palette.primary_action("Live it")
	go.pressed.connect(_confirm_month)
	column.add_child(go)
	var back: Button = Palette.choice("Not yet")
	back.pressed.connect(_close_overlay)
	column.add_child(back)


func _note_line(verb: String, label: String, amount: int, color: Color) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	row.add_child(Palette.text("%s · %s" % [verb, label], Palette.SMALL, Palette.INK_FAINT))
	row.add_child(Palette.text(Money.format(amount, false), Palette.BODY, color,
		HORIZONTAL_ALIGNMENT_RIGHT))
	return row


func _build_recap_note() -> void:
	var column: VBoxContainer = _rise(0.50, 0.30)
	var recap: Dictionary = _last_recap
	var change: int = int(recap["net_cash_change_minor"])

	column.add_child(Palette.text(String(recap.get("month_label", "")).to_upper(),
		Palette.SMALL, Palette.INK_FAINT))
	column.add_child(Palette.text("%s %s" % ["You kept" if change >= 0 else "You lost",
		Money.format(absi(change), false)], Palette.BIG, Palette.GOOD if change >= 0 else Palette.ALERT))
	column.add_child(Palette.sentence(_recap_sentence(recap), Palette.BODY, Palette.INK_SOFT))

	for line in recap["progress_lines"] as Array:
		column.add_child(Palette.sentence("· %s: %s" % [
			String((line as Dictionary)["label"]), String((line as Dictionary)["detail"])],
			Palette.SMALL, Palette.INK_FAINT))

	if bool(recap.get("unfunded", false)):
		column.add_child(Palette.text(
			"A bill went unpaid. It is written down, and no penalty is charged in this build.",
			Palette.SMALL, Palette.ALERT))

	var goal_result: Dictionary = engine.first_home_goal()
	if goal_result["ok"]:
		column.add_child(Palette.gap(2))
		column.add_child(Palette.sentence(_ambition_sentence(goal_result["value"]),
			Palette.SMALL, Palette.BRASS))

	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(spacer)

	var onward: Button = Palette.primary_action("Carry on")
	onward.pressed.connect(_close_overlay)
	column.add_child(onward)

# --- sentences ----------------------------------------------------------------

func _ambition_sentence(goal: Dictionary) -> String:
	var shortfall: int = int(goal["shortfall_minor"])
	if shortfall <= 0:
		return "You could cover the cash on that studio. Buying is the next milestone, not this one."
	var surplus: int = int(engine.state.normal_monthly_surplus()["surplus_minor"])
	if surplus <= 0:
		return "%s still to find, and nothing spare to find it with yet." % Money.format(shortfall, false)
	var months: int = int(ceil(float(shortfall) / float(surplus)))
	return "%s to go — about %d months if you set aside everything you keep." % [
		Money.format(shortfall, false), months]


func _recap_sentence(recap: Dictionary) -> String:
	var parts: Array = []
	for line in recap["income_lines"] as Array:
		parts.append(String((line as Dictionary)["label"]).to_lower())
	if parts.is_empty():
		return "Nothing came in. The month still cost what it costs."
	return "%s arrived, the bills went out, and Old Quay carried on without asking." \
		% String(parts[0]).capitalize()


func _route_title(start_id: String) -> String:
	match start_id:
		"fresh_work":
			return "Take the job"
		"fresh_university":
			return "Study, and borrow for it"
		"fresh_work_study":
			return "Do both, slowly"
		_:
			return start_id.capitalize()


func _route_line(start_id: String) -> String:
	match start_id:
		"fresh_work":
			return "Money from month one, and no qualification waiting at the end of it."
		"fresh_university":
			return "Three years of stipend and loan draws. The debt is real; the doors it opens might be."
		"fresh_work_study":
			return "Four years of being tired. A smaller wage now, a wider choice later."
		_:
			return ""


func _route_monthly(start_id: String) -> String:
	var start: Dictionary = content.start(start_id)
	var income: int = _start_money(start, "monthly_salary_minor") + _start_money(start, "monthly_stipend_minor")
	var outgoing: int = _start_money(start, "monthly_essentials_minor") + _start_money(start, "monthly_tuition_minor")
	var borrowed: int = _start_money(start, "monthly_education_loan_draw_minor")
	var text: String = "%s a month after essentials" % Money.format(income - outgoing, false)
	if borrowed > 0:
		text += ", plus %s borrowed each month" % Money.format(borrowed, false)
	return text


func _start_money(start: Dictionary, key: String) -> int:
	if not start.has(key) or start[key] == null:
		return 0
	var parsed: Dictionary = Money.from_variant(start[key], key)
	return int(parsed["value"]) if parsed["ok"] else 0


func _ordered_start_ids() -> Array:
	var ordered: Array = []
	for start_id in ["fresh_work", "fresh_university", "fresh_work_study"]:
		if content.has_start(start_id):
			ordered.append(start_id)
	for start_id in content.start_ids():
		if not ordered.has(start_id):
			ordered.append(start_id)
	return ordered

# --- actions ------------------------------------------------------------------

func _begin_life(start_id: String) -> void:
	var created: Dictionary = engine.new_game(start_id, {"display_name": "You"}, -1)
	if not created["ok"]:
		_notify(String(created.get("message", "could not start")), "alert")
		return
	_screen = "city"
	_sheet = ""
	_world.set_mode("city")
	_world.city.place_player("home")
	_notify("", "info")
	_rebuild()


func _continue_life() -> void:
	var loaded: Dictionary = engine.load_game(0)
	if not loaded["ok"]:
		_notify(String(loaded.get("message", "could not load")), "alert")
		_rebuild()
		return
	_screen = "city"
	_world.set_mode("city")
	_world.city.place_player("home")
	var payload: Dictionary = loaded["value"]
	if bool(payload.get("recovered_from_backup", false)):
		_notify(String(payload.get("notice", "")), "warning")
	_rebuild()


func _enter_room() -> void:
	_world.set_mode("room")
	_rebuild()


func _leave_room() -> void:
	_world.set_mode("city")
	_rebuild()


func _open_sheet(name: String) -> void:
	_sheet = name
	_rebuild()


func _close_sheet() -> void:
	_sheet = ""
	_rebuild()


func _open_preview() -> void:
	var preview: Dictionary = MonthEngine.preview(engine.state)
	if not preview["ok"]:
		_notify(String(preview.get("message", "preview failed")), "alert")
		_rebuild()
		return
	_pending_preview = preview["value"]
	_sheet = ""
	_screen = "preview"
	_rebuild()


## Commit first, then play the month out across the district. The simulation is
## already saved before a single frame of animation runs.
func _confirm_month() -> void:
	_commit_month()
	if _screen != "recap":
		return
	_screen = "city"
	_sheet = ""
	_journey = true
	_journey_time = 0.0
	_went_out = false
	_world.set_mode("city")
	_world.city.hour = 6.5
	_world.city.hour_speed = JOURNEY_HOUR_SPEED
	if not _world.city.travel_to("work"):
		_world.city.travel_to("home")
		_went_out = true
	_rebuild()


func _commit_month() -> void:
	var command := Command.create(
		engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
	var result: Dictionary = engine.execute(command)
	if not result["ok"]:
		_notify(String(result.get("message", "the month could not be resolved")), "alert")
		_screen = "city"
		return
	_last_recap = result["value"]
	_screen = "recap"
	_notify("", "info")


func _spend(choice: Dictionary) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision,
		{"amount_minor": Money.to_minor_string(int(choice["amount"])), "choice_id": String(choice["id"])}),
		"%s — spent." % String(choice["label"]))


func _earmark(amount: int) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_EARMARK_SAVINGS,
		engine.state.state_revision,
		{"amount_minor": Money.to_minor_string(amount), "choice_id": "first_home_fund"}),
		"%s into the jar." % Money.format(amount, false))


func _release(amount: int) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_RELEASE_SAVINGS,
		engine.state.state_revision, {"amount_minor": Money.to_minor_string(amount)}),
		"%s back out of the jar." % Money.format(amount, false))


func _run(command: Command, success: String) -> void:
	var result: Dictionary = engine.execute(command)
	if result["ok"]:
		_notify(success, "good")
	else:
		_notify(String(result.get("message", "that was refused")), "alert")
	_rebuild()


func _close_overlay() -> void:
	_screen = "city"
	_sheet = ""
	_rebuild()


func _notify(text: String, level: String) -> void:
	_message = text
	_message_level = level
