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

**Q3 visual quality: done.**

- Removed: the scrolling marquee, the "Four cinematic experiences" block (unbuilt concepts drawn as CSS art), and the sticky "How it works" story with its mock UI and fake terminal ("Built in 0.2s"). The home page is now hero, the real templates, the 3D showroom, and a closing call to action. Deleted `Marquee.tsx`, `Experiences.tsx`, `Steps.tsx` and their CSS.
- Hero: removed the aurora orbs, grain, pulsing "pill" badge and traffic-light window dots. The invented "4 experiences in development" and "MIT licensed code" lines became values computed from the catalog ("4 live templates", "MIT code, credits listed per asset"). Gradient text and the gradient button are now the solid ember accent.
- Gradients and glows: removed the CTA glow, the active filter tile glow and `--grad-brand`.
- Templates: no em dashes in copy, no coloured left stripes, a "TBC" placeholder instead of a dash in the Redline calendar. All four posters regenerated at 1280x800 without the baked-in scrollbar.
- Loading states: skeleton and "taking longer than usual" message for the preview frame; skeleton lines for the code panel. Errors and empties reuse the shared `.empty` panel.
- Fixed a Q1 bug found during this work: the Vortex `?thumb` check had a literal backspace character instead of `\b`, so hover thumbnails still downloaded the 3D model and the downloadable `hero3d.js` contained a control character. Now `URLSearchParams`; verified that thumb mode requests no 3D library or model.
- Featured heading and card rail now align (130 px); both previously differed by 58 px of doubled padding.
- Re-verified after the removals: 0 controls under 44 px on a phone, 12 px minimum text, keyboard and menu checks pass, console clean on all 11 routes at 3 widths, and the home-page leak loop still shows 0 growth per visit.

Kept on purpose: Inter for dense UI text with Unbounded as the display face; the four category tiles on /browse (more templates are coming); header blur (the only remaining glass use, kept for legibility over moving content); sample specifications inside the templates, which describe fictional vehicles and are meant to be replaced.

**Q4 SEO prerendering: done.**

- `scripts/prerender.mjs` (no new dependency; Node runs the shared `src/lib/seo.ts` directly) writes one HTML file per route: 10 routes plus `404.html`, with unique titles and descriptions, canonical URLs, Open Graph and Twitter tags, JSON-LD (`WebSite`, `BreadcrumbList`, `CreativeWork` for templates) and readable content for crawlers.
- `robots.txt` (allows posters, blocks `/previews/`, points at the sitemap) and `sitemap.xml` (8 URLs; template `lastmod` from the catalog) are generated, not guessed. They previously returned the app shell with HTTP 200.
- `/components` and `/anime` have no templates yet, so they are `noindex` and excluded from the sitemap.
- Unknown URLs now get `404.html` with a real 404 status (on Cloudflare Pages a root `404.html` replaces the SPA fallback). The app still renders its own not-found page.
- `useDocumentMeta` keeps title, description, canonical and robots correct during client-side navigation.
- `public/og.jpg`: 1200x630 social preview captured from the real hero.
- The build verifies its own output and fails on a missing canonical, a duplicate title, an h1 count other than one, a sitemap URL without a file, and similar. Tested by deleting `og.jpg` (build fails with a clear list).
- Verified against the built `dist/` served with Pages-style routing: 13 URLs return the right status, one h1 and one canonical each; JSON-LD parses; with JavaScript off the template page is readable; with it on the prerendered block is replaced; titles and robots follow client-side navigation including back; console clean on 13 URLs at 3 widths.
- Not verifiable locally, so check after the first deploy: that Cloudflare serves `/browse` from `browse.html` and `/templates` from `templates.html` without a redirect, and that `/nope` returns 404 (commands in the final report). Search Console and Bing Webmaster Tools verification and sitemap submission are manual steps for the site owner.

