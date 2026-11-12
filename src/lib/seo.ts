import type { Catalog, CatalogItem, Section } from "../types";

// Page metadata for every route. Pure functions with no imports besides types, so the same code runs
// in the browser (client-side navigation) and in scripts/prerender.mjs (build time, run by Node).

export type RouteKind = "home" | "browse" | "section" | "template" | "licensing" | "notfound";

export type RouteMeta = {
  kind: RouteKind;
  title: string;
  description: string;
  /** Canonical path of this page, without the site origin. */
  path: string;
  /** Social preview image path. */
  image: string;
  noindex: boolean;
  section?: Section;
  item?: CatalogItem;
};

export const SITE_NAME = "MotionShelf";
export const DEFAULT_IMAGE = "/og.jpg";

// Cut at a word boundary so descriptions stay under what search results show.
function clip(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 3).replace(/\s+\S*$/, "") + "...";
}

export function metaFor(rawPath: string, catalog: Catalog): RouteMeta {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "") : rawPath;
  const parts = path.split("/").filter(Boolean);
  const base = { image: DEFAULT_IMAGE, noindex: false };

  if (parts.length === 0) {
    return {
      ...base,
      kind: "home",
      path: "/",
      title: `${SITE_NAME}: animated automotive website templates`,
      description: "Original, scroll-driven website templates for supercars, off-road, motorsport and motorcycles. Preview them live, copy the code, and check every license.",
    };
  }
  if (parts.length === 1 && parts[0] === "browse") {
    return {
      ...base,
      kind: "browse",
      path: "/browse",
      title: `Browse ${catalog.items.length} animated website templates | ${SITE_NAME}`,
      description: `Browse ${catalog.items.length} animated website templates. Filter by category, theme and feature. Every template lists its license, author and sources.`,
    };
  }
  if (parts.length === 1 && parts[0] === "licensing") {
    return {
      ...base,
      kind: "licensing",
      path: "/licensing",
      title: `Licensing | ${SITE_NAME}`,
      description: "How MotionShelf handles licenses: a license record for every template and every third-party asset, with author, source and attribution.",
    };
  }

  const section = catalog.sections.find((s) => s.id === parts[0]);
  if (section && parts.length === 1) {
    const soon = section.status === "soon" || !catalog.items.some((item) => item.section === section.id);
    return {
      ...base,
      kind: "section",
      path: `/${section.id}`,
      section,
      // A section with nothing in it is thin content: keep it out of search until it has items.
      noindex: soon,
      title: `${section.label}${soon ? " (coming soon)" : ""} | ${SITE_NAME}`,
      description: clip(section.description),
    };
  }
  if (section && parts.length === 2) {
    const item = catalog.items.find((candidate) => candidate.id === parts[1] && candidate.section === section.id);
    if (item) {
      const category = catalog.categories.find((c) => c.id === item.category)?.label ?? item.category;
      return {
        ...base,
        kind: "template",
        path: `/${item.section}/${item.id}`,
        image: item.posterPath,
        section,
        item,
        title: section.id === "templates" ? `${item.title}: ${category} website template | ${SITE_NAME}` : `${item.title}: anime-style web demo | ${SITE_NAME}`,
        description: clip(item.summary),
      };
    }
  }

  return {
    ...base,
    kind: "notfound",
    path,
    noindex: true,
    title: `Page not found | ${SITE_NAME}`,
    description: "That page does not exist on MotionShelf.",
  };
}

/** Every real route, in sitemap order. */
export function routePaths(catalog: Catalog): string[] {
  return [
    "/",
    "/browse",
    ...catalog.sections.map((s) => `/${s.id}`),
    ...catalog.items.map((item) => `/${item.section}/${item.id}`),
    "/licensing",
  ];
}
