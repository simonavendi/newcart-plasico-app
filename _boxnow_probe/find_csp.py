from pathlib import Path
import re

for name in ["index.html", "poruchka.html"]:
    t = Path(name).read_text(encoding="utf-8", errors="replace")
    print("====", name, "len", len(t))
    pats = [
        r"(?i)content-security-policy",
        r"(?i)frame-src",
        r"(?i)child-src",
        r"(?i)frame-ancestors",
        r"(?i)http-equiv=[\"']?Content-Security",
        r"(?i)sandbox=",
        r"(?i)Permissions-Policy",
    ]
    for pat in pats:
        for m in re.finditer(pat, t):
            start = max(0, m.start() - 100)
            end = min(len(t), m.end() + 250)
            snippet = t[start:end].replace("\n", " ")
            print(f"HIT {pat} @{m.start()}: {snippet[:350]}")
    head = t[:12000]
    metas = re.findall(r"<meta[^>]+>", head, re.I)
    print("meta count in first 12k", len(metas))
    for m in metas[:40]:
        print(m[:300])
    # look for CSP-looking meta anywhere
    for m in re.finditer(r"<meta[^>]+>", t, re.I):
        tag = m.group(0)
        if re.search(r"content-security|csp", tag, re.I):
            print("CSP META:", tag[:500])
