import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../components/AdSlot";
import EmbedCta from "../../components/EmbedCta";
import { SiteFooter, SiteNav } from "../../components/SiteChrome";
import { Highlight, Metrics, SpokeTable, type TableRow } from "../../components/Spoke";
import AmountLinks from "../AmountLinks";
import {
  AMOUNT_PAGES, HOLIDAY_PCT, amountDescription, amountFigures, amountLabel, amountPath, amountTitle,
  euro, getAmountPage, nearbyAmounts, prefillPath,
} from "../../../lib/amounts";
import { amountContext } from "../../../lib/amount-context";
import { money, percent } from "../../../lib/format";
import { breadcrumbList, pageMetadata } from "../../../lib/seo";

type Props = { params: Promise<{ bedrag: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AMOUNT_PAGES.map((page) => ({ bedrag: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getAmountPage((await params).bedrag);
  if (!page) return {};
  const figures = amountFigures(page);
  return pageMetadata({ path: amountPath(page), title: amountTitle(figures), description: amountDescription(figures) });
}

export default async function AmountPage({ params }: Props) {
  const page = getAmountPage((await params).bedrag);
  if (!page) notFound();
  const f = amountFigures(page);
  const context = amountContext(f.grossAnnual, f.year, f.grossMonthly);
  const monthly = page.kind === "maand";
  const per = monthly ? "per maand" : "per jaar";

  const monthRows: TableRow[] = [
    { label: monthly ? "Bruto salaris" : `Bruto salaris (${euro(page.amount)} ÷ 12,96)`, value: money(f.grossMonthly) },
    { label: "Loonheffing (na heffingskortingen)", value: money(-f.regularTaxMonthly) },
    { label: "Netto in een gewone maand", value: money(f.regularNetMonthly), total: true },
  ];
  const yearRows: TableRow[] = [
    { label: "12 × bruto salaris", value: money(f.grossMonthly * 12) },
    { label: `Vakantiegeld (${HOLIDAY_PCT}% bruto)`, value: money(f.holidayGrossAnnual) },
    { label: "Totaal bruto", value: money(f.grossAnnual), muted: true },
    { label: "Loonheffing over het hele jaar", value: money(f.netAnnual - f.grossAnnual) },
    { label: "Netto per jaar", value: money(f.netAnnual), total: true },
  ];
  const hourRows: TableRow[] = [
    { label: `40 uur (${money(f.grossMonthly)} bruto)`, value: money(f.regularNetMonthly) },
    ...f.partTime.slice().reverse().map((row) => ({ label: `${row.hours} uur (${money(row.grossMonthly)} bruto)`, value: money(row.netMonthly) })),
  ];
  const neighbours = nearbyAmounts(page).map((other) => {
    const figures = amountFigures(other);
    return { page: other, net: monthly ? figures.regularNetMonthly : figures.netAnnual };
  });

  const faqs: Array<[string, string]> = [
    [`Hoeveel netto is ${euro(page.amount)} bruto ${per}?`, monthly
      ? `Ongeveer ${euro(f.regularNetMonthly)} netto in een gewone maand in ${f.year}, bij een fulltime baan zonder pensioeninhouding. Met ${HOLIDAY_PCT}% vakantiegeld erbij houd je ongeveer ${euro(f.netAnnual)} netto per jaar over.`
      : `Ongeveer ${euro(f.netAnnual)} netto per jaar in ${f.year}, gemiddeld ${euro(f.netMonthlyAverage)} per maand. Daarbij gaan we ervan uit dat ${euro(page.amount)} inclusief ${HOLIDAY_PCT}% vakantiegeld is en dat er geen pensioen wordt ingehouden.`],
    [`Hoeveel houd je over van je vakantiegeld?`, `Je vakantiegeld van ${euro(f.holidayGrossAnnual)} bruto wordt belast tegen ongeveer ${percent(f.extraTaxRate)}. Er blijft ongeveer ${euro(f.holidayNetAnnual)} netto van over.`],
    [`Wat levert € 100 bruto opslag op bij dit salaris, en waarom?`, context.rateChangesSoon ? context.raiseAnswer : `${context.raiseAnswer} Voor € 100 netto meer per maand heb je ongeveer ${euro(f.grossFor100Net)} bruto nodig.`],
    [`Hoeveel netto is dit bij 32 of 36 uur?`, `Met hetzelfde uurloon verdien je bij 36 uur ${euro(f.partTime[1].grossMonthly)} bruto en ongeveer ${euro(f.partTime[1].netMonthly)} netto per maand. Bij 32 uur is dat ${euro(f.partTime[0].grossMonthly)} bruto en ongeveer ${euro(f.partTime[0].netMonthly)} netto.`],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      breadcrumbList([["Bruto naar netto", "/bruto-netto"], [amountLabel(page), amountPath(page)]]),
    ],
  };

  return <main>
    <SiteNav />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> <Link href="/bruto-netto">Bruto netto</Link> · {amountLabel(page)}</span>
      <h1>Hoeveel netto is {euro(page.amount)} bruto {per}?</h1>
      <p>{monthly
        ? <>Bij {euro(page.amount)} bruto per maand houd je in {f.year} ongeveer <strong>{euro(f.regularNetMonthly)} netto</strong> over in een gewone maand. Hieronder zie je hoe dat is opgebouwd, wat je vakantiegeld oplevert en wat het is bij parttime werk.</>
        : <>Bij {euro(page.amount)} bruto per jaar houd je in {f.year} ongeveer <strong>{euro(f.netAnnual)} netto</strong> over, gemiddeld {euro(f.netMonthlyAverage)} per maand. Hieronder zie je hoe dat is opgebouwd en wat het is bij parttime werk.</>}</p>
    </header>

    <section className="calculator-wrap shell amount-wrap">
      <div className="calculator-shell amount-shell">
        <div className="results-panel amount-main">
          <Highlight label={monthly ? "Netto per maand" : "Netto per jaar"} value={money(monthly ? f.regularNetMonthly : f.netAnnual)}>
            {monthly
              ? <>In een gewone maand, fulltime. Met vakantiegeld gemiddeld {money(f.netMonthlyAverage)} per maand.</>
              : <>Gemiddeld {money(f.netMonthlyAverage)} per maand. In een gewone maand, zonder vakantiegeld, ontvang je {money(f.regularNetMonthly)}.</>}
          </Highlight>
          <SpokeTable head={["Per maand", "Bedrag"]} rows={monthRows} />
          <SpokeTable head={["Per jaar", "Bedrag"]} rows={yearRows} />
          <Metrics items={[
            { label: "Marginaal tarief", value: percent(f.marginalRate), note: "van elke extra euro", hint: "Het deel van elke extra euro bruto dat naar belasting gaat. Vaak hoger dan je schijftarief: als je meer verdient, nemen ook je heffingskortingen af." },
            { label: "Gemiddeld tarief", value: percent(f.effectiveRate), note: "van je totale bruto" },
            { label: "Voor € 100 netto meer", value: money(f.grossFor100Net), note: "bruto per maand nodig" },
            { label: "Netto per uur", value: money(f.netPerHour), note: "bij 40 uur per week" },
          ]} />
        </div>
        <aside className="inputs-panel amount-side">
          <div className="to-total amount-cta">
            <div><span className="section-kicker">Jouw situatie</span><strong>Reken het precies uit</strong><small>Met je eigen uren, pensioeninleg, 13e maand of bonus.</small></div>
            <div className="to-total-buttons"><Link className="primary-button" href={prefillPath(page)}>Open de calculator →</Link></div>
          </div>
          <h2 className="amount-side-title">Parttime, zelfde uurloon</h2>
          <SpokeTable head={["Uren per week", "Netto per maand"]} rows={hourRows} />
          <p className="amount-neighbour-links"><Link href="/deeltijd">Met kinderopvang en toeslagen: wat levert een dag extra werken op? →</Link></p>
          <p className="amount-neighbour-links"><Link href="/cao">Met pensioenpremie en 13e maand van jouw cao →</Link></p>
          <EmbedCta className="" />
          <h2 className="amount-side-title">Bedragen in de buurt</h2>
          <SpokeTable head={[monthly ? "Bruto per maand" : "Bruto per jaar", monthly ? "Netto per maand" : "Netto per jaar"]}
            rows={neighbours.map((row) => ({ label: euro(row.page.amount), value: money(row.net), total: row.page === page }))} />
        </aside>
      </div>
    </section>

    <section className="how-section shell total-content amount-content">
      <div className="section-heading"><div><span className="section-kicker">Bij dit inkomen</span><h2>Wat speelt er bij {euro(page.amount)} bruto {per}?</h2></div></div>
      <div className="method-copy amount-context">
        {context.paragraphs.map((text) => <p key={text}>{text}</p>)}
        <SpokeTable head={[`Heffingskortingen ${f.year}`, "Per jaar"]} rows={[
          { label: `Algemene heffingskorting (max. ${euro(context.generalCreditMax)})`, value: money(context.generalCredit) },
          { label: `Arbeidskorting (max. ${euro(context.employmentCreditMax)})`, value: money(context.employmentCredit) },
        ]} />
        <h3>Wat betekent dat voor jou?</h3>
        <ul>{context.tips.map((tip) => <li key={tip.text}>{tip.text}{tip.href && <> {tip.external ? <a href={tip.href} target="_blank" rel="noopener noreferrer">{tip.link} ↗</a> : <Link href={tip.href}>{tip.link} →</Link>}</>}</li>)}</ul>
        <p className="amount-context-source">Bron: de tarieven en heffingskortingen {f.year} van de Belastingdienst en de toeslagbedragen {f.year}, dezelfde cijfers als in de calculator. Zie <Link href="/uitleg">uitleg en bronnen</Link>.</p>
      </div>

      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Uitgangspunten van deze berekening</strong><p>
        Belastingtarieven en heffingskortingen van {f.year}, jonger dan de AOW-leeftijd, {HOLIDAY_PCT}% vakantiegeld, geen pensioeninhouding, 13e maand of bonus. {monthly ? "" : `We lezen ${euro(page.amount)} als je jaarsalaris inclusief vakantiegeld. `}Je werkgever rekent met maandtabellen en kan andere inhoudingen hebben, dus je loonstrook kan iets afwijken. Dit is een indicatie, geen financieel advies.
      </p></div></div>

      <div className="faq-block">
        <h2>Veelgestelde vragen over {euro(page.amount)} bruto</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>

      <AmountLinks current={page.slug} heading="Andere bedragen" />
    </section>
    <AdSlot placement="bruto-netto-bedrag" />
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </main>;
}
