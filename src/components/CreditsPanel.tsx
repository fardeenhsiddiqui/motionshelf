import type { Asset } from "../types";

// Third-party assets used by a template: source, author, license and the exact credit line to show.
export function CreditsPanel({ assets }: { assets: Asset[] }) {
  return (
    <aside className="panel" aria-label="Asset sources and credits">
      <h2>Asset sources &amp; credits</h2>
      {assets.length === 0 ? (
        <p className="muted small">No third-party assets. All artwork in this template is original and included in its license.</p>
      ) : (
        <ul className="credits">
          {assets.map((asset) => (
            <li key={asset.id}>
              <strong>{asset.title}</strong>
              <p className="muted small">
                {asset.author} · <a href={asset.license.url} target="_blank" rel="noopener noreferrer">{asset.license.name}</a>
                {" · "}<a href={asset.source.url} target="_blank" rel="noopener noreferrer">Source ↗</a>
              </p>
              {asset.attributionRequired && <p className="credit-line small">{asset.attributionText}</p>}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
