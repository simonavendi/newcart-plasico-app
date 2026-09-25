# Transpress courier row — logo-only + visible price (size match)

## Ask (Simona)

Transpress courier option under „До адрес“ was too short and missing price:
1. Same height/size as Speedy (Спиди Препоръчан @ 3.57 €)
2. Price back on the right (e.g. 3.57 €)
3. Keep logo-only label (no Cyrillic „Транспрес“ companion text)

## Prior regression (`6940f14`)

Emptied price text + clipped `.co-option-row__price` so selection tools saw logo-only — also shrank the row (~42px vs Speedy taller).

## Fix (`index.html` + `poruchka.html`)

1. Restore price markup: `<span class="co-option-row__price">3.57 €</span>` (drop empty/`aria-hidden`/`data-price`)
2. Remove price clip CSS
3. Match Speedy logo height for Transpress: `30px` / `36px` (was `20px` / `24px`)
4. Shared `min-height:52px` on Speedy + Transpress address courier rows
5. Title stays logo-only (`alt="Транспрес"` for a11y; no companion text node)

## Verify

- Local `:8780`: `python _verify_transpress_logo_only.py` → PASS
  - both rows height `58`; Transpress `innerText` = `3.57 €` (no Cyrillic name)
  - price box in layout; logo ~190×36
- Screenshot: `.cursor/stores/self/media/transpress-size-price.png`
- Live: https://newcart-plasico-app.vercel.app/
