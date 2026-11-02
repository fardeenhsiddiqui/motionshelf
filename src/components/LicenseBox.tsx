import type { License } from "../types";

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export function LicenseBox({ license }: { license: License }) {
  return (
    <aside className="panel" aria-label="License and source">
      <h2>License &amp; source</h2>
      <p className="license-name">
        <strong>{license.name}</strong>
        <a href={license.licenseFile} target="_blank" rel="noopener noreferrer">View license text ↗</a>
      </p>
      <dl className="facts">
        <dt>Author</dt><dd>{license.author}</dd>
        <dt>Commercial use</dt><dd>{yesNo(license.commercialUse)}</dd>
        <dt>Modification</dt><dd>{yesNo(license.modification)}</dd>
        <dt>Redistribution</dt><dd>{yesNo(license.redistribution)}</dd>
        <dt>Attribution</dt><dd>{license.attributionRequired ? license.attributionText : "Not required"}</dd>
        <dt>Original IP</dt><dd>{yesNo(license.originalIp)}</dd>
        <dt>AI-assisted</dt><dd>{yesNo(license.aiGenerated)}</dd>
        <dt>Verified</dt><dd>{license.verifiedOn}</dd>
      </dl>
      <p className="muted small">{license.notes}</p>
    </aside>
  );
}
