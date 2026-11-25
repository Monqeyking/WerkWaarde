import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../components/AdSlot";
import EmbedCta from "../../components/EmbedCta";
import JsonLd from "../../components/JsonLd";
import { SiteFooter, SiteNav } from "../../components/SiteChrome";
import { Highlight, SpokeTable, type TableRow } from "../../components/Spoke";
import { CAOS, checkedOnText, type Cao } from "../../../lib/caos";
import {
  caoDescription, caoFigures, caoHours, caoInText, caoPath, caoPrefillPath, caoSummary, caoTitle, employeeRatePct,
  getCao, pct, sectorSiblings, yearEndText, type CaoFigures,
} from "../../../lib/cao-pages";
import { euro } from "../../../lib/amounts";
import { caoContext } from "../../../lib/cao-context";
import { money } from "../../../lib/format";
import { breadcrumbList, pageMetadata } from "../../../lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CAOS.map((cao) => ({ slug: cao.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cao = getCao((await params).slug);
  if (!cao) return {};
  return pageMetadata({ path: caoPath(cao), title: caoTitle(cao), description: caoDescription(caoFigures(cao)) });
}

/** What the cao arranges, as label/value rows. */
function termsRows(cao: Cao): TableRow[] {
  const rows: TableRow[] = [
    { label: "Looptijd", value: cao.period },
    { label: "Voltijd", value: cao.fullTimeHours === null ? "Niet vastgelegd per week" : `${cao.fullTimeHours} uur per week` },
    { label: "Vakantiegeld", value: cao.holidayAllowancePct === null ? "Volgens opdrachtgever, minimaal 8%" : pct(cao.holidayAllowancePct) },
    { label: "13e maand / eindejaarsuitkering", value: cao.yearEndBonusPct === null ? "Volgens opdrachtgever" : cao.yearEndBonusPct === 0 ? "Geen" : pct(cao.yearEndBonusPct) },
  ];
  if (!cao.pension) return rows;
  const { pension } = cao;
  return [...rows,
    { label: "Pensioenfonds", value: pension.fund },
    { label: "Totale pensioenpremie", value: `${pct(pension.totalRatePct)} van de grondslag` },
    { label: "Jouw deel van de premie", value: `${pct(employeeRatePct(cao))} van de grondslag` },
    { label: "Franchise (voltijd)", value: `${euro(pension.franchise)} per jaar` },
    ...(pension.maxSalary ? [{ label: "Pensioen opgebouwd tot", value: `${euro(pension.maxSalary)} salaris per jaar` }] : []),
  ];
}

