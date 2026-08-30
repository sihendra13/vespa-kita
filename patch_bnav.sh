#!/bin/bash
FILES=(
  "index.html"
  "marketplace/index.html"
  "vw-yogyakarta/index.html"
  "60s-yogyakarta/index.html"
  "marketplace/semua/index.html"
  "functions/marketplace/l/[id].js"
  "komunitas/c/vw-club-yogyakarta/index.html"
  "komunitas/c/vespa-60s-yogyakarta/index.html"
  "komunitas/index.html"
  "komunitas/daftar/index.html"
)

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    awk '
      /\.bnav-item \{/ {
        in_bnav = 1
        print
        next
      }
      in_bnav && /padding: 8px 4px;/ {
        print "    padding: 8px 2px;"
        next
      }
      in_bnav && /margin: 0 4px;/ {
        print "    margin: 0 2px;"
        next
      }
      in_bnav && /font-size: 9px;/ {
        print "    font-size: 8.5px;"
        print "    white-space: nowrap;"
        next
      }
      in_bnav && /letter-spacing: 0.05em;/ {
        print "    letter-spacing: 0.02em;"
        next
      }
      in_bnav && /}/ {
        in_bnav = 0
      }
      { print }
    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  fi
done
