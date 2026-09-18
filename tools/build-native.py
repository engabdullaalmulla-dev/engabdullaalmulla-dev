#!/usr/bin/env python3
"""Bundle the authored game, scripts, fonts and art into one offline WebView document."""
import base64
import hashlib
import io
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
GAME = ROOT / "prototype/cafelife.html"
SRC = ROOT / "art/sprites"
OUT = ROOT / "native/src/webapp/html.js"
FONT = ROOT / "native/assets/fonts/fonts.css"
BRANDS = {"icon": ROOT / "native/assets/icon.png", "logo": ROOT / "art/brand/logo.png"}


def encode(path, square=192, wide=1100):
    """Keep transparent paintings crisp at phone scale and embed as WebP."""
    with Image.open(path) as original:
        im = original.convert("RGBA")
        target = wide if im.width != im.height else square
        if im.width > target:
            im = im.resize((target, max(1, round(im.height * target / im.width))), Image.Resampling.LANCZOS)
        data = io.BytesIO()
        im.save(data, "WEBP", quality=85 if im.width == im.height else 80, method=6)
    return "data:image/webp;base64," + base64.b64encode(data.getvalue()).decode("ascii")


def source_files():
    return ([GAME, FONT] + sorted(p for p in (ROOT / "prototype/game").glob("*") if p.suffix in (".js", ".css"))
            + sorted(p for p in SRC.glob("*.png") if "@" not in p.name)
            + [p for p in BRANDS.values() if p.exists()])


def build_id():
    digest = hashlib.sha256()
    for path in source_files():
        digest.update(str(path.relative_to(ROOT)).encode())
        digest.update(path.read_bytes())
    return "cafe-life-" + digest.hexdigest()[:16]


def bundle():
    html = GAME.read_text(encoding="utf-8")
    if not re.search(r"<!doctype\s+html", html, re.I):
        raise ValueError("The authored game must be a complete HTML document")
    embedded = []

    def inline_script(match):
        attrs, src = match.group(1), match.group(3)
        if re.match(r"(?:[a-z][a-z0-9+.-]*:|//)", src, re.I):
            raise ValueError("Remote script is forbidden: " + src)
        path = (GAME.parent / src).resolve()
        if not path.is_relative_to(GAME.parent.resolve()) or not path.is_file():
            raise ValueError("Missing or out-of-tree script: " + src)
        if re.search(r"\btype\s*=\s*['\"]module", attrs, re.I):
            raise ValueError("Use local classic scripts so the native bundle needs no module fetch")
        script = path.read_text(encoding="utf-8").replace("</script", "<\\/script")
        embedded.append(str(path.relative_to(ROOT)))
        return '<script data-source="' + src + '">\n' + script + '\n</script>'

    html = re.sub(r'<script\b([^>]*?)\bsrc\s*=\s*([\'"])([^\'"]+)\2[^>]*>\s*</script\s*>',
                  inline_script, html, flags=re.I)
    if re.search(r'<script\b[^>]*\bsrc\s*=', html, re.I):
        raise ValueError("A script source was not embedded")
    for required in ("game/content.js", "game/engine.js", "game/audio.js", "game/i18n.js", "game/persistence.js", "game/access.js", "game/ui.js"):
        if "prototype/" + required not in embedded:
            raise ValueError("Missing authored module: " + required)

    def inline_stylesheet(match):
        tag = match.group(0)
        href = re.search(r"\bhref\s*=\s*([\"'])(.*?)\1", tag, re.I)
        rel = re.search(r"\brel\s*=\s*([\"'])(.*?)\1", tag, re.I)
        if not href or not rel or rel.group(2).lower() != "stylesheet":
            return tag
        src = href.group(2)
        if src.startswith("https://fonts.googleapis.com"):
            return ""
        if re.match(r"(?:[a-z][a-z0-9+.-]*:|//)", src, re.I):
            raise ValueError("Remote stylesheet is forbidden: " + src)
        path = (GAME.parent / src).resolve()
        if not path.is_relative_to(GAME.parent.resolve()) or not path.is_file():
            raise ValueError("Missing or out-of-tree stylesheet: " + src)
        css = path.read_text(encoding="utf-8")
        urls = [m.group(2).strip() for m in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css, re.I)]
        if re.search(r"@import", css, re.I) or any(not url.startswith(("data:", "#")) for url in urls):
            raise ValueError("Stylesheet contains a non-embedded resource: " + src)
        return '<style data-source="' + src + '">\n' + css + '\n</style>'

    html = re.sub(r'<link\b[^>]*>', inline_stylesheet, html, flags=re.I)

    # Local faces replace any old prototype Google Fonts import. No build-time download.
    html = re.sub(r'<link\b[^>]*href=[\'"]https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', html, flags=re.I)
    art = {p.stem: encode(p) for p in sorted(SRC.glob("*.png")) if "@" not in p.name}
    brand = {key: encode(path, square=512, wide=1200) for key, path in BRANDS.items() if path.exists()}
    if not {"icon", "logo"}.issubset(brand):
        raise ValueError("Both native/assets/icon.png and art/brand/logo.png are required")
    # CSP is deliberately strict. The game can never send an analytics or font request.
    extras = ('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
              "img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; "
              "font-src data:; media-src data: blob:; connect-src 'none'; base-uri 'none'; "
              "form-action 'none'\">"
              '<style>html,body{background:#f8f3e9;overscroll-behavior:none}'
              + FONT.read_text(encoding="utf-8") + '</style>'
              '<script>window.CAFE_BUILD_ID=' + json.dumps(build_id()) + ';'
              'window.ART_DATA=' + json.dumps(art, separators=(",", ":")) + ';'
              'window.BRAND_DATA=' + json.dumps(brand, separators=(",", ":")) + ';</script>')
    html, count = re.subn(r'(<head\b[^>]*>)', lambda m: m.group(1) + extras, html, count=1, flags=re.I)
    if count != 1:
        raise ValueError("Missing document head")
    remote = re.findall(r'(?:src|href)\s*=\s*[\'"]((?:https?:)?//[^\'"]+)', html, re.I)
    if remote:
        raise ValueError("Runtime network URLs: " + repr(remote[:3]))
    markup = re.sub(r'<script\b[^>]*>.*?</script\s*>', '', html, flags=re.I | re.S)
    local_refs = re.findall(r'<(?:img|script|link|audio|source)\b[^>]*\b(?:src|href)\s*=\s*[\'"]([^\'"]+)', markup, re.I)
    if any(not ref.startswith(("data:", "blob:", "#")) for ref in local_refs):
        raise ValueError("A runtime asset was not embedded")
    return html, {"sprites": len(art), "scripts": embedded, "buildId": build_id()}


def main():
    html, info = bundle()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text('// Generated by tools/build-native.py. Do not edit.\n'
                   '// Offline game: %d painted sprites, local scripts, fonts and brand assets.\n'
                   'export const HTML = %s;\n' % (info["sprites"], json.dumps(html)), encoding="utf-8")
    print('%s: %d sprites, %d scripts, %.2f MB -> %s' % (
        info["buildId"], info["sprites"], len(info["scripts"]), OUT.stat().st_size / 1e6, OUT.relative_to(ROOT)))


if __name__ == "__main__":
    main()
