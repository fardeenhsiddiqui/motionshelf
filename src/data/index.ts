import { simulate } from "./simulate";
import { staticRepository } from "./staticRepository";
import type { CatalogRepository } from "./repository";

// The repository the app uses. To read from a REST API instead, export an implementation of
// CatalogRepository here (for example one that calls fetch on VITE_API_BASE_URL). Nothing else changes.
export const repository: CatalogRepository = import.meta.env.VITE_DATA_SIMULATION === "1" ? simulate(staticRepository) : staticRepository;

export type { CatalogRepository, ItemQuery } from "./repository";
