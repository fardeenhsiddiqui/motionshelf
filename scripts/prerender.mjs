// Build-time prerendering. Run after `vite build` (npm run build does this).
// Writes one HTML file per route into dist/ with its own title, description, canonical URL, Open Graph
// and Twitter tags, structured data and readable content, plus 404.html, robots.txt and sitemap.xml.
// Then it checks its own output and fails the build if anything is wrong. No dependencies: it relies on
// Node running TypeScript directly (Node 22.18 or newer) to share src/lib/seo.ts with the app.
//
// File layout matches Cloudflare Pages: /browse is served from browse.html, /templates/x from
// templates/x.html, unknown URLs get 404.html with a 404 status.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { metaFor, routePaths, SITE_NAME } from "../src/lib/seo.ts";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dist = join(root, "dist");
const catalog = JSON.parse(readFileSync(join(root, "src/data/catalog.json"), "utf8"));

function siteUrl() {
  if (process.env.VITE_SITE_URL) return process.env.VITE_SITE_URL.replace(/\/+$/, "");
  const file = join(root, ".env.production");
  const match = existsSync(file) && readFileSync(file, "utf8").match(/^VITE_SITE_URL=(.+)$/m);
  if (match) return match[1].trim().replace(/\/+$/, "");
  throw new Error("VITE_SITE_URL is not set. Add it to .env.production: it is the public origin used for canonical URLs and the sitemap.");
}

