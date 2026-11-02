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
  const current = VIEWPORTS.find((v) => v.id === viewport)!;
  const src = previewSrc(item.previewPath);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

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
      <div className="stage">
        <iframe
          key={frameKey}
          className="frame"
          src={src}
          title={`${item.title} live preview`}
          sandbox={INTERACTIVE_SANDBOX}
          style={{ width: current.width ?? "100%" }}
        />
      </div>
      <p className="preview-note muted small">
        Sandboxed: the preview cannot read this site's storage or DOM{hasSeparatePreviewOrigin ? " and loads from a separate origin" : ""}.
      </p>
    </section>
  );
}
