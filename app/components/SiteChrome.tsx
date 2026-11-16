import Link from "next/link";
import { CALCULATORS } from "../../lib/calculators";

export type NavKey = "home" | "total" | "mobility" | "work" | "questions";

const navItems: Array<{ key: NavKey; href: string; label: string }> = [
  { key: "home", href: "/", label: "Start" },
  { key: "total", href: "/totaal", label: "Banen vergelijken" },
  { key: "mobility", href: "/mobiliteit", label: "Lease & mobiliteit" },
  { key: "work", href: "/werkpatroon", label: "Wat kost werken?" },
  { key: "questions", href: "/vragen", label: "Vragen" },
];

function Brand() {
  return <>
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="8 12 48 44" width="22" height="22"><rect x="12" y="40" width="9" height="12" rx="2.5" fill="#5c7a92" /><rect x="27.5" y="30" width="9" height="22" rx="2.5" fill="#8fd9cc" /><rect x="43" y="16" width="9" height="36" rx="2.5" fill="#129783" /></svg>
    </span>
    <span>Netto<span>plaatje</span></span>
  </>;
}

export function SiteNav({ active }: { active?: NavKey }) {
  return <nav className="topbar shell">
    <Link className="brand" href="/"><Brand /></Link>
    <div className="site-nav" role="navigation" aria-label="Hoofdnavigatie">
      {navItems.map((item) => <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""} aria-current={active === item.key ? "page" : undefined}>{item.label}</Link>)}
    </div>
    <div className="nav-note"><span className="status-dot"></span> Indicatie voor 2026</div>
  </nav>;
}

export function SiteFooter() {
  return <footer className="footer shell">
    <div className="brand"><Brand /></div>
    <span>Een heldere indicatie voor jouw werk- en mobiliteitskeuze.</span>
    <nav className="footer-tools" aria-label="Calculators">{CALCULATORS.map((tool) => <Link key={tool.href} href={tool.href}>{tool.title}</Link>)}<Link href="/vragen">Vragen en antwoorden</Link></nav>
    <span className="footer-links"><Link href="/uitleg">Uitleg</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/contact">Contact</Link></span>
  </footer>;
}
