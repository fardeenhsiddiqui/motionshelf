import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { itemPath } from "../../lib/paths";
import { useItems } from "../../lib/useCatalog";
import { Link } from "../../lib/router";
import { scrollToId } from "../../lib/smoothScroll";
import { pastTop, useScrollProgress } from "../../lib/useScrollProgress";
import { PreviewThumb } from "../PreviewThumb";
import type { CatalogItem } from "../../types";

const EASE = [0.16, 1, 0.3, 1] as const;

// Each word slides up from behind its own mask, one after another.
function Words({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span className="word-mask" key={`${word}-${i}`}>
          <motion.span
            className="word"
            initial={reduce ? false : { y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.1, delay: delay + i * 0.09, ease: EASE }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Frame({ item, className }: { item: CatalogItem; className: string }) {
  return (
    <Link href={itemPath(item)} className={`stack-frame ${className}`} aria-label={`Open ${item.title}`}>
      <div className="frame-bar"><span>{item.title}</span></div>
      <PreviewThumb src={item.previewPath} poster={item.posterPath} title={item.title} />
    </Link>
  );
}

function PreviewStack({ items }: { items: CatalogItem[] }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 90, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 90, damping: 18 });

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const box = event.currentTarget.getBoundingClientRect();
    mx.set((event.clientX - box.left) / box.width - 0.5);
    my.set((event.clientY - box.top) / box.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const [a, b, c] = items;
  return (
    <motion.div
      className="stack-scene"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 60, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
    >
      <motion.div className="stack" style={reduce ? undefined : { rotateX, rotateY }}>
        {b && <Frame item={b} className="frame-left" />}
        {c && <Frame item={c} className="frame-right" />}
        {a && <Frame item={a} className="frame-main" />}
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const scrollYProgress = useScrollProgress(ref, pastTop);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);
  const roadY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

  const result = useItems();
  const items = result.status === "ready" ? result.data : [];
  const live = items.length;
  const licences = [...new Set(items.map((item) => item.license.spdx))].join(", ");
  const stackItems = items.filter((item) => item.section === "templates").slice(0, 3);

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true">
        <motion.div className="road" style={{ y: roadY }}>
          <div className="road-plane" />
          <div className="road-glow" />
        </motion.div>
        <div className="streaks"><i /><i /><i /><i /><i /><i /></div>
      </div>

      <div className="hero-inner">
        <motion.div className="hero-copy" style={{ y: textY, opacity: fade }}>
          <motion.p
            className="eyebrow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          >
            Animated website experiences
          </motion.p>
          <h1 id="hero-title">
            <Words text="Websites" delay={0.2} className="h1-line" />
            <Words text="that move." delay={0.38} className="h1-line h1-accent" />
          </h1>
          <motion.p
            className="hero-lede"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
          >
            Cinematic, reusable website experiences. Preview them live, copy the code, and drop them into your own project.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1, ease: EASE }}
          >
            <Link href="/browse" className="btn-pill btn-primary">Browse templates</Link>
            <button className="btn-pill btn-outline" onClick={() => scrollToId("showroom")}>Watch the 3D showroom</button>
          </motion.div>
          {live > 0 && <motion.ul
            className="hero-facts"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
          >
            <li><b>{live}</b> live templates</li>
            <li><b>{licences}</b> code, credits listed per asset</li>
          </motion.ul>}
        </motion.div>

        <PreviewStack items={stackItems} />
      </div>

      <div className="scroll-cue" aria-hidden="true"><span>Scroll</span><i /></div>
    </section>
  );
}
