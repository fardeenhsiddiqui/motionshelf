import type { CatalogItem, SectionId } from "../types";

// URL paths for catalog pages. Pure helpers, so components never build paths by hand.
export function sectionPath(id: SectionId): string {
  return `/${id}`;
}

export function itemPath(item: Pick<CatalogItem, "section" | "id">): string {
  return `/${item.section}/${item.id}`;
}
