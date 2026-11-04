import { repository, type ItemQuery } from "../data";
import type { CatalogItem } from "../types";
import { peek, prefetch, seed, useData } from "./useData";

// The hooks components use to read catalog data. Keys must identify the request, so two calls with
// the same arguments share one cached read.
const keys = {
  sections: "sections",
  categories: "categories",
  items: (query: ItemQuery) => `items:${JSON.stringify(query)}`,
  item: (id: string) => `item:${id}`,
  assets: (ids?: string[]) => `assets:${ids ? ids.join(",") : "*"}`,
};

export const useSections = () => useData(keys.sections, () => repository.listSections());
export const useCategories = () => useData(keys.categories, () => repository.listCategories());
export const useItems = (query: ItemQuery = {}) => useData(keys.items(query), () => repository.listItems(query));
export const useItem = (id: string) => useData(keys.item(id), () => repository.getItem(id));
export const useAssets = (ids?: string[]) => useData(keys.assets(ids), () => repository.listAssets(ids));

// Called once before the first render so the shell never flashes an empty state. It waits at most
// 50 ms: instant for the bundled JSON, and a slower source simply shows loading states instead.
export async function primeCatalog(): Promise<void> {
  const reads = Promise.all([
    prefetch(keys.sections, () => repository.listSections()),
    prefetch(keys.categories, () => repository.listCategories()),
    prefetch(keys.items({}), () => repository.listItems({})),
    prefetch(keys.assets(undefined), () => repository.listAssets()),
  ]);
  await Promise.race([reads, new Promise((resolve) => setTimeout(resolve, 50))]);
  // A template page needs its own item. Seed those from the list so its first render already has the data.
  for (const item of peek<CatalogItem[]>(keys.items({})) ?? []) seed(keys.item(item.id), item);
}
