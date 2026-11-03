import { useEffect, useRef, useState } from "react";
import type { CatalogItem } from "../types";
import { INTERACTIVE_SANDBOX, hasSeparatePreviewOrigin, previewSrc } from "../lib/preview";

const VIEWPORTS = [
  { id: "desktop", label: "Desktop", width: null },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 390 },
] as const;

type ViewportId = (typeof VIEWPORTS)[number]["id"];

export function PreviewFrame({ item }: { item: CatalogItem }) {
  const root = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState<ViewportId>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [full, setFull] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const current = VIEWPORTS.find((v) => v.id === viewport)!;
  const src = previewSrc(item.previewPath);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Show a skeleton until the frame has loaded; after 10 seconds say so, and point at Reload.
  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 10000);
    return () => window.clearTimeout(timer);
  }, [frameKey, src]);

  // The preview is a full scrolling page, so it only captures the wheel and touch once you opt in.
  // It lets go again on Escape, on Done, or when it scrolls out of view.
  useEffect(() => {
    if (!engaged) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setEngaged(false); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setEngaged(false); }, { threshold: 0.05 });
    if (stage.current) observer.observe(stage.current);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); observer.disconnect(); };
  }, [engaged]);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch {
      // Fullscreen can be blocked (for example inside another frame); the page layout still works.
    }
  };

  return (
    <section ref={root} aria-label="Live preview" className={full ? "preview is-full" : "preview"}>
      <div className="preview-bar">
        <div role="group" aria-label="Viewport size" className="segmented">
          {VIEWPORTS.map((v) => (
            <button
              key={v.id}
              className={v.id === viewport ? "seg is-active" : "seg"}
              aria-pressed={v.id === viewport}
              onClick={() => setViewport(v.id)}
            >
              {v.label}{v.width ? <small> {v.width}px</small> : null}
            </button>
          ))}
        </div>
        <div className="preview-actions">
          <button className="btn btn-quiet" onClick={() => setFrameKey((k) => k + 1)}>Reload</button>
          <a className="btn btn-quiet" href={src} target="_blank" rel="noopener noreferrer">Open in new tab ↗</a>
          <button className="btn" onClick={toggleFull} aria-pressed={full}>{full ? "Exit full screen" : "Full screen"}</button>
        </div>
      </div>
      <div className="stage" ref={stage}>
        <div className="frame-wrap" style={{ width: current.width ?? "100%" }}>
          {engaged && !full && (
            <div className="frame-done"><button className="btn" onClick={() => setEngaged(false)}>Done</button></div>
          )}
          <iframe
            key={frameKey}
            className={engaged || full ? "frame" : "frame is-inert"}
            src={src}
            title={`${item.title} live preview`}
            sandbox={INTERACTIVE_SANDBOX}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <>
              <div className="frame-skeleton" aria-hidden="true" />
              <p className="frame-status" role="status">{slow ? "This is taking longer than usual. Try Reload." : "Loading preview…"}</p>
            </>
          )}
          {!engaged && !full && (
            <button className="frame-lock" onClick={() => setEngaged(true)}>
              <span className="frame-lock-cta">Tap or click to interact</span>
              <small>Until then the page scrolls normally</small>
            </button>
          )}
        </div>
      </div>
      <p className="preview-note muted small">
        Sandboxed: the preview cannot read this site's storage or DOM{hasSeparatePreviewOrigin ? " and loads from a separate origin" : ""}.
      </p>
    </section>
  );
}
