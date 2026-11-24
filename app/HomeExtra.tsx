import Link from "next/link";
import AmountLinks from "./bruto-netto/AmountLinks";
import JsonLd from "./components/JsonLd";
import { HOLIDAY_PCT, amountFigures, euro, getAmountPage } from "../lib/amounts";
import { CAOS } from "../lib/caos";
import { caoPath } from "../lib/cao-pages";
import { percent } from "../lib/format";

/** A short selection of the amount pages; the full list is on /bruto-netto. */
const HOME_AMOUNTS = [
  "2500-per-maand", "3000-per-maand", "3500-per-maand", "4000-per-maand", "5000-per-maand", "6000-per-maand",
  "40000-per-jaar", "50000-per-jaar", "60000-per-jaar",
];

/** Cao's with the most employees, shown as shortcuts on the home page. */
const HOME_CAOS = ["ziekenhuizen", "gemeenten", "rijk", "primair-onderwijs", "metaal-en-techniek", "bouw-en-infra", "vvt", "horeca"];

/** Server-rendered part of the home page below the tools: popular amounts, cao's and FAQ with real figures. */
export default function HomeExtra() {
  const f = amountFigures(getAmountPage("3500-per-maand")!);
  const keep100 = 100 * (1 - f.marginalRate);
  const caos = HOME_CAOS.map((id) => CAOS.find((cao) => cao.id === id)).filter((cao) => cao !== undefined);

  const faqs: Array<[string, string]> = [
    ["Hoe reken je bruto naar netto?",
      `Van je brutoloon gaat loonheffing af: loonbelasting en premies volksverzekeringen, verminderd met de algemene heffingskorting en de arbeidskorting. Werk je onder een cao, dan gaat er meestal ook pensioenpremie af. Bij ${euro(3500)} bruto per maand houd je in ${f.year} zonder pensioeninhouding ongeveer ${euro(f.regularNetMonthly)} netto over in een gewone maand.`],
    ["Waarom krijg je van loonsverhoging minder netto dan je verwacht?",
      `Over elke extra euro betaal je je marginale tarief. Bij ${euro(3500)} bruto per maand is dat ongeveer ${percent(f.marginalRate)}, onder meer omdat de algemene heffingskorting kleiner wordt naarmate je meer verdient. Van ${euro(100)} bruto opslag houd je dan ongeveer ${euro(keep100)} netto over.`],
    ["Hoeveel houd je over van je vakantiegeld?",
      `Vakantiegeld (meestal ${HOLIDAY_PCT}% van je brutoloon) wordt belast tegen het tarief bijzondere beloningen. Bij ${euro(3500)} per maand is dat ongeveer ${percent(f.extraTaxRate)}: van ${euro(f.holidayGrossAnnual)} bruto vakantiegeld blijft ongeveer ${euro(f.holidayNetAnnual)} netto over.`],
    ["Klopt de uitkomst precies met mijn loonstrook?",
      "Bijna. Werkgevers rekenen met de maandtabellen van de Belastingdienst en kunnen andere inhoudingen hebben, zoals pensioen, een bijdrage aan een personeelsvereniging of een fiets van de zaak. Vul in de calculator je pensioeninleg in of kies je cao, dan komt de uitkomst dichter bij je loonstrook."],
    ["Is Nettoplaatje gratis en blijven mijn gegevens privé?",
      "Ja. Je hebt geen account nodig en alles wordt in je eigen browser berekend. Wat je invult, wordt niet naar ons verstuurd. De site wordt betaald uit advertenties."],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
  };

  return <>
    <section className="shell home-extra" aria-label="Veelgezocht">
      <AmountLinks heading="Netto bij veelgezochte bedragen" only={HOME_AMOUNTS} more />
      <div className="amount-links">
        <h2>Netto per cao</h2>
        <p className="home-extra-intro">Met de pensioenpremie, het vakantiegeld en de eindejaarsuitkering van jouw cao.</p>
        <div className="amount-links-grid">
          {caos.map((cao) => <Link key={cao.id} className="amount-link" href={caoPath(cao)}>{cao.name.replace(/^Cao /, "").replace(/ \(.*\)$/, "")}</Link>)}
          <Link className="amount-link" href="/cao">Alle cao&apos;s →</Link>
        </div>
      </div>
    </section>

    <section className="how-section shell total-content">
      <div className="section-heading"><div><span className="section-kicker">Bruto naar netto</span><h2>Zo kom je van bruto naar netto</h2></div></div>
      <div className="method-copy">
        <p>Je netto salaris is je brutoloon min de loonheffing. De loonheffing bestaat uit loonbelasting en premies volksverzekeringen (AOW, Anw en Wlz), berekend met de belastingschijven van {f.year}. Daar gaan de heffingskortingen weer vanaf: de algemene heffingskorting, die lager wordt naarmate je meer verdient, en de arbeidskorting voor iedereen die werkt.</p>
        <p>Bij {euro(3500)} bruto per maand, fulltime en zonder pensioeninhouding, is je gemiddelde tarief ongeveer {percent(f.effectiveRate)} en houd je ongeveer <strong>{euro(f.regularNetMonthly)} netto</strong> over in een gewone maand. Met {HOLIDAY_PCT}% vakantiegeld komt dat op ongeveer {euro(f.netAnnual)} netto per jaar. Valt je baan onder een cao, dan gaat er meestal nog pensioenpremie af. Kies je cao in de <Link href="/bruto-netto">bruto-nettocalculator</Link> om die mee te rekenen.</p>
        <p>Netto is niet alles: een leaseauto, reistijd, kinderopvang en toeslagen bepalen mee wat een baan je echt oplevert. Daarom kun je met <Link href="/totaal">twee banen vergelijken</Link> alles naast elkaar zetten.</p>
      </div>
      <div className="faq-block">
        <h2>Veelgestelde vragen</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>
    </section>
    <JsonLd data={jsonLd} />
  </>;
}
