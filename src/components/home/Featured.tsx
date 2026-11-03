import { Link } from "../../lib/router";
import { useItems } from "../../lib/useCatalog";
import { DataView } from "../DataView";
import { Reveal } from "../Reveal";
import { TemplateCard } from "../TemplateCard";

// Stable query object so every render asks for the same cached read.
const TEMPLATES = { section: "templates" } as const;

export function Featured() {
  const items = useItems(TEMPLATES);
  return (
    <section className="section" aria-labelledby="featured-title">
      <div className="section-inner">
        <Reveal className="featured-head">
          <div>
            <p className="eyebrow">Available now</p>
            <h2 id="featured-title" className="section-title">Automotive templates</h2>
          </div>
          <Link href="/browse" className="btn-pill btn-outline">View all</Link>
        </Reveal>
      </div>
      <DataView
        result={items}
        what="templates"
        inset
        isEmpty={(list) => list.length === 0}
        empty={<p className="muted">No templates are available yet.</p>}
      >
        {(list) => (
          <Reveal className="rail" y={40}>
            <div className="rail-track" data-lenis-prevent>
              {list.map((item) => (
                <div className="rail-item" key={item.id}><TemplateCard item={item} /></div>
              ))}
            </div>
          </Reveal>
        )}
      </DataView>
    </section>
  );
}
