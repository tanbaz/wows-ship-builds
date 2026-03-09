# WoWS Captain Builds (self-hosted)

This folder is a **static website** (no backend). Upload the contents to your web server.

## Files
- `index.html` – main page
- `assets/style.css` – styling
- `assets/app.js` – sidebar, ship search, image lightbox
- `assets/images/` – all build screenshots exported from Google Docs

## Quick local test
From this folder:

```bash
python3 -m http.server 8080
```
Then open `http://localhost:8080`.

## Deploy (any static hosting)
Copy the whole folder contents to your server’s web root, e.g.
- Nginx: `/var/www/html/`
- Apache: `/var/www/html/`

Make sure the `assets/` folder stays next to `index.html`.

## Updating the site when the Google Doc changes
1. In Google Docs: **File → Download → Web Page (.html, zipped)**
2. Unzip it somewhere. You should see an `.html` file and an `images/` folder.
3. Run the rebuild script:

```bash
python3 tools/rebuild_from_google_export.py /path/to/unzipped_export
```

That will regenerate `index.html` and refresh `assets/images/`.