**Q5 backend-ready data layer: done.** Full description in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- `CatalogRepository` (async interface) with a JSON-backed `staticRepository`. Components read data only through hooks (`useSections`, `useCategories`, `useItems`, `useItem`, `useAssets`) over one small `useData` hook (cache, one request per key, retry). `src/lib/catalog.ts`, which mixed data and helpers, is gone; pure helpers live in `src/lib/paths.ts` and `src/data/filterItems.ts`.
- One `DataView` renders loading, error and empty states for every data-backed view. Verified with a test-only simulation build (`VITE_DATA_SIMULATION=1`, `?data=slow|error|flaky|empty`, compiled out of normal builds): header and footer stay up in every state; errors have **Try again** and recover; empty states are specific; a fast load never flashes a skeleton, a slow load shows one at about 155 ms; a missing template renders the not-found page, not an error.
- Attribution rule enforced in code: the 3D model mounts only after its credit asset has loaded, and prompt and zip wait for the credits.
- Found and fixed while testing: route-change focus landed on `<main>` for pages that now load asynchronously. It now moves to the heading as soon as it appears.
- Current behaviour is unchanged with the bundled JSON: 0 console errors on 13 URLs at 3 widths, 0 controls under 44 px on a phone, 0 nodes of growth per home visit, 13 prerendered URLs verified.

## 10. Final status of every finding

| Finding | Status |
|---|---|
| C1 blank page when the 3D chunk or model fails | Fixed (Q1), re-verified on the final build |
| C2 preview traps scrolling | Fixed (Q1). Touch behaviour still needs a real phone |
| C3 home page memory and listener leak | Fixed (Q1). 0 growth per visit on the final build |
| H1 hero console errors and extra load | Fixed (Q1), plus a broken `?thumb` check found and fixed in Q3 |
| H2 SEO missing | Fixed (Q4). Search Console and Bing submission are manual |
| H3 mobile and desktop differ | Fixed in emulation (Q2). Real-phone check pending |
| H4 invented content and mock UI | Fixed (Q3) |
| H5 no Terms or Privacy page | **Open.** Not done in this phase. The site collects nothing today. Add a short privacy statement and terms before adding analytics, forms or accounts |
| M1 navigation focus, title, scroll | Focus and title fixed (Q2, Q4). Back/forward scroll restoration is still untested |
| M2 too many filters on /browse | Reduced (features behind a disclosure). Four category tiles kept on purpose |
| M3 generic AI tells | Fixed (Q3). Inter kept for dense text with Unbounded as the display face |
| M4 `useMemo` in the gallery | Fixed as a side effect of the Q5 rewrite |

## 11. Remaining issues and what is not verified

- **The live site still runs the old code.** `https://motionshelf.pages.dev` was deployed before this audit. The blank-page, scroll-trap, leak, SEO and mobile problems exist there until you redeploy.
- **No real device was tested.** See the Android checklist in section 7. Safari, Firefox, a screen reader and a keyboard-only pass on a real machine are also untested.
- **Cloudflare Pages behaviour** (clean URLs from `browse.html`, a real 404 status, `/templates` served from `templates.html` beside a `templates/` folder, correct `robots.txt` and `sitemap.xml` content types) was verified against a local server that mimics Pages, not Pages itself. Check after deploying.
- **Privacy and terms pages** (H5 above).
- **Vortex paint switcher** is hidden while the 3D car is shown, because the model's paint is baked into its texture.
- **Template scripts** load GSAP from cdnjs and the Vortex 3D hero loads three.js from esm.sh. They render fully without them (verified), but animation and the 3D hero need the CDNs.
- **The previews project** serves the full site too. Its pages carry canonical URLs pointing at the main site, so they are not duplicates, but it is still reachable.
- **Building needs Node 22.18 or newer** (it runs TypeScript directly for prerendering).
- **The three oldest commits** still carry the co-author line, because removing it needs a history rewrite.
- **Template sample content** (specifications, prices, dates) describes fictional vehicles and is meant to be replaced by whoever uses a template.


