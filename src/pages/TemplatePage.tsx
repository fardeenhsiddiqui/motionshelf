import type { CatalogItem } from "../types";
import { assetsOf, categoryLabel, getSection, sectionPath } from "../lib/catalog";
import { useSources } from "../lib/sources";
import { Link } from "../lib/router";
import { CodeTabs } from "../components/CodeTabs";
import { CreditsPanel } from "../components/CreditsPanel";
import { InstallPanel } from "../components/InstallPanel";
import { LicenseBox } from "../components/LicenseBox";
import { PreviewFrame } from "../components/PreviewFrame";

export function TemplatePage({ item }: { item: CatalogItem }) {
  const section = getSection(item.section);
  const sources = useSources(item);
  const assets = assetsOf(item);

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/browse">Browse</Link> <span>/</span> <Link href={sectionPath(item.section)}>{section.label}</Link> <span>/</span> <span>{item.title}</span>
      </nav>

      <header className="page-head">
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        <div className="tags"><span className="tag tag-category">{categoryLabel(item.category)}</span>{item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
      </header>

      <PreviewFrame item={item} />

      <div className="detail-grid">
        <CodeTabs item={item} sources={sources} assets={assets} />
        <div className="side">
          <InstallPanel item={item} />
          <CreditsPanel assets={assets} />
          <LicenseBox license={item.license} />
          <aside className="panel" aria-label="Template details">
            <h2>Details</h2>
            <dl className="facts">
              <dt>Category</dt><dd>{categoryLabel(item.category)}</dd>
              <dt>Theme</dt><dd>{item.theme === "dark" ? "Dark" : "Light"}</dd>
              <dt>Responsive</dt><dd>{item.responsive ? "Yes" : "No"}</dd>
              <dt>Sections</dt><dd>{item.sections.join(", ")}</dd>
              <dt>Fonts</dt><dd>{item.fonts.join(", ")}</dd>
              <dt>Added</dt><dd>{item.createdAt}</dd>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}
