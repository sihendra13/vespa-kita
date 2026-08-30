#!/bin/bash
# Patch for .kom-logo and .proof-logos in komunitas/index.html

# 1. Update .proof-logos CSS
awk '
  /\.proof-logos\{/ {
    print "  .proof-logos{display:flex; align-items:center; justify-content:flex-start; gap:16px; flex-wrap:nowrap; padding:32px 0; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none;}"
    print "  .proof-logos::-webkit-scrollbar{display:none;}"
    next
  }
  /\.proof-logos img\{/ {
    print "  .proof-logos img{height:64px; width:120px; background:#ffffff; border-radius:12px; padding:16px; object-fit:contain; flex-shrink:0;}"
    next
  }
  { print }
' komunitas/index.html > komunitas/index.html.tmp && mv komunitas/index.html.tmp komunitas/index.html

# 2. Update the inline style of proof-logos in HTML (we previously added some inline styles)
# In my previous step, I added: style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-top: 16px;"
# The user wants NO dark background, just white cards. So we need to remove the inline style from <div class="proof-logos reveal"...>
sed -i '' 's/<div class="proof-logos reveal" style="[^"]*">/<div class="proof-logos reveal" style="margin-top: 16px;">/g' komunitas/index.html

# Also remove invert filter from Northy logo
sed -i '' 's/style="filter:brightness(0) invert(1);"//g' komunitas/index.html

# 3. Update .kom-logo CSS to use contain and white background
sed -i '' 's/background:var(--aspal) center\/cover no-repeat; z-index:2;/background:#ffffff center\/contain no-repeat; z-index:2;/g' komunitas/index.html

# Wait, the inline style in the JS template is: style="background-image:url(...)"
# It will merge with background:#ffffff center/contain no-repeat. 
# BUT `background-image` doesn't overwrite `background-color`, `background-position`, `background-size`. 
# Wait, `background` shorthand in CSS sets ALL background properties. 
# So `background-image` inline will just override the image part! This is perfect.

