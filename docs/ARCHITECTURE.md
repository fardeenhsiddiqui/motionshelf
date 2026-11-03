# MotionShelf architecture

MotionShelf is a static React app. Today its catalog is JSON bundled into the build. The structure below keeps that
working unchanged and makes it possible to read the same data from a REST API later, without touching any component.
No backend, database or API exists yet, and this document describes the seam where one would plug in.

## Layers

```
components and pages          what the visitor sees
        |  call hooks
src/lib/useCatalog.ts         useSections, useCategories, useItems, useItem, useAssets
        |  ask for a keyed read
src/lib/useData.ts            cache, one request per key, loading / error / ready state, retry
        |  call the repository
src/data/index.ts             exports the one CatalogRepository in use
        |
src/data/repository.ts        the interface (the contract)
src/data/staticRepository.ts  today: reads src/data/catalog.json and assets.json
src/data/filterItems.ts       pure filtering, shared by the repository and the gallery
```

Rules:

- Components never import JSON and never call `fetch` for catalog data. They use the hooks.
- Hooks return `{ status: "loading" | "error" | "ready", data, retry }`. `DataView` (`src/components/DataView.tsx`)
  renders those states the same way everywhere: loading appears only after 150 ms, errors have **Try again**, and an
  empty result shows the caller's own empty state.
- Pure logic (`filterItems`, `metaFor`, URL paths) has no React and no I/O, so a server or a script can reuse it.
- `src/lib/seo.ts` and `scripts/prerender.mjs` read the JSON directly at build time. That is correct for a build step
  and does not go through the repository.

## What stayed the same

Routing (a small History API router), the catalog JSON files and their build-time validator
(`scripts/validate-catalog.mjs`), the sandboxed previews, prerendering, and all page layouts. The gallery still
filters instantly in memory.

## Loading, error and empty states

| State | Behaviour |
|---|---|
| Loading | Header, footer and page frame stay on screen. A skeleton appears after 150 ms. |
| Error | A panel with a message and **Try again**. The rest of the page keeps working. |
| Empty | Each page says what is missing (no matches, section not open yet, no templates yet). |
| Not found | `getItem` resolves to `null`. The route shows the normal not-found page. It is not an error. |
| Attribution | The 3D model is only mounted once its credit asset has loaded. The prompt and zip actions wait for credits. |

The first render is primed: `primeCatalog()` (called in `main.tsx`) loads the shared lists for at most 50 ms before
mounting, so with bundled data nothing ever flashes empty.

## Adding a REST API later

1. Build the API (for example a Spring Boot service) in front of PostgreSQL. This is future work.
2. Implement `CatalogRepository` in a new file, for example `src/data/httpRepository.ts`, with `fetch` calls on
   `VITE_API_BASE_URL`. Validate every response at runtime (check the fields the UI reads), because network data is untrusted.
3. In `src/data/index.ts` export it instead of `staticRepository`, or choose by environment.
4. Add `VITE_API_BASE_URL` to `.env.production`. It is a public URL, never a secret.

Nothing else changes. `useData` already caches, deduplicates and retries.

| Repository method | REST endpoint | Notes |
|---|---|---|
| `listSections()` | `GET /api/sections` | small, rarely changes |
| `listCategories()` | `GET /api/categories` | small, rarely changes |
| `listItems(query)` | `GET /api/items?section=&category=&theme=&tag=&text=` | the same `ItemQuery` fields; add paging when the catalog grows |
| `getItem(id)` | `GET /api/items/{id}` | `404` becomes `null` |
| `listAssets(ids?)` | `GET /api/assets?ids=a,b` | |

Item responses include `categoryLabel`, joined by the server, exactly as `staticRepository` does today. The JSON shapes
in `src/types.ts` are the contract the API must return.

### PostgreSQL sketch

Mirrors the existing JSON, one table per concept:

- `sections(id, label, description, status)` and `categories(id, label)`
- `items(id, section_id, category_id, theme, title, summary, tags, preview_path, poster_path, files_base, responsive, created_at)`
- `item_files(item_id, path, language, position)`
- `licenses(item_id, name, spdx, license_file, author, attribution_required, attribution_text, commercial_use, redistribution, modification, original_ip, ai_generated, verified_on, notes)`
- `assets(id, type, title, file, source, author, license, clearance, ...)` and `item_assets(item_id, asset_id)`

Keep `validate-catalog` as the seed and CI check for the data that goes in.

### Authentication

Nothing needs it today. When a feature does (favorites, downloads, an admin area), the one place to add it is the
HTTP repository's request helper, which attaches the session or token. Pages that need a signed-in user would be new
routes. Existing public pages stay public and cacheable. Do not store tokens in `VITE_*` variables.

## Configuration

All environment-dependent values are `VITE_*` variables, read through `import.meta.env`, with committed non-secret
defaults in `.env.production`:

| Variable | Used for |
|---|---|
| `VITE_PREVIEW_ORIGIN` | host that serves sandboxed template previews |
| `VITE_SITE_URL` | public origin for canonical URLs, Open Graph URLs and the sitemap |
| `VITE_API_BASE_URL` | future: base URL of the REST API |
| `VITE_DATA_SIMULATION` | test builds only, see below |

## Testing the data states

Build with `VITE_DATA_SIMULATION=1` and add `?data=` to any URL: `slow` (1.5 s per read), `error` (every read fails),
`flaky` (each read fails once, so **Try again** works) or `empty`. A normal build contains none of this code.

## Deliberately not added

A state-management library, a data-fetching library, an ORM, GraphQL, a router library. None solves a current problem.
Add one only with a stated reason.
