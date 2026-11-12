import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CatalogItem, Category, Section, SectionId, Theme } from "../types";
import { filterItems } from "../data/filterItems";
import { sectionPath } from "../lib/paths";
import { Link } from "../lib/router";
import { useCategories, useItems, useSections } from "../lib/useCatalog";
import { combine } from "../lib/useData";
import { DataView } from "../components/DataView";
import { TemplateCard } from "../components/TemplateCard";

const THEMES: { id: Theme | "all"; label: string }[] = [
  { id: "all", label: "Any theme" },
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

// Loads what the gallery needs, then hands it to the view. Filtering is instant and in memory.
export function GalleryPage({ section }: { section?: SectionId }) {
  const loaded = combine(useSections(), useCategories(), useItems());
  return (
    <DataView result={loaded} what="templates">
      {([sections, categories, items]) => <Gallery section={section} sections={sections} categories={categories} items={items} />}
    </DataView>
  );
}

type GalleryProps = { section?: SectionId; sections: Section[]; categories: Category[]; items: CatalogItem[] };

function Gallery({ section, sections, categories: allCategories, items }: GalleryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | "all">("all");
  const [tag, setTag] = useState<string | null>(null);
  const search = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K and "/" jump to search.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") || (event.key === "/" && !typing)) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const info = section ? sections.find((s) => s.id === section) ?? null : null;
  const inSection = useMemo(() => filterItems(items, { section }), [items, section]);

  // Every category stays visible so the shelf shows what is coming; empty ones are disabled.
  const categories = useMemo(
    () => allCategories
      .filter((c) => !section || c.section === section)
      .map((c) => ({ ...c, count: inSection.filter((item) => item.category === c.id).length })),
    [allCategories, inSection, section],
  );
  const tags = useMemo(() => [...new Set(inSection.flatMap((item) => item.tags))].sort(), [inSection]);

  const results = filterItems(inSection, {
    text: query,
    category: category ?? undefined,
    theme: theme === "all" ? undefined : theme,
    tag: tag ?? undefined,
  });
  const filtering = query.trim() !== "" || category !== null || theme !== "all" || tag !== null;
  const clearFilters = () => { setQuery(""); setCategory(null); setTheme("all"); setTag(null); };

  return (
    <>
      <header className="gallery-head">
        <p className="eyebrow">{info ? "Collection" : "The shelf"}</p>
        <h1>{info ? info.label : "Browse experiences"}</h1>
        <p className="gallery-lede">
          {info
            ? info.description
            : "Cinematic website experiences you can preview live, copy and ship. Every one lists its licenses."}
        </p>
      </header>

      <nav className="section-tabs" aria-label="Sections">
        <Link href="/browse" aria-current={section ? undefined : "page"}>All <span className="count">{items.length}</span></Link>
        {sections.map((s) => (
          <Link key={s.id} href={sectionPath(s.id)} aria-current={section === s.id ? "page" : undefined}>
            {s.label}
            {s.status === "soon" ? <span className="soon">Soon</span> : <span className="count">{items.filter((item) => item.section === s.id).length}</span>}
          </Link>
        ))}
      </nav>

      <div className="toolbar">
        <div className="toolbar-row">
          <label className="search-wrap">
            <span className="visually-hidden">Search</span>
            <input
              ref={search}
              type="search"
              className="search"
              placeholder={section === "anime" ? "Search anime demos" : "Search templates"}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd aria-hidden="true">Ctrl K</kbd>
          </label>
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

        <div className="cat-tiles" role="group" aria-label="Filter by category">
          {categories.map((c) => {
            const active = c.id === category;
            const empty = c.count === 0;
            return (
              <button
                key={c.id}
                className={`cat-tile${active ? " is-active" : ""}${empty ? " is-empty" : ""}`}
                aria-pressed={active}
                disabled={empty}
                onClick={() => setCategory(active ? null : c.id)}
              >
                <span className="cat-name">{c.label}</span>
                <span className="cat-meta">{empty ? "Coming soon" : `${c.count} ${c.count === 1 ? "experience" : "experiences"}`}</span>
              </button>
            );
          })}
        </div>

        {tags.length > 0 && (
          <details className="more-filters" open={tag !== null}>
            <summary>Features{tag ? `: ${tag}` : ""}</summary>
            <div className="chips" role="group" aria-label="Filter by feature">
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
          </details>
        )}
      </div>

      <div className="result-row" aria-live="polite">
        <p className="muted small">{results.length} of {inSection.length} shown</p>
        {filtering && <button className="link-btn" onClick={clearFilters}>Clear filters</button>}
      </div>

      <motion.div className="grid" layout>
        <AnimatePresence mode="popLayout">
          {results.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <TemplateCard item={item} headingLevel="h2" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {results.length === 0 && filtering && (
        <div className="empty">
          <h2>No matches</h2>
          <p>Nothing matches these filters. Try a different word or clear them.</p>
          <button className="btn" onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      {results.length === 0 && !filtering && (
        <div className="empty">
          <h2>{info?.status === "soon" ? "Coming soon" : "Nothing here yet"}</h2>
          <p>
            {section === "anime"
              ? "This section opens once there are original or properly licensed assets to list. Every asset will carry its license."
              : info
                ? "This section is next on the list. Automotive templates are live now."
                : "There are no templates to show yet."}
          </p>
        </div>
      )}
    </>
  );
}
