extends Control

## Portrait shell for the M0 build.
##
## The UI reads committed state and issues validated commands; it never writes a
## balance. Everything it shows comes from GameState/MonthEngine, so what the
## player reads on screen is the same arithmetic the headless tests assert.
##
## Screens present at M0: New Life, Life, Money, Month preview, Month recap.
## City, Portfolio and Inbox are not built yet and are not shown as empty tabs.

const DISCRETIONARY_CHOICES: Array = [
	{"id": "city_evening", "label": "An evening out by the water", "amount": 12000,
	 "note": "A good month deserves something. No financial return."},
	{"id": "work_clothes", "label": "Better clothes for work", "amount": 45000,
	 "note": "Confidence at work. No guaranteed promotion."},
	{"id": "new_phone", "label": "A new phone", "amount": 180000,
	 "note": "Two months of what you could have set aside."},
]

const SAVING_STEPS: Array = [100000, 250000, 500000]

var engine: GameEngine
var content: ContentLibrary

var _tab: String = "life"
var _pending_preview: Dictionary = {}
var _last_recap: Dictionary = {}
var _message: String = ""
var _message_severity: String = "info"
var _screen: String = "new_life"

var _root_column: VBoxContainer
var _content_column: VBoxContainer
var _scroll: ScrollContainer

# Evidence capture: --shot=<path> [--shot-delay=<frames>] [--actions=a|b|c]
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

	var background := ColorRect.new()
	background.color = UiTheme.BACKGROUND
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var safe_area := MarginContainer.new()
	safe_area.set_anchors_preset(Control.PRESET_FULL_RECT)
	_apply_safe_area(safe_area)
	add_child(safe_area)

	_root_column = VBoxContainer.new()
	_root_column.add_theme_constant_override("separation", 10)
	safe_area.add_child(_root_column)

	_apply_startup_actions()
	_rebuild()


func _read_command_line() -> void:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--shot="):
			_shot_path = argument.substr(7)
		elif argument.begins_with("--shot-delay="):
			_shot_delay = argument.substr(13).to_int()


func _startup_actions() -> Array:
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--actions="):
			return argument.substr(10).split("|", false)
	return []


func _apply_startup_actions() -> void:
	for action in _startup_actions():
		var parts: PackedStringArray = String(action).split(":")
		match parts[0]:
			"start":
				_start_life(parts[1] if parts.size() > 1 else "fresh_work")
			"advance":
				var count: int = parts[1].to_int() if parts.size() > 1 else 1
				for i in count:
					_commit_month()
			"preview":
				_open_preview()
			"tab":
				_tab = parts[1] if parts.size() > 1 else "life"
				_screen = "main"
			"save":
				var amount: int = parts[1].to_int() if parts.size() > 1 else 100000
				_earmark(amount)
			"spend":
				_spend(DISCRETIONARY_CHOICES[0])


func _apply_safe_area(node: MarginContainer) -> void:
	var left: int = UiTheme.GUTTER
	var right: int = UiTheme.GUTTER
	var top: int = 12
	var bottom: int = 12
	# On a phone the OS reports a safe rectangle inside the display; respect it so
	# the status bar and home indicator never cover a financial control.
	var safe: Rect2i = DisplayServer.get_display_safe_area()
	var screen: Vector2i = DisplayServer.screen_get_size()
	if safe.size.x > 0 and safe.size.y > 0 and screen.x > 0 and screen.y > 0:
		var scale: float = float(size.y if size.y > 0 else 1280) / float(screen.y)
		top += int(maxf(0.0, float(safe.position.y) * scale))
		bottom += int(maxf(0.0, float(screen.y - (safe.position.y + safe.size.y)) * scale))
	node.add_theme_constant_override("margin_left", left)
	node.add_theme_constant_override("margin_right", right)
	node.add_theme_constant_override("margin_top", top)
	node.add_theme_constant_override("margin_bottom", bottom)


