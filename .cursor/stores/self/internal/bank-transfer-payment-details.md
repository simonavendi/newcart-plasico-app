# Bank transfer payment details

## Goal
When **Банков превод** (`payment_id=7`) is selected under `#checkout-payments`, show real payment data (IBAN, beneficiary, bank, BIC, reference) in an expandable details panel.

## Landed
- `main` (this commit)
- Files: `index.html`, `poruchka.html` (mirrored)

## UI
- Panel `#bank-transfer-details` directly under the Банков превод option row
- Visible when `payment_id=7` (default); hidden for other payments via `syncPayment()`
- Row keeps short SEPA hint; proforma email note moved into the panel footer

## Data (Plasico / demo)
No live IBAN was present in the repo or public plasico.bg pages (Cloudflare / no payment page). Used:

| Field | Value |
| --- | --- |
| Получател | Пласико Компютърс ЕООД |
| ЕИК | 148019777 (public company registry) |
| IBAN | `BG18UBBS80021090123456` (checkout **placeholder** — replace with real Plasico IBAN) |
| Банка | Обединена Българска Банка |
| BIC | `UBBSBGSF` |
| Основание | Номер на поръчката (ще се покаже след завършване) |

## Verify
- `node _verify_bank_transfer_details.js` @ `http://127.0.0.1:8780/index.html`
- Shots: `media/bank-transfer-details.png`, `media/bank-transfer-details-selected.png`
