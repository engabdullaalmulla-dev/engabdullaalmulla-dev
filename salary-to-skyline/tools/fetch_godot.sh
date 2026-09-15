#!/usr/bin/env bash
# Fetches and verifies the pinned engine build. See docs/decisions/0001-engine-and-toolchain-pin.md.
set -euo pipefail

GODOT_VERSION="4.7.2"
GODOT_FLAVOR="stable"
ZIP_SHA256="cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4"
BIN_SHA256="8d106cbe6144c2dc7e881d61d2429c1a8a76e6b22ef48bd5e48dcf934953f71e"
TARGET_DIR="${1:-$HOME/godot-${GODOT_VERSION}}"

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"
url="https://downloads.godotengine.org/?version=${GODOT_VERSION}&flavor=${GODOT_FLAVOR}&slug=linux.x86_64.zip"
echo "Downloading Godot ${GODOT_VERSION}-${GODOT_FLAVOR} (linux.x86_64)"
curl -sSL -o godot.zip "$url"
echo "${ZIP_SHA256}  godot.zip" | sha256sum -c -
unzip -o -q godot.zip
chmod +x "Godot_v${GODOT_VERSION}-${GODOT_FLAVOR}_linux.x86_64"
echo "${BIN_SHA256}  Godot_v${GODOT_VERSION}-${GODOT_FLAVOR}_linux.x86_64" | sha256sum -c -
"./Godot_v${GODOT_VERSION}-${GODOT_FLAVOR}_linux.x86_64" --version
echo "Engine ready at $TARGET_DIR"
