# Cart icon wheels + guest header gap

## Request
1. Broken cart: `img.abs.spr.cart-icon` inside yellow `#cart` circle missing wheels (clipped).
2. Guest `#head`: large empty gap between search and cart as if profile circle were present.

## Cause
- Mobile / mid-desktop rules forced `.cart-icon` to `24×18` / `22×16` / `28×20`. `.spr` uses a fixed `background-position` sprite (`-30px -1px`) sized for the native **34×24** frame (same as plasico.bg). Shrinking the element without scaling the sprite sheet clipped the bottom (wheels).
- Guest still used base mobile `#search{right:65/75}` / `#top-phone{right:100/117}` sized for the old ~56px cart box. Cluster cart is only 38/32px at `right:2`, so search–cart gap ballooned to ~31–35px while phone–search stayed ~8–15.

## Fix (`index.html` + `poruchka.html`)
- Keep `.cart-icon` at **34×24** everywhere; center with margins in 38/40px circles; at ≤480 use `transform:scale(0.82)` (origin top-left) so the full sprite fits the 32px circle.
- Guest ≤990: `#search{right:48}` / `#top-phone{right:83}` (≈8px gaps); ≤480: `42` / `77`. Logged-in overrides (`100/135`, `86/121`) unchanged.
- `overflow:visible` on clustered `#cart` so scaled sprite is not clipped.

## Verify
- `_verify_cart_icon_guest_gap.py` → PASS (guest 390–990: icon 34×24; gaps phone/search/cart even, search–cart ≤20; logged-in profile beside cart)
- `_verify_mobile_header_icons.py`, `_verify_profile_beside_cart.py` → PASS
- Media: `media/cart-icon-guest-390-after.png`, `media/cart-icon-guest-605-after.png`, `media/cart-icon-wheels-closeup.png`, `media/cart-icon-loggedin-605-after.png`
