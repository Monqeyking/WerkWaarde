import type { Metadata } from "next";
import Link from "next/link";
import { GrossNetCalculatorEn } from "./EnCalculators";
import EnPage, { SalaryLinks } from "./EnPage";
import { EN_SOURCES } from "../../lib/en-articles";
import { euroEn } from "../../lib/en-amounts";
import { percentEn, ratePercentEn } from "../../lib/format";
import { pageMetadata } from "../../lib/seo";
import { DEFAULT_TAX_YEAR, taxYear } from "../../lib/tax-years";

const year = DEFAULT_TAX_YEAR;
const tax = taxYear(year);
const [b1, b2, b3] = tax.brackets;
const ruling = tax.expatRuling;

export const metadata: Metadata = pageMetadata({
  path: "/en",
  lang: "en",
  title: `Dutch gross to net salary calculator ${year}`,
  description: `Calculate your net salary in the Netherlands from gross, with holiday allowance, pension and the 30% ruling. Free, in English, with the ${year} tax rates.`,
});

const how = [
  ["Pension first", "Your own pension contribution is deducted from your gross salary before tax, so you pay no wage tax on it."],
  ["Tax per year", `We apply the ${year} income tax brackets to your annual income, then deduct the general tax credit and the employment tax credit. Both get smaller as you earn more.`],
  ["30% ruling", `With the ruling, up to ${percentEn(ruling.rate)} of your salary is paid tax-free, as long as your taxable salary stays above the salary norm. Tax is calculated over the rest.`],
  ["Extras separately", "Holiday allowance, a 13th month and a bonus come on top of your salary. They are taxed at your highest rate, including the phase-out of the tax credits."],
] as const;

const faqs = [
  ["How much tax do you pay in the Netherlands?", `In ${year} the income tax rates are ${ratePercentEn(b1.rate)} up to ${euroEn(b1.limit)}, ${ratePercentEn(b2.rate)} up to ${euroEn(b2.limit)} and ${ratePercentEn(b3.rate)} above that. Two tax credits lower the tax, so the average rate is lower. Because the credits shrink as you earn more, an extra euro is often taxed at more than 50% on a middle income.`],
  ["Does the calculator include the 30% ruling?", `Yes. Choose the ruling in the calculator and the tax-free allowance is applied with the ${year} salary norm of ${euroEn(ruling.salaryNorm)} (${euroEn(ruling.salaryNormYoungMaster)} if you are under 30 with a master's degree) and the maximum of ${euroEn(ruling.rate * ruling.wntNorm)} a year.`],
  ["What is holiday allowance (vakantiegeld)?", "By law you get at least 8% of your gross salary as holiday allowance. Most employers pay it once a year, in May or June. Job offers often state the annual salary including it, which is why you can enter your salary per year."],
  ["Why is my payslip different?", "Your employer withholds wage tax with monthly tables, and your payslip can have other deductions. This calculator works with the annual rates, so it gives an estimate. Over the whole year the tax should end up close to it."],
  ["Is this calculator for freelancers too?", "No. It is for employees on a Dutch payroll. Freelancers (zzp'ers) pay income tax through their annual return, with other deductions. Health insurance premiums are not included either: you pay those to your insurer yourself."],
  ["Is Nettoplaatje available in Dutch?", "Yes. The Dutch site has more calculators: comparing two jobs, a lease car, travel costs, part-time work and allowances (toeslagen)."],
] as const;

export default function EnglishHomePage() {
  return <EnPage active="home" kicker="Gross to net · Netherlands"
    title="What is your net salary in the Netherlands?"
    intro={<>Turn your gross salary into net pay, with holiday allowance, a 13th month, your pension contribution and the 30% ruling. For employees in the Netherlands, with the official {year} tax rates. Free, no account needed.</>}
    calculator={<GrossNetCalculatorEn />} how={how} faqs={faqs} adPlacement="en-home" guides={["30-percent-ruling-explained", "dutch-payslip-explained", "dutch-income-tax-rates"]}
    extra={<>
      <SalaryLinks />
      <p className="amount-links-more"><Link href="/en/30-percent-ruling">Compare your net salary with and without the 30% ruling →</Link></p>
    </>}
    disclaimer={<p>The result is an estimate based on your input and the {year} rates of the <a href={EN_SOURCES.taxRates} target="_blank" rel="noreferrer" hrefLang="nl">Dutch Tax Administration</a>. Allowances, personal deductions, your collective agreement and the exact monthly wage tax can lead to different amounts. What you enter stays in your own browser.</p>} />;
}
