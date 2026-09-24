# Mega-Gamma / Megamag Box Now whole-window locator

**Date:** 2026-09-24  
**Task:** Replicate full-window Box Now locker locator into Plasico cart  
**Partner ID (kept):** `18248`

## Research: mega-gamma.com/checkout

- `https://mega-gamma.com/checkout` returns **404**. The live apex domain is a Portuguese industrial site (Mega & Gamma pipes), not a BG checkout.
- Wayback CDX has **no** historical captures of `/checkout` on that host.
- Closest live BG shop that matches the described UX (button ΓåÆ whole-window locator, not inline map) is **[megamag.bg/checkout](https://megamag.bg/checkout)** ΓÇö used as the working reference for wiring.

## What megamag does (reference wiring)

From `https://megamag.bg/build/assets/scripts-*.js`:

```js
window._bn_map_widget_config = {
  partnerId: <from data-boxnow-partner-id>,
  parentElement: 'body',
  type: 'popup',
  autoselect: false,
  autoclose: true,
  buttonSelector: '.boxnow-map-widget-button',
  afterSelect(data) { /* Livewire selectBoxNowLocker */ }
}
```

Then loads `https://widget-cdn.boxnow.bg/map-widget/client/v5.js`.

UI:

- Launch control: `.boxnow-map-widget-button` (ΓÇ£╨ÿ╨╖╨▒╨╡╤Ç╨╡╤é╨╡ BoxNow ╨░╨▓╤é╨╛╨╝╨░╤éΓÇªΓÇ¥)
- Empty `#boxnowmap` host (not a 450px inline map)
- On click, v5 client injects `popup.html` iframe onto **`body`** with:

  `position:fixed; top:0; left:0; width:100%; height:100%`

- Selection arrives via `postMessage` from `*.boxnow.*`; with `autoclose: true` the overlay iframe is removed.

Docs alignment ([map-docs.boxnow.bg/configuration](https://map-docs.boxnow.bg/configuration)):

| Setting | Popup recommendation | Megamag / Plasico |
|--------|----------------------|-------------------|
| Widget path | `popup.html` | yes |
| `autoselect` | `no` | yes |
| `autoclose` | `yes` | yes |
| Mount | visible full viewport | fixed overlay on `body` |

No `window.open` / redirect to a separate browser tab ΓÇö ΓÇ£whole-windowΓÇ¥ means **fullscreen fixed overlay**, not a new browsing context.

## Plasico before

- Always-mounted **inline** `#boxnowmap` iframe (`iframe.html`, 450px box)
- `type: "iframe"`, `autoclose: false`, `autoselect: yes`, `gps=no` + zip
- Auto-mount on ship-panel show (`scheduleMount`)

## Plasico after

Files: `index.html`, `poruchka.html`

- Launch button `#boxnow-open-locator` (`.boxnow-map-widget-button`)
- Opens `https://map.boxnow.bg/popup.html?...` as **fixed full-viewport** iframe on `document.body`
- Query: `partnerId=18248`, `countryCode=bg`, `language=bg`, `autoselect=no`, `autoclose=yes`, `gps=yes` (or `gps=no&zip=ΓÇª` when city chosen)
- `postMessage` ΓåÆ `fillBoxnowFields` (locker id / address / postal) ΓåÆ overlay removed
- CDN v5.js still loaded but **does not** bind the button (`buttonSelector: #boxnow-cdn-unused`, `listener: false`) to avoid double overlays
- No CSP headers reintroduced on local serve

## Local verify (2026-09-24)

`node _verify_boxnow_popup.js` against `http://127.0.0.1:8780/poruchka.html`:

- Overlay `src` uses `popup.html` + partner `18248` + bg
- Computed style: `position:fixed; top:0; left:0` (1280├ù720 viewport in headless)
- `afterSelect` fills `#boxnow-locker-id` / address / postal; overlay closes

## Note on naming

If the intended reference was literally ΓÇ£mega-gammaΓÇ¥, that checkout URL is gone; the implemented pattern is the official Box Now **popup** integration as used by megamag (and described in Box Now map docs).
