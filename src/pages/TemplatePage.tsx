import type { CatalogItem } from "../types";
import { sectionPath } from "../lib/paths";
import { useAssets, useSections } from "../lib/useCatalog";
import { useSources } from "../lib/sources";
import { Link } from "../lib/router";
import { CodeTabs } from "../components/CodeTabs";
import { DataView } from "../components/DataView";
import { CreditsPanel } from "../components/CreditsPanel";
import { InstallPanel } from "../components/InstallPanel";
import { LicenseBox } from "../components/LicenseBox";
import { PreviewFrame } from "../components/PreviewFrame";

export function TemplatePage({ item }: { item: CatalogItem }) {
  const sections = useSections();
  const assetsResult = useAssets(item.assetIds ?? []);
  const sources = useSources(item);
  const sectionLabel = (sections.status === "ready" && sections.data.find((s) => s.id === item.section)?.label) || item.section;
  // The prompt and zip include the credits, so they wait until the assets have loaded.
  const assets = assetsResult.status === "ready" ? assetsResult.data : null;

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/browse">Browse</Link> <span>/</span> <Link href={sectionPath(item.section)}>{sectionLabel}</Link> <span>/</span> <span>{item.title}</span>
      </nav>

      <header className="page-head">
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        <div className="tags"><span className="tag tag-category">{item.categoryLabel}</span>{item.tags.slice(0, 4).map((tag) => <span key={tag} className="tag">{tag}</span>)}</div>
      </header>

      <PreviewFrame item={item} />

      <div className="detail-grid">
        <CodeTabs item={item} sources={sources} assets={assets} />
        <div className="side">
          <InstallPanel item={item} />
          <DataView result={assetsResult} what="asset credits">{(list) => <CreditsPanel assets={list} />}</DataView>
          <LicenseBox license={item.license} />
          <aside className="panel" aria-label="Template details">
            <h2>Details</h2>
            <dl className="facts">
              <dt>Category</dt><dd>{item.categoryLabel}</dd>
              <dt>Theme</dt><dd>{item.theme === "dark" ? "Dark" : "Light"}</dd>
              <dt>Responsive</dt><dd>{item.responsive ? "Yes" : "No"}</dd>
              <dt>Sections</dt><dd>{item.sections.join(", ")}</dd>
              <dt>Features</dt><dd>{item.tags.join(", ")}</dd>
              <dt>Fonts</dt><dd>{item.fonts.join(", ")}</dd>
              <dt>Added</dt><dd>{item.createdAt}</dd>
            </dl>
          </aside>
        </div>
      </div>
    </>
  );
}
