# Box Now: logo left of Автомат

Simona: move BOX NOW logo to the LEFT of „автомат“ (was after).

## Desired order

`[logo] Автомат … Безплатно`

Element: `img.co-option-row__logo--boxnow` inside `span.co-option-row__title` on first ship `label.co-option-row`.

## Change

In `#step-ship-method` Box Now row title (`index.html` + `poruchka.html`):

- Before: `Автомат [logo] Безплатно`
- After: `[logo] Автомат Безплатно`

Existing flex title CSS (`.co-option-row__title` with `display:flex; align-items:center; gap:6px`) already lays out children in DOM order — no CSS change needed.

Hint unchanged: `Доставка до автомат · достъп 24/7`.

## Verify (:8780)

- Served `http://127.0.0.1:8780/index.html` and `poruchka.html`: title matches
  `<img …logo--boxnow…> Автомат <em …>Безплатно</em>`
- DOM child order: `IMG` → `TEXT:Автомат` → `EM:Безплатно`
- Screenshot: `.cursor/stores/self/media/boxnow-logo-left-of-avtomat.png`

## Git

Markup is on `main` (synced with `origin/main`). Title reorder is present in `f776adf` (bundled with aside cart qty wiring).
