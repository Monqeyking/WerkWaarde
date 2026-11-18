/**
 * Toeslagen: zorgtoeslag, kindgebonden budget and kinderopvangtoeslag.
 *
 * Indicative, on the household's toetsingsinkomen for a whole year. Huurtoeslag
 * is not calculated: it depends on rent, service costs and household make-up,
 * so the interface refers to the Belastingdienst's proefberekening instead.
 *
 * Framework-free and independent of the job model, so it can be unit tested on
 * its own. Year-specific figures live in tax-years.ts.
 */
import { DEFAULT_TAX_YEAR, taxYear, type ChildcareType } from "./tax-years.ts";

export type ChildInput = {
  /** Age in the calculation year. Children of 18 and older do not count. */
  age: number;
  care: ChildcareType | "none";
  /** Childcare hours per month (capped at the legal maximum here). */
  hoursPerMonth: number;
  /** What the childcare organisation actually charges per hour. */
  hourlyPrice: number;
};

export type HouseholdInput = {
  hasPartner: boolean;
  /** Kinderopvangtoeslag requires the applicant and any toeslagpartner to work. */
  parentsWork: boolean;
  /** Wealth above the limit: no zorgtoeslag and no kindgebonden budget. */
  assetsAboveLimit: boolean;
  children: readonly ChildInput[];
};

/**
 * Toetsingsinkomen: box 1 income of the household. The own part should include
 * holiday allowance, bonuses and the lease car's bijtelling, minus the
 * employee's pension premium (as `calculateJobTotal` returns in `taxableAnnual`).
 */
export function toetsingsinkomen(ownTaxableAnnual: number, partnerTaxableAnnual = 0, deductionsAnnual = 0) {
  return Math.max(0, Math.max(0, ownTaxableAnnual) + Math.max(0, partnerTaxableAnnual) - Math.max(0, deductionsAnnual));
}

/** Annual zorgtoeslag: standard premium(s) minus the norm premium. */
export function zorgtoeslagAnnual(income: number, hasPartner: boolean, assetsAboveLimit = false, year = DEFAULT_TAX_YEAR) {
  if (assetsAboveLimit) return 0;
  const params = taxYear(year).allowances.zorgtoeslag;
  const normPremium = (hasPartner ? params.normRatePartner : params.normRateSingle) * params.thresholdIncome
    + params.phaseOutRate * Math.max(0, income - params.thresholdIncome);
  return Math.max(0, params.standardPremium * (hasPartner ? 2 : 1) - normPremium);
}

/** Maximum kindgebonden budget before the income-related reduction. */
export function kindgebondenBudgetMax(childAges: readonly number[], hasPartner: boolean, year = DEFAULT_TAX_YEAR) {
  const params = taxYear(year).allowances.kindgebondenBudget;
  const children = childAges.filter((age) => age >= 0 && age < 18);
  if (children.length === 0) return 0;
  const perChild = children.reduce((sum, age) => sum + params.perChild + (age >= 16 ? params.age16 : age >= 12 ? params.age12 : 0), 0);
  return perChild + (hasPartner ? 0 : params.singleParent);
}

/** Annual kindgebonden budget: the maximum minus the phase-out above the threshold income. */
export function kindgebondenBudgetAnnual(income: number, childAges: readonly number[], hasPartner: boolean, assetsAboveLimit = false, year = DEFAULT_TAX_YEAR) {
  if (assetsAboveLimit) return 0;
  const params = taxYear(year).allowances.kindgebondenBudget;
  const threshold = hasPartner ? params.thresholdPartner : params.thresholdSingle;
  const reduction = params.phaseOutRate * Math.max(0, income - threshold);
  return Math.max(0, kindgebondenBudgetMax(childAges, hasPartner, year) - reduction);
}