function faqs({ cao, year, highlight: h }: CaoFigures): Array<[string, string]> {
  const name = caoInText(cao);
  const extras = h.holidayNetAnnual + h.yearEndNetAnnual;
  const list: Array<[string, string]> = [
    [`Hoeveel netto houd je over bij de ${name}?`,
      `Bij ${euro(h.grossMonthly)} bruto per maand voor een voltijdbaan van ${caoHours(cao)} uur houd je in ${year} ongeveer ${euro(h.regularNetMonthly)} netto over in een gewone maand. `
      + `Dat is na ${euro(h.pensionMonthly)} eigen pensioenpremie en ${euro(h.regularTaxMonthly)} loonheffing. `
      + (extras > 0 ? `Met ${h.yearEndGrossAnnual > 0 ? "vakantiegeld en eindejaarsuitkering" : "vakantiegeld"} erbij kom je op ongeveer ${euro(h.netAnnual)} netto per jaar.` : `Over het hele jaar is dat ongeveer ${euro(h.netAnnual)} netto.`)],
  ];
  if (cao.pension) {
    const p = cao.pension;
    list.push([`Hoeveel pensioenpremie betaal je bij de ${name}?`,
      `Je bouwt pensioen op bij ${p.fund}. De totale premie is ${pct(p.totalRatePct)} van je pensioengrondslag: je salaris${p.includesHoliday ? " inclusief vakantiegeld" : ""} min een franchise van ${euro(p.franchise)} per jaar bij voltijd`
      + `${p.maxSalary ? `, over een salaris tot ${euro(p.maxSalary)}` : ""}. Jij betaalt daarvan ${pct(p.employeeSharePct)}, dus ${pct(employeeRatePct(cao))} van de grondslag. `
      + `Bij ${euro(h.grossMonthly)} bruto is dat ongeveer ${euro(h.pensionMonthly)} per maand. De premie gaat van je bruto af vóór de belasting, dus netto kost hij je minder.`]);
  }
  list.push([`Krijg je een 13e maand bij de ${name}?`,
    cao.yearEndBonusPct === null ? "De cao laat dat aan de opdrachtgever over. Kijk in je contract of op je loonstrook."
      : cao.yearEndBonusPct === 0 ? "Nee, de cao kent geen 13e maand of vaste eindejaarsuitkering. Je werkgever kan er zelf een geven."
      : `Ja, een ${yearEndText(cao)} van je jaarsalaris. Bij ${euro(h.grossMonthly)} bruto per maand is dat ${euro(h.yearEndGrossAnnual)} bruto, waarvan je ongeveer ${euro(h.yearEndNetAnnual)} netto overhoudt.`]);
  list.push([`Hoeveel vakantiegeld krijg je bij de ${name}?`,
    cao.holidayAllowancePct === null ? "Dat volgt de regeling van de opdrachtgever, met een wettelijk minimum van 8% van je bruto salaris."
      : `${pct(cao.holidayAllowancePct)} van je bruto salaris. Bij ${euro(h.grossMonthly)} bruto per maand is dat ${euro(h.holidayGrossAnnual)} bruto per jaar, en ongeveer ${euro(h.holidayNetAnnual)} netto. Vakantiegeld wordt belast tegen je hoogste tarief.`]);
  if (cao.fullTimeHours !== null) {
    list.push([`Hoeveel uur is voltijd bij de ${name}?`,
      `${cao.fullTimeHours} uur per week. Werk je minder, dan krijg je naar verhouding minder salaris en schaalt ook de pensioenfranchise mee. In de calculator vul je je eigen uren in.`]);
  }
  return list;
}

