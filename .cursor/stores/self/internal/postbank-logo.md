# Postbank logo like Speedy/Econt/BOX NOW

Simona: add Postbank logo the same way as carrier logos — especially leasing „Купи на вноски с кредитна карта на PostBank“.

## Asset

- Source: Postbank Bulgaria wordmark (`Postbank_Bulgaria_logo…webp`, black bg keyed out)
- `assets/postbank-logo.png` — transparent PNG (280×86)

## UI

| Place | Markup |
| --- | --- |
| Payment option `payment_id=8` | `[logo] На изплащане с PostBank` — `.co-option-row__logo--postbank` |
| Leasing modal PostBank column head | `[logo] Купи на вноски с кредитна карта на PostBank` — `.pl-leasing-colhead-logo` inside `.pl-leasing-grid-colhead--postbank` |

CSS: `--postbank` sized like other option logos (22→26px). Colhead uses flex + gap.

Files: `index.html`, `poruchka.html`, `local-leasing-modal.js`, `local-leasing-modal.css`.

## Transpress

Green Transpress already on `main` @ `3c2c6de` (`assets/transpress-logo.png` + `.webp`). Re-verified served on :8780.

## Verify (:8780)

- `python _verify_postbank_logo.py` PASS
- Screenshots:
  - `.cursor/stores/self/media/postbank-logo-payment-row.png`
  - `.cursor/stores/self/media/postbank-logo-leasing-colhead.png`

## Git

Landed on `main` @ `b7445eb` (*Hide all checkout radios…* — includes PostBank logo markup + `assets/postbank-logo.png`). Docs/screenshots follow-up on this commit.
