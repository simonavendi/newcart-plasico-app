# BOX NOW — fullscreen again + keep Избор select

**Date:** 2026-09-24  
**Branch:** `main`  
**Partner ID:** `18248`  
**Local:** http://127.0.0.1:8780/index.html  

## Problem

Simona’s earlier fullscreen UX regressed to a **centered rounded modal**. Cause: the mega-gamma select fix loaded official `popup.html` (`mapType=popup` → Izbor `postMessage` works) which also loads `popup.css` (68vw×60vh card + dim shadow). Official `iframe.html` is edge-to-edge but `mapType=iframe` and **does not** `postMessage` on Избор.

## Fix

Local shell `boxnow-fullscreen-map.html`:

- `<base href="https://map.boxnow.bg/">` — CDN assets
- `css/main.css` only (no `popup.css`) + overrides → **100vw×100vh**, `border-radius:0`
- `window.mapType = "popup"` so Избор still posts locker payload
- Classic `bundle.js` (avoids cross-origin ES module CORS)

Checkout (`index.html`, `poruchka.html`):

- iframe `src` → `boxnow-fullscreen-map.html?partnerId=18248&…`
- Host `#boxnow-fullscreen-root` white full-bleed overlay
- `isBoxnowAllowedOrigin` accepts **same origin** (shell posts from `127.0.0.1` / site origin)
- Fallback still `https://map.boxnow.bg/popup.html`

## Verify

```bash
node _verify_boxnow_fullscreen_keep_select.js
node _verify_boxnow_smeni.js
```

Results: full-bleed open → Избор → overlay closes → `#selectedOfficeAddress` + **Смени**; **Смени** reopens fullscreen shell.

Media:

- `.cursor/stores/self/media/boxnow-fullscreen.png`
- `.cursor/stores/self/media/boxnow-fullscreen-keep-desktop.png`
- `.cursor/stores/self/media/boxnow-fullscreen-keep-summary-desktop.png`
