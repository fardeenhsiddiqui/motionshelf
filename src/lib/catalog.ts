import raw from "../data/catalog.json";
import type { Catalog, CatalogItem, Section, SectionId } from "../types";

export const catalog = raw as Catalog;

export function getSection(id: SectionId): Section {
  const section = catalog.sections.find((s) => s.id === id);
  if (!section) throw new Error(`Unknown section: ${id}`);
  return section;
}

export function categoryLabel(id: string): string {
  return catalog.categories.find((c) => c.id === id)?.label ?? id;
}

export function getItem(id: string): CatalogItem | undefined {
  return catalog.items.find((item) => item.id === id);
}

export function itemsInSection(section?: SectionId): CatalogItem[] {
  return section ? catalog.items.filter((item) => item.section === section) : catalog.items;
}

export function matchesQuery(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.title, item.summary, categoryLabel(item.category), item.theme, ...item.tags, ...item.sections]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function sectionPath(id: SectionId): string {
  return `/${id}`;
}

export function itemPath(item: CatalogItem): string {
  return `/${item.section}/${item.id}`;
}
