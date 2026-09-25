# BOX NOW — fullscreen close unblocked

**Date:** 2026-09-25  
**Branch:** `main` @ `4c62022`  
**Partner ID:** `18248`  
**Local:** http://127.0.0.1:8780/index.html  
**Live:** https://newcart-plasico-app.vercel.app/

## Problem

Simona could not click the Box Now fullscreen map close (black × top-right of `iframe#boxnow_map_widget*` inside `#boxnow-fullscreen-root`). Screenshots also showed a white top bar with timestamp + external-link icon.

## Cause

1. **App-side:** Host `.boxnow-fullscreen__close` was `position:absolute` floating over a full-bleed iframe. On mobile the Box Now search input spans the top edge under that ×, so the hit target competed with iframe content; sticky `#head` also kept `pointer-events:auto`.
2. **White timestamp bar:** Cursor / Simple Browser preview chrome (timestamp + open-external icon). **Not present in our HTML** — cannot be fixed in-repo; host controls must sit in a dedicated chrome strip so preview overlays do not land on the only close affordance inside the map.

## Fix (`index.html`, `poruchka.html`, `boxnowno.html`)

- Host **chrome bar** (`.boxnow-fullscreen__chrome`) above the iframe: **← НАЗАД** + **×**.
- Iframe is flex sibling **below** the bar (`iframeTop === chromeH`), not under the buttons.
- Close / Back: `z-index:6`, `pointer-events:auto`.
- While open: sticky `header.cl.rel` / `#head` / `#head-cart-cluster` / `#cookiescript_badge` → `pointer-events:none; z-index:0`.
- Esc + browser Back behavior unchanged.

## Verify

```bash
node _verify_boxnow_close_unblocked.js
```

Expect: chrome + Back + × present; `elementFromPoint` hits the buttons (not iframe); × and Back both tear down `#boxnow-fullscreen-root`; `partnerId=18248` shell src.

Media: `.cursor/stores/self/media/boxnow-close-unblocked.png`
