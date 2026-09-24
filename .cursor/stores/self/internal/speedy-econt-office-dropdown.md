# Speedy / Econt office typeahead + row click

## Goal
Simona: **Спиди офис** / **Еконт офис** searchable office field + map CTA; selecting fills the same summary (+ **Смени**). Econt/Speedy rows must be clickable like other ship options.

## Placeholder
`#office-search-input` placeholder exactly: **Град, име или адрес на офис**

## Row selection fix
Office courier rows are `<div class="co-option-row">` (not a full-row `<label>`) with visually hidden radios. Clicks on price/hint/padding previously did nothing; `cursor:default` also hid affordance.

- Row click → checks `office_courier` radio, `.clicked`, remounts widget (skips search / map CTA / Смени / inputs)
- `cursor:pointer` on rows; `pointer-events:none` on title contents so the select label receives clicks
- Hidden typeahead list: `pointer-events:none` so it can’t block the other row

## Data
| Courier | Source |
| --- | --- |
| Speedy | `assets/speedy-offices.json` |
| Econt | `ee.econt.com` `NomenclaturesService.getOffices.json` (skip `isAPS`) |

## Verify (`http://127.0.0.1:8780`)
`python _verify_office_row_click.py` → **PASS**

## Media
- `.cursor/stores/self/media/office-econt-row-selected.png`

## Files
- `index.html`, `poruchka.html`
- `_patch_office_row_click.py`, `_verify_office_row_click.py`
