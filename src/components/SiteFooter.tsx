import { sectionPath } from "../lib/paths";
import { useSections } from "../lib/useCatalog";
import { Link } from "../lib/router";

export function SiteFooter() {
  const sections = useSections();
  const sectionList = sections.status === "ready" ? sections.data : [];
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <p className="footer-brand">MotionShelf</p>
          <p className="muted small">Original, animated website experiences you can preview, copy and ship. Licensed per asset.</p>
        </div>
        <nav aria-label="Library">
          <p className="footer-title">Library</p>
          <Link href="/browse">Browse all</Link>
          {sectionList.map((s) => <Link key={s.id} href={sectionPath(s.id)}>{s.label}</Link>)}
        </nav>
        <nav aria-label="Legal">
          <p className="footer-title">Trust</p>
          <Link href="/licensing">Licensing</Link>
          <span className="muted small">Not affiliated with any vehicle manufacturer.</span>
        </nav>
      </div>
      <p className="footer-fine muted small">© 2026 MotionShelf. Vehicle brands mentioned, if any, belong to their owners.</p>
    </footer>
  );
}
