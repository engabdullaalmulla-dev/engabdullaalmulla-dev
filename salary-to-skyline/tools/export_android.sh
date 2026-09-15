#!/usr/bin/env bash
# Exports a signed Android debug APK with the pinned engine.
# Requires (see docs/decisions/0004-mobile-export-and-commerce-path.md):
#   * export templates 4.7.2.stable installed
#   * Android SDK: platform-tools, build-tools;35.0.1, platforms;android-35
#   * a debug keystore, and Godot editor settings pointing at both
set -euo pipefail

GODOT="${GODOT:-godot}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="${1:-$PROJECT_DIR/build/android/salary-to-skyline-m0-debug.apk}"

mkdir -p "$(dirname "$OUTPUT")"
"$GODOT" --headless --path "$PROJECT_DIR" --import >/dev/null
"$GODOT" --headless --path "$PROJECT_DIR" --export-debug "Android" "$OUTPUT"
echo "APK: $OUTPUT"
sha256sum "$OUTPUT"
