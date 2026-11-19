import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "../components/AdSlot";
import JsonLd from "../components/JsonLd";
import { SiteFooter, SiteNav } from "../components/SiteChrome";
import { CAOS, type Cao } from "../../lib/caos";
import { caoPath, caosBySector, employeeRatePct, holidayText, yearEndText } from "../../lib/cao-pages";
import { DEFAULT_TAX_YEAR } from "../../lib/tax-years";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/cao",
  title: `Netto salaris per cao (${DEFAULT_TAX_YEAR}): pensioen en 13e maand`,
  description: `Vakantiegeld, 13e maand en pensioenpremie van ${CAOS.length} grote cao's, met wat je netto overhoudt. Zorg, onderwijs, overheid, retail, bouw en meer.`,
});

/** "8% vakantiegeld · 13e maand van 8,33% · PFZW, 12,95% eigen premie" */
function caoLine(cao: Cao) {
  const parts = [holidayText(cao), yearEndText(cao)];
  if (cao.pension) parts.push(`${cao.pension.fund}, ${employeeRatePct(cao).toLocaleString("nl-NL")}% eigen premie`);
  const text = parts.join(" · ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function CaoIndexPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Netto per cao", "/cao"]])} /><main>
    <SiteNav />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> Netto per cao</span>
      <h1>Wat houd je netto over onder jouw cao?</h1>
      <p>Je cao bepaalt je vakantiegeld, of je een 13e maand krijgt en hoeveel pensioenpremie je zelf betaalt. Per cao zie je wat dat betekent voor je netto salaris in {DEFAULT_TAX_YEAR}, met rekenvoorbeelden en de bronnen.</p>
    </header>
    <section className="shell">
      {caosBySector().map((group) => <div key={group.sector} className="kb-tools">
        <h2>{group.sector}</h2>
        <div className="kb-grid">
          {group.caos.map((cao) => <Link key={cao.id} href={caoPath(cao)} className="related-card"><strong>{cao.name}</strong><span>{caoLine(cao)}</span></Link>)}
        </div>
      </div>)}
      <div className="kb-tools">
        <h2>Staat jouw cao er niet bij?</h2>
        <p className="choice-note">Vul vakantiegeld, 13e maand en je eigen pensioeninleg zelf in de <Link href="/bruto-netto">bruto-netto-calculator</Link> in. Je vindt ze op je loonstrook of in je arbeidsvoorwaarden.</p>
      </div>
    </section>
    <AdSlot placement="cao" />
    <SiteFooter />
  </main></>;
}
