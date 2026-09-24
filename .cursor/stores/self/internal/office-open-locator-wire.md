# Office open-locator wire fix

## Problem
`button#office-open-locator` („Избери офис от карта“) showed `data-bound=1` under the selected Speedy/Econt office option but often did not open the matching carrier map. Root cause: the CTA lived **inside** the courier `<label class="co-option-row">` after nesting, and launch relied on a one-shot `data-bound` listener plus a silent `isOfficeShip()` early return.

## Fix
- Office courier rows are now `<div class="co-option-row">` with an inner `<label class="co-option-row__select">` for radio + title/price only.
- `#office-widget-wrap` stays mounted in the checked row (via `mountOfficeWidget`) but **outside** the label.
- Launch uses capture-phase document delegation (`__plasicoOfficeLaunchBound`) for `#office-open-locator` / `#office-change-locator` — survives remounts; still sets `data-bound=1` for inspectability.
- `openOfficeLocator()` no longer silently no-ops when the office panel is visible.
- `setClickedForRadios` prefers `.co-option-row` so `.clicked` stays on the card.

BOX NOW path unchanged.

## Verify (http://127.0.0.1:8780)
`python _verify_office_open_locator_wire.py` → VERIFY OK

- Speedy click → `speedy.bg` iframe; postMessage → summary + Смени
- Econt switch remounts CTA under Econt (not in `<label>`); click → `econt.com` iframe; summary + Смени
- Box Now panel/button intact; poruchka parity OK

## Media
- `media/office-open-locator-econt-cta.png`
- `media/office-open-locator-speedy-map.png`
- `media/office-open-locator-econt-map.png`
- `media/office-open-locator-speedy-summary.png`
- `media/office-open-locator-econt-summary.png`

## Files
- `index.html`, `poruchka.html`
