import { catalog, itemPath } from "../lib/catalog";
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
    </>
  );
}
