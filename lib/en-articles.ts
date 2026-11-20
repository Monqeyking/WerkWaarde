/**
 * English guides for expats, shown at /en/guides/<slug>. Same shape as the Dutch
 * articles in articles.ts. Figures come from tax-years.ts and the calculator, so
 * they follow the tax year; facts about the ruling were checked on 20 November 2026
 * against the Belastingdienst and business.gov.nl pages listed in EN_SOURCES.
 */
import type { Article } from "./articles.ts";
import { EN_AMOUNT_PAGES, enAmountFigures, euroEn } from "./en-amounts.ts";
import { percentEn, ratePercentEn } from "./format.ts";
import { DEFAULT_TAX_YEAR, taxYear } from "./tax-years.ts";

export const EN_SOURCES = {
  rulingContent: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/internationaal/personeel/u_bent_niet_in_nederland_gevestigd_loonheffingen_inhouden/als_u_loonheffingen_gaat_inhouden/extraterritoriale_kosten_en_de_30procentregeling/inhoud_van_de_regeling/inhoud_van_de_regeling",
  rulingConditions: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontenten/belastingdienst/business/payroll_taxes/you_are_not_established_in_the_netherlands_are_you_required_to_withhold_payroll_taxes/when_you_are_going_to_withhold_payroll_taxes/etraterritorial_costs_and_the_30percent-facility/conditions_attached_to_the_30percent-facility/",
  rulingBusiness: "https://business.gov.nl/regulation/30-percent-ruling/",
  holidayAllowance: "https://business.gov.nl/regulation/holiday-allowance/",
  taxRates: "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen",
} as const;

const year = DEFAULT_TAX_YEAR;
const tax = taxYear(year);
const ruling = tax.expatRuling;
const pct = (rate: number) => ratePercentEn(rate);
const [b1, b2] = tax.brackets;
const employmentPeak = tax.employmentCredit.at(-1)!;
const employmentZeroAt = employmentPeak.from + employmentPeak.base / -employmentPeak.rate;
const generalZeroAt = tax.generalCredit.phaseOutFrom + tax.generalCredit.max / tax.generalCredit.phaseOutRate;
const example = enAmountFigures(EN_AMOUNT_PAGES.find((page) => page.slug === "60000-gross-per-year")!);
const exampleHigh = enAmountFigures(EN_AMOUNT_PAGES.find((page) => page.slug === "100000-gross-per-year")!);
const nextRate = taxYear(year + 1).expatRuling.rate;

