import { useEffect } from "react";
import Lenis from "lenis";

let instance: Lenis | null = null;
let wake: () => void = () => {};

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { immediate: true });
  else window.scrollTo({ top: 0 });
  wake();
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: "smooth" });
  wake();
}

// Lenis smooth scrolling for the whole platform; skipped when the user prefers reduced motion.
// The animation loop only runs while a scroll is in progress. It used to run every frame forever, which
// cost 2% of a CPU core on a laptop and about 10% on a mid-range phone while nothing was moving.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    instance = lenis;

    let frame = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      frame = lenis.isScrolling ? requestAnimationFrame(tick) : 0;
    };
    wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const inputs = ["wheel", "scroll", "touchstart", "keydown"] as const;
    inputs.forEach((name) => window.addEventListener(name, wake, { passive: true }));

    return () => {
      inputs.forEach((name) => window.removeEventListener(name, wake));
      cancelAnimationFrame(frame);
      wake = () => {};
      lenis.destroy();
      instance = null;
    };
  }, []);
  return null;
}
