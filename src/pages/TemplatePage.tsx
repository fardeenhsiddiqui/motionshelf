import { useState } from "react";
import type { CatalogItem } from "../types";
import { categoryLabel, getSection, sectionPath } from "../lib/catalog";
import { Link } from "../lib/router";
import { CodeTabs } from "../components/CodeTabs";
import { LicenseBox } from "../components/LicenseBox";

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: null },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 390 },
] as const;

export function TemplatePage({ item }: { item: CatalogItem }) {
  const [viewport, setViewport] = useState<(typeof VIEWPORTS)[number]["id"]>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const current = VIEWPORTS.find((v) => v.id === viewport)!;
  const section = getSection(item.section);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Browse</Link> <span>/</span> <Link href={sectionPath(item.section)}>{section.label}</Link> <span>/</span> <span>{item.title}</span>
      </nav>

      <header className="page-head">
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        <div className="tags"><span className="tag tag-category">{categoryLabel(item.category)}</span>{item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
      </header>

      <section aria-label="Live preview" className="preview">
        <div className="preview-bar">
          <div role="group" aria-label="Viewport size" className="segmented">
            {VIEWPORTS.map((v) => (
              <button
                key={v.id}
                className={v.id === viewport ? "seg is-active" : "seg"}
                aria-pressed={v.id === viewport}
                onClick={() => setViewport(v.id)}
              >
                {v.label}{v.width ? <small> {v.width}px</small> : null}
              </button>
            ))}
          </div>
          <div className="preview-actions">
            <button className="btn btn-quiet" onClick={() => setFrameKey((k) => k + 1)}>Reload</button>
            <a className="btn btn-quiet" href={item.previewPath} target="_blank" rel="noopener noreferrer">Open full page ↗</a>
          </div>
        </div>
        <div className="stage">
          {/* No allow-scripts: previews are static HTML/CSS. allow-same-origin is needed because
              Vite's dev/preview servers render opaque-origin (fully sandboxed) frames blank. */}
          <iframe
            key={frameKey}
            className="frame"
            src={item.previewPath}
            title={`${item.title} live preview`}
            sandbox="allow-same-origin"
            style={{ width: current.width ?? "100%" }}
          />
        </div>
      </section>

      <div className="detail-grid">
        <CodeTabs item={item} />
        <div className="side">
          <LicenseBox license={item.license} />
          <aside className="panel" aria-label="Template details">
            <h2>Details</h2>
            <dl className="facts">
              <dt>Category</dt><dd>{categoryLabel(item.category)}</dd>
              <dt>Theme</dt><dd>{item.theme === "dark" ? "Dark" : "Light"}</dd>
              <dt>Responsive</dt><dd>{item.responsive ? "Yes" : "No"}</dd>
              <dt>Sections</dt><dd>{item.sections.join(", ")}</dd>
              <dt>Fonts</dt><dd>{item.fonts.join(", ")}</dd>
              <dt>External deps</dt><dd>{item.externalDeps.length === 0 ? "None" : item.externalDeps.join(", ")}</dd>
              <dt>Added</dt><dd>{item.createdAt}</dd>
            </dl>
            <h3>Use it</h3>
            <ol className="steps">
              <li>Copy <code>index.html</code> and <code>styles.css</code> into the same folder.</li>
              <li>Open <code>index.html</code>. No build step or dependencies needed.</li>
              <li>Replace the copy, the brand name and the colors.</li>
            </ol>
          </aside>
        </div>
      </div>
    </>
  );
}
