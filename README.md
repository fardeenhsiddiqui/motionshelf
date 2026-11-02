# MotionShelf

A curated shelf of **original** animated website experiences. Preview them live, copy the
code, and check the license before you ship.

All layouts, code, graphics and copy here are original. No third-party source, no
copyrighted vehicle photos, no brand logos. Vehicles shown are fictional.

## What is in it

| Area | What |
| --- | --- |
| Homepage | Cinematic hero, smooth scroll (Lenis), page transitions (Motion), and a lazy-loaded 3D showroom (three.js / React Three Fiber) using an unbranded CC BY model |
| Gallery | Poster cards with a live hover preview, category tiles, theme and feature filters, Ctrl/Cmd+K search |
| Template page | Sandboxed live preview, desktop/tablet/mobile widths, full screen, code tabs, copy, download (single file or .zip), copy as AI prompt, dependencies, asset credits, license |
| Templates | Vortex GT (supercar), Ridgeback X (off-road), Redline Racing (motorsport), Kestrel M9 (motorcycle). Each is plain HTML + CSS + JS with a scroll-driven scene (GSAP + ScrollTrigger from a CDN) |

## Stack

React + TypeScript + Vite, plain CSS, a static JSON catalog and sandboxed iframes.
No backend, database or auth. Deploys as a static site on Cloudflare Pages.

## Run it

```bash
npm install
npm run dev            # local dev server
npm run build          # validate catalog + typecheck + production build into dist/
npm run build:release  # same, but fails on assets not cleared for redistribution
npm run preview        # serve the production build
```

## How it is organized

```
src/data/catalog.json         every item, with its license record
src/data/assets.json          every external asset: source, author, license, clearance
src/lib/                      catalog helpers, router, smooth scroll, preview + download helpers
src/components/, src/pages/   the app UI (src/components/showroom is the lazy 3D chunk)
public/previews/<id>/         each template as index.html, styles.css, script.js, LICENSE.txt, poster.webp
public/_headers               Cloudflare Pages headers (CORS for the 3D model)
scripts/validate-catalog.mjs  fails the build if license metadata or files are missing
```

## Adding a template

1. Put `index.html`, `styles.css`, optional JS, `LICENSE.txt` and a 1280x800 `poster.webp` in `public/previews/<id>/`.
2. Add an entry to `src/data/catalog.json`, including the full `license` record, every
   file in `files`, and any CDN scripts in `externalDeps`.
3. Run `npm run build`. The validator tells you what is missing.

## Preview isolation

Template previews run script-enabled code, so they are isolated twice:

1. The iframe uses `sandbox="allow-scripts allow-popups allow-forms"` **without**
   `allow-same-origin`. The frame gets an opaque origin and cannot read the app's storage,
   cookies or DOM, even when served from the same host.
2. In production the previews load from a second origin. Set `VITE_PREVIEW_ORIGIN`
   (see `.env.production`) to another host serving the same build. On Cloudflare Pages that
   is a second project (`motionshelf-previews`) that receives the identical `dist/`.

The in-app Claude browser pane blocks opaque-origin frames, so check previews in a normal browser.

## Assets and clearance

Every external asset (3D model, image, video, font) is listed in `src/data/assets.json`
with its source, author, license and a `clearance` of `cleared` or `dev-only`.
`npm run build` allows dev-only assets and prints a warning. `npm run build:release`
fails if any dev-only asset is present.

## Deploy (Cloudflare Pages)

One-time: `npx wrangler login` (opens your browser to authorize; no token is stored in the repo).

```bash
npm run deploy:previews   # builds and deploys dist/ to the motionshelf-previews project
npm run deploy            # builds and deploys dist/ to the motionshelf project
```

Deploy the previews project first so its URL exists, then the main site. Both projects
serve the same build; only the main one is linked from outside.

This repo also doubles as a personal Claude Code learning project; see `CLAUDE.md` for the working agreements.
