#!/usr/bin/env bash
# Project test entry point (BUILD_PLAN_AND_ACCEPTANCE B4).
# Usage: GODOT=/path/to/Godot_v4.7.2-stable_linux.x86_64 tools/run_tests.sh [--filter=money]
set -euo pipefail

GODOT="${GODOT:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

"$GODOT" --headless --path "$PROJECT_DIR" --import >/dev/null
"$GODOT" --headless --path "$PROJECT_DIR" --script res://tests/test_runner.gd -- "$@"
