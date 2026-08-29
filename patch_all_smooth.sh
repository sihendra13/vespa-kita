#!/bin/bash
FILES=(
  "index.html"
  "marketplace/index.html"
  "vw-yogyakarta/index.html"
  "60s-yogyakarta/index.html"
  "marketplace/semua/index.html"
  "functions/marketplace/l/[id].js"
)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    # Change transition to smooth ease
    sed -i '' 's/transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);/transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);/g' "$f"
    
    # Change bottom: 12px to bottom: 16px
    sed -i '' 's/bottom: 12px;/bottom: 16px;/g' "$f"

    # Replace `.bnav-item.active` color to #ffffff but keep SVG color
    awk '
      /\.bnav-item\.active \{/ {
        in_active = 1
        print
        next
      }
      in_active && /color: var\(--merah/ {
        sub(/color: var\(--merah[^;]*\);/, "color: #ffffff;")
        print
        in_active = 0
        next
      }
      in_active && /}/ {
        in_active = 0
      }
      { print }
    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  fi
done
