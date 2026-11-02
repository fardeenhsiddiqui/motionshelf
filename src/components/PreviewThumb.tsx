import { useEffect, useRef, useState } from "react";

const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;
const HOVER_DELAY_MS = 180;

type Props = { src: string; title: string; poster?: string };

// With a poster: a lazy image, upgraded to a live scripts-off preview while the pointer rests on it.
// Without one: the live preview is always mounted.
export function PreviewThumb({ src, title, poster }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);
  const [scale, setScale] = useState(0.3);
  const [live, setLive] = useState(!poster);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / DESKTOP_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = () => {
    if (!poster) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLive(true), HOVER_DELAY_MS);
  };
  const stop = () => {
    if (!poster) return;
    window.clearTimeout(timer.current);
    setLive(false);
  };

  return (
    <div
      className={live && poster ? "thumb is-live" : "thumb"}
      ref={box}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") start(); }}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      {poster && <img src={poster} alt="" loading="lazy" decoding="async" width={DESKTOP_WIDTH} height={DESKTOP_HEIGHT} />}
      {live && (
        <iframe
          src={src}
          title={`${title} preview`}
          sandbox="allow-same-origin"
          tabIndex={-1}
          aria-hidden="true"
          style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
