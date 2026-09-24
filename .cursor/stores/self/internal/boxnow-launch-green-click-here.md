# BOX NOW launch button — green + „като кликнете тук“

## Ask
Simona: finish `#boxnow-open-locator` — add „като кликнете тук“ to the label and make the button Plasico green (bg) / white text (not light blue).

## Change
- Label: `Изберете BOX NOW автомат като кликнете тук`
- CSS scoped to `#checkout #boxnow-open-locator` only (shared `.boxnow-widget-launch` stays for office locator)
- Colors: `#55a630` / hover `#4a9229`, white text
- Mirrored in `index.html` + `poruchka.html`

## Verify (:8780)
- Served HTML contains new label + `#checkout #boxnow-open-locator` green rules
- Computed: `background rgb(85, 166, 48)`, `color rgb(255, 255, 255)`
- Screenshot: `.cursor/stores/self/media/boxnow-launch-green-click-here.png`

## Landing
- HTML (`index.html` + `poruchka.html`): `0ccdd10` on `main`
