# Idea illustrations

One drawn scene per date idea. The filename is the idea's `illustrationId`
(its id without the `i-` prefix), so `i-pasta` wants `pasta.webp`.

`docs/ILLUSTRATIONS.md` is the brief: every filename, the idea it belongs to,
and the scene to draw.

- **Format** `.webp` preferred, `.png` and `.svg` also picked up.
- **Size** 1200×900 (4:3). Rendered small, so the scene has to read at 92px
  wide — two figures and one clear object, not a busy street.
- **Adding one** drop the file in and rebuild. Nothing else to wire: the
  manifest is built by `import.meta.glob`, so a file that is here is used and
  an idea with no file falls back on its own.

They are not in `public/` on purpose. Vite fingerprints what is here, so a
replaced illustration is not served from a stale cache — and the manifest is
built from what actually exists, so an idea whose asset has not been drawn yet
falls back silently instead of firing a 404 for every card on every screen.
