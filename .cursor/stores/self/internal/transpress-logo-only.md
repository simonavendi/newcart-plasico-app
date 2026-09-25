# Transpress logo-only row

Simona: on the Transpress shipping option row, leave **just the logo** — hide Cyrillic „Транспрес“ and price „3.57 €“. Row stays selectable.

## Change

CSS-only hide on address courier stack (`#step-ship-details` / `[data-ship-panel=address]` / `input[data-key=transpress]`):

- `.co-option-row__title` → `font-size:0; line-height:0; gap:0` (logo keeps explicit height)
- `.co-option-row__price` → clip / sr-only style (markup kept)

Files: `index.html`, `poruchka.html`. Speedy row unchanged (still shows label + badge + price).

No existing Speedy/Box Now “logo-only” hide pattern — those still show companion text — so Transpress-specific CSS.

## Verify (:8780)

- `python _verify_transpress_logo_only.py` → PASS (CSS present, click selects Transpress, title font-size 0, price clipped, Speedy still shows text)
- Screenshot: `.cursor/stores/self/media/transpress-logo-only.png`
