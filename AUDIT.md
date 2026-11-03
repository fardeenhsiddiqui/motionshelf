# MotionShelf quality, architecture and experience audit

Audited: https://motionshelf.pages.dev (commit `f04503c`) on 2026-11-03.
Method: Chromium (Edge 156) driven over the DevTools protocol against the live site, plus a read of all app source. Every finding below says how it was measured. Anything not measured is listed under "Testing gaps".

Checklist used: [DESIGN_AND_ENGINEERING_CHECKLIST.md](DESIGN_AND_ENGINEERING_CHECKLIST.md).

## 1. Summary

The routes load and look clean, and the four templates work, including with their CDNs blocked. The "stuck" reports are explained by three real defects:

1. **Any failure of the lazy 3D code blanks the whole site.** There is no error boundary.
2. **The live preview traps scrolling.** Wheel and touch input over the iframe scrolls the frame, not the page.
3. **The home page leaks memory and event listeners** on every visit, and loads three full template pages in the hero.

Mobile differs from desktop mostly through small tap targets, a preview frame that fills the screen width, and desktop-only controls. SEO is effectively absent: every route has the same title and the SEO files do not exist.

## 2. Findings and evidence

### Critical

**C1. A failed 3D chunk or model blanks the entire app.**
- Evidence: blocking `Scene-*.js` (the lazy chunk) and, separately, `car-concept.glb`, then scrolling to the showroom. Result both times: `#root` has 0 children, no header, no text.
- Root cause: `Showroom` renders `lazy(() => import("./Scene"))` inside `Suspense`, and `Scene` uses `useGLTF`. Both throw on failure. There is no `ErrorBoundary` anywhere, so React unmounts the whole tree.
- Likely real-world triggers: a flaky mobile connection, or the visitor holding a stale page after a redeploy (the chunk hash changes, the old URL 404s). The tap-to-load button makes this reachable on phones.

