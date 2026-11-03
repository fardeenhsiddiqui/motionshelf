import rawCatalog from "./catalog.json";
import rawAssets from "./assets.json";
import type { Asset, CatalogItem, Category, Section } from "../types";
import { filterItems } from "./filterItems";
import type { CatalogRepository } from "./repository";

// Reads the JSON that ships in the bundle. scripts/validate-catalog.mjs checks it at build time, so
// the casts below are safe. Methods are async to match the interface; they resolve immediately.
type Stored = Omit<CatalogItem, "categoryLabel">;
const stored = rawCatalog as unknown as { sections: Section[]; categories: Category[]; items: Stored[] };
const assets = (rawAssets as unknown as { assets: Asset[] }).assets;

const labels = new Map(stored.categories.map((c) => [c.id, c.label]));
const items: CatalogItem[] = stored.items.map((item) => ({ ...item, categoryLabel: labels.get(item.category) ?? item.category }));

export const staticRepository: CatalogRepository = {
  listSections: async () => stored.sections,
  listCategories: async () => stored.categories,
  listItems: async (query) => filterItems(items, query),
  getItem: async (id) => items.find((item) => item.id === id) ?? null,
  listAssets: async (ids) => (ids ? assets.filter((asset) => ids.includes(asset.id)) : assets),
};
