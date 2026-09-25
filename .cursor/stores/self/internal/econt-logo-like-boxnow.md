# Speedy + Econt logos like BOX NOW

Simona: use Еконт and Speedy logos the same way as BOX NOW (option titles left of label; office picker CTA/summary carrier marks).

## Assets

- Source Econt: `15fef672-4e86-412a-9160-a9dbb7cd3e1c.png` → `assets/econt-logo.png`
- Source Speedy: `317a8314-5b84-4266-a7c9-55d341ff84e8.png` → `assets/speedy-logo.png`
- Pattern ref: `assets/boxnow-logo.png` + `.co-option-row__logo--boxnow`

## UI

| Place | Markup |
| --- | --- |
| Address courier Speedy row | `[logo] Спиди Препоръчан` — `.co-option-row__logo--speedy` |
| Office Speedy row | `[logo] Спиди офис` |
| Office Econt row | `[logo] Еконт офис` — `.co-option-row__logo--econt` |
| Office map CTA | Active courier logo left of „Избери офис от карта“ (`#office-launch-logo-*`) |
| Office selected heading | Courier logo + heading text (`#office-selected-logo-*`, `#office-selected-heading-text`) |

`syncOfficeCarrierMarks()` toggles Speedy ↔ Econt marks on courier change / fill / boot. Speedy stays as-is elsewhere beyond these rows; Транспрес unchanged.

CSS: `--econt` / `--speedy` sized like `--boxnow` (height 30→36px desktop). Launch title + selected heading use flex + gap for logo+label.

Files: `index.html`, `poruchka.html`.

## Verify (:8780)

- Served HTML + `/assets/{econt,speedy,boxnow}-logo.png` PNG OK
- `python _verify_carrier_logos.py` PASS (markup + Playwright visibility toggle)
- Screenshots:
  - `.cursor/stores/self/media/carrier-logos-office-rows.png`
  - `.cursor/stores/self/media/carrier-logos-econt-cta.png`
  - `.cursor/stores/self/media/carrier-logos-address-speedy.png`

## Git

On `main` @ `fd5ee80` — *Add Speedy and Econt logos like BOX NOW.*
