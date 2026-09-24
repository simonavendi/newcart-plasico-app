# Hide all checkout radios

## Goal
Simona: remove **all** visible radio circles across checkout (not only courier rows). Keep card/row click selection. Speedy/Transpress second-line hints stay removed.

## Change
CSS in `index.html` + `poruchka.html` (+ `local-leasing-modal.css` for modal plans):

- Global clip/sr-only hide: `#checkout input[type=radio]` and `.pl-leasing-radio`
- `position:relative` on `.co-person-type label`, `.co-phone-confirm__option`, `.co-option-row__select`, `.pl-leasing-cell`
- Address courier body still `align-items:center` (no hint subtext)
- Radios remain in DOM for form state / JS (`setClickedForRadios`, leasing scheme)

Covers: ship methods, address couriers, office Speedy/Econt, payment, invoice person type, phone confirm, leasing plan cells. Installment PostBank tiles were already `<button>`s (no radios).

## Verify (:8780)
- `python _verify_hide_all_radios.py` → PASS (20 checkout radios hidden + leasing)
- Media:
  - `.cursor/stores/self/media/hide-all-radios-address-couriers.png`
  - `.cursor/stores/self/media/hide-all-radios-payment.png`
  - `.cursor/stores/self/media/hide-all-radios-person-type.png`
  - `.cursor/stores/self/media/hide-all-radios-phone-confirm.png`
  - `.cursor/stores/self/media/hide-all-radios-office.png`
  - `.cursor/stores/self/media/hide-all-radios-leasing.png`

## Related
- Earlier ship-method-only hide: `internal/hide-shipping-radios.md`
- Address courier hints: `internal/courier-rows-no-radio-subtext.md`

## Git
- Landed on main @ 7445eb.
