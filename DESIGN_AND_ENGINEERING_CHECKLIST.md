# MotionShelf design and engineering checklist

> Create a checklist and always check before writing a prompt and designing any section. Never start implementation until the requirements, design principles, architecture, responsiveness, performance and user experience have been reviewed.

This file is **mandatory for every future change**: new sections, pages, templates, components and fixes. Before writing code, or a prompt that will produce code, walk through it. In the commit message or notes, record anything you consciously chose to break and why.

## 0. Pre-flight gate (answer before you start)

1. **Requirement.** What problem does this solve, for whom? Is there a simpler way?
2. **Design.** Which warnings in section 1 apply? Does the result still look like cinematic automotive, not a SaaS dashboard?
3. **Architecture.** Where does the data come from? Where does the logic live? Does it fit the structure in section 4, or does it need an approved change?
4. **Responsiveness.** How does it behave at 360, 390, 768, 1024 and 1440 px, and with touch?
5. **Performance.** What does it cost in bytes, requests, main-thread time and animation frames? Is it inside the budgets in section 3?
6. **UX states.** What are the loading, error, empty and success states?
7. **Accessibility, SEO, security, licensing.** Sections 2, 5 and 6.

Do not start implementing until each of these has an answer.

## 1. The 30 "looks vibecoded" warnings

These are heuristics, not laws. Each one is a *tell* when used by default, without a reason. The test is always: **does this serve the product, or is it decoration I reached for out of habit?** "Fine when" says when the choice is justified.

| # | Warning | Generic or poor when | Fine when |
|---|---|---|---|
| 1 | Harsh gradients | Used on text, buttons and backgrounds just to look "modern" | One restrained gradient carries meaning, such as a light falloff or a sunset in a scene |
| 2 | Lucide icons | A default icon set decorates every card and heading | Icons aid scanning of real actions, or are custom and consistent |
| 3 | Pure white background | `#fff` with grey cards, the default template look | The brand is genuinely light; use a warm off-white and a tinted neutral scale |
| 4 | Rainbow colouring | Many hues with no hierarchy | A defined accent plus neutrals; a product colour switcher showing real colours |
| 5 | Drop shadows | Stacked soft shadows on every card | Shadow separates a floating layer, or models real light in a scene |
| 6 | 3 feature cards in a row | The default "icon, title, sentence" trio | The three items really are parallel and each has real content or a visual |
| 7 | Emojis | Used as icons or in headings | Never as UI. Plain text glyphs such as a copy confirmation are fine |
| 8 | Liquid glass | Blur and translucency on everything | A single overlay that sits over moving imagery and needs legibility |
| 9 | Em dashes | Used in copy as a rhythm tic | Rare, deliberate punctuation. Prefer commas and full stops |
| 10 | Inter, Geist, Space Grotesk | The font is the unexamined default | The face was chosen for the brand; Inter is fine for dense UI text if the display face carries identity |
| 11 | Coloured left stripe | A card or quote with a 3px accent border | A true blockquote or callout whose meaning the stripe carries |
| 12 | Fake testimonials | Always. Never invent people, quotes or logos | Only real, attributed, permitted quotes |
| 13 | Bento grids | Mixed tile sizes with no content reason | The content genuinely varies in size and importance |
| 14 | Terminal window | Fake traffic-light window chrome around decoration | A real command the user will run, shown as code |
| 15 | "It's not X, it's Y" | A formulaic copy pattern | Say the plain thing directly |
| 16 | Checkmark bullets | Every list becomes ticked benefits | A real checklist or comparison with a state |
| 17 | 3 pricing tiers | Starter, Pro, Enterprise by reflex | There is a real pricing model. There is none here, so do not add it |
| 18 | No real product demos | Mock UI, skeleton imagery or screenshots standing in for the product | Always show the real thing running: the live preview, the real code |
| 19 | Soft corner radius | Large, uniform rounding on everything | A deliberate radius scale, with sharp or small radii where the brand is technical |
| 20 | Purple and black | Purple glow on near-black | Not our palette; keep orange and ember on warm black |
| 21 | No skeleton loaders | Content pops in, or the screen is blank while loading | Always give a loading state that matches the final layout |
| 22 | Radial orbs | Blurred coloured blobs behind the hero | Light that belongs to the scene, such as headlights or a sunrise |
| 23 | Dot grids | A faint dot or line grid as texture | A real measurement or technical motif |
| 24 | Sparkle icons | The "AI magic" sparkle | Not relevant here |
| 25 | Animated arrows | Arrows that slide on hover on every link | Directional UI where the motion explains something |
| 26 | No TOS | Missing terms | Required before any account, upload or payment |
| 27 | No privacy policy | Missing | Required the moment there is analytics, forms, accounts or cookies. Until then a short "no tracking, no cookies" statement |
| 28 | Hover animations | Everything lifts or glows on hover | Hover reveals real information (the live preview) and has a touch and keyboard equivalent |
| 29 | Neon colours | Saturated glow on dark | A single signal colour used sparingly, such as brake lights or an accent |
| 30 | Basic pastel colours | Washed-out defaults | A considered, named palette with contrast checked |

Source: the supplied "30 reasons your site looks vibecoded" list.

## 2. Mandatory design and UX rules

