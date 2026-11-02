import { Reveal } from "../Reveal";

const EXPERIENCES = [
  { id: "desert", n: "01", title: "Desert Drive", line: "A sports car cuts through dunes: 3D scenery, drifting dust and scroll-driven camera moves.", tags: ["3D", "Scroll", "Particles"] },
  { id: "earth", n: "02", title: "Earth Explorer", line: "Follow a car around a curved planet with cinematic transitions between continents.", tags: ["3D", "Transitions", "Camera"] },
  { id: "moto", n: "03", title: "Motorcycle", line: "A motorcycle on a mountain pass or a neon city: depth, parallax and light.", tags: ["3D", "Parallax", "Lighting"] },
  { id: "race", n: "04", title: "Racing", line: "Track, speed and sound-of-motion: a race car with streaking light and tension.", tags: ["3D", "Speed FX", "Scroll"] },
];

function Scene({ id }: { id: string }) {
  return (
    <div className={`scene scene-${id}`} aria-hidden="true">
      <span className="layer l1" />
      <span className="layer l2" />
      <span className="layer l3" />
      <span className="layer l4" />
    </div>
  );
}

export function Experiences() {
  return (
    <section className="section" id="experiences" aria-labelledby="exp-title">
      <div className="section-inner">
        <Reveal>
          <p className="eyebrow">In development</p>
          <h2 id="exp-title" className="section-title">Four cinematic experiences</h2>
          <p className="section-lede">Full-screen, scroll-driven worlds you can lift into your own site. Each one ships with its source, its assets and its license.</p>
        </Reveal>
        <div className="exp-grid">
          {EXPERIENCES.map((exp, i) => (
            <Reveal key={exp.id} delay={(i % 2) * 0.12}>
              <article className="exp-tile">
                <Scene id={exp.id} />
                <div className="exp-body">
                  <div className="exp-top">
                    <span className="exp-n">{exp.n}</span>
                    <span className="status-pill">In development</span>
                  </div>
                  <h3>{exp.title}</h3>
                  <p>{exp.line}</p>
                  <ul className="exp-tags">{exp.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
