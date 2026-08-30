#!/bin/bash
FILE="functions/komunitas/c/[id].js"

# 1. Update Cover Height
sed -i '' 's/\.profile-cover{margin-top:68px; width:100%; height:260px;/\.profile-cover{margin-top:68px; width:100%; height:340px;/g' "$FILE"

# 2. Update Profile Head offset
sed -i '' 's/\.profile-head{display:flex; align-items:flex-end; gap:24px; margin-top:-64px;/\.profile-head{display:flex; align-items:flex-end; gap:28px; margin-top:-76px;/g' "$FILE"

# 3. Update Profile Logo (White background, contain, bigger)
sed -i '' 's/\.profile-logo{width:112px; height:112px; border-radius:50%; border:4px solid var(--aspal); background:var(--aspal-2) center\/contain no-repeat;/\.profile-logo{width:144px; height:144px; border-radius:50%; border:6px solid var(--aspal); background:#ffffff center\/70% no-repeat; box-shadow: 0 4px 24px rgba(0,0,0,0.4);/g' "$FILE"

# 4. Update Profile Name Font Size
sed -i '' 's/\.profile-name{font-size:clamp(22px,4vw,34px);/\.profile-name{font-size:clamp(28px,5vw,42px); font-weight: 500;/g' "$FILE"

# 5. Update About Text
sed -i '' 's/\.about-text{color:var(--krem-2); font-size:15px; max-width:720px; margin-top:16px; line-height:1.7; white-space:pre-line;}/\.about-text{color:rgba(239,233,216,0.85); font-size:16.5px; max-width:800px; margin-top:24px; line-height:1.8; white-space:pre-line; letter-spacing:0.01em;}/g' "$FILE"

# 6. Add IG Icon to the button
awk '
  /<a href="\$\{escapeHtml\(igHref\)\}" target="_blank" rel="noopener" class="btn btn-outline">Instagram<\/a>/ {
    print "        ${community.ig ? `<a href=\"${escapeHtml(igHref)}\" target=\"_blank\" rel=\"noopener\" class=\"btn btn-outline\" style=\"display:flex; align-items:center; gap:8px;\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"5\" ry=\"5\"></rect><path d=\"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\"></path><line x1=\"17.5\" y1=\"6.5\" x2=\"17.51\" y2=\"6.5\"></line></svg> Instagram</a>` : \"\"}"
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# Make profile meta a bit larger
sed -i '' 's/\.profile-meta{font-family:var(--mono); font-size:12px;/\.profile-meta{font-family:var(--mono); font-size:13px;/g' "$FILE"

