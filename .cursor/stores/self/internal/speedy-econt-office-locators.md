# Speedy + Econt office locators

## Goal
For **До офис** shipping, open an official office map/locator (Speedy or Econt), pick an office, return to checkout with summary + **Смени** — same pattern as BOX NOW. Launch CTA label exactly: **Избери офис от карта**.

## UI
- Under Speedy / Еконт office rows: launch button `Избери офис от карта` (`#office-open-locator`).
- After select: heading + name/address card + **Смени** (`#office-selected`, `#office-change-locator`).
- Switching Speedy ↔ Еконт clears the selection and restores the CTA.
- Manual city/office text fields removed (map is the picker).

## Integrations
| Courier | Embed | Select callback |
| --- | --- | --- |
| Speedy | `https://services.speedy.bg/office_locator_widget_v3/office_locator.php?lang=bg&showOfficesList=1&dropOff=1&pickUp=1&officeType=ALL&…` | `postMessage` office object (`id`, `name`, `address.fullAddressString`). Bare id enriched via `getOfficeDetails.php`. |
| Econt | `https://officelocator.econt.com/?shopUrl=…&lang=bg&officeType=office` (fallback `offices.econt.com`) | `postMessage` `{ office: { id, code, name, address } }` per delivery.econt.com docs. |

Host overlay: fullscreen iframe + close / Escape (`.office-fullscreen`), parallel to BOX NOW — BOX NOW code path untouched.

## Verify (http://127.0.0.1:8780)
- Button label exact; Speedy/Econt iframe opens by courier.
- Simulated `postMessage` fills summary, closes overlay, shows **Смени**.
- Courier switch clears selection; BOX NOW panel still launches.

## Media
- `media/office-speedy-selected.png`
- `media/office-econt-selected.png`
- `media/office-speedy-locator.png`
- `media/office-econt-locator-wait.png`

## Files
- `index.html`, `poruchka.html` — CSS + office panel markup + locator script
