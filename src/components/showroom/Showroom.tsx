import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValueEvent, useReducedMotion } from "motion/react";
import { getAsset } from "../../lib/catalog";
import { stickyTravel, useScrollProgress } from "../../lib/useScrollProgress";
import { ErrorBoundary } from "../ErrorBoundary";
import { Reveal } from "../Reveal";
import type { Input } from "./Scene";

// three.js and the model live in this chunk and are only fetched when the section nears the viewport.
const Scene = lazy(() => import("./Scene"));

const POSTER = "/assets/showroom-poster.webp";

const CHAPTERS = [
  { title: "Studio lit", text: "Soft boxes and rim lights, built in code. No HDR download, no baked video." },
  { title: "Every angle", text: "Scroll to move the camera. Drag to turn the car yourself." },
  { title: "Close in", text: "A 249k-triangle model, compressed to under 2 MB and streamed once." },
  { title: "Ready to ship", text: "Lazy-loaded, performance-monitored, with a still-image fallback." },
];

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Phones and "save data" users get a still image and a button instead of an automatic 1.8 MB download.
function needsOptIn(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return window.matchMedia("(pointer: coarse) and (max-width: 820px)").matches || connection?.saveData === true;
}

export function Showroom() {
  const section = useRef<HTMLElement>(null);
  const input = useRef<Input>({ dragYaw: 0, lastTouch: 0 });
  const drag = useRef<{ x: number } | null>(null);
  const reduce = useReducedMotion() ?? false;
  const near = useInView(section, { once: true, margin: "600px 0px" });
  const visible = useInView(section);
  const [optIn, setOptIn] = useState(false);
  const [supported] = useState(webglAvailable);
  const [needsTap] = useState(needsOptIn);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [chapter, setChapter] = useState(0);
  const scrollYProgress = useScrollProgress(section, stickyTravel);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setChapter(Math.min(CHAPTERS.length - 1, Math.round(value * (CHAPTERS.length - 1))));
  });

  const monitor = typeof window === "undefined" || !new URLSearchParams(window.location.search).has("perf-off");
  const wanted = near && supported && !failed && (!needsTap || optIn);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const end = () => { drag.current = null; };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const credit = getAsset("car-concept");

  return (
    <section className="showroom" id="showroom" ref={section} aria-labelledby="showroom-title">
      <div className="showroom-sticky">
        <div
          className="showroom-stage"
          aria-hidden="true"
          onPointerDown={(event) => { drag.current = { x: event.clientX }; input.current.lastTouch = performance.now(); }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            input.current.dragYaw += (event.clientX - drag.current.x) * 0.008;
            drag.current.x = event.clientX;
            input.current.lastTouch = performance.now();
          }}
        >
          <img className={ready ? "showroom-poster is-hidden" : "showroom-poster"} src={POSTER} alt="" decoding="async" />
          {wanted && (
            <ErrorBoundary fallback={null} onError={onFail}>
            <Suspense fallback={null}>
              <Scene progress={scrollYProgress} input={input} still={reduce} monitor={monitor} active={visible} onReady={onReady} onFail={onFail} />
            </Suspense>
            </ErrorBoundary>
          )}
          <div className="showroom-vignette" />
        </div>

        <div className="showroom-ui">
          <Reveal className="showroom-head">
            <p className="eyebrow">3D showroom</p>
            <h2 id="showroom-title" className="section-title">A car that moves with your scroll</h2>
          </Reveal>

          <div className="showroom-chapter">
            <motion.div key={chapter} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <span className="showroom-n">0{chapter + 1} / 0{CHAPTERS.length}</span>
              <h3>{CHAPTERS[chapter].title}</h3>
              <p>{CHAPTERS[chapter].text}</p>
            </motion.div>
          </div>

          <div className="showroom-foot">
            {needsTap && !optIn && supported && !failed && (
              <button className="btn-pill btn-primary" onClick={() => setOptIn(true)}>Load 3D showroom (≈2 MB)</button>
            )}
            {(!supported || failed) && <p className="showroom-note">The 3D view could not load, so a still image is shown.</p>}
            {ready && <p className="showroom-hint">Drag to rotate</p>}
            {credit?.attributionRequired && (
              <p className="showroom-credit">
                {credit.attributionText} <a href={credit.license.url} target="_blank" rel="noopener noreferrer">License</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