export const EN_ARTICLES: Article[] = [
  {
    slug: "30-percent-ruling-explained",
    title: "The Dutch 30% ruling explained: who qualifies and what it's worth",
    seoTitle: "The Dutch 30% ruling explained",
    description: `How the Dutch 30% ruling works in ${year}: who qualifies, the salary norm of ${euroEn(ruling.salaryNorm)}, the ${euroEn(ruling.rate * ruling.wntNorm)} cap, the 5-year limit and the drop to ${pct(nextRate)} in ${year + 1}.`,
    updated: "2026-11-20",
    intro: `The 30% ruling (expatregeling) lets your employer pay up to ${pct(ruling.rate)} of your salary tax-free if you were recruited from abroad and earn above a salary norm. It lasts at most five years. From ${year + 1} the percentage drops to ${pct(nextRate)}. Use the [30% ruling calculator](/en/30-percent-ruling) to see what it means for your net pay.`,
    sections: [
      {
        heading: "What the ruling does",
        paragraphs: [
          `Working abroad comes with extra costs, such as trips home and higher housing costs. Instead of reimbursing those costs one by one, your employer may pay a fixed tax-free allowance: up to ${pct(ruling.rate)} of your salary, where the salary includes the allowance itself. You pay wage tax only on the rest. On a salary of ${euroEn(100_000)}, up to ${euroEn(100_000 * ruling.rate)} is tax-free and you pay tax on ${euroEn(100_000 * (1 - ruling.rate))}.`,
          `In practice your gross salary stays the same, but less of it is taxed. Your employer can also choose to reimburse the actual extra costs tax-free instead, but not both in the same year.`,
        ],
      },
      {
        heading: "Who qualifies",
        paragraphs: [
          "You must have been recruited from abroad or transferred within a multinational. In the 24 months before your first working day in the Netherlands, you must have lived more than 150 km from the Dutch border for more than 16 months.",
          `You also need specific expertise that is scarce in the Netherlands. The Tax Administration tests this with your salary: in ${year} your taxable annual salary must be above ${euroEn(ruling.salaryNorm)}. If you are under 30 and have a master's degree, the norm is ${euroEn(ruling.salaryNormYoungMaster)}. Taxable means after the tax-free allowance, so with the ruling your gross salary must be higher than the norm. The norms go up every year.`,
          "Your employer applies for the ruling. The application must be filed within 4 months after your first working day; the Tax Administration decides within about 8 weeks.",
        ],
      },
      {
        heading: "The salary norm and the maximum",
        paragraphs: [
          `Because your taxable salary must stay above the norm, the ruling is worth less just above it. At ${euroEn(50_000)} a year, only ${euroEn(50_000 - ruling.salaryNorm)} can be paid tax-free: the part above ${euroEn(ruling.salaryNorm)}. Below the norm, the ruling gives you nothing.`,
          `There is also a maximum. The allowance is capped at ${pct(ruling.rate)} of the salary limit for top incomes in the public sector (WNT): ${euroEn(ruling.wntNorm)} in ${year}. So the tax-free amount is at most ${euroEn(ruling.rate * ruling.wntNorm)} a year, reached at a salary of ${euroEn(ruling.wntNorm)} or more.`,
        ],
      },
      {
        heading: "How long it lasts, and what changes in " + (year + 1),
        paragraphs: [
          "The ruling applies for a maximum of 5 years. Earlier periods in which you lived or worked in the Netherlands in the 25 years before you arrived are deducted from that, apart from short stays.",
          `From 1 January ${year + 1} the tax-free percentage drops from ${pct(ruling.rate)} to ${pct(nextRate)}. Since 1 January 2025 the ruling no longer comes with the option of partial non-resident tax status for savings and investments; only people who already had the ruling at the end of 2023 can keep that status until the end of 2026.`,
          "International school fees for your children can be reimbursed tax-free on top of the ruling, if the school follows a foreign curriculum and mainly serves children of employees from abroad.",
        ],
      },
      {
        heading: "What it means for your net salary",
        paragraphs: [
          `On ${euroEn(60_000)} gross a year, including holiday allowance, you take home about ${euroEn(example.without.netAnnual)} a year without the ruling and ${euroEn(example.ruling.netAnnual)} with it. On ${euroEn(100_000)} that is ${euroEn(exampleHigh.without.netAnnual)} without and ${euroEn(exampleHigh.ruling.netAnnual)} with the ruling. Try your own salary in the [30% ruling calculator](/en/30-percent-ruling).`,
        ],
      },
    ],
    calculator: { href: "/en/30-percent-ruling", label: "Calculate your 30% ruling" },
    related: ["dutch-payslip-explained", "dutch-income-tax-rates"],
  },
  {
    slug: "dutch-payslip-explained",
    title: "Your Dutch payslip explained: from gross to net",
    seoTitle: "Dutch payslip explained: gross to net",
    description: "What the lines on a Dutch payslip mean: gross salary, pension contribution, wage tax, tax credits, holiday allowance and the 30% ruling allowance.",
    updated: "2026-11-20",
    intro: "A Dutch payslip (loonstrook) starts with your gross salary, deducts your pension contribution, and then withholds wage tax (loonheffing). What is left is your net pay. Holiday allowance is paid separately, usually once a year in May or June.",
    sections: [
      {
        heading: "Gross salary and pension",
        paragraphs: [
          "Your gross salary (brutoloon) is the amount in your contract. Most employees in the Netherlands build up a pension through their employer. Your own pension contribution (pensioenpremie werknemer) is deducted from your gross salary before tax, so you pay no wage tax on it. Your employer usually pays a larger part of the premium on top; that part is not on your net pay but is part of your total reward.",
        ],
      },
      {
        heading: "Wage tax and tax credits",
        paragraphs: [
          `Wage tax (loonheffing) is income tax plus national insurance contributions, withheld by your employer every month. The rate depends on your annual income: ${pct(b1.rate)} up to ${euroEn(b1.limit)}, ${pct(b2.rate)} up to ${euroEn(b2.limit)} and ${pct(tax.brackets[2].rate)} above that in ${year}.`,
          "Two tax credits lower the tax: the general tax credit (algemene heffingskorting) and the employment tax credit (arbeidskorting). Your employer applies them if you have asked for the loonheffingskorting, which you should do with one employer only. Read more in [Dutch income tax rates and tax credits](/en/guides/dutch-income-tax-rates).",
        ],
      },
      {
        heading: "Holiday allowance and a 13th month",
        paragraphs: [
          "By law you get at least 8% of your gross salary as holiday allowance (vakantiegeld). Most employers pay it once a year in May or June. Some collective agreements (cao) also give a 13th month or year-end bonus.",
          "These extras are taxed at your highest rate, so a bigger share goes to tax than on your regular salary. In a regular month you therefore get less than one twelfth of your net annual income. The [gross to net calculator](/en) shows both.",
        ],
      },
      {
        heading: "The 30% ruling on your payslip",
        paragraphs: [
          "If you have the 30% ruling, part of your salary is paid as a tax-free allowance. Your payslip usually shows it as a separate line, and wage tax is calculated only over the rest. Read [how the 30% ruling works](/en/guides/30-percent-ruling-explained).",
        ],
      },
      {
        heading: "Health insurance is separate",
        paragraphs: [
          "Basic health insurance (zorgverzekering) is compulsory for residents, but you take it out and pay the monthly premium yourself; it is not deducted from your salary. Your employer does pay the income-related health care contribution (Zvw) for you. On a lower income you may be entitled to a health care allowance (zorgtoeslag).",
        ],
      },
    ],
    calculator: { href: "/en", label: "Calculate your net salary" },
    related: ["dutch-income-tax-rates", "30-percent-ruling-explained"],
  },
  {
    slug: "dutch-income-tax-rates",
    title: `Dutch income tax rates and tax credits ${year}`,
    description: `The Dutch income tax brackets for ${year} (${pct(b1.rate)}, ${pct(b2.rate)} and ${pct(tax.brackets[2].rate)}), the general and employment tax credits, and why your marginal rate is often above 50%.`,
    updated: "2026-11-20",
    intro: `In ${year} the Netherlands taxes income from work in three brackets: ${pct(b1.rate)} up to ${euroEn(b1.limit)}, ${pct(b2.rate)} up to ${euroEn(b2.limit)} and ${pct(tax.brackets[2].rate)} above that. Two tax credits lower the tax, but they shrink as you earn more, so the tax on an extra euro is often higher than the bracket rate.`,
    sections: [
      {
        heading: `Tax brackets ${year}`,
        paragraphs: [
          `Box 1 covers income from work and your home. For people below the state pension age (AOW) the rates are ${pct(b1.rate)} on income up to ${euroEn(b1.limit)}, ${pct(b2.rate)} from ${euroEn(b1.limit)} to ${euroEn(b2.limit)}, and ${pct(tax.brackets[2].rate)} above ${euroEn(b2.limit)}. The rate in the first bracket includes national insurance contributions. From the state pension age the first bracket is ${pct(tax.bracketsAow[0].rate)}.`,
          "Your pension contribution is deducted before tax. With the 30% ruling, the tax-free allowance is left out as well.",
        ],
      },
      {
        heading: "Tax credits",
        paragraphs: [
          `The general tax credit (algemene heffingskorting) is at most ${euroEn(tax.generalCredit.max)}. Above ${euroEn(tax.generalCredit.phaseOutFrom)} it goes down by ${pct(tax.generalCredit.phaseOutRate)} of every extra euro, until it is gone at about ${euroEn(generalZeroAt)}.`,
          `The employment tax credit (arbeidskorting) rises with your income to a maximum of ${euroEn(employmentPeak.base)} at ${euroEn(employmentPeak.from)}. Above that it goes down by ${pct(-employmentPeak.rate)} of every extra euro, until it is gone at about ${euroEn(employmentZeroAt)}.`,
        ],
      },
      {
        heading: "Why your marginal rate is so high",
        paragraphs: [
          `Between about ${euroEn(employmentPeak.from)} and ${euroEn(b2.limit)} you pay the bracket rate of ${pct(b2.rate)} and lose part of both tax credits on every extra euro. On a salary of ${euroEn(60_000)} a year, about ${percentEn(example.without.marginalRate)} of a raise goes to tax. Above ${euroEn(b2.limit)} the rate is ${pct(tax.brackets[2].rate)}, and the employment tax credit keeps phasing out up to about ${euroEn(employmentZeroAt)}.`,
          "That is why holiday allowance and bonuses, which come on top of your salary, are taxed at a high rate. The [gross to net calculator](/en) shows your own marginal rate.",
        ],
      },
      {
        heading: "Where the figures come from",
        paragraphs: [
          `The rates and credits are the official ${year} figures of the Dutch Tax Administration (Belastingdienst). The calculators on Nettoplaatje use the same figures. See [your Dutch payslip explained](/en/guides/dutch-payslip-explained) for how they show up on your payslip.`,
        ],
      },
    ],
    calculator: { href: "/en", label: "Calculate your net salary" },
    related: ["dutch-payslip-explained", "30-percent-ruling-explained"],
  },
];

export const getEnArticle = (slug: string) => EN_ARTICLES.find((article) => article.slug === slug);

export const enArticlePath = (article: Article) => `/en/guides/${article.slug}`;
