import type { LegalDoc } from "../lib/legal";

// Renders one legal document from src/lib/legal.ts. The same data feeds the prerendered HTML.
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <header className="page-head">
        <h1>{doc.title}</h1>
        <p>{doc.intro}</p>
        <p className="muted small">Last updated {doc.updated}</p>
      </header>
      <div className="prose legal">
        {doc.blocks.map((block) => (
          <section key={block.heading}>
            <h2>{block.heading}</h2>
            {block.paragraphs?.map((text) => <p key={text}>{text}</p>)}
            {block.list && <ul>{block.list.map((text) => <li key={text}>{text}</li>)}</ul>}
          </section>
        ))}
      </div>
    </>
  );
}
