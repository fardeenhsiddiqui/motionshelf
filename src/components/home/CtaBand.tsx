import { Link } from "../../lib/router";
import { Reveal } from "../Reveal";

export function CtaBand() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="cta-glow" aria-hidden="true" />
      <Reveal className="cta-inner">
        <h2 id="cta-title">Pick an experience.<br /><span>Make it yours.</span></h2>
        <p>Original code and assets, with the license on every page.</p>
        <Link href="/browse" className="btn-pill btn-primary">Start browsing</Link>
      </Reveal>
    </section>
  );
}
