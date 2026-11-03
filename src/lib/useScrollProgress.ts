import { useEffect, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// How far an element has scrolled past the top of the viewport, as a motion value from 0 to 1.
// `travel` returns the scroll distance that counts as 0 to 1. Define it once at module level.
//
// This replaces motion's `useScroll({ target })`, which kept the whole home page in memory after
// navigating away (about 450 DOM nodes and 24 listeners per visit, see AUDIT.md). One passive
// listener, removed on unmount.
export type Travel = (rect: DOMRect, viewportHeight: number) => number;

// The element's own height: 0 when its top touches the viewport top, 1 when its bottom does.
export const pastTop: Travel = (rect) => rect.height;

// A tall section with a sticky child: 1 when the section's bottom reaches the viewport bottom.
export const stickyTravel: Travel = (rect, viewportHeight) => rect.height - viewportHeight;

export function useScrollProgress(ref: RefObject<HTMLElement | null>, travel: Travel): MotionValue<number> {
  const progress = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = travel(rect, window.innerHeight);
      progress.set(distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref, progress, travel]);
  return progress;
}
