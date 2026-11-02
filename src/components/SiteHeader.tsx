import { useEffect, useState } from "react";
import { catalog, sectionPath } from "../lib/catalog";
import { Link } from "../lib/router";

function Logo() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="url(#ms-logo)" />
      <path d="M7 22h18M9 16h14M11 10h10" stroke="#07080b" strokeWidth="3" strokeLinecap="round" />
      <defs>
        <linearGradient id="ms-logo" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#ff5a36" />
          <stop offset="1" stopColor="#ffb020" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SiteHeader({ path, overlay }: { path: string; overlay: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const first = path.split("/").filter(Boolean)[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [path]);

  const solid = scrolled || !overlay || open;
  const links = [
    { href: "/browse", label: "Browse", current: first === "browse" },
    ...catalog.sections.map((s) => ({ href: sectionPath(s.id), label: s.label, current: first === s.id, soon: s.status === "soon" })),
    { href: "/licensing", label: "Licensing", current: first === "licensing" },
  ];

  return (
    <header className={solid ? "site-header is-solid" : "site-header"}>
      <Link href="/" className="brand" aria-label="MotionShelf home">
        <Logo />
        <span>MotionShelf</span>
      </Link>
      <nav className={open ? "site-nav is-open" : "site-nav"} aria-label="Primary">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.current ? "page" : undefined}>
            {l.label}
            {"soon" in l && l.soon ? <span className="soon">Soon</span> : null}
          </Link>
        ))}
      </nav>
      <Link href="/browse" className="btn-pill header-cta">Browse templates</Link>
      <button className="menu-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span /><span />
      </button>
    </header>
  );
}
