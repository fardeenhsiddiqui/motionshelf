import type { ReactNode } from "react";
import { motion } from "motion/react";
import type { SectionId } from "./types";
import { catalog, getItem } from "./lib/catalog";
import { usePath } from "./lib/router";
import { SmoothScroll } from "./lib/smoothScroll";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { HomePage } from "./pages/HomePage";
import { GalleryPage } from "./pages/GalleryPage";
import { TemplatePage } from "./pages/TemplatePage";
import { LicensingPage } from "./pages/LicensingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const SECTION_IDS = new Set<string>(catalog.sections.map((s) => s.id));

function route(path: string): ReactNode {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return <HomePage />;
  if (parts[0] === "browse" && parts.length === 1) return <GalleryPage key="all" />;
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
  const isHome = path === "/";

  return (
    <div className="shell">
      <SmoothScroll />
      <SiteHeader path={path} overlay={isHome} />
      {isHome ? (
        <main>{route(path)}</main>
      ) : (
        <motion.main
          key={path}
          className="page"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {route(path)}
        </motion.main>
      )}
      <SiteFooter />
    </div>
  );
}
