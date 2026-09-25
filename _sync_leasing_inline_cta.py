# -*- coding: utf-8 -*-
"""Sync leasing CTA into inline HTML scripts + add body.is-leasing-ready."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JS_PATH = ROOT / "local-leasing-modal.js"
MIRROR = ROOT / "_leasing_modal.js"

ANCHOR = "document.documentElement.classList.toggle('pl-leasing-cta-complete', active);"
REPLACEMENT = (
    "document.documentElement.classList.toggle('pl-leasing-cta-complete', active);\n"
    "\t\tdocument.body.classList.toggle('is-leasing-ready', active);\n"
    "\t\tdocument.body.setAttribute('data-leasing-ready', active ? '1' : '0');"
)


def patch_js(text: str) -> str:
    if "is-leasing-ready" in text:
        return text
    if ANCHOR not in text:
        raise SystemExit("anchor missing in local-leasing-modal.js")
    return text.replace(ANCHOR, REPLACEMENT, 1)


def sync_inline(html_path: Path, js: str) -> None:
    text = html_path.read_text(encoding="utf-8")
    start_marker = '<script id="local-leasing-modal-inline">'
    end_marker = "</script>"
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"missing inline in {html_path.name}")
    content_start = start + len(start_marker)
    end = text.find(end_marker, content_start)
    if end < 0:
        raise SystemExit(f"missing end in {html_path.name}")

    uses_crlf = "\r\n" in text[start : start + 200]
    embed = js.replace("\r\n", "\n")
    if uses_crlf:
        embed = embed.replace("\n", "\r\n")
        nl = "\r\n"
    else:
        nl = "\n"

    new_text = text[:content_start] + nl + embed + nl + text[end:]
    html_path.write_text(new_text, encoding="utf-8", newline="")

    t2 = html_path.read_text(encoding="utf-8")
    s2 = t2.find(start_marker) + len(start_marker)
    e2 = t2.find(end_marker, s2)
    inline = t2[s2:e2]
    ok = (
        "syncCheckoutCta" in inline
        and "is-leasing-ready" in inline
        and "КУПИ НА ИЗПЛАЩАНЕ" in inline
    )
    print(html_path.name, "synced", ok, "inline_len", len(inline))
    if not ok:
        raise SystemExit(f"sync verification failed for {html_path.name}")


def main() -> None:
    js = patch_js(JS_PATH.read_text(encoding="utf-8"))
    JS_PATH.write_text(js, encoding="utf-8", newline="\n")
    MIRROR.write_text(js, encoding="utf-8", newline="\n")
    print("js patched; is-leasing-ready =", "is-leasing-ready" in js)

    for name in ("index.html", "poruchka.html"):
        sync_inline(ROOT / name, js)


if __name__ == "__main__":
    main()
