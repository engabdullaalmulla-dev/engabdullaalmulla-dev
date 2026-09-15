extends Control

## The face of the game.
##
## Design rule for this layer: you are looking at a room in a city, not at an
## account. The world is full-bleed at the top; underneath it there is one
## number that matters, one sentence explaining it, one visible ambition, and
## one thing to do. Everything else — the ledger, the assumptions, the
## transaction list — lives behind a deliberate tap, because a player who wants
## the arithmetic should be able to get all of it, and a player who does not
## should never be handed a dashboard.
##
## The UI reads committed state and issues validated commands. It cannot write
## a balance.

const SAVING_STEPS: Array = [100000, 250000, 500000]

const DISCRETIONARY_CHOICES: Array = [
	{"id": "city_evening", "label": "An evening out by the water", "amount": 12000,
	 "note": "You will remember it. The fund will not notice."},
	{"id": "work_clothes", "label": "Clothes that fit the job", "amount": 45000,
	 "note": "Three weeks of setting money aside, spent in an afternoon."},
	{"id": "new_phone", "label": "The phone you keep looking at", "amount": 180000,
	 "note": "Two and a half months of everything you manage to save."},
]

var engine: GameEngine
var content: ContentLibrary

var _screen: String = "new_life"
var _sheet: String = ""
var _pending_preview: Dictionary = {}
var _last_recap: Dictionary = {}
var _message: String = ""
var _message_level: String = "info"

var _world: WorldView
var _stage: VBoxContainer
var _panel: VBoxContainer
var _overlay: Control

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

	var backdrop := ColorRect.new()
	backdrop.color = Palette.NIGHT
	backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(backdrop)

	_stage = VBoxContainer.new()
	_stage.set_anchors_preset(Control.PRESET_FULL_RECT)
	_stage.add_theme_constant_override("separation", 0)
	add_child(_stage)

	# Full-bleed world: 180x160 logical at exactly 4x on a 720-wide viewport.
	_world = WorldView.new()
	_world.custom_minimum_size = Vector2(720, 640)
	_stage.add_child(_world)

	var margins := MarginContainer.new()
	margins.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_apply_safe_area(margins)
	_stage.add_child(margins)

	_panel = VBoxContainer.new()
	_panel.add_theme_constant_override("separation", 10)
	margins.add_child(_panel)

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
					_screen = "home"
				"preview":
					_open_preview()
				"recap":
					_screen = "recap"
				"sheet":
					_sheet = parts[1] if parts.size() > 1 else ""
					_screen = "home"
				"save":
					_earmark(parts[1].to_int() if parts.size() > 1 else 100000)
				"spend":
					_spend(DISCRETIONARY_CHOICES[0])
				"home":
					_screen = "home"
					_sheet = ""


func _apply_safe_area(node: MarginContainer) -> void:
	var top: int = 14
	var bottom: int = 16
	var safe: Rect2i = DisplayServer.get_display_safe_area()
	var screen: Vector2i = DisplayServer.screen_get_size()
	if safe.size.y > 0 and screen.y > 0:
		var scale: float = float(size.y if size.y > 0 else 1280) / float(screen.y)
		bottom += int(maxf(0.0, float(screen.y - (safe.position.y + safe.size.y)) * scale))
	node.add_theme_constant_override("margin_left", Palette.GUTTER)
	node.add_theme_constant_override("margin_right", Palette.GUTTER)
	node.add_theme_constant_override("margin_top", top)
	node.add_theme_constant_override("margin_bottom", bottom)


func _process(_delta: float) -> void:
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
	for child in _panel.get_children():
		_panel.remove_child(child)
		child.queue_free()
	for child in _overlay.get_children():
		_overlay.remove_child(child)
		child.queue_free()

	# There is no life yet: nothing else can be shown, whatever was requested.
	if engine.state == null:
		_screen = "new_life"
		_sheet = ""

	_refresh_world()

	if _screen == "new_life":
		_build_new_life()
	else:
		_build_home()

	if _screen == "preview":
		_build_preview_note()
	elif _screen == "recap":
		_build_recap_note()
	elif not _sheet.is_empty():
		_build_sheet()


func _refresh_world() -> void:
	if engine.state == null:
		_world.configure("dawn", 0.0, false)
		return
	var fill: float = 0.0
	var goal: Dictionary = engine.first_home_goal()
	if goal["ok"] and int((goal["value"] as Dictionary)["cash_needed_minor"]) > 0:
		fill = float((goal["value"] as Dictionary)["earmarked_minor"]) \
			/ float((goal["value"] as Dictionary)["cash_needed_minor"])
	# The hour of day drifts month to month so no two months look identical.
	var hours: Array = ["dawn", "day", "dusk", "night"]
	var hour: String = "night" if _screen == "recap" else String(hours[engine.state.month_index % 4])
	_world.configure(hour, fill, engine.state.arrears() > 0)


func _build_new_life() -> void:
	_panel.add_child(Palette.text("SALARY TO SKYLINE", Palette.BIG, Palette.INK))
	_panel.add_child(Palette.sentence(
		"A rented room, a salary, and a city that was not built for you yet.",
		Palette.BODY, Palette.INK_SOFT))
	_panel.add_child(Palette.gap(2))

	if engine.save_store.has_save(0):
		var resume: Button = Palette.primary_action("Go back to your life")
		resume.pressed.connect(_continue_life)
		_panel.add_child(resume)
		_panel.add_child(Palette.gap(2))

	# The routes scroll, so a shorter phone never clips the third life.
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var routes := VBoxContainer.new()
	routes.add_theme_constant_override("separation", 10)
	routes.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(routes)
	_panel.add_child(scroll)

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


