# BOX NOW — real lockers + Back closes overlay

**Date:** 2026-09-24  
**Branch:** `main` @ `df7d9f5`  
**Partner ID:** `18248`  
**Local:** http://127.0.0.1:8780/index.html  

## Problem

1. Fullscreen map (`boxnow-fullscreen-map.html`) showed only **2–3 DEV test lockers** (“Test Locker 1”, “BOX NOW Офис, София”, cluster “2” over Sofia) instead of the real Bulgaria network.
2. Browser **Back** left the user stuck on the fullscreen map instead of returning to checkout.

## Root cause

CDN classic `bundle.js` (IIFE / `nomodule` fallback) is baked with:

```js
{ env: "DEV", url: "https://globallockersdev.z28.web.core.windows.net" }
```

DEV Bulgaria `lockers/all.json` has ~3 test points. Official ES-module `config.js` on `map.boxnow.bg` uses **PROD** (~900+ BG lockers). The local shell used `bundle.js` to avoid cross-origin module CORS from `127.0.0.1`, so it inherited DEV.

## Fix

### Real lockers (`boxnow-fullscreen-map.html`)

- Keep fullscreen shell: `main.css` + `window.mapType = "popup"` + CDN `bundle.js`.
- Before `bundle.js`, rewrite `fetch` + `XMLHttpRequest.open` so any `globallockersdev` / `/DEV/` locker or partner URL becomes `globallockersprod` / `/PROD/`.
- Azure blob allows `Access-Control-Allow-Origin: *`, so PROD JSON loads from the local shell origin.

### Back → cart (`index.html`, `poruchka.html`)

- On open: `history.pushState({ plasicoBoxnowLocator: true })`.
- On `popstate` (browser Back): `closeBoxnowLocator({ fromPopstate: true })` — overlay tears down, checkout stays.
- On × / Esc / Izbor close: tear down, then `history.back()` with an ignore flag so a quick re-open isn’t killed by the matching `popstate`.

Kept: partnerId **18248**, Izbor `postMessage` → summary / Смени, edge-to-edge UX.

## Verify

```bash
node _verify_boxnow_real_lockers.js
```

Expect: many locker list rows (≫10), PROD dataset, Izbor → summary, Back closes `#boxnow-fullscreen-root` while checkout remains.

Media:

- `.cursor/stores/self/media/boxnow-real-lockers.png`
- `.cursor/stores/self/media/boxnow-back-to-cart.png`
