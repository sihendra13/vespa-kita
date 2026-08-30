#!/bin/bash
FILE="functions/komunitas/c/[id].js"

awk '
  /const sponsorBlock = sponsorLogos\.length/ {
    print "      const sponsorBlock = sponsorLogos.length"
    print "        ? `<div style=\"margin-top:16px; padding-top:16px; border-top:1px solid rgba(241,232,214,0.08);\">` +"
    print "          `<div style=\"font-family:var(--mono); font-size:11px; letter-spacing:0.05em; color:var(--chrome); text-transform:uppercase; margin-bottom:12px;\">Disponsori oleh</div>` +"
    print "          `<div style=\"display:flex; align-items:center; gap:12px; flex-wrap:wrap;\">` +"
    print "            ${sponsorLogos.map((url) => {"
    print "              const isNorthy = url.toLowerCase().includes(\"northy\");"
    print "              const isUnlock = url.toLowerCase().includes(\"unlock\");"
    print "              let extraStyle = \"\";"
    print "              if(isNorthy) extraStyle = \"filter: brightness(0); height: 18px;\";"
    print "              if(isUnlock) extraStyle = \"height: 44px; transform: scale(1.2);\";"
    print "              return `<div style=\"background:#ffffff; border-radius:8px; padding:8px 16px; height:64px; min-width:100px; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.2);\"><img src=\"${escapeHtml(url)}\" alt=\"Sponsor\" style=\"height:44px; width:auto; object-fit:contain; mix-blend-mode:multiply; ${extraStyle}\"></div>`;"
    print "            }).join(\"\")}"
    print "          `</div></div>`"
    print "        : \"\";"
    
    # skip the next 5 lines of the old block
    getline
    getline
    getline
    getline
    getline
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