## 12. Phase 3: production quality, comprehensive testing and issue resolution

Method: Chrome 156 and Edge 156 (both Chromium) driven over the DevTools protocol against the **deployed site**, then
the same suites against a local production build served with Cloudflare Pages-style routing and gzip. Device sizes
and touch were emulated. **No physical phone, Firefox or Safari/WebKit was available**, so none of those were tested
(see section 12.6 and 12.7).

### 12.1 Issues found, root causes and fixes

Severity: Critical = site unusable or data loss; High = visible failure or major cost for many visitors; Medium =
real defect with a workaround or limited reach; Low = polish.

| ID | Sev | Issue | Reproduction | Root cause | Fix (files) | Verified |
|---|---|---|---|---|---|---|
| P3-01 | High | **3D showroom leaks a canvas, a WebGL context and about 236 DOM nodes on every visit.** After roughly 16 visits browsers drop old contexts and 3D would fail | Home, scroll to the showroom, navigate away, repeat. Count live canvases with `Runtime.queryObjects` | three.js 0.182 keeps one module-level `DFG_LUT` texture and every renderer adds a dispose listener to it that `renderer.dispose()` never removes. The cached model's geometry and textures are also shared, and react-three-fiber never disposes a `<primitive>`. Old renderers stayed reachable, and through the canvas's parent pointers so did the detached page DOM | `showroom/Scene.tsx`: release the model's GPU resources and the shared texture when the scene unmounts | 8 visits: canvases, contexts, nodes, listeners, buffers and programs flat (was +1 canvas, +236 nodes, +28 listeners, +131 buffers per visit). 4 remounts render correctly |
| P3-02 | High | **Home page downloads the 3D scene code and model (2.7 MB raw) at load**, before any scroll | Load `/` and list requests: `Scene-*.js` and `car-concept.glb` start at about 0.2 s | "Near the viewport" used a 600 px margin and latched once. At first render the page above had not laid out, so the showroom top was at 1,329 px instead of its final 1,956 px, inside the margin | `showroom/Showroom.tsx`: 300 px margin with an explanation | Initial load 28 requests / 3.5 MB to 10 requests / 0.8 MB (local, uncompressed). 3D is ready before the section arrives on scroll |
| P3-03 | High | **Home page burns 12.5% of a CPU core idle on a laptop and 49% at phone-class speed**, nothing happening on screen | Fresh load of `/`, wait 6 s, read `TaskDuration`. Stopping CSS animations drops it to 0.1% | Five perpetual animations at once: the road (animated `background-position`, a main-thread repaint every frame), six streaks, three bobbing preview frames and the scroll cue | `styles/home.css`, `home/Hero.tsx`: one compositor-friendly road animation (`transform`), the rest removed, paused when the hero is off-screen | Idle 12.5% to 0.5% (desktop) and 49% to 2.0% (4x CPU). Off-screen: 0 running animations |
| P3-04 | Medium | **Smooth-scroll loop runs every frame forever** on every page | Fresh load of `/licensing`, idle 6 s | Lenis was driven by an unconditional `requestAnimationFrame` loop | `lib/smoothScroll.tsx`: loop runs only while a scroll is in progress | Idle 2.2% to 0.03% (desktop) and 9.7% to 0.03% (4x CPU). Wheel still eases (21 steps), settles, PageDown, hero button and route changes work |
| P3-05 | High | **Large layout shift on template pages**: CLS 0.36 desktop, 0.70 phone-class (target 0.1) | Load `/templates/vortex-gt`, read `layout-shift` entries | The template item loaded asynchronously, so `<main>` was empty at first render and the footer sat mid-screen, then jumped 2,300 px when content arrived | `lib/useData.ts`, `lib/useCatalog.ts` (seed per-item cache from the loaded list), `styles.css` (`.page { min-height: 100svh }`) | CLS 0.000 on home, browse, section, licensing, template (desktop and phone) |
| P3-06 | Medium | **Home LCP 2.3 to 2.6 s on a fast desktop** | Load `/`, read LCP | Entrance animations staggered content in over about 2.3 s and the main preview poster was lazy-loaded | `home/Hero.tsx` (about 0.9 s entrance), `PreviewThumb.tsx` (eager, high priority), `scripts/prerender.mjs` (preload the poster and the two latin fonts) | LCP 1.3 s. Phone-class medians: home 6.8 s to 5.6 s, long tasks 4.9 s to 2.9 s |
| P3-07 | Medium | **After a WebGL context loss the showroom stage went blank** (page alive, note shown, but no poster) | `WEBGL_lose_context.loseContext()` on the canvas | The poster stayed hidden because "ready" was never cleared on failure | `showroom/Showroom.tsx` | Poster and message shown; no exceptions; navigation still works |
| P3-08 | Medium | **A debug "64 fps · High quality" readout was shown to every visitor** (unnecessary UI, 11 px text) | Scroll to the showroom | The meter was tied to the adaptive-quality monitor, which is on by default | `showroom/Scene.tsx`, `Showroom.tsx`: meter only with `?perf` | Not present by default |
| P3-09 | Low | **Console warning on every page with 3D**: `THREE.Clock has been deprecated` | Load `/` on production, scroll to the showroom | `@react-three/fiber` 9.8.2 (latest stable) constructs a `THREE.Clock`, deprecated in three r183 | `package.json`: three and @types/three pinned to exactly 0.182.0 | Console clean with 3D mounted. **Revisit when R3F releases a version that no longer uses Clock** |
| P3-10 | Medium | **Keyboard: the locked preview iframe was a Tab stop with no focus ring**, and once inside, the exit was Shift+Tab through the template's links | Tab through `/templates/vortex-gt` | iframes are focusable by default; the lock only blocked pointer input | `PreviewFrame.tsx`: `tabIndex` -1 while locked; focus moves to **Done** on engage, and back to the preview button on release | Tab reaches the button; Enter engages; Tab enters the frame; Shift+Tab returns to Done; Enter releases |
| P3-11 | Medium | **Heading levels skip on `/browse`** (h1 straight to h3 card titles) | Read the heading outline | `TemplateCard` always rendered an `h3` | `TemplateCard.tsx` (`headingLevel`), `GalleryPage.tsx`, `gallery.css` | No skipped levels on any route |
| P3-12 | Low | **Contrast 4.30:1** on the "768px / 390px" viewport labels | Computed-colour check | `opacity: 0.7` | `styles.css` | 0 contrast failures on 5 page types |
| P3-13 | Low | **10.8 px text** in the viewport toggle at widths above 640 px | Minimum font probe at tablet, landscape and laptop sizes | `<small>` default size | `styles.css` | Minimum text 12 px on every route and device size |
| P3-14 | Medium | **Phone landscape: the main hero button was cut off at the fold, and template breadcrumb separators sat above the links** | 844x390 and 667x375 screenshots | Hero sized by viewport width; the Q2 tap-target change left separators unaligned | `styles.css` (short-landscape rules, `.crumbs` alignment) | Primary button fully in view at 640x360, 667x375, 844x390, 915x412 and all larger sizes |
| P3-15 | Low | **Mixed CRLF/LF line endings in a downloadable template file** (`ridgeback-x/styles.css`) | Count `\r` in the served file | Created on Windows with mixed endings | File normalised; new `.gitattributes` keeps `public/previews/**` on LF | No carriage returns in any template file |
| P3-16 | Info | Edge reports "Tracking Prevention blocked access to storage for cdnjs.cloudflare.com" on template pages | Open a template in Edge | Templates load GSAP from a third-party CDN | **Not changed on purpose.** Self-hosting GSAP would remove it, but redistributing GSAP inside downloadable templates is a licensing decision for the owner (section 12.7). Scripts load and run | n/a |

