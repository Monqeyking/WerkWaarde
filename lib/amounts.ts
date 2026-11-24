/**
 * Static landing pages for popular salary amounts ("€ 3.500 bruto per maand").
 * One or two pages per income band, each with an explanation of what happens at
 * that income (lib/amount-context.ts). Keep the list short: near-identical pages
 * for every €100 read as thin content to Google and AdSense, and were removed in
 * November 2026. Their URLs redirect to the calculator (public/_redirects).
 */
import { createDefaultState, updateJobSection, updatePersonal, type NettoplaatjeState } from "./job-model.ts";
import { grossToNet } from "./spokes.ts";
import { DEFAULT_TAX_YEAR } from "./tax-years.ts";

export type AmountKind = "maand" | "jaar";
export type AmountPage = { slug: string; kind: AmountKind; amount: number };

/** The lowest page sits around the full-time minimum wage: lower amounts at 40 hours would be below it. */
export const MONTHLY_AMOUNTS = [2700, 3000, 3500, 4000, 5000, 6000, 8000] as const;
export const YEARLY_AMOUNTS = [40000, 50000, 60000] as const;

/** Amount pages that existed until November 2026; each now redirects to the calculator with its amount filled in. */
export const RETIRED_MONTHLY_AMOUNTS = [
  2000, 2200, 2400, 2500, 2600, 2800, 2900, 3100, 3200, 3300, 3400, 3600, 3700, 3800, 3900, 4200, 4500, 4800, 5500, 6500, 7000, 9000, 10000,
] as const;
export const RETIRED_YEARLY_AMOUNTS = [30000, 35000, 45000, 70000, 80000, 90000] as const;

/** Holiday allowance assumed on every amount page. */
export const HOLIDAY_PCT = 8;
const FULL_TIME_HOURS = 40;
export const PART_TIME_HOURS = [32, 36] as const;

const toPages = (monthly: readonly number[], yearly: readonly number[]): AmountPage[] => [
  ...monthly.map((amount) => ({ slug: `${amount}-per-maand`, kind: "maand" as const, amount })),
  ...yearly.map((amount) => ({ slug: `${amount}-per-jaar`, kind: "jaar" as const, amount })),
];

export const AMOUNT_PAGES: readonly AmountPage[] = toPages(MONTHLY_AMOUNTS, YEARLY_AMOUNTS);
export const RETIRED_AMOUNT_PAGES: readonly AmountPage[] = toPages(RETIRED_MONTHLY_AMOUNTS, RETIRED_YEARLY_AMOUNTS);

export function getAmountPage(slug: string): AmountPage | undefined {
  return AMOUNT_PAGES.find((page) => page.slug === slug);
}

/**
 * Monthly gross salary for a page. A yearly amount is read as the full annual
 * gross including 8% holiday allowance, so the monthly salary is amount / 12.96.
 */
export function monthlyGrossFor(page: AmountPage) {
  return page.kind === "maand" ? page.amount : page.amount / (12 * (1 + HOLIDAY_PCT / 100));
}

/** A standard situation: full time, 8% holiday allowance, no pension deduction, no extras. */
export function amountState(grossMonthly: number, year = DEFAULT_TAX_YEAR, hoursPerWeek = FULL_TIME_HOURS): NettoplaatjeState {
  const state = updatePersonal(createDefaultState(), { taxYear: year });
  return updateJobSection(state, "current", "salary", {
    grossMonthly, hoursPerWeek, holidayAllowancePct: HOLIDAY_PCT, yearEndBonusPct: 0, annualBonus: 0,
    pensionMode: "monthly", pensionEmployeeMonthly: 0, pensionEmployerMonthly: 0,
  });
}

export type AmountFigures = ReturnType<typeof amountFigures>;

export function amountFigures(page: AmountPage, year = DEFAULT_TAX_YEAR) {
  const grossMonthly = monthlyGrossFor(page);
  const result = grossToNet(amountState(grossMonthly, year), "current");
  const partTime = PART_TIME_HOURS.map((hours) => {
    const gross = grossMonthly * hours / FULL_TIME_HOURS;
    return { hours, grossMonthly: gross, netMonthly: grossToNet(amountState(gross, year, hours), "current").regularNetMonthly };
  });
  return { page, year, ...result, partTime };
}

/** Amounts just below and above this page's amount (not necessarily pages), for the "nearby" table. */
export function nearbyAmounts(page: AmountPage, count = 2): AmountPage[] {
  const step = page.kind === "maand" ? 250 : 2500;
  const amounts: AmountPage[] = [];
  for (let offset = -count; offset <= count; offset += 1) {
    const amount = page.amount + offset * step;
    if (amount > 0) amounts.push(offset === 0 ? page : { slug: "", kind: page.kind, amount });
  }
  return amounts;
}

/** "€ 3.500" without decimals, for titles and headings. */
export function euro(amount: number) {
  // Non-breaking space, so "€" never ends up on its own line.
  return `€ ${Math.round(amount).toLocaleString("nl-NL")}`;
}

export const amountPath = (page: AmountPage) => `/bruto-netto/${page.slug}`;

/** Link that opens the calculator with this monthly gross salary filled in. */
export const prefillPath = (page: AmountPage) => `/bruto-netto#bruto=${Math.round(monthlyGrossFor(page))}`;

/** Search-result title, kept within about 60 characters including " | Nettoplaatje". */
export function amountTitle(figures: AmountFigures) {
  const { page, year } = figures;
  return page.kind === "maand"
    ? `${euro(page.amount)} bruto per maand: ${euro(figures.regularNetMonthly)} netto (${year})`
    : `${euro(page.amount)} bruto per jaar: ${euro(figures.netAnnual)} netto (${year})`;
}

export function amountDescription(figures: AmountFigures) {
  const { page, year } = figures;
  return page.kind === "maand"
    ? `Bij ${euro(page.amount)} bruto per maand houd je in ${year} ongeveer ${euro(figures.regularNetMonthly)} netto over. Met vakantiegeld, marginaal tarief en parttime.`
    : `Bij ${euro(page.amount)} bruto per jaar houd je in ${year} ongeveer ${euro(figures.netAnnual)} netto over, gemiddeld ${euro(figures.netMonthlyAverage)} per maand. Met belasting en parttime.`;
}

/** Short label for link lists: "€ 3.500 per maand" or "€ 60.000 per jaar". */
export const amountLabel = (page: AmountPage) => `${euro(page.amount)} ${page.kind === "maand" ? "per maand" : "per jaar"}`;
