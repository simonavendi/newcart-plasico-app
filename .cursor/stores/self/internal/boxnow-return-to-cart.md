# BOX NOW — return to cart after locker select

**Date:** 2026-09-24  
**Landed on:** `main` (`f33e830`, currently under tip `2062e1f`) — also PR #16 / `cursor/boxnow-return-to-cart-a244`  
**Partner ID:** `18248`  
**Reference:** [megamag.bg/checkout](https://megamag.bg/checkout) (mega-gamma.com/checkout is 404)

## Goal

After the user picks a BOX NOW locker in the edge-to-edge fullscreen locator (`iframe.html` in `#boxnow-fullscreen-root`), immediately close the overlay and return them to the checkout/cart shipping panel — same autoclose UX as megamag.

## Megamag wiring (reference)

```js
window._bn_map_widget_config = {
  type: 'popup',
  autoclose: true,
  autoselect: false,
  afterSelect(data) { /* fill locker + Livewire */ }
}
```

CDN v5 client removes its iframe when `autoclose: true` and a `postMessage` arrives from `*.boxnow.*`.

## Plasico change

Files: `index.html`, `poruchka.html` (identical checkout snapshots)

Kept from PR #15:

- Edge-to-edge host overlay `#boxnow-fullscreen-root`
- Map URL: `https://map.boxnow.bg/iframe.html?...&autoclose=yes&autoselect=no`
- Config: `autoclose: true`

Added / hardened:

1. **`onBoxnowSelect`** (wired as `_bn_map_widget_config.afterSelect`):
   - fills `#boxnow-locker-id` / address / postal + selected summary (unchanged fields)
   - **`closeBoxnowLocator()`** destroys the host overlay + scroll-lock classes
   - scrolls/focuses the selected-locker summary / launch button so return-to-cart is obvious
2. **`postMessage` handler** still calls `afterSelect`, then **always** `closeBoxnowLocator()` in `finally` so the host closes even if the iframe ignores `autoclose=yes`.
3. Broader origin allowlist (map / widget-vN hosts) + JSON-string payload normalize.

## Local verify

```bash
python -m http.server 8780 --bind 127.0.0.1
node _verify_boxnow_select.js
```

Result (2026-09-24):

- `afterSelect` fills fields and removes `#boxnow-fullscreen-root` **without Escape**
- Simulated `postMessage` from `https://map.boxnow.bg` same outcome
- iframe `src` includes `iframe.html`, `partnerId=18248`, `autoclose=yes`

Manual: open `http://127.0.0.1:8780/index.html` → BOX NOW → pick locker → overlay gone, summary visible under shipping.

## Docs

https://map-docs.boxnow.bg/configuration — `autoclose=yes` recommended for popup/fullscreen flows.
