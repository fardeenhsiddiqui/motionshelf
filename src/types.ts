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
  language: "html" | "css";
};

export type Category = {
  id: string;
  label: string;
};

export type Theme = "dark" | "light";

export type CatalogItem = {
  id: string;
  section: SectionId;
  category: string;
  theme: Theme;
  title: string;
  summary: string;
  tags: string[];
  previewPath: string;
  filesBase: string;
  files: CodeFile[];
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
