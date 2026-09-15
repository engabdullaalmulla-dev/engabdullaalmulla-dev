#!/bin/sh
# cafe.html is the single source of truth. It is authored in Claude Artifact
# format (no doctype/html/head/body wrapper) so the same file can be published
# as a shareable link. This wraps it into a standalone page for local testing.
set -e
{
  printf '%s\n' '<!doctype html><html lang="en"><head>'
  printf '%s\n' '<meta charset="utf-8">'
  printf '%s\n' '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  printf '%s\n' '<style>:root{padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
  cat cafe.html
  printf '%s\n' '</body></html>'
} > index.html
echo "built index.html"
