import type { CatalogRepository } from "./repository";

// Test aid for the loading, error and empty states. It is only compiled in when the app is built with
// VITE_DATA_SIMULATION=1 (see index.ts); a normal build drops this file. Pick a mode with ?data=...
//   slow   every call takes 1.5 seconds
//   error  every call fails
//   flaky  each method fails once, then works (to try the Try again button)
//   empty  lists come back empty and getItem finds nothing
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function simulate(real: CatalogRepository): CatalogRepository {
  const mode = new URLSearchParams(window.location.search).get("data");
  if (!mode) return real;
  const failed = new Set<string>();

  async function run<T>(name: string, empty: T, call: () => Promise<T>): Promise<T> {
    if (mode === "slow") await wait(1500);
    if (mode === "error") throw new Error("Simulated data error");
    if (mode === "flaky" && !failed.has(name)) {
      failed.add(name);
      await wait(300);
      throw new Error("Simulated data error");
    }
    return mode === "empty" ? empty : call();
  }

  return {
    listSections: () => run("sections", [], () => real.listSections()),
    listCategories: () => run("categories", [], () => real.listCategories()),
    listItems: (query) => run("items", [], () => real.listItems(query)),
    getItem: (id) => run("item", null, () => real.getItem(id)),
    listAssets: (ids) => run("assets", [], () => real.listAssets(ids)),
  };
}
