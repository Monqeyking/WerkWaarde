/**
 * English salary pages for expats ("€60,000 gross per year in the Netherlands").
 * Expats usually get an offer as a yearly amount, so most pages are yearly. Each
 * page shows the net salary with and without the 30% ruling (expatregeling), and
 * explains what the ruling does at that salary (lib/en-amount-context.ts).
 * One or two pages per ruling zone: below the salary norm, limited by the norm, the
 * full percentage, and the full percentage with the rest still in the top bracket.
 * Near-identical pages read as thin content to Google and AdSense; the pages removed
 * in November 2026 redirect to the calculator (public/_redirects).
 */
import { AMOUNT_PAGES, HOLIDAY_PCT, amountPath, amountState } from "./amounts.ts";
import type { ExpatOption } from "./expat.ts";
import { moneyEn } from "./format.ts";
import { updateJobSection } from "./job-model.ts";
import { grossToNet } from "./spokes.ts";
import { DEFAULT_TAX_YEAR } from "./tax-years.ts";

export type EnAmountKind = "month" | "year";
export type EnAmountPage = { slug: string; kind: EnAmountKind; amount: number };

export const EN_MONTHLY_AMOUNTS = [3000] as const;
export const EN_YEARLY_AMOUNTS = [60000, 70000, 100000] as const;

/** Salary pages removed in November 2026; each redirects to the calculator with its amount filled in. */
export const EN_RETIRED_MONTHLY_AMOUNTS = [4000, 5000, 6000] as const;
export const EN_RETIRED_YEARLY_AMOUNTS = [50000, 80000, 120000] as const;

const toEnPages = (yearly: readonly number[], monthly: readonly number[]): EnAmountPage[] => [
  ...yearly.map((amount) => ({ slug: `${amount}-gross-per-year`, kind: "year" as const, amount })),
  ...monthly.map((amount) => ({ slug: `${amount}-gross-per-month`, kind: "month" as const, amount })),
];

export const EN_AMOUNT_PAGES: readonly EnAmountPage[] = toEnPages(EN_YEARLY_AMOUNTS, EN_MONTHLY_AMOUNTS);
export const EN_RETIRED_AMOUNT_PAGES: readonly EnAmountPage[] = toEnPages(EN_RETIRED_YEARLY_AMOUNTS, EN_RETIRED_MONTHLY_AMOUNTS);

export const getEnAmountPage = (slug: string) => EN_AMOUNT_PAGES.find((page) => page.slug === slug);

export const enAmountPath = (page: EnAmountPage) => `/en/salary/${page.slug}`;

/** The Dutch page for the same amount, when there is one (used for hreflang). */
export function dutchAmountPath(page: EnAmountPage): string | undefined {
  const slug = `${page.amount}-per-${page.kind === "month" ? "maand" : "jaar"}`;
  const dutch = AMOUNT_PAGES.find((other) => other.slug === slug);
  return dutch && amountPath(dutch);
}

/** Link that opens the English calculator with this monthly gross salary filled in. */
export const enPrefillPath = (page: EnAmountPage) => `/en#bruto=${Math.round(enMonthlyGross(page))}`;

/** A yearly amount is read as the full annual gross including 8% holiday allowance, as in most Dutch offers. */
export function enMonthlyGross(page: EnAmountPage) {
  return page.kind === "month" ? page.amount : page.amount / (12 * (1 + HOLIDAY_PCT / 100));
}

function stateWithRuling(grossMonthly: number, year: number, option: ExpatOption) {
  return updateJobSection(amountState(grossMonthly, year), "current", "salary", { expatRuling: option });
}

export type EnAmountFigures = ReturnType<typeof enAmountFigures>;

/** Net pay for a standard full-time job, without the ruling, with it, and with the lower norm for under-30s with a master's. */
export function enAmountFigures(page: EnAmountPage, year = DEFAULT_TAX_YEAR) {
  const grossMonthly = enMonthlyGross(page);
  return {
    page,
    year,
    grossMonthly,
    without: grossToNet(stateWithRuling(grossMonthly, year, "none"), "current"),
    ruling: grossToNet(stateWithRuling(grossMonthly, year, "standard"), "current"),
    youngMaster: grossToNet(stateWithRuling(grossMonthly, year, "youngMaster"), "current"),
  };
}

/** "€60,000" without decimals. */
export const euroEn = (amount: number) => moneyEn(Math.round(amount));

export const enAmountLabel = (page: EnAmountPage) => `${euroEn(page.amount)} ${page.kind === "month" ? "a month" : "a year"}`;

/** The headline net figure: per month for monthly pages, per year for yearly pages. */
export const headlineNet = (figures: EnAmountFigures, which: "without" | "ruling" = "without") =>
  figures.page.kind === "month" ? figures[which].regularNetMonthly : figures[which].netAnnual;

export function enAmountTitle(figures: EnAmountFigures) {
  const { page, year } = figures;
  return `${euroEn(page.amount)} gross per ${page.kind}: ${euroEn(headlineNet(figures))} net (${year})`;
}

export function enAmountDescription(figures: EnAmountFigures) {
  const { page, year, without, ruling } = figures;
  const per = page.kind === "month" ? "a month" : "a year";
  const monthly = page.kind === "year" ? `, or ${euroEn(without.netMonthlyAverage)} a month` : "";
  const withRuling = ruling.expatAllowanceAnnual > 0
    ? `With the 30% ruling: ${euroEn(headlineNet(figures, "ruling"))}.`
    : "Below the salary norm of the 30% ruling.";
  return `On ${euroEn(page.amount)} gross ${per} you take home about ${euroEn(headlineNet(figures))} net in ${year}${monthly}. ${withRuling} Tax and holiday pay explained.`;
}
