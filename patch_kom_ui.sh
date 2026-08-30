#!/bin/bash
FILE="komunitas/index.html"

# 1. Update Hero Copy
sed -i '' 's/<span class="accent">KAMI BANTU CARIKAN SPONSOR<\/span>/<span class="accent">DAPATKAN DUKUNGAN SPONSOR<\/span>/g' "$FILE"

# Re-write the lede paragraph safely
awk '
  /<p class="lede">VespaKita bantu komunitas kamu mendapatkan sponsor/ {
    print "    <p class=\"lede\">VespaKita siap membantu komunitas kamu mendapatkan dukungan sponsor untuk kegiatan touring, gathering, atau jambore melalui jaringan brand yang telah kami bangun. Terbukti: <i>Road to Jakarta<\/i> (Vespa 60'\''s Yogyakarta) sukses bersinergi dengan 4 brand nasional.<\/p>"
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# Update Hero secondary button
sed -i '' 's/>Lihat Komunitas yang Sudah Dibantu</>Lihat Jejaring Komunitas</g' "$FILE"

# 2. Update Bottom CTA Copy
sed -i '' 's/<h3>Ada Event Komunitas yang Butuh Sponsor?<\/h3>/<h3>Wujudkan Event Komunitasmu!<\/h3>/g' "$FILE"
sed -i '' 's/<p>Ceritakan rencana kegiatan komunitas kamu — touring, gathering, atau jambore. Tim VespaKita akan bantu carikan sponsor lewat jaringan brand yang sudah kami bangun.<\/p>/<p>Ceritakan rencana kegiatan komunitasmu seperti touring, gathering, atau jambore. Tim VespaKita siap menghubungkan misimu dengan jaringan brand dan sponsor yang tepat.<\/p>/g' "$FILE"

# 3. Fix Sponsor Logos Styling
# Remove the old .proof-logos img rule
awk '
  /\.proof-logos img\{/ {
    print "  .sponsor-card { background: #ffffff; border-radius: 8px; padding: 8px 24px; height: 80px; min-width: 140px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); flex-shrink: 0; }"
    print "  .sponsor-card img { width: auto; object-fit: contain; }"
    print "  .s-logo-hs { height: 60px; }"
    print "  .s-logo-kenanga { height: 60px; }"
    print "  .s-logo-unlock { height: 64px; transform: scale(1.4); }"
    print "  .s-logo-northy { height: 18px; }"
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# Wrap logos in HTML
awk '
  /<div class="proof-logos reveal" style="margin-top: 16px;">/ {
    in_logos = 1
    print
    next
  }
  in_logos && /<\/div>/ {
    in_logos = 0
    print
    next
  }
  in_logos && /sponsor-hs.jpg/ {
    print "      <div class=\"sponsor-card\"><img src=\"../60s-yogyakarta/sponsor-hs.jpg\" alt=\"Sponsor HS\" class=\"s-logo-hs\" loading=\"lazy\"></div>"
    next
  }
  in_logos && /sponsor-kenanga.jpg/ {
    print "      <div class=\"sponsor-card\"><img src=\"../60s-yogyakarta/sponsor-kenanga.jpg\" alt=\"Sponsor Kenanga Garage\" class=\"s-logo-kenanga\" loading=\"lazy\"></div>"
    next
  }
  in_logos && /sponsor-unlock.png/ {
    print "      <div class=\"sponsor-card\"><img src=\"../60s-yogyakarta/sponsor-unlock.png\" alt=\"Sponsor Unlock Indonesia\" class=\"s-logo-unlock\" loading=\"lazy\"></div>"
    next
  }
  in_logos && /sponsor-northy.png/ {
    print "      <div class=\"sponsor-card\"><img src=\"../60s-yogyakarta/sponsor-northy.png\" alt=\"Sponsor Northy\" class=\"s-logo-northy\" style=\"filter: brightness(0);\" loading=\"lazy\"></div>"
    next
  }
  { print }
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

