extends Control

## Placeholder city vignette.
##
## This is procedural code-drawn art standing in for the original isometric
## pixel-art world. It is deliberately simple and is NOT the shipping art
## direction: commissioned/authored tiles arrive with the M2 vertical slice.
## Nothing here reads or changes simulation state.

const SEED: int = 20260915

var horizon_ratio: float = 0.62


func _ready() -> void:
	custom_minimum_size = Vector2(0, 150)


func _draw() -> void:
	var width: float = size.x
	var height: float = size.y
	var horizon: float = height * horizon_ratio

	# Sky and water bands.
	draw_rect(Rect2(0, 0, width, horizon), Color(0.129, 0.157, 0.235))
	draw_rect(Rect2(0, horizon, width, height - horizon), Color(0.075, 0.180, 0.208))
	draw_circle(Vector2(width * 0.78, horizon * 0.42), height * 0.09, Color(0.906, 0.663, 0.376, 0.55))

	# Skyline silhouette from a fixed seed so the vignette never flickers.
	var rng := RandomNumberGenerator.new()
	rng.seed = SEED
	var x: float = -8.0
	while x < width:
		var tower_width: float = rng.randf_range(18.0, 40.0)
		var tower_height: float = rng.randf_range(height * 0.18, height * 0.52)
		var tint: float = rng.randf_range(0.16, 0.26)
		var body := Rect2(x, horizon - tower_height, tower_width, tower_height)
		draw_rect(body, Color(tint, tint + 0.03, tint + 0.07))
		# Lit windows: decoration only, not an occupancy signal.
		var window_y: float = body.position.y + 8.0
		while window_y < horizon - 8.0:
			var window_x: float = body.position.x + 5.0
			while window_x < body.position.x + tower_width - 7.0:
				if rng.randf() > 0.55:
					draw_rect(Rect2(window_x, window_y, 3.0, 5.0), Color(0.847, 0.741, 0.573, 0.7))
				window_x += 7.0
			window_y += 11.0
		x += tower_width + rng.randf_range(4.0, 12.0)

	# Water highlight.
	for i in 14:
		var line_y: float = horizon + 6.0 + i * 5.0
		if line_y > height:
			break
		draw_line(Vector2(rng.randf_range(0.0, width * 0.5), line_y),
			Vector2(rng.randf_range(width * 0.5, width), line_y),
			Color(0.180, 0.741, 0.639, 0.10), 1.0)
