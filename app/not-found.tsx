import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav } from "./components/SiteChrome";
import { CALCULATORS } from "../lib/calculators";
import { AMOUNT_PAGES, amountLabel, amountPath } from "../lib/amounts";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  robots: { index: false },
};

const POPULAR_AMOUNTS = ["2500-per-maand", "3000-per-maand", "3500-per-maand", "4000-per-maand", "50000-per-jaar"];

/** Served by Cloudflare as out/404.html for every unknown path. */
export default function NotFound() {
  const amounts = AMOUNT_PAGES.filter((page) => POPULAR_AMOUNTS.includes(page.slug));
  return <main>
    <SiteNav />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> Foutcode 404</span>
      <h1>Deze pagina bestaat niet (meer)</h1>
      <p>De link is misschien verouderd of er zit een typefout in het adres. Kies hieronder een calculator, of begin op de <Link href="/">homepage</Link>.</p>
    </header>
    <section className="tool-grid tool-grid-all shell" aria-label="Alle calculators">
      {CALCULATORS.map((tool, index) => <Link key={tool.href} className={`tool-card ${index % 2 === 0 ? "teal" : "blue"}`} href={tool.href}>
        <span className="section-kicker">{tool.kicker}</span><h2>{tool.title}</h2><p>{tool.text}</p><span className="tool-link">Bereken →</span>
      </Link>)}
    </section>
    <section className="landing-content shell" aria-label="Veelgezocht">
      <span className="section-kicker">Veelgezocht</span><h2>Snel naar een bedrag of je cao</h2>
      <div><h3>Netto bij een bedrag</h3><p className="not-found-links">{amounts.map((page) => <Link key={page.slug} href={amountPath(page)}>{amountLabel(page)}</Link>)}</p></div>
      <div><h3>Meer hulp</h3><p className="not-found-links"><Link href="/cao">Netto per cao</Link><Link href="/vragen">Vragen en antwoorden</Link><Link href="/uitleg">Zo rekenen we</Link><Link href="/contact">Contact</Link></p></div>
    </section>
    <SiteFooter />
  </main>;
}
