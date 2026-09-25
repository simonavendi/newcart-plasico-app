# Terms required label — (задължително)

- Target: `#checkout #step-confirm label.conditions > .lb`
- Appended muted `<span class="co-conditions__req">(задължително)</span>` after the green `.cbox` link (link/`data-url` unchanged)
- Style shared with `.co-phone-confirm__opt`: `color:#999;font-size:13px`
- Footer subscribe checkbox unchanged
- Files: `index.html` (landed in `a3e1619`), `poruchka.html` (`d7d8f36`)
- Verify @ 8780: PASS — req text present, opt mirror, cbox `rgb(40, 128, 0)`
- Shots: `media/terms-required-label.png`, `media/terms-required-with-optional.png`
