import { useState, type KeyboardEvent } from "react";
import type { Asset, CatalogItem } from "../types";
import { allReady, buildPrompt, copyText, saveBlob, zipFiles, type Sources } from "../lib/sources";

type Notice = "" | "ok" | "fail";

// Briefly shows a result label after an action such as copy.
function useNotice(): [Notice, (ok: boolean) => void] {
  const [notice, setNotice] = useState<Notice>("");
  const show = (ok: boolean) => {
    setNotice(ok ? "ok" : "fail");
    window.setTimeout(() => setNotice(""), 1800);
  };
  return [notice, show];
}

export function CodeTabs({ item, sources, assets }: { item: CatalogItem; sources: Sources; assets: Asset[] }) {
  const [active, setActive] = useState(0);
  const [copied, showCopied] = useNotice();
  const [prompted, showPrompted] = useNotice();

  const file = item.files[active];
  const source = sources[file.path] ?? { status: "loading" };
  const ready = allReady(item, sources);

  // Arrow keys, Home and End move between file tabs, as in the WAI-ARIA tabs pattern.
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = item.files.length;
    const next = event.key === "ArrowRight" ? (active + 1) % count : event.key === "ArrowLeft" ? (active + count - 1) % count : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`tab-${item.id}-${next}`)?.focus();
  };

  const onCopy = async () => {
    if (source.status === "ready") showCopied(await copyText(source.text));
  };
  const onPrompt = async () => {
    if (ready) showPrompted(await copyText(buildPrompt(item, sources, assets)));
  };
  const onZip = () => {
    if (!ready) return;
    const files = item.files.map((f) => ({ name: f.path, text: (sources[f.path] as { text: string }).text }));
    saveBlob(`${item.id}.zip`, zipFiles(files));
  };

  return (
    <section className="code" aria-label="Source code">
      <div className="code-bar">
        <div role="tablist" aria-label="Source files" className="code-tabs" onKeyDown={onTabKey}>
          {item.files.map((f, index) => (
            <button
              key={f.path}
              id={`tab-${item.id}-${index}`}
              role="tab"
              aria-selected={index === active}
              aria-controls={`panel-${item.id}`}
              tabIndex={index === active ? 0 : -1}
              className={index === active ? "tab is-active" : "tab"}
              onClick={() => setActive(index)}
            >
              {f.path}
            </button>
          ))}
        </div>
        <div className="code-actions" aria-live="polite">
          <button className="btn btn-quiet" onClick={onPrompt} disabled={!ready}>
            {prompted === "ok" ? "Prompt copied ✓" : prompted === "fail" ? "Copy failed" : "Copy as prompt"}
          </button>
          <button className="btn btn-quiet" onClick={onZip} disabled={!ready}>Download all (.zip)</button>
          <a className="btn btn-quiet" href={`${item.filesBase}/${file.path}`} download={file.path}>Download {file.path}</a>
          <button className="btn" onClick={onCopy} disabled={source.status !== "ready"}>
            {copied === "ok" ? "Copied ✓" : copied === "fail" ? "Copy failed" : `Copy ${file.language.toUpperCase()}`}
          </button>
        </div>
      </div>
      <pre className="code-body" id={`panel-${item.id}`} role="tabpanel" aria-labelledby={`tab-${item.id}-${active}`} tabIndex={0}>
        {source.status === "loading" && <span className="muted">Loading…</span>}
        {source.status === "error" && <span className="muted">Could not load {file.path}. Try the Download button.</span>}
        {source.status === "ready" && <code>{source.text}</code>}
      </pre>
    </section>
  );
}
