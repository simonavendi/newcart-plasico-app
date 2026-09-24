# REMOVE Postbank logo images

Simona: remove Postbank logo from everywhere. Keep text labels; no logo images.

## Scope

| Location | Before | After |
|---|---|---|
| Payment `payment_id=8` | `[logo] На изплащане с PostBank` | text only |
| Leasing modal PostBank colhead | `[logo] Купи на вноски…` | text only (`COLUMNS.postbank.title`) |

## Changes

- Removed `<img … src="assets/postbank-logo.png">` from payment row + leasing colhead in `index.html`, `poruchka.html`, `local-leasing-modal.js`
- Removed unused CSS: `.co-option-row__logo--postbank`, `.pl-leasing-colhead-logo`, flex override on `.pl-leasing-grid-colhead--postbank`
- Left `assets/postbank-logo.png` unused on disk
- Kept installment scheme tiles under `assets/postbank/pb-*.png` (not the brand wordmark)
- Kept all PostBank text labels / column titles

## Verify

- `node _verify_remove_postbank_logos.js` @ `:8780`
- Shots:
  - `.cursor/stores/self/media/remove-postbank-logo-payment-row.png`
  - `.cursor/stores/self/media/remove-postbank-logo-leasing-colhead.png`