### 12.2 Investigated and found not to be bugs

Recorded so nobody re-investigates them:

- **Back/forward, rapid clicking, odd URLs**: correct with real mouse events (history entries without a user gesture are skipped by Chrome, which fooled my first scripted test). Scroll position is restored on back. `/browse/` redirects to `/browse`; `/BROWSE` is a 404.
- **Touch scroll over the locked preview**: the page scrolls (316 px vs 305 px over plain text). My first test used an unreliable synthesised gesture.
- **3D drag and rendering**: the scene renders about 3,100 draw calls per second, drag changes the picture (isolated by emulating reduced motion, which disables idle rotation), rendering stops off-screen (0 draw calls) and resumes on return.
- **Failed CDNs, failed 3D chunk, failed model**: templates still render with the CDNs blocked, and the app never goes blank.
- **Iframe isolation**: from inside each preview frame, parent DOM, parent storage, cookies and `top` all throw `SecurityError`, and `self.origin` is `null`.
- **Copy, prompt, single-file and ZIP downloads**: byte-identical to the live source for all four templates (the ZIP opens with a standard tool). Windows normalises clipboard newlines, which is not a site issue.
- **Hero button lands 88 px below the showroom's top edge**: Lenis computes this; the heading is comfortably visible.
- **Frame rate at 4x CPU throttle varies from 21 to 56 fps** between runs. This machine renders WebGL in software, so it is a diagnostic, not a gate.

