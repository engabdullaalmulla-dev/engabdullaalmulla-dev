#!/bin/sh
# cafe.html and frenzy.html are the sources of truth. They are authored in
# Claude Artifact format (no doctype/html/head/body wrapper) so the same file
# can be published as a shareable link. This wraps one into a standalone page.
#   ./build.sh            -> builds both to cafe.local.html / frenzy.local.html
#   ./build.sh frenzy     -> builds just that one
set -e
wrap() {
  { printf '%s\n' '<!doctype html><html lang="en"><head>' \
      '<meta charset="utf-8">' \
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' \
      '<style>:root{padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
    cat "$1.html"
    printf '%s\n' '</body></html>'
  } > "$1.local.html"
  echo "built $1.local.html"
}
if [ -n "$1" ]; then wrap "$1"; else wrap cafe; wrap frenzy; fi
