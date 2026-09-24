# Address courier rows: no radio / no subtext

## Goal
On `#step-ship-details` `.co-ship-panel[data-ship-panel=address]` `.co-option-stack` (Спиди / Транспрес):
- Remove visible radio circles
- Remove second-line hints (“Стандартна куриерска доставка”, “Алтернативен куриер до адрес”)
- Keep title, “Препоръчан”, price, logos; cards stay clickable

## Change
- **CSS** (already on main before hint cleanup; kept): visually clip radios in address courier stack; `align-items:center` on row body
- **HTML** (`index.html` + `poruchka.html`): delete the two `.co-option-row__hint` lines under Speedy / Transpress
- Radios remain in DOM (`name=courier_id`) for form state; selection via `label.co-option-row` / `.clicked` / `:has(input:checked)`
- Did not touch Transpress logo markup (parallel work); title flex + logo classes leave room

## Verify (:8780)
- `python _verify_courier_rows_no_radio.py` → PASS html + Playwright click Speedy/Transpress
- Media:
  - `.cursor/stores/self/media/courier-rows-no-radio-speedy.png`
  - `.cursor/stores/self/media/courier-rows-no-radio-transpress.png`
  - `.cursor/stores/self/media/courier-rows-no-radio-details.png`
