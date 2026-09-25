# Mobile header utility icons aligned

## Request (Simona)
Fix chaos/misalignment of mobile `#head` utilities: phone, search, profile, cart overlapping / different tops (e.g. 605px: phone/search top≈18, profile≈6, cart≈10; search overlapped by profile). One horizontal row, shared vertical center, clickable gaps. Profile left of cart; yellow circles sized consistently. Keep sticky header + no black bar from `05e7aab`. Desktop unchanged.

## Cause
After profile moved beside cart (`4387cd9`), `#head-cart-cluster` was absolutely placed with `top:10`/`8` while phone/search stay `top:18`. Cluster also kept original `right` clearance meant for cart alone (`#search{right:65}`), so the wider profile+cart pair overlapped search. Negative margins on yellow circles shifted hitboxes further off-center.

## Fix (`index.html` + `poruchka.html`)
`@media (max-width:990px)` / `480px`:
- Cluster `top` so profile/cart cy ≈ phone/search cy (~31.5); equal box sizes (38 / 32) with `margin:0` yellow circles
- `gap:8` / `6` between profile and cart
- Logged-in only: `#search{right:100}` / `86`, `#top-phone{right:135}` / `121` so phone → search → profile → cart never overlap
- Sticky `header` + mobile black-bar hide from `05e7aab` untouched; desktop ≥991 rules unchanged

## Verify (`_verify_mobile_header_icons.py` → PASS)
- 390 / 480 / 605 / 768 / 990 logged-in: no overlaps; cySpread ≤0.5; gaps ≥6; profile left of cart; `beforeDisplay=none`; sticky after scroll
- Desktop 1280: clean; black `::before` 30px; profile left of cart
- Guest 605: profile hidden; search–cart gap ≥8

## Media
- `media/mobile-header-icons-aligned.png` (605)
- `media/mobile-header-icons-aligned-390.png`
- `media/mobile-header-icons-aligned-desktop.png`
