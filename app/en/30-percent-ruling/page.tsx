import type { Metadata } from "next";
import JsonLd from "../../components/JsonLd";
import { RulingCalculatorEn } from "../EnCalculators";
import EnPage, { SalaryLinks } from "../EnPage";
import { EN_SOURCES } from "../../../lib/en-articles";
import { euroEn } from "../../../lib/en-amounts";
import { percentEn } from "../../../lib/format";
import { breadcrumbJsonLd, pageMetadata } from "../../../lib/seo";
import { DEFAULT_TAX_YEAR, taxYear } from "../../../lib/tax-years";

const year = DEFAULT_TAX_YEAR;
const ruling = taxYear(year).expatRuling;
const nextRate = taxYear(year + 1).expatRuling.rate;
const cap = ruling.rate * ruling.wntNorm;

export const metadata: Metadata = pageMetadata({
  path: "/en/30-percent-ruling",
  lang: "en",
  title: `30% ruling calculator: net salary ${year}`,
  description: `See how much more net salary the Dutch 30% ruling gives you, with the ${year} salary norm of ${euroEn(ruling.salaryNorm)}, the ${euroEn(cap)} cap and the drop to ${percentEn(nextRate)} in ${year + 1}.`,
});

const how = [
  [`${percentEn(ruling.rate)} tax-free`, `Your employer may pay up to ${percentEn(ruling.rate)} of your salary, including the allowance itself, as a tax-free allowance. You pay wage tax on the rest.`],
  ["Salary norm", `Your taxable salary must stay above ${euroEn(ruling.salaryNorm)} a year (${euroEn(ruling.salaryNormYoungMaster)} if you are under 30 with a master's degree). Just above the norm, only the part above it is tax-free.`],
  ["Maximum", `The allowance is at most ${euroEn(cap)} a year: ${percentEn(ruling.rate)} of the ${euroEn(ruling.wntNorm)} salary limit for top incomes (WNT).`],
  [`${percentEn(nextRate)} from ${year + 1}`, `From 1 January ${year + 1} the tax-free percentage drops to ${percentEn(nextRate)}. The calculator uses the ${year} rules.`],
] as const;

const faqs = [
  ["Who qualifies for the 30% ruling?", "Employees recruited from abroad or transferred within a multinational, who lived more than 150 km from the Dutch border for more than 16 of the 24 months before starting work in the Netherlands. Your salary must also be above the salary norm, which shows that you have specific expertise that is scarce in the Netherlands."],
  ["How long does the 30% ruling last?", "At most 5 years. Earlier periods in which you lived or worked in the Netherlands in the 25 years before you arrived are deducted, apart from short stays."],
  ["How do I apply?", "Your employer applies to the Dutch Tax Administration (Belastingdienst). File the application within 4 months after your first working day. The decision usually follows within 8 weeks."],
  ["What is the lower norm for under-30s?", `If you are under 30 and have a master's degree, the salary norm is ${euroEn(ruling.salaryNormYoungMaster)} instead of ${euroEn(ruling.salaryNorm)} in ${year}. It applies until the end of the month in which you turn 30.`],
  [`What changes in ${year + 1}?`, `The tax-free part drops from ${percentEn(ruling.rate)} to ${percentEn(nextRate)} of your salary. The salary norms are indexed every year.`],
  ["Can my employer reimburse actual costs instead?", "Yes. Instead of the fixed allowance, your employer may reimburse your actual extra costs of working abroad tax-free, but not both in the same year. International school fees can be reimbursed tax-free on top of the ruling."],
] as const;

export default function RulingPage() {
  return <><JsonLd data={breadcrumbJsonLd([["30% ruling calculator", "/en/30-percent-ruling"]], "en")} /><EnPage active="ruling" kicker="30% ruling · expatregeling"
    title="30% ruling calculator: how much more net do you get?"
    intro={<>Compare your net salary with and without the Dutch 30% ruling. The calculator applies the {year} salary norm and the maximum, so you see what the ruling is really worth at your salary.</>}
    calculator={<RulingCalculatorEn />} how={how} faqs={faqs} adPlacement="en-30-percent-ruling" guides={["30-percent-ruling-explained", "dutch-income-tax-rates"]}
    extra={<SalaryLinks heading="Net salary with and without the ruling" />}
    disclaimer={<p>Calculated for a full year with the {year} rules of the Dutch Tax Administration (<a href={EN_SOURCES.rulingContent} target="_blank" rel="noreferrer" hrefLang="nl">content of the ruling</a>, <a href={EN_SOURCES.rulingConditions} target="_blank" rel="noreferrer">conditions</a>). If you start or stop during the year, the maximum applies pro rata. Whether you qualify is decided by the Tax Administration.</p>} /></>;
}
