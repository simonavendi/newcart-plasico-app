# Box Now: Автомат before logo

Simona asked: on the Box Now delivery option row, put “автомат” text before (left of) the BOX NOW logo.

## Change

In `#step-ship-method` Box Now `label.co-option-row` title:

- Before: `[logo] Безплатно`
- After: `Автомат [logo] Безплатно`

Files: `index.html`, `poruchka.html` (same markup).

Hint line unchanged: `Доставка до автомат · достъп 24/7`.

## Verify

- Served `http://127.0.0.1:8780/index.html` contains `Автомат` immediately before the boxnow logo `<img>`.
