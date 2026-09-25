# Profile menu renamed (Simona 6 labels)

## Request
Replace the 4 profile-dropdown labels with Simona’s 6 account options on **both**:
- Header `#btn-top-profile` → `#user-profile-menu`
- Checkout `#btn-account-auth` → `#checkout-profile-menu`

Keep existing light menu styling (white bg, green hover). **Изход** stays the distinct red logout row. Do not restyle to orange.

## Labels (both menus)
1. История на поръчките  
2. Смяна на парола  
3. Моите адреси  
4. Моите фирми  
5. Рекламации  
6. Изход  

## Links
All five nav items → `https://plasico.bg/account` (account hub; no separate public routes for orders/password/addresses/companies/claims found — same pattern as prior profile menu work).

**Изход** still clears `localStorage.plasico_demo_auth` via existing logout handlers (`#btn-top-logout` / `#btn-checkout-logout`).

## Files
- `index.html`, `poruchka.html`, `boxnowno.html` — markup only in both menus
- Screenshot: `media/profile-menu-renamed.png` (header menu open)
- Verify: `_verify_profile_menu_renamed.py`

## Verify (:8780)
- Logged in → header + checkout menus each show the 6 labels in order
- Menu bg white; logout color `#b00020`; no orange restyle
- Изход clears demo auth and restores guest CTA
- Script → **PASS**
