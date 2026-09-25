from pathlib import Path
import re

css = Path("local-leasing-modal.css").read_text(encoding="utf-8")
assert "safe-area-inset-top" in css
assert "inside the modal" in css

ACCENT = """
/* Plasico accent + ensure overlay wins over site CSS */
.pl-leasing-overlay{
  --pl-accent:#55a630;
  --pl-accent-hover:#4a9229;
  --pl-accent-soft:rgba(85,166,48,.12);
  --pl-accent-ring:rgba(85,166,48,.25);
  --pl-link:#288000;
  z-index:10060!important;
}
.pl-leasing-overlay[hidden]{display:none!important}
#checkout .checkout-layout__aside .aside-leasing{
  position:relative;
  z-index:5;
  pointer-events:auto;
  cursor:pointer;
}

"""


def sync(html_path: str) -> bool:
    text = Path(html_path).read_text(encoding="utf-8")
    pattern = re.compile(
        r"(<style id=pl-leasing-plasico-overrides>\s*)(.*?)(</style>)",
        re.S,
    )
    m = pattern.search(text)
    if not m:
        print(html_path, "STYLE BLOCK NOT FOUND")
        idx = text.find("pl-leasing-plasico")
        print("idx", idx, repr(text[idx : idx + 120]) if idx >= 0 else None)
        return False

    header = (
        "/* FULL leasing modal CSS inlined — external link often fails "
        "to apply in this preview */\n"
    )
    old_inner = m.group(2)
    accent_marker = "/* Plasico accent + ensure overlay wins"
    if accent_marker in old_inner:
        accent = "\n" + old_inner[old_inner.index(accent_marker) :]
        if not accent.endswith("\n"):
            accent += "\n"
    else:
        accent = ACCENT

    new_inner = header + css
    if not new_inner.endswith("\n"):
        new_inner += "\n"
    new_inner += accent

    text2 = text[: m.start()] + m.group(1) + new_inner + m.group(3) + text[m.end() :]
    Path(html_path).write_text(text2, encoding="utf-8")
    assert "safe-area-inset-top" in text2
    print(html_path, "SYNCED OK")
    return True


ok = all(sync(p) for p in ["index.html", "poruchka.html", "boxnowno.html"])
raise SystemExit(0 if ok else 1)