### 12.3 Before and after

Same-environment comparisons (old commit `feeb58c` against the fixed build, both served gzip'd by the same test
server, interleaved A/B runs, medians). Absolute times were inflated by a busy machine; the direction held in every run set.

| Measurement | Before | After |
|---|---|---|
| Home idle CPU, 4x CPU, nothing moving | 49% of a core | 2.0% |
| Home idle CPU, desktop | 12.5% | 0.5% |
| Static page idle CPU (4x CPU) | 7.8% (`/licensing`) | 0.09% (`/browse`) |
| Home first load | 28 requests, 3.5 MB (raw) | 10 requests, 0.8 MB (raw) |
| Home LCP, desktop | 2.3 to 2.6 s | 1.3 s |
| Home LCP, phone-class (4x CPU, slow 4G), median of 6 | 6.8 s | 5.6 s |
| Home long-task time, phone-class | 4.9 s | 2.9 s |
| Template CLS | 0.364 desktop, 0.698 phone-class | 0.000 |
| Template long-task time, phone-class | 3.1 s | 2.0 s |
| Showroom visits: DOM nodes / listeners / canvases per visit | +236 / +28 / +1 | 0 / 0 / 0 |
| 72 navigations across every route: nodes, listeners, heap | not measured | +0, +0, +0.4 MB |
| Initial JavaScript (gzip) | 136 kB | 136 kB (unchanged; budget 150 kB) |
| 3D scene code (lazy, gzip) / model | 285 kB / 1.7 MB, loaded at page load | same files, loaded only when the section is near |
| Showroom frame rate, desktop | 60 fps | 60 fps |

### 12.4 Test coverage

All suites live in the session scratchpad (they drive Chrome DevTools directly, not part of the repo) and were run on
the live site, then on the final build.

