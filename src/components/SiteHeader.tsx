import { useEffect, useRef, useState } from "react";
import { sectionPath } from "../lib/paths";
import { useSections } from "../lib/useCatalog";
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
  const menuButton = useRef<HTMLButtonElement>(null);
  const first = path.split("/").filter(Boolean)[0];
  const sections = useSections();
  const sectionList = sections.status === "ready" ? sections.data : [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [path]);

  // Escape closes the mobile menu and hands focus back to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButton.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || !overlay || open;
  const links = [
    { href: "/browse", label: "Browse", current: first === "browse" },
    ...sectionList.map((s) => ({ href: sectionPath(s.id), label: s.label, current: first === s.id, soon: s.status === "soon" })),
    { href: "/licensing", label: "Licensing", current: first === "licensing" },
  ];

  return (
    <header className={solid ? "site-header is-solid" : "site-header"}>
      <Link href="/" className="brand" aria-label="MotionShelf home">
        <Logo />
        <span>MotionShelf</span>
      </Link>
      <nav id="site-nav" className={open ? "site-nav is-open" : "site-nav"} aria-label="Primary">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.current ? "page" : undefined}>
            {l.label}
            {"soon" in l && l.soon ? <span className="soon">Soon</span> : null}
          </Link>
        ))}
      </nav>
      <Link href="/browse" className="btn-pill header-cta">Browse templates</Link>
      <button ref={menuButton} className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-controls="site-nav" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span /><span />
      </button>
    </header>
  );
}
