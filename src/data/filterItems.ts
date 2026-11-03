import type { CatalogItem } from "../types";
import type { ItemQuery } from "./repository";

// Pure filtering, shared by the static repository and by the gallery's instant in-memory filters.
// A server would do the same work from the same ItemQuery.
export function matchesText(item: CatalogItem, text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.title, item.summary, item.categoryLabel, item.theme, ...item.tags, ...item.sections].join(" ").toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterItems(items: CatalogItem[], query: ItemQuery = {}): CatalogItem[] {
  return items.filter(
    (item) =>
      (!query.section || item.section === query.section) &&
      (!query.category || item.category === query.category) &&
      (!query.theme || item.theme === query.theme) &&
      (!query.tag || item.tags.includes(query.tag)) &&
      (!query.text || matchesText(item, query.text)),
  );
}
