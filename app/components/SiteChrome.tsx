import Link from "next/link";

export type NavKey = "home" | "total" | "mobility" | "work";

const navItems: Array<{ key: NavKey; href: string; label: string }> = [
  { key: "home", href: "/", label: "Start" },
  { key: "total", href: "/totaal", label: "Banen vergelijken" },
  { key: "mobility", href: "/mobiliteit", label: "Lease & mobiliteit" },
  { key: "work", href: "/werkpatroon", label: "Wat kost werken?" },
];

function Brand() {
  return <><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></>;
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
    <span className="footer-links"><Link href="/uitleg">Uitleg</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/contact">Contact</Link></span>
  </footer>;
}
