# Aside leasing button font match

## Goal
Make `#aside-leasing-btn` text size/prominence match `#btn-account-auth`.

## Changes (CSS only)
- Base: padding `10px 18px` (match auth), line-height `1.25`
- Teaser: `font-size: inherit` + `font-weight: bold` (was 13px / normal)
- `@media (max-width:1100px)`: leasing `font-size:17px` (with auth)
- `@media (max-width:768px)`: leasing `font-size:18px` (with auth)

## Files
- `index.html`, `poruchka.html`

## Verify (localhost:8780)
| viewport | auth | lease label/teaser |
|----------|------|--------------------|
| 1280     | 15px | 15px               |
| 1000     | 17px | 17px               |
| 390      | 18px | 18px               |

Screenshots: `media/aside-leasing-btn-after.png`, `media/btn-account-auth-ref.png`
