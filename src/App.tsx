import type { ReactNode } from "react";
import type { SectionId } from "./types";
import { catalog, getItem, itemsInSection, sectionPath } from "./lib/catalog";
import { Link, usePath } from "./lib/router";
import { GalleryPage } from "./pages/GalleryPage";
import { TemplatePage } from "./pages/TemplatePage";
import { LicensingPage } from "./pages/LicensingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const SECTION_IDS = new Set<string>(catalog.sections.map((s) => s.id));

function route(path: string): ReactNode {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return <GalleryPage key="all" />;
  if (parts[0] === "licensing" && parts.length === 1) return <LicensingPage />;
  if (SECTION_IDS.has(parts[0])) {
    const section = parts[0] as SectionId;
    if (parts.length === 1) return <GalleryPage key={section} section={section} />;
    const item = parts.length === 2 ? getItem(parts[1]) : undefined;
    if (item && item.section === section) return <TemplatePage key={item.id} item={item} />;
  }
  return <NotFoundPage />;
}

export function App() {
  const path = usePath();
  const first = path.split("/").filter(Boolean)[0];

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="MotionShelf home">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#ff5a36" />
            <path d="M7 22h18M9 16h14M11 10h10" stroke="#0b0d12" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>MotionShelf</span>
        </Link>
        <nav className="topnav" aria-label="Primary">
          <Link href="/licensing" aria-current={first === "licensing" ? "page" : undefined}>Licensing</Link>
        </nav>
      </header>

      <div className="body">
        <nav className="sidebar" aria-label="Sections">
          <Link href="/" className="side-link" aria-current={path === "/" ? "page" : undefined}>
            All <span className="count">{catalog.items.length}</span>
          </Link>
          {catalog.sections.map((section) => (
            <Link
              key={section.id}
              href={sectionPath(section.id)}
              className="side-link"
              aria-current={first === section.id ? "page" : undefined}
            >
              {section.label}
              {section.status === "soon"
                ? <span className="soon">Soon</span>
                : <span className="count">{itemsInSection(section.id).length}</span>}
            </Link>
          ))}
        </nav>
        <main className="content">{route(path)}</main>
      </div>

      <footer className="footer">
        <span>© 2026 MotionShelf. Original templates, licensed per item.</span>
        <Link href="/licensing">Licensing</Link>
      </footer>
    </div>
  );
}
