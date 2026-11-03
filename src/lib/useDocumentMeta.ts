import { useEffect } from "react";
import { metaFor } from "./seo";
import { useCategories, useItems, useSections } from "./useCatalog";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").replace(/\/+$/, "");

// Find a tag in <head>, or add it, so client-side navigation keeps the title and tags in step with the route.
function headTag<T extends HTMLElement>(selector: string, create: () => T): T {
  const existing = document.head.querySelector<T>(selector);
  if (existing) return existing;
  const tag = create();
  document.head.appendChild(tag);
  return tag;
}

// Pages are prerendered with the right tags for crawlers (scripts/prerender.mjs). This keeps the
// document title and description right when the visitor navigates inside the app.
export function useDocumentMeta(path: string) {
  const sectionsResult = useSections();
  const categoriesResult = useCategories();
  const itemsResult = useItems();
  const sections = sectionsResult.status === "ready" ? sectionsResult.data : null;
  const categories = categoriesResult.status === "ready" ? categoriesResult.data : null;
  const items = itemsResult.status === "ready" ? itemsResult.data : null;

  useEffect(() => {
    if (!sections || !categories || !items) return;
    const meta = metaFor(path, { sections, categories, items });
    document.title = meta.title;

    headTag<HTMLMetaElement>('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" })).content = meta.description;

    const canonical = headTag<HTMLLinkElement>('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }));
    canonical.href = `${SITE_URL || window.location.origin}${meta.path}`;

    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (meta.noindex) {
      headTag<HTMLMetaElement>('meta[name="robots"]', () => Object.assign(document.createElement("meta"), { name: "robots" })).content = "noindex, follow";
    } else {
      robots?.remove();
    }
  }, [path, sections, categories, items]);
}
