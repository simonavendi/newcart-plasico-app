# BOX NOW — mega-gamma / megamag select → locker summary

**Date:** 2026-09-24  
**Branch:** `main`  
**Partner ID:** `18248`  
**Local:** http://127.0.0.1:8780/index.html  

## Reference

- `https://mega-gamma.com/checkout` → **404**
- Used instead: [megamag.bg/checkout](https://megamag.bg/checkout) (already in this project)

Megamag CDN config:

```js
type: 'popup',
autoselect: false,
autoclose: true,
afterSelect(data) { Livewire.selectBoxNowLocker(id) }
```

## Bug

We loaded `iframe.html` (`mapType="iframe"`). In Box Now `setupSidebar.js`, **Избор** only calls `parent.postMessage(...)` when `mapType === "popup"`. On iframe mode the button hides the widget and posts **nothing** — checkout stayed on the launch button.

## Fix

Files: `index.html`, `poruchka.html`

1. Map URL → `https://map.boxnow.bg/popup.html?...&autoselect=no&autoclose=yes` (fallback `widget-v5.../popup.html`)
2. `_bn_map_widget_config.type: "popup"` (match megamag)
3. Host `#boxnow-fullscreen-root` dim overlay + close; still autoclose on locker `postMessage`
4. Also handle `{ boxnowClose: "yes" }` (shadow dismiss)
5. After select: fill `#selectedOfficeAddress` name/address, hide launch (`.is-selected`), show **Смени**

## Verify

```bash
node _verify_boxnow_live_select.js   # real Izbor in popup iframe
node _verify_boxnow_locker_name.js
node _verify_boxnow_select.js
node _verify_boxnow_fullscreen.js
```

Live result: Izbor → overlay closes → summary with name + address + Смени; launch hidden.

Media: `media/boxnow-mega-gamma-summary.png`
