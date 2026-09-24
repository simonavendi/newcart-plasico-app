# Leasing name: Cyrillic-only autofill + placeholder spacing

## Goal
1. `#pl-leasing-name` must **not** autofill when checkout name is Latin/English-only. Autofill name only when the source has Cyrillic (field requires кирилица). Phone/email/EGN autofill unchanged.
2. Add a space before `...` in all four apply placeholders:
   - `Име и фамилия ... (задължително на кирилица)`
   - `Телефон за контакти ... (започващ с нула)`
   - `ЕГН ...`
   - `Ел. поща ...`

## Change
In `fillApplyFormFromCustomer`, gate name fill with existing `isCyrillicName(data.fullName)`:

```js
if (isCyrillicName(data.fullName)) {
  setApplyFieldIfEmpty(document.getElementById('pl-leasing-name'), data.fullName);
}
```

`isCyrillicName` already requires Cyrillic letters and rejects Latin-only / mixed non-Cyrillic strings (`^[\u0400-\u04FF\s\-'.]+$` plus at least one Cyrillic char).

## Files
- `local-leasing-modal.js` (primary served)
- `_leasing_modal.js` (mirror)
- `index.html` / `poruchka.html` (inline fallback copies)

## Verify (:8780)
```bash
node _verify_leasing_name_cyrillic_autofill.js
```
- Latin `#field-name` → `#pl-leasing-name` stays empty; phone/email still fill
- Cyrillic `#field-name` → name autofills
- All four placeholders include space before `...`

## Screenshots
- `.cursor/stores/self/media/leasing-name-latin-no-autofill.png`
- `.cursor/stores/self/media/leasing-name-cyrillic-autofill.png`
