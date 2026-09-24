# Speedy / Econt office locators — Back closes overlay

**Date:** 2026-09-24  
**Branch:** `main` — wiring @ `e858e32`, docs/verify @ `b6b897a`  
**Local:** http://127.0.0.1:8780/index.html  
**Mirrors:** Box Now Back fix @ `df7d9f5`

## Problem

Browser **Back** while the Speedy or Econt office map (`#office-fullscreen-root` from `#office-open-locator`) was open left the user stuck on the map instead of returning to checkout. Box Now already used `pushState` + `popstate`.

## Fix (`index.html`, `poruchka.html`)

Same pattern as BOX NOW:

- On open: `history.pushState({ plasicoOfficeLocator: true })` + `__plasicoOfficeHistPushed`.
- On `popstate` (browser Back): `closeOfficeLocator({ fromPopstate: true })` — overlay tears down, checkout stays.
- On × / Esc / office select close: tear down, then `history.back()` with `__plasicoOfficeIgnorePop` so a quick re-open isn’t killed by the matching `popstate`.

Kept: select → summary + **Смени**, Speedy/Econt iframe sources, courier switch clears selection.

## Verify

```bash
node _verify_office_back_button.js
```

Expect: Speedy + Econt open push history; Back removes `#office-fullscreen-root` while `#checkout` remains; postMessage select fills summary and shows Смени.

Media:

- `.cursor/stores/self/media/office-speedy-map-open.png`
- `.cursor/stores/self/media/office-speedy-back-to-cart.png`
- `.cursor/stores/self/media/office-speedy-selected-smeni.png`
- `.cursor/stores/self/media/office-econt-map-open.png`
- `.cursor/stores/self/media/office-econt-back-to-cart.png`
- `.cursor/stores/self/media/office-econt-selected-smeni.png`