| Area | What was checked | Result |
|---|---|---|
| Routes and SEO | 13 URLs: status, unique title, one canonical, one h1, JSON-LD parses, noindex only where intended, 404 status, robots, sitemap, no-JS content, head follows client-side navigation | Pass on live (Edge and Chrome) and on the final build |
| Navigation and interaction | Back/forward, 12 rapid clicks, history spam, 7 unusual URLs, gallery search, theme, category, feature filters, Clear filters, `/` and Ctrl+K | Pass |
| Templates (4) | Frame loads, separate origin, sandbox attribute, iframe isolation, GSAP ran, 3D in sandbox, viewport toggles, Reload, interact/Done, fullscreen, every code tab, Copy, Copy as prompt, ZIP, single download | Pass |
| 3D showroom | Load, fps, camera, drag, off-screen pause, context loss, memory over 8 visits, phone opt-in, remount rendering | Pass (fps at 4x throttle informational) |
| Stability | 72-navigation tour over every route, 8-visit showroom loop, idle cost by page, smooth-scroll behaviour | Pass |
| Devices (emulated) | iPhone SE, iPhone 14, Pixel 7, Galaxy S8 portrait; iPhone 14, Pixel 7, iPhone SE landscape; iPad portrait and landscape; laptop. 9 routes each: overflow, tap targets, text size, console. Touch: menu, tap, swipe | Pass |
| Accessibility | Real Tab traversal on 5 page types, focus visibility, accessibility-tree names, computed contrast, landmarks, heading order, alt text, iframe titles, zoom | Pass |
| Performance | LCP, FCP, CLS, long tasks, requests, bytes, idle CPU, interleaved A/B under phone-class throttling | See 12.3 |

Browsers: Chrome 156 and Edge 156 (Chromium). Firefox and WebKit were not installed and were not downloaded.

### 12.5 Production verification (before these fixes are deployed)

The deployed site was verified on 2026-11-04. Routes, titles, canonicals, 404 status, robots, sitemap, template
previews, isolation, copy and downloads all pass. Cloudflare serves `/browse` and `/templates` directly with no
redirect, `/browse/` redirects to `/browse`, and unknown paths return 404. The deployed site **still shows P3-01 to
P3-15**, because those fixes are in the repository but not yet deployed (deploying needs a Cloudflare token, which is
not stored anywhere).

### 12.6 Remaining limitations

- No physical-device testing. Touch behaviour, iOS Safari (toolbars, `svh` units, WebGL limits), Android Chrome
  performance and thermal behaviour are unverified.
- Firefox and Safari/WebKit untested.
- No screen reader pass. Contrast was computed for text on solid backgrounds; text over gradients or images was skipped.
- WebGL was rendered in software here, so showroom frame rates are not representative of real GPUs.
- Terms and Privacy pages are still not written (H5). The site collects nothing today.
- `three` is pinned to 0.182.0 because of P3-09. Revisit when `@react-three/fiber` stops using `THREE.Clock`.
- P3-16 is unchanged.
- Initial JavaScript is 136 kB gzip. A further reduction would need replacing parts of the animation library; it is
  within budget, so it was left alone.

### 12.7 Needs the owner (not done on purpose)

1. **Redeploy** to ship the fixes (commands in `README.md`; needs a Cloudflare API token set in your own shell).
2. **GSAP licensing and hosting**: decide whether to self-host GSAP inside templates (removes the Edge notice and the
   CDN dependency) after checking GreenSock's current license terms for redistribution.
3. **Terms and Privacy pages**: decide the wording before adding analytics, forms or accounts.
4. **Real feedback**: send `docs/USER_FEEDBACK.md` to developers and freelancers. No feedback exists yet.

### 12.8 Android checklist (about 10 minutes)

Use Chrome on mobile data, after redeploying.

1. Home: scroll top to bottom without stopping. Any freeze or jank?
2. Tap **Load 3D showroom** (about 2 MB). It should load; then swipe vertically over the car (the page should
   scroll) and horizontally on the car (it should rotate).
3. Navigate Home, Browse, a template, back, forward. No blank screens or stuck loading.
4. On a template, swipe up with your thumb on the preview: the **page** should scroll. Tap **Tap or click to
   interact**, scroll inside the preview, tap **Done**.
5. Rotate to landscape on the home page: the **Browse templates** button should be fully visible.
6. Browse: tap every filter, type in search, make sure no tap misses.
7. Tap **Copy HTML** and paste somewhere; tap **Download all (.zip)** and open the file.
8. Optional: USB debugging and `chrome://inspect` on your PC to read the console, and tell me anything red.

## 13. Phase 4: browser testing, template polish, anime section

