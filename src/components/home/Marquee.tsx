const WORDS = ["Desert Drive", "Earth Explorer", "Motorcycle", "Racing", "Scroll-driven", "3D scenes", "Copy-ready code", "Original assets"];

export function Marquee() {
  // Two identical halves: the track slides exactly one half, so the loop is seamless.
  const half = WORDS.map((word) => <span key={word}>{word}</span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <div className="marquee-half">{half}</div>
        <div className="marquee-half">{half}</div>
      </div>
    </div>
  );
}
