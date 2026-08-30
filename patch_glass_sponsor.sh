#!/bin/bash
FILE="functions/komunitas/c/[id].js"

awk '
  /const sponsorBlock = sponsorLogos\.length/ {
    print "      const mainSponsors = sponsorLogos.filter(url => !url.toLowerCase().includes(\"northy\"));"
    print "      const apparelSponsors = sponsorLogos.filter(url => url.toLowerCase().includes(\"northy\"));"
    print "      const sponsorBlock = sponsorLogos.length"
    print "        ? `<div style=\"margin-top:24px; padding:24px; background:rgba(0,0,0,0.25); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border-radius:16px; border:1px solid rgba(255,255,255,0.06); box-shadow:0 8px 32px rgba(0,0,0,0.3);\">` +"
    print "          (mainSponsors.length ? "
    print "            `<div style=\"font-family:var(--mono); font-size:13px; letter-spacing:0.15em; color:#f1e8d6; text-transform:uppercase; font-weight:600; margin-bottom:16px;\">` +"
    print "            `SUPPORTED BY` +"
    print "            `<div style=\"width:60px; height:1px; background:rgba(255,255,255,0.2); margin-top:8px;\"></div>` +"
    print "            `</div>` +"
    print "            `<div style=\"display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:${apparelSponsors.length ? 24 : 0}px;\">` +"
    print "              ${mainSponsors.map((url) => {"
    print "                const isUnlock = url.toLowerCase().includes(\"unlock\");"
    print "                const imgStyle = isUnlock ? \"height:44px; width:auto; object-fit:contain; mix-blend-mode:multiply; transform:scale(1.2);\" : \"height:44px; width:auto; object-fit:contain; mix-blend-mode:multiply;\";"
    print "                return `<div style=\"background:#ffffff; border-radius:12px; padding:10px 14px; height:68px; min-width:80px; display:flex; align-items:center; justify-content:center; overflow:hidden;\"><img src=\"${escapeHtml(url)}\" style=\"${imgStyle}\"></div>`;"
    print "              }).join(\"\")}"
    print "            `</div>` : \"\") +"
    print "          (apparelSponsors.length ? "
    print "            `<div style=\"display:flex; align-items:center; gap:12px; flex-wrap:wrap;\">` +"
    print "              `<span style=\"font-family:var(--mono); font-size:11.5px; letter-spacing:0.1em; color:#4ade80; text-transform:uppercase; font-weight:600;\">Apparel Partner:</span>` +"
    print "              ${apparelSponsors.map(url => `<img src=\"${escapeHtml(url)}\" style=\"height:24px; width:auto; object-fit:contain; filter:brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.5));\">`).join(\"\")}"
    print "            `</div>` : \"\") +"
    print "          `</div>`"
    print "        : \"\";"
    
    # skip the next 14 lines of the old block
    for(i=0; i<14; i++) getline
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

