# Speedy / Econt office typeahead

## Goal
Simona: **Спиди офис** and **Еконт офис** each get a searchable free-text field with an office dropdown (typeahead), in addition to **Избери офис от карта**. Selecting from the list fills the same summary card (+ **Смени**) as a map pick.

## Behavior
- Typeahead input `#office-search-input` inside `#office-widget-wrap` (moves with Speedy ↔ Еконт remount).
- Dropdown `#office-search-list` filters by city / name / code; keyboard ↑↓ / Enter / Esc.
- Pick → `fillOfficeFields` → same `#office-selected` summary + **Смени** as map `postMessage`.
- When selected, search + map CTA hide (`is-selected`); **Смени** still opens the map.
- Map CTA label unchanged: **Избери офис от карта**.

## Data sources
| Courier | Source | Notes |
| --- | --- | --- |
| Speedy | `assets/speedy-offices.json` (~1305 offices) | Built from Speedy map widget embed (`speedy_offices`) + addresses via `getOfficeDetails.php`. Browser CORS blocks live `searchOffices.php`. |
| Econt | `POST https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json` `{countryCode:"BGR"}` | CORS `*`. APS automats excluded (`isAPS`) to match map `officeType=office`. Cached in memory after first fetch. |

## Verify (`http://127.0.0.1:8780`)
`python _verify_office_typeahead.py` → **PASS**

- Speedy: type “Младост” / “Варна” → dropdown → summary + Смени
- Econt: type “Младост” / “София” → dropdown → summary
- Map CTA / Смени still opens fullscreen locator

## Media
- `.cursor/stores/self/media/office-typeahead-speedy.png`
- `.cursor/stores/self/media/office-typeahead-speedy-selected.png`
- `.cursor/stores/self/media/office-typeahead-econt.png`
- `.cursor/stores/self/media/office-typeahead-econt-selected.png`

## Files
- `index.html`, `poruchka.html` — CSS + search markup + typeahead JS
- `assets/speedy-offices.json`
- `_patch_office_typeahead.py`, `_verify_office_typeahead.py`, `_extract_speedy_offices.py`
