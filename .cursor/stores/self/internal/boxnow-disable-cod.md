# BOX NOW — disable COD (наложен платеж)

**Verify:** http://127.0.0.1:8780/index.html

## Goal

When delivery locker courier is **BOX NOW**, **Наложен платеж** stays visible but greyed out and not selectable.

**Speedy автомат** and **Еконт автомат** keep COD enabled.

If COD was selected and the user switches to BOX NOW locker, deselect COD. Re-enable COD when leaving BOX NOW (other locker carrier, office, address, store).

## Change

`syncCodForShipMethod` blocks COD only when:

- ship method is `boxnow` (До автомат), **and**
- `locker_courier` is `boxnow`

Speedy / Econt locker carriers clear the disabled state.

Locker courier `change` also calls `syncCodForShipMethod`.

## Verify

```bash
node _verify_boxnow_disable_cod.js
node _verify_locker_cod_speedy_econt.js
```