- **No fake content.** No invented testimonials, statistics, customer logos, benchmarks, "built in 0.2s" lines or counts. Every number is computed from data or measured.
- **No unnecessary UI.** Every control earns its place. Do not add a filter, tab, badge, tooltip or section because it is common. When a layer has fewer than two real options, remove it.
- **No generic AI layouts.** Hero, three cards, logo row, pricing, FAQ, CTA is a layout to avoid by default. Start from what this page needs to show.
- **Meaningful product demonstrations.** The product is the animated site. Show it running, in the real iframe, with real code. Never a mock of it.
- **Consistent typography and spacing.** Use the tokens in `src/styles/tokens.css`: one display face, one text face, a type scale, a spacing scale, a radius scale. No one-off sizes. Body text is at least 16 px on mobile, and never below 12 px.
- **Cinematic automotive identity.** Dark, high-contrast, motion tied to scroll and the vehicle. It must not read as a generic SaaS dashboard.
- **Accessibility.** One `h1` per page and a logical heading order; visible focus; every interactive element reachable by keyboard; tap targets of at least 44 px (24 px minimum for inline text links, with spacing); alt text on meaningful images and empty alt on decorative ones; contrast of at least 4.5:1 for text; `prefers-reduced-motion` respected; no information conveyed by colour alone; a route change moves focus and updates the document title.
- **Real mobile responsiveness.** Design the phone layout deliberately, not by shrinking desktop. Hover-only behaviour needs a touch equivalent. No horizontal scroll. Never trap scrolling inside an embedded frame. A 390 px browser viewport is **not** proof of real-device compatibility; test on a phone.
- **States.** Every data or network dependent view has a loading state (skeleton matching the layout), an error state with a retry, an empty state that explains what to do, and a success confirmation for actions.
- **Motion.** Motion explains or delights once, then gets out of the way. One signature motion per section. No more than one continuous animation visible at a time. Respect reduced motion.

## 3. Performance and animation budgets

| Budget | Limit |
|---|---|
| Initial JS (main route, gzip) | 150 kB |
| Lazy 3D chunk (gzip) | 300 kB, loaded only on demand |
| Total transfer for first view of any route | 500 kB, excluding the lazy 3D chunk and the model |
| LCP | 2.5 s on a mid-range phone profile |
| CLS | 0.1 |
| Long tasks during load | none above 200 ms |
| Frame rate while scrolling | 50 fps or better at 4x CPU throttle |
| Concurrent live iframes on one page | 1 (2 in a comparison). Posters otherwise |
| Large assets (over 1 MB) | Lazy, opt-in on phones and on data saver |
| Memory | Navigating between routes 20 times must not grow DOM node or listener counts |

Animation rules: animate `transform` and `opacity` only; clean up every listener, observer, timer, ticker and `requestAnimationFrame` on unmount; pause off-screen work; remove `will-change` after use.

## 4. Engineering quality

- **Prefer the simplest solution** (`CLAUDE.md`). No new dependency, framework or service without a stated reason and approval. No architectural change without explaining why first.
- **Maintainable, reusable components.** One component, one job. Shared UI lives in `src/components`. Pure logic lives in `src/lib` with no React. Pages compose; they do not hold business rules.
- **Data access.** Components read catalog data only through the hooks in `src/lib/useCatalog.ts` and render every result with `DataView` (loading, error, empty). Never import the JSON or call `fetch` for catalog data in a component. See `docs/ARCHITECTURE.md`.
- **Error handling.** An error boundary wraps every lazy or network dependent subtree, so one failure never blanks the app. Failures degrade to a poster or message.
- **Config.** All environment dependent values come from `import.meta.env.VITE_*`. No secrets in the repo or the bundle, ever.
- **Types and validation.** No `any`. Data from outside the bundle (a future API) is validated at runtime before use.
- **Verification before commit.** `npm run build` and `npm run build:release` pass; affected routes are exercised at desktop, tablet and phone widths; console clean (warnings included); no new listener or node leak.
- **Git.** Identity `fardeensiddiqui`, the GitHub noreply address. No AI co-author. No force-push. No credentials committed. Review the diff for unrelated files before committing.

## 5. SEO and metadata

Each item is for a **meaningful** page; do not add content only to satisfy SEO.

- [ ] A unique `<title>` and meta description per route, written for people and accurate.
- [ ] Exactly one `h1` per page, with a logical hierarchy under it.
- [ ] A canonical URL on every indexable route.
- [ ] Open Graph and Twitter card metadata, with a real 1200x630 image.
- [ ] `robots.txt` and `sitemap.xml` that return the right file type, not the app shell.
- [ ] Unknown URLs return a real 404 status or carry `noindex`.
- [ ] Meaningful alt text on images; modern formats (WebP or AVIF) with explicit dimensions.
- [ ] Descriptive internal links with working targets; breadcrumbs match the page hierarchy.
- [ ] Structured data only where it is true: `WebSite`, `BreadcrumbList`, and `CreativeWork` or `SoftwareSourceCode` for templates. FAQ schema only if the page really contains an FAQ.
- [ ] Content must be visible to crawlers that do not run JavaScript (prerender or static HTML per route).
- [ ] After launch: verify in Google Search Console and Bing Webmaster Tools, and submit the sitemap. Those are manual steps for the site owner.
- [ ] "Author bio on every page", "About Us" and "share on all socials" apply only if the site has authors or a reason to publish them. They are not added by default.

Source: the supplied SEO checklist.

## 6. Security and licensing

- Template previews run in sandboxed iframes without `allow-same-origin`, from a separate origin in production.
- Every external asset is in `src/data/assets.json` with source, author, licence and clearance. `build:release` fails on dev-only assets.
- Attribution is shown wherever a licence requires it, including inside the template that uses the asset.
- Third-party scripts load from pinned versions and are declared in `externalDeps`. A template must still render fully when they fail.
- Security headers live in `public/_headers`. No credentials in source, in Git or in chat.
