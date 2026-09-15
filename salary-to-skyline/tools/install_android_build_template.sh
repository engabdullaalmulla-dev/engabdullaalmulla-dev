#!/usr/bin/env bash
# Installs the Gradle build template into res://android/build.
# Only needed for builds that include an Android plugin (for example the
# in-app-purchase plugin, which requires Gradle builds). The default export
# preset uses the prebuilt template and does not need this.
set -euo pipefail

VERSION="4.7.2.stable"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ZIP="${GODOT_TEMPLATES_DIR:-$HOME/.local/share/godot/export_templates/$VERSION}/android_source.zip"

[ -f "$SOURCE_ZIP" ] || { echo "android_source.zip not found at $SOURCE_ZIP" >&2; exit 1; }
mkdir -p "$PROJECT_DIR/android/build"
unzip -q -o "$SOURCE_ZIP" -d "$PROJECT_DIR/android/build"
touch "$PROJECT_DIR/android/build/.gdignore"
printf '%s' "$VERSION" > "$PROJECT_DIR/android/.build_version"
echo "Gradle build template installed. Set gradle_build/use_gradle_build=true in export_presets.cfg to use it."