func _build_home() -> void:
	var state: GameState = engine.state

	var ribbon := HBoxContainer.new()
	ribbon.add_child(Palette.text(SimCalendar.label(state.month_index), Palette.SMALL, Palette.INK_FAINT))
	ribbon.add_child(Palette.text(
		"age %d" % SimCalendar.age_years(int(state.player.get("age_months_at_start", 216)) + state.month_index),
		Palette.SMALL, Palette.INK_FAINT, HORIZONTAL_ALIGNMENT_RIGHT))
	_panel.add_child(ribbon)

	_panel.add_child(Palette.text(Money.format(state.spendable_cash()), Palette.HERO, Palette.INK))
	_panel.add_child(Palette.sentence(_position_sentence(), Palette.BODY, Palette.INK_SOFT))

	if not _message.is_empty():
		_panel.add_child(Palette.text(_message, Palette.SMALL, Palette.severity(_message_level)))

	_panel.add_child(Palette.gap(2))
	_panel.add_child(_ambition_strip())

	var breathe := Control.new()
	breathe.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_panel.add_child(breathe)

	var act: Button = Palette.primary_action("Live this month")
	act.pressed.connect(_open_preview)
	_panel.add_child(act)

	var quiet := HBoxContainer.new()
	quiet.add_theme_constant_override("separation", 8)
	for entry in [["saving", "Set aside"], ["spending", "Spend"], ["ledger", "Ledger"]]:
		var button: Button = Palette.choice(String(entry[1]))
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.pressed.connect(_open_sheet.bind(String(entry[0])))
		quiet.add_child(button)
	_panel.add_child(quiet)


## The ambition, always on screen: a line of brass that fills as the fund does.
func _ambition_strip() -> Control:
	var goal_result: Dictionary = engine.first_home_goal()
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 4)
	if not goal_result["ok"]:
		return column
	var goal: Dictionary = goal_result["value"]
	var needed: int = int(goal["cash_needed_minor"])
	var saved: int = int(goal["earmarked_minor"])

	var heading := HBoxContainer.new()
	heading.add_child(Palette.text("A studio of your own", Palette.SMALL, Palette.INK_SOFT))
	heading.add_child(Palette.text("%s / %s" % [Money.format(saved, false), Money.format(needed, false)],
		Palette.SMALL, Palette.BRASS, HORIZONTAL_ALIGNMENT_RIGHT))
	column.add_child(heading)

	var track := ProgressBar.new()
	track.max_value = maxf(1.0, float(needed))
	track.value = float(saved)
	track.show_percentage = false
	track.custom_minimum_size = Vector2(0, 6)
	track.add_theme_stylebox_override("background", Palette.fill(Color(1, 1, 1, 0.10)))
	track.add_theme_stylebox_override("fill", Palette.fill(Palette.BRASS))
	column.add_child(track)
	column.add_child(Palette.sentence(_ambition_sentence(goal), Palette.SMALL, Palette.INK_FAINT))
	return column


func _build_sheet() -> void:
	match _sheet:
		"saving":
			_sheet_panel("Set money aside", _saving_body)
		"spending":
			_sheet_panel("Spend some of it", _spending_body)
		"ledger":
			_sheet_panel("The ledger", _ledger_body)


## Anything that is not the room rises over it from the bottom, leaving the
## world visible above. Nothing in this game replaces the world with a document.
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


## Every number the simulation knows, for the player who wants them. This is the
## only place that looks like a statement, and it is one tap away, not the app.
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


## The month ahead, written like a note to yourself rather than an invoice.
func _build_preview_note() -> void:
	var column: VBoxContainer = _rise(0.34, 0.55)
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
	var column: VBoxContainer = _rise(0.46, 0.35)
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

func _position_sentence() -> String:
	var state: GameState = engine.state
	var surplus: Dictionary = state.normal_monthly_surplus()
	var left_over: int = int(surplus["surplus_minor"])
	if state.arrears() > 0:
		return "You are behind by %s. Everything else waits until that is cleared." \
			% Money.format(state.arrears(), false)
	if left_over > 0:
		return "After everything you must pay, about %s a month is yours to aim with." \
			% Money.format(left_over, false)
	if left_over == 0:
		return "You break even each month. Nothing is going wrong, and nothing is being built."
	return "You are %s short every month. Savings are covering the difference, for now." \
		% Money.format(-left_over, false)


func _ambition_sentence(goal: Dictionary) -> String:
	var shortfall: int = int(goal["shortfall_minor"])
	if shortfall <= 0:
		return "You could cover the closing cash on that studio. Buying is not built yet — that is the next milestone."
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
	return "%s arrived, the bills went out, and the city carried on without asking." \
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
	_screen = "home"
	_sheet = ""
	_notify("", "info")
	_rebuild()


func _continue_life() -> void:
	var loaded: Dictionary = engine.load_game(0)
	if not loaded["ok"]:
		_notify(String(loaded.get("message", "could not load")), "alert")
		_rebuild()
		return
	_screen = "home"
	var payload: Dictionary = loaded["value"]
	if bool(payload.get("recovered_from_backup", false)):
		_notify(String(payload.get("notice", "")), "warning")
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


func _confirm_month() -> void:
	_commit_month()
	_rebuild()


func _commit_month() -> void:
	var command := Command.create(
		engine.next_command_id("cmd"), Command.TYPE_ADVANCE_MONTH, engine.state.state_revision)
	var result: Dictionary = engine.execute(command)
	if not result["ok"]:
		_notify(String(result.get("message", "the month could not be resolved")), "alert")
		_screen = "home"
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
	_screen = "home"
	_sheet = ""
	_rebuild()


func _notify(text: String, level: String) -> void:
	_message = text
	_message_level = level
