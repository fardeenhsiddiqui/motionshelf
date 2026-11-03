import { useEffect, useRef } from "react";
import { MotionConfig, motion } from "motion/react";
import type { Section } from "./types";
import { usePath } from "./lib/router";
import { SmoothScroll } from "./lib/smoothScroll";
import { useDocumentMeta } from "./lib/useDocumentMeta";
import { useItem, useSections } from "./lib/useCatalog";
import { DataView } from "./components/DataView";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { HomePage } from "./pages/HomePage";
import { GalleryPage } from "./pages/GalleryPage";
import { TemplatePage } from "./pages/TemplatePage";
import { LicensingPage } from "./pages/LicensingPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function TemplateRoute({ section, id }: { section: Section; id: string }) {
  const item = useItem(id);
  return (
    <DataView result={item} what="this template" isEmpty={(found) => found === null || found.section !== section.id} empty={<NotFoundPage />}>
      {(found) => found && <TemplatePage item={found} />}
    </DataView>
  );
}

// Anything that is not the home page, /browse or /licensing must name a section, so it waits for the section list.
function SectionRoute({ parts }: { parts: string[] }) {
  const sections = useSections();
  return (
    <DataView result={sections} what="this page">
      {(all) => {
        const section = all.find((s) => s.id === parts[0]);
        if (!section || parts.length > 2) return <NotFoundPage />;
        if (parts.length === 1) return <GalleryPage key={section.id} section={section.id} />;
        return <TemplateRoute key={parts[1]} section={section} id={parts[1]} />;
      }}
    </DataView>
  );
}

function Route({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return <HomePage />;
  if (parts.length === 1 && parts[0] === "browse") return <GalleryPage key="all" />;
  if (parts.length === 1 && parts[0] === "licensing") return <LicensingPage />;
  return <SectionRoute parts={parts} />;
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
  useDocumentMeta(path);
  const page = <ErrorBoundary key={path} fallback={<PageError />}><Route path={path} /></ErrorBoundary>;

  // After a client-side route change, move focus to the new page heading so keyboard and screen reader users follow along.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const main = document.getElementById("main");
    if (!main) return;
    const focus = (target: HTMLElement) => { target.tabIndex = -1; target.focus({ preventScroll: true }); };
    const heading = main.querySelector<HTMLElement>("h1");
    if (heading) { focus(heading); return; }
    // The page is still loading its data: focus the main area now, and the heading as soon as it appears.
    focus(main);
    const watcher = new MutationObserver(() => {
      const found = main.querySelector<HTMLElement>("h1");
      if (!found) return;
      if (document.activeElement === main) focus(found);
      watcher.disconnect();
    });
    watcher.observe(main, { childList: true, subtree: true });
    const stop = window.setTimeout(() => watcher.disconnect(), 5000);
    return () => { watcher.disconnect(); window.clearTimeout(stop); };
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
