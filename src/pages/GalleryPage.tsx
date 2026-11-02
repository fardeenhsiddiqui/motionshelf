import { useMemo, useState } from "react";
import type { SectionId, Theme } from "../types";
import { catalog, getSection, itemsInSection, matchesQuery } from "../lib/catalog";
import { TemplateCard } from "../components/TemplateCard";

const THEMES: { id: Theme | "all"; label: string }[] = [
  { id: "all", label: "Any theme" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

export function GalleryPage({ section }: { section?: SectionId }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | "all">("all");
  const [tag, setTag] = useState<string | null>(null);

  const info = section ? getSection(section) : null;
  const inSection = itemsInSection(section);

  // Only offer categories and tags that actually have items in this section.
  const categories = useMemo(
    () => catalog.categories
      .map((c) => ({ ...c, count: inSection.filter((item) => item.category === c.id).length }))
      .filter((c) => c.count > 0),
    [inSection],
  );
  const tags = useMemo(() => [...new Set(inSection.flatMap((item) => item.tags))].sort(), [inSection]);

  const results = inSection.filter((item) => (
    matchesQuery(item, query)
    && (!category || item.category === category)
    && (theme === "all" || item.theme === theme)
    && (!tag || item.tags.includes(tag))
  ));
  const filtering = query.trim() !== "" || category !== null || theme !== "all" || tag !== null;
  const clearFilters = () => { setQuery(""); setCategory(null); setTheme("all"); setTag(null); };

  return (
    <>
      <header className="page-head">
        <h1>{info ? info.label : "Browse MotionShelf"}</h1>
        <p>
          {info
            ? info.description
            : "Original website templates and UI building blocks. Preview them live, copy the code, and check the license before you ship."}
        </p>
      </header>

      <div className="toolbar">
        <div className="toolbar-row">
          <input
            type="search"
            className="search"
            placeholder="Search templates, categories, tags…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search"
          />
          {inSection.length > 0 && (
            <div role="group" aria-label="Theme" className="segmented">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={t.id === theme ? "seg is-active" : "seg"}
                  aria-pressed={t.id === theme}
                  onClick={() => setTheme(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <div className="chips" role="group" aria-label="Filter by category">
            <button
              className={category === null ? "chip chip-category is-active" : "chip chip-category"}
              aria-pressed={category === null}
              onClick={() => setCategory(null)}
            >
              All categories <span className="chip-count">{inSection.length}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={c.id === category ? "chip chip-category is-active" : "chip chip-category"}
                aria-pressed={c.id === category}
                onClick={() => setCategory(c.id === category ? null : c.id)}
              >
                {c.label} <span className="chip-count">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <div className="chips chips-tags" role="group" aria-label="Filter by feature">
            {tags.map((name) => (
              <button
                key={name}
                className={name === tag ? "chip is-active" : "chip"}
                aria-pressed={name === tag}
                onClick={() => setTag(name === tag ? null : name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <>
          {filtering && <p className="muted small result-summary">{results.length} of {inSection.length} shown</p>}
          <div className="grid">
            {results.map((item) => <TemplateCard key={item.id} item={item} />)}
          </div>
        </>
      )}

      {results.length === 0 && filtering && (
        <div className="empty">
          <h2>No matches</h2>
          <p>Nothing matches these filters. Try a different word or clear them.</p>
          <button className="btn" onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      {results.length === 0 && !filtering && info && (
        <div className="empty">
          <h2>{info.status === "soon" ? "Coming soon" : "Nothing here yet"}</h2>
          <p>
            {section === "anime"
              ? "This section opens once there are original or properly licensed assets to list. Every asset will carry its license."
              : "This section is next on the list. Automotive templates are live now."}
          </p>
        </div>
      )}

      {!section && !filtering && catalog.items.length > 0 && (
        <p className="muted small result-count">{catalog.items.length} item{catalog.items.length === 1 ? "" : "s"} · more landing soon</p>
      )}
    </>
  );
}
