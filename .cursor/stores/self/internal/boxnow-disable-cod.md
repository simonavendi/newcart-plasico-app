# BOX NOW — disable COD (наложен платеж)

**Date:** 2026-09-24  
**Landed on:** `main` (`f776adf` — also includes aside cart qty wiring)  
**Verify:** http://127.0.0.1:8780/index.html

## Goal

When delivery is BOX NOW, **Наложен платеж** must stay visible but greyed out and not selectable. If COD was selected and the user switches to BOX NOW, deselect COD and pick another available payment (Банков превод / first enabled). Re-enable COD when leaving BOX NOW.

## Change

Files: `index.html`, `poruchka.html` (identical checkout snapshots)

1. **CSS** — `#checkout .co-option-row.is-disabled` / `:has(input:disabled)`: opacity `.48`, grey text/bg, `cursor:not-allowed`, `pointer-events:none`.
2. **`syncCodForShipMethod`** — no longer hides the COD row. On `ship === "boxnow"`: `disabled` + `is-disabled` + `aria-disabled`; if checked, uncheck and select `payment_id=7` (or first non-disabled). On other ship methods: clear disabled styling.
3. **Initial markup** — COD starts `disabled` / `is-disabled` because BOX NOW is the default ship method.

## Local verify

```bash
python -m http.server 8780 --bind 127.0.0.1
node _verify_boxnow_disable_cod.js
```

Result (2026-09-24): **PASS**

- BOX NOW load: COD visible, opacity 0.48, not selectable; pay = 7
- Address: COD re-enabled (opacity 1)
- Select COD → switch to BOX NOW: COD unchecked, pay falls back to 7, greyed again
- Click COD while disabled: stays unchecked

## Media

- `.cursor/stores/self/media/boxnow-cod-disabled.png`
- `.cursor/stores/self/media/boxnow-cod-enabled-address.png`
- `.cursor/stores/self/media/boxnow-cod-deselected.png`
