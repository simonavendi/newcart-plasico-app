# Terms consent — native required checkbox

- Landed on: `main` @ `296fb53`
- Files: `index.html`, `poruchka.html` (mirrored)
- Target: `#checkout #step-confirm label.conditions` / `input[name=approve_conditions]`

## Changes
- Add HTML `required` on checkout terms checkbox (`value=1` kept for POST)
- Unhide native checkbox (override `.conditions input { visibility:hidden; position:absolute }`)
- Hide fake `.lb:before` sprite checkbox so the real tick shows
- Remove decorative red `*` (`.fbox::before`)
- Footer subscribe checkbox unchanged

## Verify (Playwright @ 8780)
- `required: true`, `visibility: visible`, asterisk `::before` content `none`
- Unchecked: `checkValidity() === false`, validationMessage present, submit blocked
- Checked: `checkValidity() === true`, value `1`
- Shots: `media/terms-consent-checkbox.png`, `media/terms-consent-checkbox-checked.png`