func _process(_delta: float) -> void:
	if _shot_path.is_empty():
		return
	_frames += 1
	if _frames < _shot_delay:
		return
	var image: Image = get_viewport().get_texture().get_image()
	image.save_png(_shot_path)
	print("screenshot written: %s" % _shot_path)
	get_tree().quit(0)

# --- Rebuild ------------------------------------------------------------------

func _rebuild() -> void:
	for child in _root_column.get_children():
		child.queue_free()
		_root_column.remove_child(child)
	match _screen:
		"new_life":
			_build_new_life()
		"preview":
			_build_month_preview()
		"recap":
			_build_month_recap()
		_:
			_build_main()


func _build_new_life() -> void:
	var vignette := preload("res://game/presentation/skyline_vignette.gd").new()
	vignette.custom_minimum_size = Vector2(0, 170)
	_root_column.add_child(vignette)

	_root_column.add_child(UiTheme.label("SALARY TO SKYLINE", UiTheme.SIZE_DISPLAY, UiTheme.TEXT))
	_root_column.add_child(UiTheme.label(
		"A rented room, a salary, and a city you cannot afford yet.",
		UiTheme.SIZE_BODY, UiTheme.TEXT_MUTED))
	_root_column.add_child(UiTheme.label(
		"M0 foundation build · placeholder art · all money is simulated and has no cash value",
		UiTheme.SIZE_SMALL, UiTheme.WARNING))
	_root_column.add_child(UiTheme.spacer(4))

	if engine.save_store.has_save(0):
		var resume := UiTheme.button("Continue saved life", true)
		resume.pressed.connect(_continue_life)
		_root_column.add_child(resume)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(column)
	_root_column.add_child(scroll)

	for start_id in _ordered_start_ids():
		var start: Dictionary = content.start(start_id)
		var card: VBoxContainer = UiTheme.card(_start_title(start_id))
		card.add_child(UiTheme.row("Opening cash", _money(start, "opening_cash_minor")))
		if start.has("monthly_salary_minor"):
			card.add_child(UiTheme.row("Monthly salary", _money(start, "monthly_salary_minor")))
		if start.has("monthly_stipend_minor"):
			card.add_child(UiTheme.row("Monthly stipend", _money(start, "monthly_stipend_minor")))
		if start.has("monthly_education_loan_draw_minor"):
			card.add_child(UiTheme.row("Monthly loan draw (debt)",
				_money(start, "monthly_education_loan_draw_minor"), UiTheme.SIZE_BODY, UiTheme.WARNING))
		if start.has("monthly_tuition_minor"):
			card.add_child(UiTheme.row("Monthly tuition", _money(start, "monthly_tuition_minor")))
		card.add_child(UiTheme.row("Monthly essentials", _money(start, "monthly_essentials_minor")))
		card.add_child(UiTheme.label(String(start.get("funding_note", "")),
			UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
		var choose := UiTheme.button("Start this life", true)
		choose.pressed.connect(_start_life.bind(start_id))
		card.add_child(choose)
		column.add_child(card.get_meta("card_root"))

	column.add_child(UiTheme.label(
		"Time only moves when you advance a month. Closing the app changes nothing.",
		UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))


func _build_main() -> void:
	var state: GameState = engine.state
	var header := VBoxContainer.new()
	header.add_theme_constant_override("separation", 2)
	header.add_child(UiTheme.row(SimCalendar.label(state.month_index),
		"Age %d" % SimCalendar.age_years(int(state.player.get("age_months_at_start", 216)) + state.month_index),
		UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	header.add_child(UiTheme.label(Money.format(state.spendable_cash()), UiTheme.SIZE_DISPLAY, UiTheme.TEXT))
	header.add_child(UiTheme.label("Spendable cash", UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_root_column.add_child(header)

	var surplus: Dictionary = state.normal_monthly_surplus()
	var totals := GridContainer.new()
	totals.columns = 3
	totals.add_theme_constant_override("h_separation", 8)
	totals.add_child(_total_tile("Monthly surplus", Money.format(int(surplus["surplus_minor"])),
		UiTheme.GOOD if int(surplus["surplus_minor"]) >= 0 else UiTheme.ALERT))
	totals.add_child(_total_tile("Net worth", Money.format(state.net_worth()), UiTheme.TEXT))
	var commitments: Array = state.upcoming_commitments(12)
	var committed_total: int = 0
	for row in commitments:
		committed_total += int((row as Dictionary)["amount_minor"])
	totals.add_child(_total_tile("Next 12 months owed", Money.format(committed_total), UiTheme.WARNING))
	_root_column.add_child(totals)

	if not _message.is_empty():
		var banner: VBoxContainer = UiTheme.card("")
		banner.add_child(UiTheme.label("%s %s" % [UiTheme.severity_glyph(_message_severity), _message],
			UiTheme.SIZE_SMALL, UiTheme.severity_color(_message_severity)))
		_root_column.add_child(banner.get_meta("card_root"))

	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 8)
	for entry in [["life", "Life"], ["money", "Money"]]:
		var button: Button = UiTheme.button(String(entry[1]), _tab == String(entry[0]))
		button.pressed.connect(_select_tab.bind(String(entry[0])))
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tabs.add_child(button)
	_root_column.add_child(tabs)

	_scroll = ScrollContainer.new()
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_content_column = VBoxContainer.new()
	_content_column.add_theme_constant_override("separation", 10)
	_content_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.add_child(_content_column)
	_root_column.add_child(_scroll)

	if _tab == "life":
		_build_life_tab()
	else:
		_build_money_tab()

	var advance := UiTheme.button("Advance month  ▸", true)
	advance.pressed.connect(_open_preview)
	_root_column.add_child(advance)


func _total_tile(title: String, value: String, color: Color) -> Control:
	var container := PanelContainer.new()
	container.add_theme_stylebox_override("panel", UiTheme.panel(UiTheme.SURFACE, 12))
	container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 2)
	column.add_child(UiTheme.label(title, UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	column.add_child(UiTheme.label(value, UiTheme.SIZE_SMALL, color))
	container.add_child(column)
	return container


func _build_life_tab() -> void:
	var state: GameState = engine.state
	var vignette := preload("res://game/presentation/skyline_vignette.gd").new()
	vignette.custom_minimum_size = Vector2(0, 130)
	_content_column.add_child(vignette)

	var life: VBoxContainer = UiTheme.card("This month")
	if state.is_employed():
		life.add_child(UiTheme.row("Work", String(state.employment.get("job_id", "")).capitalize()))
		life.add_child(UiTheme.row("Salary", Money.format(state.monthly_salary()), UiTheme.SIZE_BODY, UiTheme.GOOD))
		life.add_child(UiTheme.row("Experience", "%d month(s)" % int(state.employment.get("experience_months", 0))))
	else:
		life.add_child(UiTheme.label("No job. Essentials still arrive every month.",
			UiTheme.SIZE_BODY, UiTheme.ALERT))
	if state.is_studying():
		life.add_child(UiTheme.row("Study", String(state.study.get("program_id", "")).capitalize()))
		life.add_child(UiTheme.row("Progress", "%d of %d month(s)" % [
			int(state.study.get("months_completed", 0)), int(state.study.get("duration_months", 0))]))
		life.add_child(UiTheme.row("Tuition", Money.format(state.monthly_tuition())))
		if state.monthly_education_draw() > 0:
			life.add_child(UiTheme.row("Loan draw (debt, not income)",
				Money.format(state.monthly_education_draw()), UiTheme.SIZE_BODY, UiTheme.WARNING))
	elif not state.study.is_empty():
		life.add_child(UiTheme.row("Study", "Completed", UiTheme.SIZE_BODY, UiTheme.GOOD))
	life.add_child(UiTheme.row("Essentials", Money.format(state.monthly_essentials_minor)))
	life.add_child(UiTheme.label(
		"Focus %d of %d used. Browsing, budgeting and paying bills are free."
			% [_focus_used(), state.focus_capacity], UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_content_column.add_child(life.get_meta("card_root"))

	var goal_result: Dictionary = engine.first_home_goal()
	if goal_result["ok"]:
		var goal: Dictionary = goal_result["value"]
		var card: VBoxContainer = UiTheme.card("First home fund")
		card.add_child(UiTheme.label("A studio in Old Quay — %s" % Money.format(int(goal["price_minor"])),
			UiTheme.SIZE_TITLE, UiTheme.TEXT))
		card.add_child(UiTheme.row("Cash needed at closing", Money.format(int(goal["cash_needed_minor"])),
			UiTheme.SIZE_BODY, UiTheme.SAND))
		card.add_child(UiTheme.row("Set aside so far", Money.format(int(goal["earmarked_minor"]))))
		card.add_child(UiTheme.row("Still to find", Money.format(int(goal["shortfall_minor"])),
			UiTheme.SIZE_BODY, UiTheme.WARNING))
		var bar := ProgressBar.new()
		bar.max_value = maxf(1.0, float(goal["cash_needed_minor"]))
		bar.value = float(goal["earmarked_minor"])
		bar.show_percentage = false
		bar.custom_minimum_size = Vector2(0, 10)
		card.add_child(bar)
		card.add_child(UiTheme.label(
			"Deposit %s plus %s of fictional acquisition costs. Buying property is not implemented yet: this is the target M2 delivers."
				% [Money.format(int(goal["price_minor"]) - int(goal["loan_minor"])), Money.format(int(goal["fees_minor"]))],
			UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
		var buttons := HBoxContainer.new()
		buttons.add_theme_constant_override("separation", 8)
		for step in SAVING_STEPS:
			var save_button: Button = UiTheme.button("+ %s" % Money.format(int(step), false))
			save_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			save_button.disabled = engine.state.spendable_cash() < int(step)
			save_button.pressed.connect(_earmark.bind(int(step)))
			buttons.add_child(save_button)
		card.add_child(buttons)
		if int(goal["earmarked_minor"]) > 0:
			var release: Button = UiTheme.button("Release the fund back to spendable cash")
			release.pressed.connect(_release.bind(int(goal["earmarked_minor"])))
			card.add_child(release)
			card.add_child(UiTheme.label(
				"Releasing it is allowed — it is still your money — but the deposit moves further away.",
				UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
		_content_column.add_child(card.get_meta("card_root"))

	var spending: VBoxContainer = UiTheme.card("Optional spending")
	spending.add_child(UiTheme.label("Salary is not spare cash.", UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	for choice in DISCRETIONARY_CHOICES:
		var button: Button = UiTheme.button("%s  ·  %s" % [
			String(choice["label"]), Money.format(int(choice["amount"]), false)])
		button.disabled = engine.state.spendable_cash() < int(choice["amount"])
		button.pressed.connect(_spend.bind(choice))
		spending.add_child(button)
		spending.add_child(UiTheme.label(String(choice["note"]), UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_content_column.add_child(spending.get_meta("card_root"))

	if not engine.state.notices.is_empty():
		var inbox: VBoxContainer = UiTheme.card("Notices")
		var recent: Array = engine.state.notices.slice(maxi(0, engine.state.notices.size() - 4))
		for raw in recent:
			var notice: Dictionary = raw
			inbox.add_child(UiTheme.label("%s %s" % [
				UiTheme.severity_glyph(String(notice.get("severity", "info"))), String(notice.get("title", ""))],
				UiTheme.SIZE_BODY, UiTheme.severity_color(String(notice.get("severity", "info")))))
			inbox.add_child(UiTheme.label(String(notice.get("body", "")), UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
		_content_column.add_child(inbox.get_meta("card_root"))


func _build_money_tab() -> void:
	var state: GameState = engine.state
	var cash: VBoxContainer = UiTheme.card("Cash")
	cash.add_child(UiTheme.row("Spendable now", Money.format(state.spendable_cash()),
		UiTheme.SIZE_BODY, UiTheme.GOOD))
	cash.add_child(UiTheme.row("Set aside for the first home", Money.format(state.restricted_cash())))
	cash.add_child(UiTheme.row("Total cash owned", Money.format(state.liquid_cash_total())))
	cash.add_child(UiTheme.label(
		"Money you have set aside is still yours; it is simply not counted as spendable, and it is never deducted twice.",
		UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_content_column.add_child(cash.get_meta("card_root"))

	var surplus: Dictionary = state.normal_monthly_surplus()
	var forecast: VBoxContainer = UiTheme.card("Normal monthly surplus (estimate)")
	forecast.add_child(UiTheme.row("Recurring income", Money.format(int(surplus["income_minor"]))))
	forecast.add_child(UiTheme.row("Recurring costs", Money.format(int(surplus["outgoing_minor"]))))
	forecast.add_child(UiTheme.separator())
	forecast.add_child(UiTheme.row("Estimated surplus", Money.format(int(surplus["surplus_minor"])),
		UiTheme.SIZE_TITLE, UiTheme.GOOD if int(surplus["surplus_minor"]) >= 0 else UiTheme.ALERT))
	for assumption in surplus["assumptions"] as Array:
		forecast.add_child(UiTheme.label("· %s" % String(assumption), UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_content_column.add_child(forecast.get_meta("card_root"))

	var worth: VBoxContainer = UiTheme.card("Net worth (book value)")
	worth.add_child(UiTheme.row("Assets", Money.format(state.ledger.balance_of_kind(Accounts.KIND_ASSET))))
	worth.add_child(UiTheme.row("Debt", Money.format(state.total_debt()),
		UiTheme.SIZE_BODY, UiTheme.WARNING if state.total_debt() > 0 else UiTheme.TEXT))
	if state.arrears() > 0:
		worth.add_child(UiTheme.row("Unpaid bills", Money.format(state.arrears()),
			UiTheme.SIZE_BODY, UiTheme.ALERT))
	worth.add_child(UiTheme.separator())
	worth.add_child(UiTheme.row("Net worth", Money.format(state.net_worth()), UiTheme.SIZE_TITLE))
	_content_column.add_child(worth.get_meta("card_root"))

	var commitments: VBoxContainer = UiTheme.card("Upcoming commitments")
	var rows: Array = state.upcoming_commitments(6)
	for raw in rows:
		var row: Dictionary = raw
		var color: Color = UiTheme.ALERT if String(row["kind"]) == "arrears" else UiTheme.TEXT
		commitments.add_child(UiTheme.row("%s · %s" % [
			SimCalendar.short_label(int(row["month_index"])), String(row["label"])],
			Money.format(int(row["amount_minor"])), UiTheme.SIZE_SMALL, color))
	commitments.add_child(UiTheme.label(
		"Dated obligations for the next six months. Off-plan instalments and loan payments join this list when those systems arrive.",
		UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_content_column.add_child(commitments.get_meta("card_root"))

	var journal: VBoxContainer = UiTheme.card("Recent transactions")
	var entries: Array = state.ledger.recent_entries(14)
	entries.reverse()
	var shown: int = 0
	for raw_entry in entries:
		var entry: Dictionary = raw_entry
		if String(entry["account"]) != Accounts.CASH_OPERATING:
			continue
		var amount: int = int(entry["amount"])
		journal.add_child(UiTheme.row("%s · %s" % [
			SimCalendar.short_label(int(entry["month_index"])), String(entry["reason"]).capitalize()],
			Money.format(amount), UiTheme.SIZE_SMALL, UiTheme.GOOD if amount > 0 else UiTheme.TEXT))
		shown += 1
		if shown >= 8:
			break
	_content_column.add_child(journal.get_meta("card_root"))


func _build_month_preview() -> void:
	_root_column.add_child(UiTheme.label("Before you advance", UiTheme.SIZE_TITLE, UiTheme.TEXT))
	var recap: Dictionary = _pending_preview
	var card: VBoxContainer = UiTheme.card(String(recap.get("month_label", "")))
	card.add_child(UiTheme.row("Cash now", Money.format(int(recap["opening_cash_minor"]))))
	for line in recap["income_lines"] as Array:
		card.add_child(UiTheme.row("+ %s" % String((line as Dictionary)["label"]),
			Money.format(int((line as Dictionary)["amount_minor"])), UiTheme.SIZE_BODY, UiTheme.GOOD))
	for line in recap["borrowing_lines"] as Array:
		card.add_child(UiTheme.row("~ %s" % String((line as Dictionary)["label"]),
			Money.format(int((line as Dictionary)["amount_minor"])), UiTheme.SIZE_BODY, UiTheme.WARNING))
	for line in recap["expense_lines"] as Array:
		card.add_child(UiTheme.row("- %s" % String((line as Dictionary)["label"]),
			Money.format(int((line as Dictionary)["amount_minor"]))))
	for line in recap["deferred_lines"] as Array:
		card.add_child(UiTheme.row("! %s cannot be paid" % String((line as Dictionary)["label"]),
			Money.format(int((line as Dictionary)["amount_minor"])), UiTheme.SIZE_BODY, UiTheme.ALERT))
	card.add_child(UiTheme.separator())
	card.add_child(UiTheme.row("Cash after this month", Money.format(int(recap["closing_cash_minor"])),
		UiTheme.SIZE_TITLE))
	card.add_child(UiTheme.label(
		"Contractual amounts only. Nothing here is a promise about future prices.",
		UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_root_column.add_child(card.get_meta("card_root"))
	_root_column.add_child(UiTheme.spacer(0))

	var confirm := UiTheme.button("Advance the month", true)
	confirm.pressed.connect(_confirm_month)
	_root_column.add_child(confirm)
	var back := UiTheme.button("Not yet")
	back.pressed.connect(_close_overlay)
	_root_column.add_child(back)


func _build_month_recap() -> void:
	var recap: Dictionary = _last_recap
	_root_column.add_child(UiTheme.label(String(recap.get("month_label", "")), UiTheme.SIZE_SMALL, UiTheme.TEXT_MUTED))
	_root_column.add_child(UiTheme.label("Month complete", UiTheme.SIZE_TITLE, UiTheme.TEXT))

	var card: VBoxContainer = UiTheme.card("What changed")
	var change: int = int(recap["net_cash_change_minor"])
	card.add_child(UiTheme.row("Cash change", Money.format(change), UiTheme.SIZE_TITLE,
		UiTheme.GOOD if change >= 0 else UiTheme.ALERT))
	card.add_child(UiTheme.row("Cash now", Money.format(int(recap["closing_cash_minor"]))))
	card.add_child(UiTheme.row("Net worth", Money.format(int(recap["closing_net_worth_minor"]))))
	if int(recap["total_debt_minor"]) > 0:
		card.add_child(UiTheme.row("Debt", Money.format(int(recap["total_debt_minor"])),
			UiTheme.SIZE_BODY, UiTheme.WARNING))
	for line in recap["progress_lines"] as Array:
		card.add_child(UiTheme.row(String((line as Dictionary)["label"]),
			String((line as Dictionary)["detail"]), UiTheme.SIZE_SMALL))
	if bool(recap.get("unfunded", false)):
		card.add_child(UiTheme.label(
			"! A bill could not be paid. It is recorded as arrears and no late fee was charged.",
			UiTheme.SIZE_SMALL, UiTheme.ALERT))
	_root_column.add_child(card.get_meta("card_root"))

	var goal_result: Dictionary = engine.first_home_goal()
	if goal_result["ok"]:
		var goal: Dictionary = goal_result["value"]
		var progress: VBoxContainer = UiTheme.card("First home fund")
		progress.add_child(UiTheme.row("Still to find", Money.format(int(goal["shortfall_minor"])),
			UiTheme.SIZE_BODY, UiTheme.SAND))
		_root_column.add_child(progress.get_meta("card_root"))

	var back := UiTheme.button("Back to the month", true)
	back.pressed.connect(_close_overlay)
	_root_column.add_child(back)

# --- Actions ------------------------------------------------------------------

func _start_life(start_id: String) -> void:
	var created: Dictionary = engine.new_game(start_id, {"display_name": "You"}, -1)
	if not created["ok"]:
		_set_message(String(created.get("message", "could not start")), "alert")
		return
	_screen = "main"
	_tab = "life"
	_set_message("", "info")
	_rebuild()


func _continue_life() -> void:
	var loaded: Dictionary = engine.load_game(0)
	if not loaded["ok"]:
		_set_message(String(loaded.get("message", "could not load")), "alert")
		_rebuild()
		return
	var payload: Dictionary = loaded["value"]
	_screen = "main"
	if bool(payload.get("recovered_from_backup", false)):
		_set_message(String(payload.get("notice", "")), "warning")
	_rebuild()


func _select_tab(tab: String) -> void:
	_tab = tab
	_rebuild()


func _open_preview() -> void:
	var preview: Dictionary = MonthEngine.preview(engine.state)
	if not preview["ok"]:
		_set_message(String(preview.get("message", "preview failed")), "alert")
		_rebuild()
		return
	_pending_preview = preview["value"]
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
		_set_message(String(result.get("message", "the month could not be resolved")), "alert")
		_screen = "main"
		return
	_last_recap = result["value"]
	_screen = "recap"
	_set_message("", "info")


func _spend(choice: Dictionary) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_SPEND_DISCRETIONARY,
		engine.state.state_revision,
		{"amount_minor": Money.to_minor_string(int(choice["amount"])), "choice_id": String(choice["id"])}),
		"Spent %s on %s." % [Money.format(int(choice["amount"])), String(choice["label"]).to_lower()])


func _earmark(amount: int) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_EARMARK_SAVINGS,
		engine.state.state_revision,
		{"amount_minor": Money.to_minor_string(amount), "choice_id": "first_home_fund"}),
		"%s set aside for the first home." % Money.format(amount))


func _release(amount: int) -> void:
	_run(Command.create(engine.next_command_id("cmd"), Command.TYPE_RELEASE_SAVINGS,
		engine.state.state_revision, {"amount_minor": Money.to_minor_string(amount)}),
		"%s released back to spendable cash." % Money.format(amount))


func _run(command: Command, success_message: String) -> void:
	var result: Dictionary = engine.execute(command)
	if result["ok"]:
		_set_message(success_message, "good")
	else:
		_set_message(String(result.get("message", "that action was refused")), "alert")
	_rebuild()


func _close_overlay() -> void:
	_screen = "main"
	_rebuild()


func _set_message(text: String, severity: String) -> void:
	_message = text
	_message_severity = severity

# --- Helpers ------------------------------------------------------------------

func _focus_used() -> int:
	var used: int = 0
	var state: GameState = engine.state
	if state.is_employed():
		var job: Dictionary = content.job(String(state.employment.get("job_id", "")))
		used += int(job.get("focus_per_month", 0))
	if state.is_studying():
		used += int(state.study.get("focus_per_month", 0))
	return used


func _money(source: Dictionary, key: String) -> String:
	var parsed: Dictionary = Money.from_variant(source.get(key, "0"), key)
	return Money.format(int(parsed["value"])) if parsed["ok"] else "—"


## Presentation order: the plainest route first, so a new player reads the
## simplest budget before the funded-study plan.
func _ordered_start_ids() -> Array:
	var preferred: Array = ["fresh_work", "fresh_university", "fresh_work_study"]
	var ordered: Array = []
	for start_id in preferred:
		if content.has_start(start_id):
			ordered.append(start_id)
	for start_id in content.start_ids():
		if not ordered.has(start_id):
			ordered.append(start_id)
	return ordered


func _start_title(start_id: String) -> String:
	match start_id:
		"fresh_work":
			return "Work now"
		"fresh_university":
			return "University, funded"
		"fresh_work_study":
			return "Part-time work and study"
		_:
			return start_id.capitalize()
