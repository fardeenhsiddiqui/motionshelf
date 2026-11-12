import type { CatalogItem } from "../types";
import { itemPath } from "../lib/paths";
import { Link } from "../lib/router";
import { PreviewThumb } from "./PreviewThumb";

export function TemplateCard({ item, headingLevel = "h3" }: { item: CatalogItem; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <Link href={itemPath(item)} className="card">
      <PreviewThumb src={item.previewPath} poster={item.posterPath} title={item.title} />
      <div className="card-body">
        <p className="kicker">{item.categoryLabel} · {item.theme}</p>
        <div className="card-title">
          <Heading>{item.title}</Heading>
          <span className="badge">{item.license.spdx}</span>
        </div>
        <p>{item.summary}</p>
        <div className="tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <span className="card-cta">{item.section === "templates" ? "Open template" : "Open demo"} <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}
