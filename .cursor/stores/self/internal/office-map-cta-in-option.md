# Office map CTA inside courier option row

## Goal
Simona: „Избери офис от карта“ (`#office-open-locator`) must sit **in** the matching Speedy/Еконт `co-option-row`, not as a separate control under `#office-widget-wrap` below the stack.

## Change
- Nest `#office-widget-wrap` (launch + selected summary + **Смени**) inside the checked courier option label (`data-office-courier-row=speedy|econt`).
- `mountOfficeWidget(courier)` remounts the wrap into the newly checked row on Speedy ↔ Еконт change.
- Map open, `postMessage` fill, summary card, and **Смени** unchanged.
- CSS: nested panel `margin-top` + `clear:both` (no flex-column on the row — keeps radio left of title).

## Verify (`http://127.0.0.1:8780`)
`python _verify_office_cta_in_option.py` → **PASS**

- CTA parent is `.co-option-row` for Speedy, then Econt after switch
- Speedy/Econt fullscreen iframes still open
- Simulated select → summary + **Смени** inside the row; **Смени** reopens map

## Media
- `.cursor/stores/self/media/office-cta-in-speedy-option.png`
- `.cursor/stores/self/media/office-cta-in-econt-option.png`
- `.cursor/stores/self/media/office-summary-in-speedy-option.png`

## Files
- `index.html`, `poruchka.html`
- `_patch_office_cta_in_option.py`, `_verify_office_cta_in_option.py`

## Git
On `main` @ `9b7bd2d` (nest `9f082e7` + layout fix).