/** Percentage (0–1) of the capped hourly price that kinderopvangtoeslag reimburses. */
export function kinderopvangPercentage(income: number, firstChild: boolean, year = DEFAULT_TAX_YEAR) {
  const { table } = taxYear(year).allowances.kinderopvangtoeslag;
  let row = table[0];
  for (const candidate of table) if (income >= candidate[0]) row = candidate;
  return (firstChild ? row[1] : row[2]) / 100;
}

export type ChildcareResult = {
  care: ChildcareType;
  hoursPerMonth: number;
  /** Whether this child gets the (lower) first-child percentage. */
  firstChild: boolean;
  percentage: number;
  grossMonthly: number;
  allowanceMonthly: number;
  netMonthly: number;
};

/**
 * Kinderopvangtoeslag per child in formal childcare. The child with the most
 * hours counts as the first child; the others get the higher percentage.
 * Hours are capped at the monthly maximum, the price at the maximum hourly price;
 * the part of the price above that maximum is paid in full by the parents.
 */
export function kinderopvangtoeslag(income: number, household: Pick<HouseholdInput, "parentsWork" | "children">, year = DEFAULT_TAX_YEAR): ChildcareResult[] {
  const params = taxYear(year).allowances.kinderopvangtoeslag;
  const inCare = household.children
    .filter((child): child is ChildInput & { care: ChildcareType } => child.care !== "none" && child.age >= 0 && child.age < 18 && child.hoursPerMonth > 0)
    .map((child) => ({ ...child, hoursPerMonth: Math.min(params.maxHoursPerMonth, Math.max(0, child.hoursPerMonth)) }));
  const firstIndex = inCare.reduce((best, child, index) => child.hoursPerMonth > inCare[best].hoursPerMonth ? index : best, 0);
  return inCare.map((child, index) => {
    const firstChild = index === firstIndex;
    const percentage = household.parentsWork ? kinderopvangPercentage(income, firstChild, year) : 0;
    const price = Math.max(0, child.hourlyPrice);
    const grossMonthly = child.hoursPerMonth * price;
    const allowanceMonthly = child.hoursPerMonth * Math.min(price, params.maxHourlyPrice[child.care]) * percentage;
    return { care: child.care, hoursPerMonth: child.hoursPerMonth, firstChild, percentage, grossMonthly, allowanceMonthly, netMonthly: grossMonthly - allowanceMonthly };
  });
}

export type AllowancesResult = {
  toetsingsinkomen: number;
  zorgtoeslagMonthly: number;
  kindgebondenBudgetMonthly: number;
  childcare: ChildcareResult[];
  kinderopvangtoeslagMonthly: number;
  childcareGrossMonthly: number;
  childcareNetMonthly: number;
  /** Zorgtoeslag + kindgebonden budget + kinderopvangtoeslag. */
  totalAllowancesMonthly: number;
};

/** All toeslagen for a household at a given toetsingsinkomen, as monthly averages. */
export function calculateAllowances(income: number, household: HouseholdInput, year = DEFAULT_TAX_YEAR): AllowancesResult {
  const childAges = household.children.map((child) => child.age);
  const zorgtoeslagMonthly = zorgtoeslagAnnual(income, household.hasPartner, household.assetsAboveLimit, year) / 12;
  const kindgebondenBudgetMonthly = kindgebondenBudgetAnnual(income, childAges, household.hasPartner, household.assetsAboveLimit, year) / 12;
  const childcare = kinderopvangtoeslag(income, household, year);
  const sum = (key: "allowanceMonthly" | "grossMonthly" | "netMonthly") => childcare.reduce((total, child) => total + child[key], 0);
  const kinderopvangtoeslagMonthly = sum("allowanceMonthly");
  return {
    toetsingsinkomen: income,
    zorgtoeslagMonthly,
    kindgebondenBudgetMonthly,
    childcare,
    kinderopvangtoeslagMonthly,
    childcareGrossMonthly: sum("grossMonthly"),
    childcareNetMonthly: sum("netMonthly"),
    totalAllowancesMonthly: zorgtoeslagMonthly + kindgebondenBudgetMonthly + kinderopvangtoeslagMonthly,
  };
}
