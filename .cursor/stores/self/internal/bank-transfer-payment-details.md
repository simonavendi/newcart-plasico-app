# Bank transfer payment details

## Goal
When **Банков превод** (`payment_id=7`) is selected under `#checkout-payments`, show real payment data (IBAN, beneficiary, bank, BIC, reference) in an expandable details panel.

## Landed
- `main` @ `383b8c6`
- Files: `index.html`, `poruchka.html` (mirrored)

## UI
- Panel `#bank-transfer-details` directly under the Банков превод option row
- Visible only when user selects `payment_id=7`; hidden on load / other payments via `syncPayment()` (no payment preselected — see `no-payment-preselect.md`)
- Row keeps short SEPA hint; proforma email note moved into the panel footer

## Data (Plasico)

| Field | Value |
| --- | --- |
| Получател | Пласико Компютърс ЕООД |
| ЕИК | 148019777 (public company registry) |
| IBAN | `BG18UBBS81551064228519` (`#bank-transfer-iban`) |
| Банка | Обединена Българска Банка |
| BIC | `UBBSBGSF` |
| Основание | Номер на поръчката (ще се покаже след завършване) |

Placeholder `BG18UBBS80021090123456` replaced with live Plasico IBAN (see `bank-transfer-iban-update.md`).

## Verify
- `node _verify_bank_transfer_details.js` @ `http://127.0.0.1:8780/index.html`
- Shots: `media/bank-transfer-details.png`, `media/bank-transfer-details-selected.png`
