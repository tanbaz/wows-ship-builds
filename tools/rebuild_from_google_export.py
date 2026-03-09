#!/usr/bin/env python3
"""Rebuild the static site from a Google Docs 'Web Page (.html, zipped)' export.

Usage:
  python3 tools/rebuild_from_google_export.py /path/to/unzipped_export

The export folder should contain:
  - a single .html file
  - an images/ directory
"""

import re
import sys
import html as htmlmod
from pathlib import Path


def slugify(s: str) -> str:
    s = htmlmod.unescape(s).lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "section"


def main(export_dir: Path) -> int:
    html_files = list(export_dir.glob("*.html"))
    if not html_files:
        print("ERROR: No .html file found in export dir", file=sys.stderr)
        return 2
    if len(html_files) > 1:
        # pick the largest; google exports sometimes create one main html
        html_files.sort(key=lambda p: p.stat().st_size, reverse=True)
    src_html = html_files[0]

    img_dir = export_dir / "images"
    if not img_dir.exists():
        print("ERROR: images/ folder not found in export dir", file=sys.stderr)
        return 2

    site_root = Path(__file__).resolve().parents[1]
    out_index = site_root / "index.html"
    out_assets = site_root / "assets"
    out_images = out_assets / "images"
    out_images.mkdir(parents=True, exist_ok=True)

    src = src_html.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r"<body[^>]*>(.*)</body>", src, re.S | re.I)
    body = m.group(1) if m else src

    # light cleanup
    body = re.sub(r"<hr[^>]*page-break-before:always[^>]*>", "", body, flags=re.I)
    body = re.sub(r"<p[^>]*>\s*(?:<span[^>]*>\s*</span>\s*)*</p>", "", body, flags=re.I)

    # simplify lists and common tags
    body = re.sub(r"<(ul|ol)\s+[^>]*>", lambda m: f"<{m.group(1)}>", body)
    body = re.sub(r"<li\s+[^>]*>", "<li>", body)
    body = re.sub(r"<p\s+[^>]*>", "<p>", body)

    # preserve heading ids when present; otherwise we will add them
    body = re.sub(
        r"<(h[1-6])\s+[^>]*id=\"([^\"]+)\"[^>]*>",
        lambda m: f"<{m.group(1)} id=\"{m.group(2)}\">",
        body,
    )
    body = re.sub(r"<(h[1-6])\s+[^>]*>", lambda m: f"<{m.group(1)}>", body)

    # drop span attributes, keep spans for inline text
    body = re.sub(r"<span[^>]*>", "<span>", body)

    # remove google anchor markers
    body = re.sub(r"<a id=\"kix\.[^\"]+\"></a>", "", body)
    body = re.sub(r"<a id=\"id\.[^\"]+\"></a>", "", body)

    # Add ids to headings missing them
    heading_pat = re.compile(r"<h([1-6])([^>]*)>(.*?)</h\\1>", re.S | re.I)
    used = set()
    headings = []  # (level, id, text)

    parts = []
    last = 0
    for mh in heading_pat.finditer(body):
        parts.append(body[last : mh.start()])
        lvl = mh.group(1)
        attrs = mh.group(2) or ""
        inner = mh.group(3)

        text = re.sub("<[^<]+?>", "", inner)
        text = htmlmod.unescape(text).strip()

        if not text:
            parts.append(f"<h{lvl}>{inner}</h{lvl}>")
            last = mh.end()
            continue

        id_match = re.search(r'id=\"([^\"]+)\"', attrs)
        if id_match:
            hid = id_match.group(1)
        else:
            base = slugify(text)
            hid = base
            i = 2
            while hid in used:
                hid = f"{base}-{i}"
                i += 1

        used.add(hid)
        headings.append((int(lvl), hid, text))
        parts.append(f"<h{lvl} id=\"{hid}\">{inner}</h{lvl}>")
        last = mh.end()

    parts.append(body[last:])
    body2 = "".join(parts)

    # Build sidebar from h2/h3
    nav = [h for h in headings if h[0] in (2, 3)]
    sidebar = []
    open_ul = False
    for lvl, hid, text in nav:
        if lvl == 2:
            if open_ul:
                sidebar.append("</ul>")
                open_ul = False
            sidebar.append(
                f'<div class="nav-section"><a class="nav-h2" href="#{hid}">{text}</a></div>'
            )
            sidebar.append('<ul class="nav-h3">')
            open_ul = True
        else:
            sidebar.append(f'<li><a href="#{hid}">{text}</a></li>')
    if open_ul:
        sidebar.append("</ul>")

    sidebar_html = "\n".join(sidebar)

    # Rewrite image paths
    body2 = body2.replace('src="images/', 'src="assets/images/')
    body2 = body2.replace("src='images/", "src='assets/images/")

    # Copy images
    for f in img_dir.glob("*.*"):
        (out_images / f.name).write_bytes(f.read_bytes())

    # Assemble final index
    index = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>WoWS Captain Builds</title>
  <link rel=\"stylesheet\" href=\"assets/style.css\" />
</head>
<body>
  <header class=\"topbar\">
    <div class=\"brand\">WoWS Captain Builds</div>
    <input id=\"search\" class=\"search\" type=\"search\" placeholder=\"Search ships (e.g., Hornet, I-56)…\" />
  </header>
  <div class=\"layout\">
    <aside class=\"sidebar\" id=\"sidebar\">
      {sidebar_html}
    </aside>
    <main class=\"content\" id=\"content\">
      {body2}
    </main>
  </div>

  <div class=\"lightbox\" id=\"lightbox\" aria-hidden=\"true\">
    <button class=\"lightbox-close\" id=\"lightboxClose\" aria-label=\"Close\">×</button>
    <img id=\"lightboxImg\" alt=\"\" />
  </div>

  <script src=\"assets/app.js\"></script>
</body>
</html>"""

    out_index.write_text(index, encoding="utf-8")
    print(f"Rebuilt: {out_index}")
    print(f"Images copied to: {out_images}")
    print(f"Nav entries: {len(nav)}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__.strip())
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1]).expanduser().resolve()))
