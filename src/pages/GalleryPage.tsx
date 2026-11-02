import { useMemo, useState } from "react";
import type { SectionId } from "../types";
import { catalog, getSection, itemsInSection, matchesQuery } from "../lib/catalog";
import { TemplateCard } from "../components/TemplateCard";

export function GalleryPage({ section }: { section?: SectionId }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const info = section ? getSection(section) : null;
  const inSection = itemsInSection(section);
  const tags = useMemo(() => [...new Set(inSection.flatMap((item) => item.tags))].sort(), [inSection]);
  const results = inSection.filter((item) => matchesQuery(item, query) && (!tag || item.tags.includes(tag)));
  const filtering = query.trim() !== "" || tag !== null;

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
        <input
          type="search"
          className="search"
          placeholder="Search templates, tags, sections…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search"
        />
        {tags.length > 0 && (
          <div className="chips" role="group" aria-label="Filter by tag">
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
        <div className="grid">
          {results.map((item) => <TemplateCard key={item.id} item={item} />)}
        </div>
      )}

      {results.length === 0 && filtering && (
        <div className="empty">
          <h2>No matches</h2>
          <p>Nothing matches your search. Try a different word or clear the tag filter.</p>
          <button className="btn" onClick={() => { setQuery(""); setTag(null); }}>Clear filters</button>
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
