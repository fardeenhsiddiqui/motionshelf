import { useEffect, useRef, type ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";
import type { SectionId } from "./types";
import { catalog, getItem } from "./lib/catalog";
import { usePath } from "./lib/router";
import { SmoothScroll } from "./lib/smoothScroll";
import { ErrorBoundary } from "./components/ErrorBoundary";
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

function PageError() {
  return (
    <div className="empty">
      <h1>Something went wrong</h1>
      <p>This page failed to load. Reloading usually fixes it.</p>
      <button className="btn" onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

export function App() {
  const path = usePath();
  const isHome = path === "/";
  const page = <ErrorBoundary key={path} fallback={<PageError />}>{route(path)}</ErrorBoundary>;

  // After a client-side route change, move focus to the new page heading so keyboard and screen reader users follow along.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const main = document.getElementById("main");
    const target = main?.querySelector<HTMLElement>("h1") ?? main;
    if (!target) return;
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }, [path]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <a className="skip-link" href="#main">Skip to content</a>
        <SmoothScroll />
        <SiteHeader path={path} overlay={isHome} />
        {isHome ? (
          <main id="main" tabIndex={-1}>{page}</main>
        ) : (
          <motion.main
            id="main"
            key={path}
            className="page"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {page}
          </motion.main>
        )}
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
