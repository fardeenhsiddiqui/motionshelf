import { allAssets, catalog, itemPath } from "../lib/catalog";
import { Link } from "../lib/router";

export function LicensingPage() {
  return (
    <>
      <header className="page-head">
        <h1>Licensing</h1>
        <p>Every item on MotionShelf lists its license, author and source before you copy or download it.</p>
      </header>

      <div className="prose">
        <h2>Our rules</h2>
        <ul>
          <li>MotionShelf only lists original work or work with a license that permits redistribution.</li>
          <li>No copyrighted vehicle photos, brand logos or official marketing material.</li>
          <li>Every catalog entry carries a license record. The build fails if one is missing.</li>
          <li>This page describes our process. It is not legal advice.</li>
        </ul>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Item</th><th>License</th><th>Author</th><th>Commercial</th><th>Attribution</th><th>AI-assisted</th><th>Verified</th></tr>
          </thead>
          <tbody>
            {catalog.items.map((item) => (
              <tr key={item.id}>
                <td><Link href={itemPath(item)}>{item.title}</Link></td>
                <td><a href={item.license.licenseFile} target="_blank" rel="noopener noreferrer">{item.license.spdx}</a></td>
                <td>{item.license.author}</td>
                <td>{item.license.commercialUse ? "Yes" : "No"}</td>
                <td>{item.license.attributionRequired ? "Required" : "None"}</td>
                <td>{item.license.aiGenerated ? "Yes" : "No"}</td>
                <td>{item.license.verifiedOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose licensing-block">
        <h2>Third-party assets</h2>
        <p className="muted">Files used by the site or by templates that are not original to MotionShelf.</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Asset</th><th>License</th><th>Author</th><th>Attribution</th><th>Source</th></tr>
          </thead>
          <tbody>
            {allAssets().map((asset) => (
              <tr key={asset.id}>
                <td>{asset.title}</td>
                <td><a href={asset.license.url} target="_blank" rel="noopener noreferrer">{asset.license.name}</a></td>
                <td>{asset.author}</td>
                <td>{asset.attributionRequired ? asset.attributionText : "None"}</td>
                <td><a href={asset.source.url} target="_blank" rel="noopener noreferrer">Source</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose licensing-block">
        <h2>Libraries and fonts</h2>
        <ul>
          <li>React, Motion, Lenis, three.js, React Three Fiber and drei: MIT.</li>
          <li>Unbounded and Inter fonts (via Fontsource): SIL Open Font License 1.1.</li>
          <li>Templates load GSAP and ScrollTrigger from cdnjs and, for the Vortex GT 3D hero, three.js from esm.sh. GSAP is used under its standard no-charge license and is not redistributed in the template files.</li>
        </ul>
      </div>
    </>
  );
}
