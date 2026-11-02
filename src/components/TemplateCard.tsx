import type { CatalogItem } from "../types";
import { categoryLabel, itemPath } from "../lib/catalog";
import { Link } from "../lib/router";
import { PreviewThumb } from "./PreviewThumb";

export function TemplateCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={itemPath(item)} className="card">
      <PreviewThumb src={item.previewPath} title={item.title} />
      <div className="card-body">
        <p className="kicker">{categoryLabel(item.category)} · {item.theme}</p>
        <div className="card-title">
          <h3>{item.title}</h3>
          <span className="badge">{item.license.spdx}</span>
        </div>
        <p>{item.summary}</p>
        <div className="tags">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
