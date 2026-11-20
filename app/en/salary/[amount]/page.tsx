import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "../../../components/AdSlot";
import { SiteFooterEn, SiteNavEn } from "../../../components/SiteChrome";
import { Highlight, Metrics, SpokeTable, type TableRow } from "../../../components/Spoke";
import { SalaryLinks } from "../../EnPage";
import { HOLIDAY_PCT } from "../../../../lib/amounts";
import {
  EN_AMOUNT_PAGES, enAmountDescription, enAmountFigures, enAmountLabel, enAmountPath, enAmountTitle, euroEn, getEnAmountPage, headlineNet,
} from "../../../../lib/en-amounts";
import { moneyEn, percentEn } from "../../../../lib/format";
import { breadcrumbList, pageMetadata } from "../../../../lib/seo";
import { taxYear } from "../../../../lib/tax-years";

type Props = { params: Promise<{ amount: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return EN_AMOUNT_PAGES.map((page) => ({ amount: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getEnAmountPage((await params).amount);
  if (!page) return {};
  const figures = enAmountFigures(page);
  return pageMetadata({ path: enAmountPath(page), lang: "en", title: enAmountTitle(figures), description: enAmountDescription(figures) });
}

export default async function SalaryPage({ params }: Props) {
  const page = getEnAmountPage((await params).amount);
  if (!page) notFound();
  const f = enAmountFigures(page);
  const { without, ruling, youngMaster } = f;
  const monthly = page.kind === "month";
  const per = monthly ? "per month" : "per year";
  const rules = taxYear(f.year).expatRuling;
  const rulingPct = percentEn(rules.rate);
  const youngDiffers = Math.abs(youngMaster.netAnnual - ruling.netAnnual) > 1;
  const keep100 = 100 * (1 - without.marginalRate);

  const monthRows: TableRow[] = [
    { label: monthly ? "Gross salary" : `Gross salary (${euroEn(page.amount)} ÷ 12.96)`, value: moneyEn(without.grossMonthly) },
    { label: "Wage tax (after tax credits)", value: moneyEn(-without.regularTaxMonthly) },
    { label: "Net in a regular month", value: moneyEn(without.regularNetMonthly), total: true },
  ];
  const yearRows: TableRow[] = [
    { label: "12 × gross salary", value: moneyEn(without.grossMonthly * 12) },
    { label: `Holiday allowance (${HOLIDAY_PCT}% gross)`, value: moneyEn(without.holidayGrossAnnual) },
    { label: "Total gross", value: moneyEn(without.grossAnnual), muted: true },
    { label: "Wage tax over the whole year", value: moneyEn(without.netAnnual - without.grossAnnual) },
    { label: "Net per year", value: moneyEn(without.netAnnual), total: true },
  ];
  const rulingRows: TableRow[] = [
    { label: "Without the ruling", value: moneyEn(headlineNet(f)) },
    { label: `With the ${rulingPct} ruling`, value: moneyEn(headlineNet(f, "ruling")), total: true },
    ...(youngDiffers ? [{ label: "Under 30 with a master's degree", value: moneyEn(monthly ? youngMaster.regularNetMonthly : youngMaster.netAnnual) }] : []),
    { label: "Tax-free allowance per year", value: moneyEn(ruling.expatAllowanceAnnual), muted: true },
  ];

  const rulingAnswer = ruling.expatAllowanceAnnual <= 0
    ? `Not with the standard norm: your taxable salary must stay above ${euroEn(rules.salaryNorm)} a year, and this salary is below it.${youngDiffers ? ` If you are under 30 with a master's degree, the norm is ${euroEn(rules.salaryNormYoungMaster)} and you take home ${euroEn(monthly ? youngMaster.regularNetMonthly : youngMaster.netAnnual)} net ${per}.` : ""}`
    : ruling.expatLimit === "norm"
      ? `Only a little: your taxable salary must stay above the salary norm of ${euroEn(rules.salaryNorm)}, so only ${euroEn(ruling.expatAllowanceAnnual)} a year can be tax-free. You take home ${euroEn(headlineNet(f, "ruling"))} net ${per} instead of ${euroEn(headlineNet(f))}.${youngDiffers ? ` Under 30 with a master's degree, the lower norm gives ${euroEn(monthly ? youngMaster.regularNetMonthly : youngMaster.netAnnual)}.` : ""}`
      : `With the ruling, ${euroEn(ruling.expatAllowanceAnnual)} a year is paid tax-free and you take home about ${euroEn(headlineNet(f, "ruling"))} net ${per} instead of ${euroEn(headlineNet(f))}. That is ${euroEn(ruling.netAnnual - without.netAnnual)} more a year.`;

  const faqs: Array<[string, string]> = [
    [`How much is ${euroEn(page.amount)} gross ${per} net in the Netherlands?`, monthly
      ? `About ${euroEn(without.regularNetMonthly)} net in a regular month in ${f.year}, for a full-time job without pension contribution. With ${HOLIDAY_PCT}% holiday allowance you take home about ${euroEn(without.netAnnual)} net a year.`
      : `About ${euroEn(without.netAnnual)} net a year in ${f.year}, or ${euroEn(without.netMonthlyAverage)} a month on average. We assume ${euroEn(page.amount)} includes ${HOLIDAY_PCT}% holiday allowance, as in most Dutch offers, and no pension contribution. In a regular month you get ${euroEn(without.regularNetMonthly)}.`],
    [`How much more do you get with the 30% ruling?`, rulingAnswer],
    [`How much of a raise do you keep at this salary?`, `Your marginal tax rate is about ${percentEn(without.marginalRate)}. Of €100 extra gross a month you keep about ${euroEn(keep100)} net. For €100 more net you need about ${euroEn(without.grossFor100Net)} gross.`],
    [`How much do you keep of your holiday allowance?`, `Your holiday allowance of ${euroEn(without.holidayGrossAnnual)} gross is taxed at about ${percentEn(without.extraTaxRate)}. About ${euroEn(without.holidayNetAnnual)} net remains, usually paid in May or June.`],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "FAQPage", inLanguage: "en", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      breadcrumbList([["Net salary", "/en"], [enAmountLabel(page), enAmountPath(page)]], "en"),
    ],
  };

  return <main>
    <SiteNavEn />
    <header className="sub-hero shell">
      <span className="hero-kicker"><span className="kicker-line"></span> <Link href="/en">Gross to net</Link> · {enAmountLabel(page)}</span>
      <h1>How much is {euroEn(page.amount)} gross {per} net in the Netherlands?</h1>
      <p>{monthly
        ? <>On {euroEn(page.amount)} gross a month you take home about <strong>{euroEn(without.regularNetMonthly)} net</strong> in a regular month in {f.year}. Below you see how that adds up, what the 30% ruling adds and what your holiday allowance gives.</>
        : <>On {euroEn(page.amount)} gross a year you take home about <strong>{euroEn(without.netAnnual)} net</strong> in {f.year}, or {euroEn(without.netMonthlyAverage)} a month on average. Below you see how that adds up and what the 30% ruling adds.</>}</p>
    </header>

    <section className="calculator-wrap shell amount-wrap">
      <div className="calculator-shell amount-shell">
        <div className="results-panel amount-main">
          <Highlight label={monthly ? "Net per month" : "Net per year"} value={moneyEn(headlineNet(f))}>
            {monthly
              ? <>In a regular month, full time. With holiday allowance {moneyEn(without.netMonthlyAverage)} a month on average.</>
              : <>{moneyEn(without.netMonthlyAverage)} a month on average. In a regular month, without holiday allowance, you get {moneyEn(without.regularNetMonthly)}.</>}
          </Highlight>
          <SpokeTable head={["Per month", "Amount"]} rows={monthRows} />
          <SpokeTable head={["Per year", "Amount"]} rows={yearRows} />
          <Metrics items={[
            { label: "Marginal rate", value: percentEn(without.marginalRate), note: "of every extra euro" },
            { label: "Average rate", value: percentEn(without.effectiveRate), note: "of your total gross" },
            { label: "For €100 more net", value: moneyEn(without.grossFor100Net), note: "gross per month needed" },
            { label: "Net per hour", value: moneyEn(without.netPerHour), note: "at 40 hours a week" },
          ]} />
        </div>
        <aside className="inputs-panel amount-side">
          <h2 className="amount-side-title">With the 30% ruling</h2>
          <SpokeTable head={["Net " + per, "Amount"]} rows={rulingRows} />
          <p className="amount-neighbour-links"><Link href={`/en/30-percent-ruling#bruto=${f.grossMonthly.toFixed(2)}`}>Compare with and without the ruling for your own situation →</Link></p>
          <div className="to-total amount-cta">
            <div><span className="section-kicker">Your situation</span><strong>Calculate it exactly</strong><small>With your own hours, pension contribution, 13th month or bonus.</small></div>
            <div className="to-total-buttons"><Link className="primary-button" href={`/en#bruto=${f.grossMonthly.toFixed(2)}`}>Open the calculator →</Link></div>
          </div>
        </aside>
      </div>
    </section>

    <section className="how-section shell total-content amount-content">
      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Assumptions</strong><p>
        Tax rates and tax credits of {f.year}, below the state pension age, full time, {HOLIDAY_PCT}% holiday allowance, no pension contribution, 13th month or bonus. {monthly ? "" : `We read ${euroEn(page.amount)} as your annual salary including holiday allowance. `}The 30% ruling is calculated for a full year with the {f.year} salary norm and maximum. Your employer uses monthly tables and may have other deductions, so your payslip can differ slightly. This is an estimate, not financial advice.
      </p></div></div>

      <div className="faq-block">
        <h2>Questions about {euroEn(page.amount)} gross {per}</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div>

      <SalaryLinks current={page.slug} heading="Other salaries" />
    </section>
    <AdSlot placement="en-salary" show="adsense" label="Advertisement" />
    <SiteFooterEn />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </main>;
}
