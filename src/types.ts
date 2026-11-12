export type SectionId = "templates" | "components" | "anime";

export type Section = {
  id: SectionId;
  label: string;
  description: string;
  status: "live" | "soon";
};

export type License = {
  name: string;
  spdx: string;
  licenseFile: string;
  author: string;
  sourceUrl: string | null;
  attributionRequired: boolean;
  attributionText: string | null;
  commercialUse: boolean;
  redistribution: boolean;
  modification: boolean;
  originalIp: boolean;
  aiGenerated: boolean;
  verifiedOn: string;
  notes: string;
};

export type CodeFile = {
  path: string;
  language: "html" | "css" | "js";
};

export type Clearance = "cleared" | "dev-only";

export type Asset = {
  id: string;
  type: "model" | "image" | "video" | "font" | "audio" | "hdri";
  title: string;
  file: string;
  source: { name: string; url: string };
  originalSource?: string;
  author: string;
  license: { name: string; spdx: string; url: string; licenseFile: string };
  attributionRequired: boolean;
  attributionText?: string;
  commercialUse: boolean;
  redistribution: boolean;
  modification: boolean;
  clearance: Clearance;
  brandsDepicted: string[];
  brandPermission?: string;
  processing?: string;
  usedIn: string[];
  verifiedOn: string;
  notes?: string;
};

export type Category = {
  id: string;
  label: string;
  /** The section this category belongs to, so each section shows only its own filters. */
  section: SectionId;
};

export type Theme = "dark" | "light";

export type CatalogItem = {
  id: string;
  section: SectionId;
  category: string;
  /** Display name of the category, joined in by the repository. */
  categoryLabel: string;
  theme: Theme;
  title: string;
  summary: string;
  tags: string[];
  previewPath: string;
  posterPath: string;
  filesBase: string;
  files: CodeFile[];
  assetIds?: string[];
  sections: string[];
  fonts: string[];
  externalDeps: string[];
  responsive: boolean;
  createdAt: string;
  license: License;
};

export type Catalog = {
  sections: Section[];
  categories: Category[];
  items: CatalogItem[];
};