Starting point: commit `61c493f`. Everything below was tested in headless Chrome 157 and Edge 157 over the DevTools
protocol with real mouse, touch and keyboard events. Firefox and WebKit are **not installed** here and were not
tested; I did not download them. No physical devices were used.

### 13.1 Part 1: browser testing

| Check | Result |
|---|---|
| 12-device matrix (iPhone SE/14, Pixel 7, Galaxy S8, iPad, laptop, 1080p, 1440p; portrait and landscape, touch on for phones and tablets): overflow, tap targets, minimum text, console, one `h1` | App routes `/`, `/browse`, `/templates`, `/anime`, `/licensing`, a template, the three anime pages and the 404: **all pass in Chrome** |
| The same matrix on the seven standalone template pages in Edge | Pass, except 3 invisible radio inputs (opacity 0, 13 px) behind the 44 px colour swatch labels in three templates. They are not tap targets, so this is a probe false positive |
| Behaviour tests on the four vehicle templates (scene active, scroll-spy, HUD follows scroll, wheels turn, captions visible, menu open/Escape/link-close on a touch phone, skip link, reduced motion, CDNs blocked, no console errors) | All pass in Chrome and Edge |
| Behaviour tests on the three anime pages (four sizes incl. landscape, overflow, console, tap targets, skip link, scene steps, pause off screen, Hit button, reduced motion) | All pass in Chrome and Edge |

Reproducible issues found and fixed:

- **A1. Tap targets and tiny text in the templates.** Logos were 30 to 34 px tall, buttons 41 to 42 px, the footer
  "Back to top" link 21 px, and several labels were 11 px. Root cause: the 44 px rule was only inside
  `@media (pointer: coarse)`, which does not match in every touch context. Fixed with an unconditional 44 px minimum
  on the logo, buttons and footer links, and a 12 px text minimum.
- **A2. Offscreen animation kept running.** `.is-paused *` does not match pseudo-elements, so the Kestrel sea
  (`.sea::after`) and similar loops never paused. Fixed by pausing `*::before` and `*::after` too, and by pausing the
  Redline ticker offscreen.
- **A3. Committed posters were at risk of corruption.** `.gitattributes` marks everything under `public/previews/` as
  text with LF endings, so git rewrote bytes inside binary `.webp` posters (3 of 4 differed from the files on disk
  in my first commit). Fixed by marking `webp`, `glb`, `png`, `jpg` and `woff2` there as `binary`; the committed
  blobs now match the files byte for byte. Posters in `61c493f` are intact (RIFF sizes checked).
- **A4.** My first idle-CPU comparison showed a false Vortex regression because the baseline server had no 3D model
  file (404), so the baseline never rendered the 3D hero. Re-run with the model present: equal (98 % vs 98 %).

### 13.2 Part 2: feedback preparation

`docs/USER_FEEDBACK.md` already had a good question list. Added a short paste-ready message for chat or email, a
two-minute version, steps for the template scroll scene, menu and hover or tap, a question on how believable the
vehicles and scenes look, and a question on the Anime Assets section. The response log is still empty on purpose:
**no feedback has been received**, and none is invented.

### 13.3 Part 3: template polish

All four templates were rebuilt around better artwork and richer scenes (scope kept to the four existing templates).

- **Vehicles.** New detailed vector artwork generated from one script: lit body gradients, glass with glint, panel
  lines, brake discs with calipers and computed spokes, headlight and tail lights. It is SVG, so it recolours with the
  existing swatches, stays small, and keeps the wheel-spin hooks the scroll scenes use. Vortex still has its separate
  3D model. A fully 3D model per template would need licensed or commissioned models; I did not research those in
  this pass, so it is the owner's call.
- **Environments and scenes.** Vortex: street lamps, headlight beam and exhaust flame on each upshift. Ridgeback:
  drifting clouds and a dust trail whose density follows scroll speed (replaced ten infinite tweens). Redline: dimmed
  CSS crowd (stylesheet 188 kB to 19 kB), HUD and caption scrims. Kestrel: gulls, glitter on the sea, headlight beam.
