# Bank transfer — red order-ref warning

## Goal
In `#bank-transfer-details`, by the Основание / order-number `dd` („Номер на поръчката (ще се покаже след завършване)“), show a clear red warning:

> Задължително е да посочите номер на поръчка като основание в превода

Also hide the ЕИК row (`148019777`).

## Landed
- Red warn: `main` @ `0ccdd10`
- Hide ЕИК: `main` @ `3531e5a`
- Files: `index.html`, `poruchka.html` (mirrored)

## UI
- Markup: `<span class="bank-transfer-details__order-ref-warn">…</span>` inside the Основание `dd`, under the placeholder text (`display:block`)
- Style: `#c62828`, 13px, font-weight 600
- ЕИК `div.bank-transfer-details__row` removed from the panel (Получател / IBAN / Банка / BIC / Основание remain)

## Verify
- `node _verify_bank_order_ref_warn.js` @ `http://127.0.0.1:8780/index.html`
- `node _verify_bank_hide_eik.js`
- Shots: `media/bank-order-ref-red-note.png`, `media/bank-order-ref-no-eik.png`
- Checks: warn present, red `rgb(198, 40, 40)`, no ЕИК/148019777, mirrored in `poruchka.html`
