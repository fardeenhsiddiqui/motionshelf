import { catalog } from "../../lib/catalog";
import { Link } from "../../lib/router";
import { Reveal } from "../Reveal";
import { TemplateCard } from "../TemplateCard";

export function Featured() {
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
      <Reveal className="rail" y={40}>
        <div className="rail-track" data-lenis-prevent>
          {catalog.items.map((item) => (
            <div className="rail-item" key={item.id}><TemplateCard item={item} /></div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
