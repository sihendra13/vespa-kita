#!/bin/bash
FILE="vw-yogyakarta/index.html"

# Patch CSS
awk '
  /\/\* BOTTOM NAVIGATION \*\// {
    print "  /* BOTTOM NAVIGATION */"
    print "  .bottom-nav {"
    print "    display: none;"
    print "    position: fixed;"
    print "    top: auto; "
    print "    bottom: 0; "
    print "    left: 0; "
    print "    right: 0;"
    print "    background: rgba(23, 25, 27, 0.85);"
    print "    backdrop-filter: blur(20px);"
    print "    -webkit-backdrop-filter: blur(20px);"
    print "    border-top: 1px solid rgba(255,255,255,0.1);"
    print "    border: 1px solid transparent;"
    print "    border-radius: 0;"
    print "    z-index: 1000;"
    print "    padding: 4px 8px;"
    print "    padding-bottom: calc(4px + env(safe-area-inset-bottom, 0px));"
    print "    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);"
    print "  }"
    print "  .bottom-nav.bnav-shrink {"
    print "    bottom: 24px;"
    print "    left: 16px;"
    print "    right: 16px;"
    print "    border-radius: 30px;"
    print "    border: 1px solid rgba(255,255,255,0.15);"
    print "    box-shadow: 0 10px 40px rgba(0,0,0,0.6);"
    print "    padding-bottom: 4px;"
    print "  }"
    print "  .bnav-item {"
    print "    flex: 1;"
    print "    display: flex;"
    print "    flex-direction: column;"
    print "    align-items: center;"
    print "    justify-content: center;"
    print "    padding: 8px 4px;"
    print "    margin: 0 4px;"
    print "    color: #ffffff;"
    print "    text-decoration: none;"
    print "    font-size: 9px;"
    print "    font-weight: 600;"
    print "    letter-spacing: 0.05em;"
    print "    font-family: var(--mono);"
    print "    text-transform: uppercase;"
    print "    border-radius: 20px;"
    print "    transition: all 0.3s;"
    print "  }"
    print "  .bnav-item svg {"
    print "    margin-bottom: 4px;"
    print "    width: 20px; height: 20px;"
    print "    opacity: 0.7;"
    print "    transition: all 0.3s;"
    print "  }"
    print "  .bnav-item:hover {"
    print "    color: #ffffff;"
    print "  }"
    print "  .bnav-item.active {"
    print "    color: var(--merah);"
    print "    background: rgba(255, 255, 255, 0.12);"
    print "  }"
    print "  .bnav-item:hover svg {"
    print "    opacity: 1;"
    print "    color: var(--merah);"
    print "  }"
    print "  .bnav-item.active svg {"
    print "    opacity: 1;"
    print "    color: var(--merah);"
    print "    transform: translateY(-2px) scale(1.1);"
    print "  }"
    skip = 1
    next
  }
  skip && /@media \(max-width: 768px\)/ {
    skip = 0
  }
  !skip { print }
' $FILE > $FILE.tmp && mv $FILE.tmp $FILE

# Patch JS
awk '
  /const navEl = document.querySelector\('"'"'\.chrome'"'"'\);/ {
    print "  const navEl = document.querySelector('"'"'.chrome'"'"');"
    print "  const bNav = document.querySelector('"'"'.bottom-nav'"'"');"
    print "  let lastScrollY = window.scrollY;"
    next
  }
  /window.addEventListener\('"'"'scroll'"'"', checkScroll\);/ {
    print "  window.addEventListener('"'"'scroll'"'"', () => {"
    print "    checkScroll();"
    print "    if (bNav) {"
    print "      if (window.scrollY > lastScrollY && window.scrollY > 100) {"
    print "        bNav.classList.add('"'"'bnav-shrink'"'"');"
    print "      } else {"
    print "        bNav.classList.remove('"'"'bnav-shrink'"'"');"
    print "      }"
    print "    }"
    print "    lastScrollY = window.scrollY;"
    print "  });"
    next
  }
  { print }
' $FILE > $FILE.tmp && mv $FILE.tmp $FILE

