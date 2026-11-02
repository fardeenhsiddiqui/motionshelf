import { useEffect, useState } from "react";
import type { CatalogItem } from "../types";

type Loaded = { status: "loading" } | { status: "error" } | { status: "ready"; text: string };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts or blocked clipboard access.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CodeTabs({ item }: { item: CatalogItem }) {
  const [active, setActive] = useState(0);
  const [sources, setSources] = useState<Record<string, Loaded>>({});
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");

  useEffect(() => {
    let cancelled = false;
    setSources({});
    item.files.forEach(async (file) => {
      let result: Loaded;
      try {
        const response = await fetch(`${item.filesBase}/${file.path}`);
        if (!response.ok) throw new Error(String(response.status));
        result = { status: "ready", text: await response.text() };
      } catch {
        result = { status: "error" };
      }
      if (!cancelled) setSources((prev) => ({ ...prev, [file.path]: result }));
    });
    return () => {
      cancelled = true;
    };
  }, [item]);

  const file = item.files[active];
  const source = sources[file.path] ?? { status: "loading" };

  const onCopy = async () => {
    if (source.status !== "ready") return;
    setCopied((await copyText(source.text)) ? "ok" : "fail");
    window.setTimeout(() => setCopied(""), 1800);
  };

  return (
    <section className="code" aria-label="Source code">
      <div className="code-bar">
        <div role="tablist" className="code-tabs">
          {item.files.map((f, index) => (
            <button
              key={f.path}
              role="tab"
              aria-selected={index === active}
              className={index === active ? "tab is-active" : "tab"}
              onClick={() => setActive(index)}
            >
              {f.path}
            </button>
          ))}
        </div>
        <div className="code-actions">
          <a className="btn btn-quiet" href={`${item.filesBase}/${file.path}`} download={file.path}>Download</a>
          <button className="btn" onClick={onCopy} disabled={source.status !== "ready"} aria-live="polite">
            {copied === "ok" ? "Copied ✓" : copied === "fail" ? "Copy failed" : `Copy ${file.language.toUpperCase()}`}
          </button>
        </div>
      </div>
      <pre className="code-body" tabIndex={0}>
        {source.status === "loading" && <span className="muted">Loading…</span>}
        {source.status === "error" && <span className="muted">Could not load {file.path}. Try the Download button.</span>}
        {source.status === "ready" && <code>{source.text}</code>}
      </pre>
    </section>
  );
}
