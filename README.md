# MotionShelf

A curated shelf of **original** website templates, UI components and backgrounds.
Preview them live, copy the HTML/CSS, and check the license before you ship.

Inspired by the browsing experience of component libraries like ThreeUI. All layouts,
code, graphics and copy here are original. No ThreeUI source, no copyrighted vehicle
photos, no brand logos.

## Sections

| Section | Status |
| --- | --- |
| Automotive Templates | Live: first template is **Vortex GT** |
| UI Components & Backgrounds | Planned |
| Anime Assets | Later, only with cleared licenses |

## Stack

React + TypeScript + Vite, plain CSS, a static JSON catalog, and sandboxed iframes for
template previews. No backend, database, auth or Three.js. Deploys as a static site
(Cloudflare Pages compatible).

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # validate catalog + typecheck + production build into dist/
npm run preview  # serve the production build
```

## How it is organized

```
src/data/catalog.json        every item, with its license record
src/lib/                     catalog helpers and a tiny History API router
src/components/, src/pages/  the app UI
public/previews/<id>/        each template as plain index.html + styles.css + LICENSE.txt
scripts/validate-catalog.mjs fails the build if license metadata or files are missing
```

## Adding a template

1. Put `index.html`, `styles.css` and `LICENSE.txt` in `public/previews/<id>/`.
2. Add an entry to `src/data/catalog.json`, including the full `license` record.
3. Run `npm run build`. The validator tells you what is missing.

## Notes

- Previews use `sandbox="allow-same-origin"` (scripts off). Vite's dev and preview servers
  render fully opaque-origin sandboxed frames blank. A template that needs JavaScript
  should be previewed from a separate origin instead of adding `allow-scripts` here.
- This repo also doubles as a personal Claude Code learning project; see `CLAUDE.md` for
  the working agreements.
