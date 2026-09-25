# Bigger clickable checkout tickboxes

- Landed on: `main` @ `6e68a20`
- Files: `index.html`, `poruchka.html` (mirrored CSS)
- Scope: checkout confirm/payment checkboxes only (no auth-modal)

## Why
Native ticks were ~13–14px with weak label hit areas. Invoice card and terms row needed larger ticks and whole-field toggling.

## Changes
- `#checkout .co-invoice-check input[type=checkbox]`: **20×20px**, accent `#3b82f6`; label `width:100%` + flex copy so the blue card is the hit target (`for=` kept for JS)
- `#checkout #step-confirm label.conditions input[type=checkbox]`: **20×20px**, accent `#679F08`; `.fbox` / `.conditions` full-width flex so the row toggles
- Keep `required` on terms consent; `(задължително)` + green `.cbox` `data-url` unchanged
- Phone confirm remains Да/Не option cards (radios visually hidden); styles also cover any `label.conditions` checkbox in `#step-confirm`
- Follow-up fix in same commit: restore aside cart heading to **Поръчка** after accidental rename in `6a14162`

## Verify (:8780)
- `node _verify_bigger_checkboxes.js` → PASS
  - terms/invoice size 20×20
  - label click toggles both
  - `required: true`, req text `(задължително)`, cbox green + `help?info=52`
- Shots: `media/bigger-checkboxes-terms.png`, `media/bigger-checkboxes-invoice.png`
