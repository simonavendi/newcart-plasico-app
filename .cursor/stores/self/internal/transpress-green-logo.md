# Transpress green logo

Simona: „транпрес лого ползвай като overlay-неш да е зелено“ — use Transpress logo; make it Plasico green (not white-on-black).

## Assets

- Source: `a6e11f03-0636-4d89-b934-bf9508357d19` (WEBP, white mark on black)
- `assets/transpress-logo.webp` — original white-on-black (mask/filter source)
- `assets/transpress-logo.png` — green-on-transparent recolor `#39B54A` (theme-color / Plasico green)

Built by `_make_transpress_logo.py` (black → transparent; white → `#39B54A`).

## UI

Address courier row (`courier_id` / `data-key=transpress`):

`[logo] Транспрес` — same pattern as Speedy/Econt/BOX NOW (`.co-option-row__logo--transpress`).

CSS sizing: height 20→24px desktop, max-width ~168→190px (wide wordmark).

Files: `index.html`, `poruchka.html`.

## Verify (:8780)

- Served `/assets/transpress-logo.png` + `.webp` OK
- `python _verify_transpress_logo.py` PASS (markup + green pixel check)
- Screenshot: `.cursor/stores/self/media/transpress-green-logo.png`

## Git

- Markup/CSS on `main` @ `9b7bd2d` (office row layout also included Transpress img).
- Assets + notes on `main` @ `3c2c6de` — *Add green Transpress logo assets for address courier.*
