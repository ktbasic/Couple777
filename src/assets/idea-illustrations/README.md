# Idea illustrations

One drawn scene per date idea. The filename is the idea's `illustrationId`
(its id without the `i-` prefix), so `i-pasta` wants `pasta.webp`.

`docs/ILLUSTRATIONS.md` is the brief: every filename, the idea it belongs to,
and the scene to draw.

- **Format** `.webp` preferred, `.png` and `.svg` also picked up.
- **Size** 1200×900 (4:3) — the shape the card shows, so nothing is cropped.
  It renders at 132×99, so the scene has to read there: two figures, one clear
  object, one suggested place, not a busy street.
- **The eight that exist** are `.svg`, hand-authored by
  `scripts/pilot-illustrations.py`. Run that to regenerate them; it is their
  source. The other 57 need not be made the same way.
- **Adding one** drop the file in and rebuild. Nothing else to wire: the
  manifest is built by `import.meta.glob`, so a file that is here is used and
  an idea with no file falls back on its own.

They are not in `public/` on purpose. Vite fingerprints what is here, so a
replaced illustration is not served from a stale cache — and the manifest is
built from what actually exists, so an idea whose asset has not been drawn yet
falls back silently instead of firing a 404 for every card on every screen.
