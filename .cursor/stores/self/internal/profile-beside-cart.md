# Profile beside cart (header)

## Request (Simona)
Move `button#btn-top-profile` from `#top-line` → `#user` (26×26 green) to `#head`, immediately **left of `#cart`**, matching cart’s yellow-circle style. Keep dropdown (Профил / Предишни поръчки / Документи / Изход). No duplicate in `#user`. Don’t break cart click.

Follow-up: profile was wrapping **below** cart (`top≈103` vs cart `top≈52`). Must share cart/phone row; on mobile scale both so they fit.

## Cause
Two separate `float:right` siblings: `#cart` (~56px) fit on the `#head` row; adding `#head-profile` (~56px) exceeded the ~94px gap after `#top-phone` on `.pw{width:990px}`, so profile wrapped.

## Fix
- Remove logged-in control from `#user` (guest links stay; `#user` hidden when logged in)
- Wrap profile + cart in `#head-cart-cluster` (profile **before** cart in DOM → left of cart)
- **Absolute** position the cluster on `#head` (`top:22px; right:-9px`) so it cannot float-wrap under phone
- Yellow `::before` circle on `#head-profile` matching `#cart.hp:before`
- Mid desktop (991–1280, logged in): slightly shrink both (~40px) so phone stays clear
- Mobile ≤990 / ≤480: scale both profile + cart down further
- Dropdown JS still uses `#btn-top-profile` / `#user-profile-menu` / `#head-profile.is-open`

## Files
- `index.html`, `poruchka.html`
- Screenshot: `media/profile-beside-cart.png` (+ `profile-beside-cart-mobile.png`)
- Verify: `_verify_profile_beside_cart.py` → PASS

## Verify (:8780)
- Logged in: no `#user` profile; yellow profile left of cart; `cart.top≈52`, same cy as phone
- Menu opens with 4 items; Изход restores guest
- Cart `data-url` intact, profile not inside `#cart`
- Mobile 390: both ≤36px wide, same row, cluster within viewport