export default async function CaoPage({ params }: Props) {
  const cao = getCao((await params).slug);
  if (!cao) notFound();
  const figures = caoFigures(cao);
  const { year, highlight: h, examples } = figures;
  const name = caoInText(cao);
  const questions = faqs(figures);
  const siblings = sectorSiblings(cao);
  const context = caoContext(cao, year);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "FAQPage", mainEntity: questions.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      breadcrumbList([["Netto per cao", "/cao"], [cao.name, caoPath(cao)]]),
    ],
  };

  return <><JsonLd data={jsonLd} /><main>
    <SiteNav />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> <Link href="/cao">Netto per cao</Link> · {cao.sector}</span>
      <h1>Netto salaris bij de {name} ({year})</h1>
      <p>{caoSummary(cao)} Bij {euro(h.grossMonthly)} bruto per maand houd je ongeveer <strong>{euro(h.regularNetMonthly)} netto</strong> over.</p>
    </header>

    <section className="calculator-wrap shell amount-wrap">
      <div className="calculator-shell amount-shell">
        <div className="results-panel amount-main">
          <Highlight label={`Netto per maand bij ${euro(h.grossMonthly)} bruto`} value={money(h.regularNetMonthly)}>
            Voltijd ({caoHours(cao)} uur), in een gewone maand, na pensioenpremie en loonheffing. Over het hele jaar, met {cao.yearEndBonusPct ? "vakantiegeld en eindejaarsuitkering" : "vakantiegeld"}, gemiddeld {money(h.netMonthlyAverage)} per maand.
          </Highlight>
          <SpokeTable head={[`Bij ${euro(h.grossMonthly)} bruto`, "Per maand"]} rows={[
            { label: "Bruto salaris", value: money(h.grossMonthly) },
            ...(h.pensionMonthly > 0 ? [{ label: `Eigen pensioenpremie (${cao.pension?.fund})`, value: money(-h.pensionMonthly) }] : []),
            { label: "Loonheffing (na heffingskortingen)", value: money(-h.regularTaxMonthly) },
            { label: "Netto in een gewone maand", value: money(h.regularNetMonthly), total: true },
          ]} />

          <h2 className="amount-side-title">Rekenvoorbeelden {year}</h2>
          <div className="work-table">
            <div className="work-table-head"><span>Bruto per maand</span><strong>Pensioen</strong><strong>Netto per maand</strong><strong>Netto per jaar</strong></div>
            {examples.map((row) => <div key={row.grossMonthly}><span>{money(row.grossMonthly)}</span><strong>{money(-row.pensionMonthly)}</strong><strong>{money(row.regularNetMonthly)}</strong><strong>{money(row.netAnnual)}</strong></div>)}
          </div>
          <p className="choice-note">Voltijd, jonger dan de AOW-leeftijd. Netto per jaar is inclusief {cao.yearEndBonusPct ? "vakantiegeld en eindejaarsuitkering" : "vakantiegeld"}. Dit zijn voorbeeldbedragen, niet de salarisschalen uit de cao.</p>
        </div>

        <aside className="inputs-panel amount-side">
          <div className="to-total amount-cta">
            <div><span className="section-kicker">Jouw situatie</span><strong>Reken het uit met jouw salaris</strong><small>De calculator opent met de {name} al ingevuld. Vul je eigen bruto salaris en uren in.</small></div>
            <div className="to-total-buttons"><Link className="primary-button" href={caoPrefillPath(cao)}>Open de calculator →</Link></div>
          </div>
          <h2 className="amount-side-title">Wat de cao regelt</h2>
          <SpokeTable head={["Onderdeel", "Volgens de cao"]} rows={termsRows(cao)} />
          {siblings.length > 0 && <>
            <h2 className="amount-side-title">Andere cao&apos;s in {cao.sector.toLowerCase()}</h2>
            <p className="amount-neighbour-links">{siblings.map((other) => <Link key={other.id} href={caoPath(other)}>{other.name}</Link>)}</p>
          </>}
          <p className="amount-neighbour-links"><Link href="/cao">Alle cao&apos;s →</Link></p>
          <EmbedCta className="" />
        </aside>
      </div>
    </section>

    <section className="how-section shell total-content amount-content">
      <div className="section-heading"><div><span className="section-kicker">Vergeleken met andere cao&apos;s</span><h2>Wat is bijzonder aan de {name}?</h2></div></div>
      <div className="method-copy amount-context">
        {context.paragraphs.map((text) => <p key={text}>{text}</p>)}
        <p className="amount-context-source">Vergeleken met de {CAOS.length} cao&apos;s op Nettoplaatje, bij {euro(h.grossMonthly)} bruto per maand in {year}. Bronnen staan hieronder per cao.</p>
      </div>

      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Uitgangspunten en bronnen</strong><p>
        Belastingtarieven en heffingskortingen van {year}, een voltijdbaan van {caoHours(cao)} uur, zonder bonus, leaseauto of andere inhoudingen.
        {cao.note && <> {cao.note}</>} Je werkgever rekent met maandtabellen, dus je loonstrook kan iets afwijken. Dit is een indicatie, geen financieel advies.
        {" "}Gecontroleerd op {checkedOnText(cao)} met de <a href={cao.sourceUrl} target="_blank" rel="noreferrer">cao-tekst</a>
        {cao.pension && <> en de premiegegevens van <a href={cao.pension.sourceUrl} target="_blank" rel="noreferrer">{cao.pension.fund}</a></>}.
      </p></div></div>

      <div className="faq-block">
        <h2>Veelgestelde vragen over de {name}</h2>
        <div className="faq-list">{questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>
    </section>
    <AdSlot placement="cao" />
    <SiteFooter />
  </main></>;
}