const base = siteUrl();
const abs = (path) => base + (path.startsWith("/") ? path : "/" + path);
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const itemPath = (item) => `/${item.section}/${item.id}`;
const categoryLabel = (id) => catalog.categories.find((c) => c.id === id)?.label ?? id;
const template = readFileSync(join(dist, "index.html"), "utf8");
// The headline and body fonts (latin subsets): the browser would only discover them after downloading the CSS.
const fontPreloads = readdirSync(join(dist, "assets")).filter((f) => /^(unbounded|inter)-latin-wght-normal-.*.woff2$/.test(f)).map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`);
if (!template.includes('<div id="root"></div>')) {
  console.error('Prerender: dist/index.html has no empty <div id="root"></div> to fill. Run it right after `vite build` (npm run build does), not twice on the same dist.');
  process.exit(1);
}

// Readable content for crawlers and visitors without JavaScript. React replaces it when the app starts.
function bodyFor(meta) {
  const list = (items) => `<ul>${items.map((i) => `<li><a href="${itemPath(i)}">${esc(i.title)}</a>: ${esc(i.summary)}</li>`).join("")}</ul>`;
  switch (meta.kind) {
    case "home":
      return `<h1>Websites that move.</h1><p>${esc(meta.description)}</p><h2>Automotive templates</h2>${list(catalog.items)}<p><a href="/browse">Browse all templates</a> · <a href="/licensing">Licensing</a></p>`;
    case "browse":
      return `<h1>Browse experiences</h1><p>${esc(meta.description)}</p>${list(catalog.items)}`;
    case "section": {
      const items = catalog.items.filter((i) => i.section === meta.section.id);
      return `<h1>${esc(meta.section.label)}</h1><p>${esc(meta.section.description)}</p>${items.length ? list(items) : "<p>Coming soon.</p>"}<p><a href="/browse">Browse all templates</a></p>`;
    }
    case "template": {
      const { item, section } = meta;
      const files = item.files.map((f) => `<li>${esc(f.path)}</li>`).join("");
      return `<nav aria-label="Breadcrumb"><a href="/browse">Browse</a> / <a href="/${section.id}">${esc(section.label)}</a> / ${esc(item.title)}</nav><h1>${esc(item.title)}</h1><p>${esc(item.summary)}</p><p>${esc(categoryLabel(item.category))} template. License: ${esc(item.license.name)}, by ${esc(item.license.author)}.</p><h2>Files</h2><ul>${files}</ul>`;
    }
    case "licensing":
      return `<h1>Licensing</h1><p>${esc(meta.description)}</p><ul>${catalog.items.map((i) => `<li><a href="${itemPath(i)}">${esc(i.title)}</a>: ${esc(i.license.spdx)}, by ${esc(i.license.author)}</li>`).join("")}</ul>`;
    default:
      return `<h1>Page not found</h1><p>${esc(meta.description)}</p><p><a href="/browse">Back to browse</a></p>`;
  }
}

function structuredData(meta) {
  const crumbs = [{ name: "Home", path: "/" }];
  if (meta.kind === "browse") crumbs.push({ name: "Browse", path: "/browse" });
  if (meta.kind === "licensing") crumbs.push({ name: "Licensing", path: "/licensing" });
  if (meta.kind === "section") crumbs.push({ name: meta.section.label, path: meta.path });
  if (meta.kind === "template") crumbs.push({ name: "Browse", path: "/browse" }, { name: meta.section.label, path: `/${meta.section.id}` }, { name: meta.item.title, path: meta.path });
  const graph = [];
  if (meta.kind === "home") graph.push({ "@type": "WebSite", name: SITE_NAME, url: abs("/"), description: meta.description });
  if (crumbs.length > 1) graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })) });
  if (meta.kind === "template") {
    const { item } = meta;
    graph.push({ "@type": "CreativeWork", name: item.title, description: item.summary, url: abs(meta.path), image: abs(item.posterPath), license: abs(item.license.licenseFile), keywords: item.tags.join(", "), dateCreated: item.createdAt, inLanguage: "en", publisher: { "@type": "Organization", name: SITE_NAME } });
  }
  return graph.length ? JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") : null;
}

function render(meta) {
  const url = abs(meta.path);
  const image = abs(meta.image);
  const defaultImage = meta.image === "/og.jpg";
  const ld = structuredData(meta);
  const head = [
    ...fontPreloads,
    `<link rel="canonical" href="${esc(url)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex, follow" />' : "",
    // The home page's main hero image is its largest paint: start fetching it before the app loads.
    meta.kind === "home" && catalog.items[0] ? `<link rel="preload" as="image" href="${esc(catalog.items[0].posterPath)}" fetchpriority="high" />` : "",
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    defaultImage ? '<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />' : '<meta property="og:image:width" content="1280" /><meta property="og:image:height" content="800" />',
    `<meta property="og:image:alt" content="${esc(meta.item ? `${meta.item.title} template preview` : "MotionShelf: animated automotive website templates")}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ld ? `<script type="application/ld+json">${ld}</script>` : "",
    // The prerendered content is for crawlers and no-JS visitors. With JavaScript, React replaces it, so hide it meanwhile.
    '<script>document.documentElement.classList.add("js")</script>',
    "<style>.js .prerender{visibility:hidden}</style>",
  ].filter(Boolean).join("\n    ");

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(meta.description)}" />`)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><main class="page prerender">${bodyFor(meta)}</main></div>`);
  return html;
}

function write(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}
const fileFor = (path) => (path === "/" ? join(dist, "index.html") : join(dist, `${path.slice(1)}.html`));

// ---------- write pages ----------
const pages = [];
for (const path of routePaths(catalog)) {
  const meta = metaFor(path, catalog);
  if (meta.kind === "notfound") throw new Error(`route ${path} resolved to not found`);
  pages.push({ path, meta, file: fileFor(path), html: render(meta) });
}
const notFound = { path: "/404", meta: metaFor("/404", catalog), file: join(dist, "404.html") };
notFound.html = render(notFound.meta);
for (const page of [...pages, notFound]) write(page.file, page.html);

// ---------- robots.txt and sitemap.xml ----------
const robots = `User-agent: *
Allow: /
Allow: /previews/*/poster.webp
Disallow: /previews/

Sitemap: ${abs("/sitemap.xml")}
`;
const sitemapPages = pages.filter((p) => !p.meta.noindex);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages.map((p) => {
  const lastmod = p.meta.item && /^\d{4}-\d{2}-\d{2}$/.test(p.meta.item.createdAt) ? `<lastmod>${p.meta.item.createdAt}</lastmod>` : "";
  return `  <url><loc>${esc(abs(p.path))}</loc>${lastmod}</url>`;
}).join("\n")}
</urlset>
`;
write(join(dist, "robots.txt"), robots);
write(join(dist, "sitemap.xml"), sitemap);

// ---------- verify the output ----------
const problems = [];
const titles = new Map();
for (const page of [...pages, notFound]) {
  const html = readFileSync(page.file, "utf8");
  const where = page.path;
  const count = (re) => (html.match(re) || []).length;
  if (count(/<title>/g) !== 1) problems.push(`${where}: expected exactly one <title>`);
  if (count(/<h1[ >]/g) !== 1) problems.push(`${where}: expected exactly one <h1> in the prerendered content`);
  if (count(/<link rel="canonical"/g) !== 1) problems.push(`${where}: expected exactly one canonical link`);
  if (!html.includes(`<link rel="canonical" href="${esc(abs(page.meta.path))}" />`)) problems.push(`${where}: canonical does not match the route`);
  if (!html.includes('property="og:title"') || !html.includes('property="og:image"')) problems.push(`${where}: missing Open Graph tags`);
  if (page.meta.description.length > 160) problems.push(`${where}: description is ${page.meta.description.length} characters (limit 160)`);
  if (page.meta.title.length > 70) problems.push(`${where}: title is ${page.meta.title.length} characters (limit 70)`);
  if (titles.has(page.meta.title)) problems.push(`${where}: title duplicates ${titles.get(page.meta.title)}`);
  titles.set(page.meta.title, where);
  if (page.meta.noindex !== html.includes('content="noindex, follow"')) problems.push(`${where}: robots meta does not match noindex`);
  if (!html.includes('src="/assets/')) problems.push(`${where}: app script is missing`);
  // Relative image and license paths must exist in dist.
  const assetPaths = [page.meta.image, page.meta.item?.license.licenseFile].filter(Boolean);
  for (const p of assetPaths) if (!existsSync(join(dist, p.replace(/^\//, "")))) problems.push(`${where}: missing file ${p}`);
}
for (const p of sitemapPages) if (!existsSync(p.file)) problems.push(`sitemap lists ${p.path} but ${p.file} does not exist`);
if (sitemapPages.some((p) => p.meta.noindex)) problems.push("sitemap lists a noindex page");
if (!notFound.html.includes("noindex")) problems.push("404.html is not noindex");

if (problems.length) {
  console.error("Prerender verification failed:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
console.log(`Prerendered ${pages.length} route(s) + 404.html; sitemap has ${sitemapPages.length} URL(s); ${pages.length - sitemapPages.length} set to noindex. Origin: ${base}`);
