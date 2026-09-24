from pathlib import Path
import re

CSP_RE = re.compile(
    r'<meta http-equiv=content-security-policy content="[^"]*">\s*',
    re.IGNORECASE,
)

for name in ["index.html", "poruchka.html"]:
    p = Path(name)
    t = p.read_text(encoding="utf-8")
    m = CSP_RE.search(t)
    if not m:
        print(name, "CSP meta NOT FOUND")
        continue
    t2 = CSP_RE.sub("", t, count=1)
    p.write_text(t2, encoding="utf-8")
    print(name, "REMOVED CSP meta; bytes", len(t) - len(t2))
    print("was:", m.group(0)[:180])
