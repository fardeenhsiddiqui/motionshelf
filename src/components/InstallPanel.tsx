import type { CatalogItem } from "../types";

export function InstallPanel({ item }: { item: CatalogItem }) {
  const names = item.files.map((f) => f.path);
  const hasDeps = item.externalDeps.length > 0;
  return (
    <aside className="panel" aria-label="Dependencies and installation">
      <h2>Dependencies &amp; install</h2>
      {hasDeps ? (
        <ul className="deps">
          {item.externalDeps.map((dep) => <li key={dep}><code>{dep}</code></li>)}
        </ul>
      ) : (
        <p className="muted small">No dependencies. Plain files, no build step.</p>
      )}
      <h3>Install</h3>
      <ol className="steps">
        <li>Download the files or copy them into one folder: {names.map((n, i) => <span key={n}>{i > 0 && ", "}<code>{n}</code></span>)}.</li>
        {hasDeps && <li>Load the dependencies above. Pin the versions listed; CDN scripts go before <code>script.js</code>.</li>}
        <li>Open <code>index.html</code>, or drop the folder into any static host.</li>
        <li>Replace the brand, copy and colors, and keep the credits above where required.</li>
      </ol>
    </aside>
  );
}
