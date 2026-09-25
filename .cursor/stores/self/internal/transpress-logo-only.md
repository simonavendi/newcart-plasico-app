# Transpress logo-only courier row (Simona correction)

Simona selected the **Transpress shipping courier option row** (not an address form field):
- `label.co-option-row` in `.co-ship-panel` → `.co-option-stack`
- visible_text had been: `Транспрес 3.57 €`
- Ask: leave **just the logo** on that courier row

## What `6d49eca` did

CSS-only hide scoped to `#step-ship-details` / `[data-ship-panel=address]` / `input[data-key=transpress]`:
- `.co-option-row__title { font-size:0 }` + clipped price
- Correct **courier** row (under „До адрес“), **not** Град/Адрес fields
- But companion Cyrillic + clipped price stayed in DOM/`innerText`, so selection tools still reported `Транспрес 3.57 €`
- Notes/URL wrongly pointed at `newcart.plasico.app` (dead); live is Vercel

## Fix

On the Transpress **courier option** only (`index.html` + `poruchka.html`):

1. Remove companion text node „Транспрес“ after the logo (`alt` kept for a11y)
2. Empty price text (`data-price` kept) + `aria-hidden` + CSS clip
3. Narrow CSS to `.co-option-stack label…` — drop title `font-size:0` hack
4. Do **not** touch address fields, Speedy/Econt/Box Now

## Verify

- Local `:8780`: `python _verify_transpress_logo_only.py` → PASS
- Screenshot: `.cursor/stores/self/media/transpress-logo-only-fixed.png`
- Live: https://newcart-plasico-app.vercel.app/
- Pushed `main` @ `6940f14`
