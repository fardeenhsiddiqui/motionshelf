import type { Asset, CatalogItem, Category, Section, SectionId, Theme } from "../types";

// The only way the UI reads catalog data. Today one implementation reads the bundled JSON
// (staticRepository.ts). A REST API on PostgreSQL would be a second implementation of this same
// interface, and no component would change. See docs/ARCHITECTURE.md.

/** Filters for listing items. The static implementation applies them in memory; a REST API takes them as query parameters. */
export type ItemQuery = {
  section?: SectionId;
  category?: string;
  theme?: Theme;
  tag?: string;
  /** Free text matched against title, summary, category, theme, tags and sections. */
  text?: string;
};

export interface CatalogRepository {
  listSections(): Promise<Section[]>;
  listCategories(): Promise<Category[]>;
  listItems(query?: ItemQuery): Promise<CatalogItem[]>;
  /** Resolves to null when there is no such item. That is a normal answer, not an error. */
  getItem(id: string): Promise<CatalogItem | null>;
  /** Every asset, or only those with the given ids. */
  listAssets(ids?: string[]): Promise<Asset[]>;
}