- **Navigation.** Skip link, current-section highlight, animated underline, a 44 px menu button with Escape and
  link-close on phones. The menu does not depend on GSAP, so it still works if the CDN is blocked.
- **Hover and touch.** Lift and border on cards, press feedback on buttons, hover effects only where hover exists.
- **Readability.** Captions sit on a soft radial scrim so they stay legible over busy scenes; checked in screenshots
  on desktop and phone.
- **Mobile performance.** Scene loops (idle vibration, shake, dust, lamps) run only while the scene is on screen;
  no `drop-shadow` filters on scrubbed elements; camera shake skipped on touch devices; `content-visibility` on
  sections far below the fold.

Measured idle main-thread time at 4x CPU throttle, interleaved A/B (3 runs each, medians; **headless Chrome with
software rendering, so only the comparison is meaningful, not the absolute values**):

| Template | In view, before to after | Scrolled to the bottom, before to after |
|---|---|---|
| Vortex GT | 98 % to 98 % (the 3D canvas dominates both) | 79 % to 50 % |
| Ridgeback X | 79 % to 60 % | 76 % to 28 % |
| Redline Racing | 85 % to 66 % | 75 % to 67 % |
| Kestrel M9 | 86 % to 81 % | 86 % to 62 % |

That run came before fix A2. After it I only have single, noisy samples (for example Ridgeback and Redline near
23 % with the scene scrolled away), so I do not claim a number for the final state. These templates are still much
heavier than the anime scenes below; the next step would be replacing the remaining always-on loops with
scroll-driven ones.

### 13.4 Part 4: Anime section

- Research and the licence rules are in `docs/ANIME_ASSETS.md`. Decision: **original assets drawn in code, no
  third-party art, no fonts**, so there is nothing to attribute. VRoid, Live2D, fan art and generator outputs were
  rejected for redistribution or likeness risk.
- Three items, built on the existing catalog: **Sakura Dusk** and **Neon Rain** (scroll-driven parallax scenes,
  category Backgrounds & scenes) and **Impact Frames** (CSS manga effects with a Hit button, category Effects).
  Category **Characters** exists with no items and shows "Coming soon" on purpose.
- Architecture change (small, explained here because the project asks for it): categories now belong to a section
  (`category.section`), so `/anime` shows its own filters instead of the car categories. The validator rejects an
  item whose category is in another section. Card button, SEO title and search placeholder are section-aware.
- Section status set to `live`, so it is indexed; the sitemap now has 12 URLs (1 noindex: Components, still empty).
- Anime pages measured at 4x throttle: Sakura Dusk 0.5 % of a core in view, Neon Rain 5 to 10 % (constant rain),
  Impact Frames 1 to 5 %; all about 0.1 % once scrolled away. Loops pause off screen; reduced motion shows a still
  frame with zero running animations.
- Every item is MIT, `originalIp: true`, `aiGenerated: true`, with `verifiedOn` 2026-11-12.

### 13.5 Remaining issues and what I did not verify

- **Firefox and WebKit** were not available and not tested. Safari-specific risks to check on a Mac or iPhone:
  `paint-order` on the Impact Frames title, `contain: paint` with sticky stages, CSS `calc()` with `clamp()` in
  opacity, and `100svh`.
- **Physical devices** were not used. Emulation does not reproduce thermal throttling or real touch scrolling.
- Phone view of Sakura Dusk and Neon Rain crops the sides (the tree and some signs are off screen); the centre
  subject stays visible.
- Idle CPU numbers come from software-rendered headless Chrome and are for comparison only.
- Vortex still pays for the 3D canvas while the hero is in view.
- **Needs the owner:** redeploy (Cloudflare token in your own shell); GSAP self-hosting and licence decision;
  Terms and Privacy pages; real feedback from `docs/USER_FEEDBACK.md`; choose whether to commission or license a
  3D vehicle model per template and an original anime character.
