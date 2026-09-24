# BOX NOW — autofill locker name after select

**Date:** 2026-09-24  
**Landed on:** `main` @ `662a049` (index summary UI already in `4689370`; this commit mirrors `poruchka.html` + docs/media)  
**Partner ID:** `18248`  
**Local:** http://127.0.0.1:8780/index.html

## Goal

After the user picks a locker in the fullscreen map iframe, persist id/name/address and render a clear shipping summary (not empty) — same idea as reference SingleFile checkouts with `#selectedOfficeAddress` + **Смени**.

## Widget payload (from `markerClicked.js`)

```js
window.parent.postMessage({
  boxnowLockerId,
  boxnowLockerLat,
  boxnowLockerLng,
  boxnowLockerName,           // e.g. "BOX NOW - Лукойл, … - 24/7"
  boxnowLockerPostalCode,
  boxnowLockerAddressLine1,  // e.g. "бул. Цар Освободител, Варна"
  boxnowLockerAddressLine2,
  boxnowCountry
}, "*");
```

## UI after select

- Section heading: `BOXNOW - ДО АВТОМАТ — АДРЕС ЗА ДОСТАВКА`
- Grey card `#selectedOfficeAddress`:
  - **title** ← `boxnowLockerName` (`#boxnow-selected-name`)
  - **sub-address** ← `boxnowLockerAddressLine1` (+ line2) (`#boxnow-selected-text`)
  - **Смени** (orange pencil) → reopens fullscreen locator
- Launch button hidden while selected (`.boxnow-widget-panel.is-selected`)

## Hidden fields

| Field | id | source |
| --- | --- | --- |
| id | `#boxnow-locker-id` | `boxnowLockerId` |
| name | `#boxnow-locker-name` | `boxnowLockerName` |
| address | `#boxnow-locker-address` | `boxnowLockerAddressLine1` |
| address2 | `#boxnow-locker-address2` | `boxnowLockerAddressLine2` |
| postal | `#boxnow-locker-postal` | `boxnowLockerPostalCode` |

## Files

- `index.html` / `poruchka.html` (mirrored)
- Media: `media/boxnow-locker-name-filled.png`
- Verify: `node _verify_boxnow_locker_name.js`

## Verify result

- `afterSelect` fills name + address, shows summary, hides launch, closes overlay
- `postMessage` from `https://map.boxnow.bg` same outcome
- **Смени** reopens `#boxnow-fullscreen-root`
