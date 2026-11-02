import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { Reveal } from "../Reveal";

const STEPS = [
  { title: "Discover", text: "Browse by category, theme and feature. Every experience shows what it needs before you open it." },
  { title: "Preview live", text: "Run the real thing in a sandboxed frame. Switch between desktop, tablet and phone widths." },
  { title: "Copy the code", text: "HTML, CSS and scripts, copy-ready. Or copy everything as a single prompt for your AI assistant." },
  { title: "Ship it", text: "Drop the files into your project. Licenses and attributions are listed for every asset." },
];

function Visual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="vis vis-discover">
        {["Supercar", "Off-road", "Motorsport", "Motorcycle", "3D", "Scroll"].map((t, i) => (
          <span key={t} style={{ animationDelay: `${i * 80}ms` }}>{t}</span>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="vis vis-preview">
        <div className="vp-bar"><i /><i /><i /></div>
        <div className="vp-hero"><b /><b /><b /></div>
        <div className="vp-row"><s /><s /><s /></div>
      </div>
    );
  }
  if (index === 2) {
    return (
      <pre className="vis vis-code"><code>{`<section class="hero">
  <h1>Pure <span>velocity.</span></h1>
  <a class="btn" href="#reserve">
    Reserve a build slot
  </a>
</section>

.hero h1 span { color: var(--accent); }`}</code></pre>
    );
  }
  return (
    <div className="vis vis-ship">
      <p><span>$</span> cp index.html styles.css ./my-site/</p>
      <p><span>$</span> npm run build</p>
      <p className="ok">✓ Built in 0.2s. Ready to deploy.</p>
    </div>
  );
}

export function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(value * STEPS.length))));
  });

  return (
    <section className="story" ref={ref} aria-labelledby="steps-title">
      <div className="story-sticky">
        <div className="section-inner story-layout">
          <div className="story-copy">
            <Reveal>
              <p className="eyebrow">How it works</p>
              <h2 id="steps-title" className="section-title">From idea to your site in four moves</h2>
            </Reveal>
            <ol className="step-list">
              {STEPS.map((step, i) => (
                <li key={step.title} className={i === active ? "step is-active" : "step"}>
                  <span className="step-n">0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="step-progress" aria-hidden="true"><motion.i style={{ scaleX: bar }} /></div>
          </div>
          <div className="story-stage" aria-hidden="true">
            <div className="stage-glow" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="stage-card"
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Visual index={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
