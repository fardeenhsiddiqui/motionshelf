import { useEffect, useRef, useState } from "react";

const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;

// Renders a live, non-interactive, scripts-off miniature of a template.
export function PreviewThumb({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESKTOP_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="thumb" ref={box}>
      <iframe
        src={src}
        title={`${title} preview`}
        sandbox="allow-same-origin"
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, transform: `scale(${scale})` }}
      />
    </div>
  );
}
