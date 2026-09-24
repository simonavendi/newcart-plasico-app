# Office CTA inline, no logo in button

## Goal
Simona: `#office-open-locator` („Избери офис от карта“) must:
1. have **no carrier logo** inside the button
2. sit on the **same line** as the option title („Спиди офис“ / „Еконт офис“), not a full-width row below

Applies to both Speedy and Econt office rows. Click → open map unchanged.

## Change
- Restructured Speedy/Econt office rows: `.office-courier-row__body` flex line with `label` (logo + title) → CTA → price; hint on next line.
- `#office-widget-wrap` uses `display:contents` so the launch button participates in that title line; selected summary still full-width below.
- Removed `#office-launch-logo-speedy` / `#office-launch-logo-econt` from the button; compact text-only `.office-widget-launch`.
- `mountOfficeWidget` inserts the wrap into `.office-courier-row__body` (before price) when switching Speedy ↔ Еконт.
- CTA stays outside `<label>`; capture-phase launch delegation unchanged.

## Verify (`http://127.0.0.1:8780`)
`python _verify_office_cta_inline_no_logo.py` → **PASS**

- Speedy + Econt: CTA same vertical center as title (±18px), no `<img>` in button, width ≪ row
- Speedy/Econt fullscreen maps still open from the CTA

## Media
- `.cursor/stores/self/media/office-cta-inline-speedy.png`
- `.cursor/stores/self/media/office-cta-inline-econt.png`
- `.cursor/stores/self/media/office-cta-inline-speedy-map.png`
- `.cursor/stores/self/media/office-cta-inline-econt-map.png`

## Files
- `index.html`, `poruchka.html`
- `_patch_office_cta_inline_no_logo.py`, `_verify_office_cta_inline_no_logo.py`

## Git
On `main` @ `fb0b3f5`.