**C2. The preview iframe captures scrolling, so the page appears stuck.**
- Evidence, desktop 1440x900, mouse wheel over the Vortex preview, 12 ticks: page scrolled **0 px**; the frame scrolled 2,400 of 4,516 px. The page only resumes after the frame content is exhausted.
- Evidence, emulated phone 390x800, touch scroll over the preview: page scrolled **0 px**. The frame is 316 px wide in a 390 px viewport, leaving about 37 px gutters to grab. (The frame's own scroll stayed at 0 in emulation, so the gesture was swallowed rather than measured; see Testing gaps.)
- Root cause: each template is a tall, scroll-driven page (3,000 px+ pinned scenes) embedded as a scrollable frame inside a scrolling page.

**C3. Memory and event listeners grow on every visit to the home page.**
- Evidence, SPA navigation home to licensing 8 times, GC forced: about **+455 DOM nodes and +24 listeners per visit**, never released (3,505 to 12,605 nodes over 20 loops; 3.6 to 8.2 MB heap). The same loop on /browse, /licensing and template pages: **0 growth**.
- Bisect by removing components from the home page: without `Hero`, growth is 0. Removing the hero's preview stack alone does not stop it (still +427 per visit). Removing the iframes by hand before leaving does not stop it either. So the leak is in the hero's scroll-linked motion code (`useScroll({ target })`, `useTransform`, `useSpring`), not the iframes. The showroom's `useScroll` may add a smaller share (609 vs 457 per visit with and without it).
- Exact line not yet isolated. That is the first task of the fix milestone.

### High

**H1. Home page loads three live template pages, and logs three console errors.**
- Evidence: Edge logs `Blocked script execution in .../previews/{ridgeback-x,redline-racing,vortex-gt}/ because the document's frame is sandboxed...` on `/`. Home LCP 2.5 s on desktop and 2.4 s on a throttled phone profile; other routes 0.2 to 0.6 s on desktop. Home pulls 125 kB from cdnjs and shows 4 long tasks (393 ms).
- Root cause: `Hero` renders `PreviewThumb` without a `poster`, so each frame is a live iframe with scripts disabled. The templates then try to run their scripts. The posters already exist.
- My earlier route sweep missed this because it counted `console.error` calls and not browser log entries.

**H2. SEO is missing.**
- Evidence: every route returns `<title>MotionShelf</title>` and the same meta description (curl of `/`, `/browse`, `/templates/vortex-gt`). `robots.txt`, `sitemap.xml` and `og.png` all return **200 text/html** (the SPA shell). An unknown URL like `/nope` returns **200**, a soft 404. No canonical, Open Graph, Twitter card or structured data.
- Root cause: a single `index.html` and client-side rendering only. No per-route head management, no prerendering, no static SEO files.

**H3. Mobile and desktop differ in unintended ways.**
- Evidence (390 px, measured): interactive elements under 40 px high: home 6, `/browse` 24, template page 18, licensing 15 (for example "Browse all" 68x22, "Licensing" 63x22, "Dark" 57x32, "Full screen" 105x40, per-file download 100x32). Smallest text is 11 px. The browse search placeholder is truncated ("...feature"). On the template page the Desktop/Tablet/Mobile viewport toggles are shown on a phone, where they do nothing useful, and the preview starts below a long summary plus nine tags.
- Root cause: layouts were shrunk from desktop rather than designed for the phone.

**H4. Some content is invented or mock.**
- Evidence: `components/home/Steps.tsx` prints `✓ Built in 0.2s. Ready to deploy.` in a fake terminal window (warnings 12/14/18). The hero says "4 experiences in development". `home.css` has mock UI blocks (`.vp-hero`, `.vp-row`) standing in for products.
- To confirm visually: the "Experiences" and "Steps" sections, which I read in code but have not yet reviewed in screenshots.

**H5. No Terms or Privacy page.** Searched all pages and components: none exist. The site collects nothing today, so a short truthful "no cookies, no tracking, no accounts" page plus basic terms is enough for now.

### Medium

- **M1. Navigation behaviour (code inspection only).** The router updates the URL and scrolls to top but does not set the document title, move focus, or restore scroll on back/forward.
- **M2. Too many filter layers on /browse.** Section tabs, theme control, category tiles and feature chips, over four items. The category tiles repeat information the section tabs and chips already give.
- **M3. Generic-AI tells** (checklist section 1), preserving the cinematic identity:
  - 22 `linear-gradient`, 19 `radial-gradient` and 1 `conic-gradient` in the app CSS, including gradient headline text and an orange-to-amber button (#1, #22).
  - Terminal-style three-dot window bars on the hero frames (#14).
  - `backdrop-filter` in 5 places (#8).
  - Coloured left-stripe callouts in the credit line and two templates (#11).
  - Em dashes in all four templates (#9).
  - A visible scrollbar inside the live thumbnails on the home hero.
- **M4. `useMemo` in `GalleryPage` does nothing**, because `itemsInSection` returns a new array each render. Harmless at four items.

### Checked and fine

- All 12 routes at 1440, 820 and 390 px: no console errors, failed requests or horizontal overflow. The route sweep, the 404 pages and the three non-home leak loops were clean.
- Template pages and their iframes load from the preview origin with the correct sandbox; the Vortex 3D hero renders inside the sandbox.
- **CDN dependence is safe.** With `cdnjs.cloudflare.com` and `esm.sh` blocked, all four templates still render their content, with 0 JS errors (page height drops as the scroll scenes switch off).
- Showroom: 61 fps while scrolling, 49 fps at 4x CPU throttle.
- Page weight: 250 to 450 kB per route; main bundle about 138 kB gzip.

## 3. Root causes (short)

| Symptom | Root cause |
|---|---|
| Blank page | Lazy 3D chunk and model fetch throw with no error boundary |
| Page will not scroll | Scroll-driven templates embedded as scrollable frames |
| Slow, heavier home, growing memory | Live iframes in the hero; hero scroll-motion subscriptions not released |
| Console errors on home | Live thumbnails with scripts disabled |
| No search presence | Client-rendered single HTML shell, no per-route head, no static SEO files |
| Mobile feels different | Desktop-first layout; small tap targets; frame fills the width |

## 4. Proposed fixes

**Q1. Resilience and "stuck" fixes** (no architecture change)
1. Add an `ErrorBoundary` around the showroom and one around the routed page; fall back to the poster plus a retry button. Handle a failed lazy import by reloading once.
2. Make the preview inert until activated: a "Click to interact" overlay (pointer events off), a clear exit control and Esc. Hide the viewport toggles on phones and give the frame a fixed height that fits the screen.
3. Hero uses poster images, not live iframes. This also removes the console errors and the extra requests.
4. Find and fix the hero scroll-motion leak; add a regression check (20 navigations, node and listener counts flat).

**Q2. Mobile and accessibility**
Raise tap targets to 44 px; text to at least 12 px (body 16 px); shorten the template page header on phones and put the preview first; fix the truncated search placeholder; move focus and set the title on route change; reduce the filter layers on /browse.

**Q3. Visual quality** (per the checklist)
Replace the fake terminal and invented output with real content; remove terminal window chrome, mock UI blocks and left stripes; cut gradients and glass to the few that earn their place; remove em dashes; hide the scrollbar in thumbnails. Keep the dark, ember, cinematic identity.

**Q4. SEO** (needs your approval, see section 6)
Per-route title, description, canonical and Open Graph; a real 1200x630 image; `robots.txt` and `sitemap.xml`; a real 404 or `noindex`; `BreadcrumbList` and template structured data; a Terms and a Privacy page.

**Q5. Backend-readiness refactor** (needs your approval, see section 5)

**Q6. Full re-test, real-phone test, then deploy** (only when the above is complete).

## 5. Backend-readiness assessment

**Current shape.** Static React SPA. Catalog and assets are JSON imported at build time. A small History API router. No network calls apart from fetching template source files.

| Area | State | Verdict |
|---|---|---|
| Routing | Hand-written `usePath`, a route function in `App.tsx`. Works for static pages | **Keep.** Add title and focus handling. Not worth a router library yet |
| Data access | Components call synchronous `catalog.ts` helpers over imported JSON | **Change.** The one seam that matters. Make these async and return loading and error states |
| Business logic | Mostly in `lib/` already (`matchesQuery`, `buildPrompt`, `zipFiles`). Filtering is inline in `GalleryPage` | **Mostly keep.** Move the filter predicate into a pure `filterItems` function so a server can later do the same |
| API readiness | None. `catalog.json` and `assets.json` already resemble REST resources (`/items`, `/assets`, `/categories`) | **Small change.** An `api.ts` that today reads JSON and later calls `fetch` |
| Authentication | Not needed today | **Reserve the seam only.** One `apiFetch` wrapper where credentials or tokens attach; no auth UI now |
| Error handling and validation | No error boundary. Catalog data is cast with `as Catalog`, never validated at runtime. A build-time validator exists | **Change.** Add boundaries now (Q1). Validate API responses at runtime when a backend exists |
| Config | One variable, `VITE_PREVIEW_ORIGIN`, in a committed `.env.production` | **Keep.** Add `VITE_API_BASE_URL` when needed. Secrets never go in `VITE_*` |

**Practical architecture, when you want a backend.**
- Keep the static frontend on Cloudflare Pages. Add a small REST API (for example a Cloudflare Worker or Pages Function) that talks to PostgreSQL.
- Tables mirror the existing JSON: `categories`, `items` (with `license` columns), `assets`, `item_assets`, `item_files`. Later: `users`, `favorites`, `downloads`.
- Endpoints: `GET /api/items?section=&category=&q=`, `GET /api/items/:id`, `GET /api/assets`. Return the same shapes as the JSON today, so the frontend types do not change.
- Move catalog edits from hand-edited JSON to the database, and keep `validate-catalog` as a seed and CI check.
- Order of work: (1) add the async data layer and error states against the JSON, (2) build the API against Postgres, (3) switch the data layer to `fetch`, (4) add auth only when a feature needs it.

**Avoid for now:** state management libraries, a data-fetching library, an ORM, a router library, GraphQL. None solves a current problem.

## 6. Decisions I need from you

These change architecture, so I will not start them without your agreement:
1. **Prerendering for SEO (Q4).** The honest way to give crawlers real titles and content is to generate a static HTML file per route at build time. Smallest option: a short Node script in `scripts/` that runs after `vite build` and writes `dist/<route>/index.html` from a template with per-route head tags. It needs no new dependency. The alternative, leaving the SPA as is, means search engines and social previews see one generic page.
2. **Async data layer (Q5).** Described above. It touches every page that reads the catalog, but the change is mechanical.

Q1 to Q3 do not need approval and I am proceeding with them.

## 7. Testing gaps (not verified)

- **No real device was tested.** Everything above used emulated 390 and 820 px viewports and emulated touch. That does not prove real-phone compatibility. Unverified: touch scrolling over the preview on a real phone (the emulated swipe left the frame at scroll 0, so the result is partly inconclusive), iOS Safari behaviour, browser toolbar resizing, the showroom tap-to-load flow, WebGL on a real mobile GPU, and thermal throttling.
- **Only Chromium (Edge) was used.** Firefox and Safari are untested.
- **No keyboard-only, screen reader or contrast-measurement pass.**
- **Back/forward scroll restoration** was read in code but not exercised.
- **Not yet reviewed visually:** the Experiences and Steps sections, the licensing page, and the template pages' lower half (code panel, credits).
- **Slow-network behaviour of the 3D opt-in** was only simulated.

### How to test on your Android phone

1. Open https://motionshelf.pages.dev in Chrome on the phone, on mobile data (not Wi-Fi).
2. Home: scroll top to bottom. Does it ever freeze? Tap "Load 3D showroom". Does it load, and does the page still scroll afterwards?
3. Open Vortex GT. Put your thumb on the preview and swipe up. Does the page scroll, or only the preview?
4. Rotate the phone to landscape and repeat step 3.
5. Browse: tap each filter, type in search, and note any tap that misses.
6. Optional, for exact errors: enable Developer options and USB debugging, connect the phone to the PC, open `chrome://inspect` in desktop Chrome, inspect the page and send me the Console output.

## 8. Implementation sequence

1. Commit this checklist and audit.
2. **Q1** resilience and stuck fixes. Build, test, commit, push.
3. **Q2** mobile and accessibility.
4. **Q3** visual quality.
5. Pause for your decisions on Q4 and Q5, then implement.
6. **Q6** full re-test (including the real-phone pass above). Deploy only after that.

## 9. Progress

**Q1 resilience and "stuck" fixes: done** (measured on a local build of the new code, same method as the findings).

| Finding | Before | After |
|---|---|---|
| C1 blank page when the 3D chunk or model fails | `#root` empty | Page stays up; poster plus "The 3D view could not load" note |
| C2 preview traps scrolling | Wheel over preview: page moved 0 px | Locked by default: page moved about 2,000 px. After "Click to interact": frame scrolls, page does not, Done button shown. Escape, Done, or scrolling away releases it. Viewport toggles hidden on phones |
| C3 home page leak | +455 nodes and +24 listeners per visit | 0 nodes per visit, listeners flat (174 to 175 over 10 visits) |
| H1 hero console errors and extra load | 3 console errors, 3 live iframes on home | 0 errors, 0 live iframes. Hover previews now run in the isolated sandbox with scripts on (`?thumb` skips the 3D model) |

Root cause of C3: motion's `useScroll({ target })` retained the page. Replaced by `useScrollProgress`, one passive scroll listener removed on unmount.

Not yet re-checked on a real phone. See section 7.

**Q2 mobile and accessibility: done** (measured on a local build; 390 px touch emulation, not a real phone).

- Controls under 44 px on a phone: home 6, /browse 24, template page 18, licensing 15 before; **0 on every route after** (measured on `/`, `/browse`, `/templates`, `/licensing`, two template pages, `/nope`).
- Smallest text raised from 11 px to 12 px everywhere except the "In development" pill that Q3 removes. Muted text contrast raised (`--faint` is now `#7e879a`).
- Keyboard: skip link; focus moves to the page heading after every route change; arrow keys, Home and End move between file tabs; Escape closes the mobile menu and returns focus to its button; the menu button reports open or closed state.
- Reduced motion: with `prefers-reduced-motion: reduce`, 0 CSS animations run on the home page (16 otherwise) and smooth scrolling is off. Framer-motion animations follow the setting through `MotionConfig`.
- Template page: the header shows 4 feature tags, the full list is in Details. Preview "Done" control stays visible while the preview is active. Licensing tables are keyboard-scrollable regions.
- /browse: the feature chips sit behind a "Features" disclosure, and the search placeholder is no longer cut off.
- Console clean (errors and warnings) on all 11 routes at 1440, 820 and 390 px, and no horizontal overflow on a phone.
