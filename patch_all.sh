#!/bin/bash
FILES=(
  "marketplace/index.html"
  "vw-yogyakarta/index.html"
  "60s-yogyakarta/index.html"
  "marketplace/semua/index.html"
  "functions/marketplace/l/[id].js"
)
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    sed -i '' 's/bottom: 24px;/bottom: 12px;/g' "$f"
    sed -i '' 's/left: 16px;/left: 12px;/g' "$f"
    sed -i '' 's/right: 16px;/right: 12px;/g' "$f"
  fi
done
