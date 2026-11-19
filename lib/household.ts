/**
 * Connects the shared model's household to the toeslagen calculation.
 *
 * The toetsingsinkomen is the job's own box 1 income (salary, bonuses and
 * bijtelling minus the employee's pension premium) plus
 * the partner's income, minus deductions. Childcare hours follow the job's
 * opvangdagen, so a job with fewer opvangdagen also gets less kinderopvangtoeslag.
 */
import { CHILD_SLOTS, type Child, type ChildCare, type JobKey, type NettoplaatjeState } from "./job-model.ts";
import type { ChildcareType } from "./tax-years.ts";
import { calculateAllowances, toetsingsinkomen, type AllowancesResult, type HouseholdInput } from "./toeslagen.ts";
import { combinationCredit, incomeTax } from "./calculator.ts";

/** The children the user switched on, in slot order. */
export function activeChildren(state: NettoplaatjeState): Child[] {
  return CHILD_SLOTS.map((slot) => state.personal.household.children[slot]).filter((child) => child.active);
}

/** Whether any active child goes to formal childcare. */
export function hasFormalChildcare(state: NettoplaatjeState) {
  return activeChildren(state).some((child) => child.care !== "none");
}

/** Childcare hours per month for a child, at a number of opvangdagen per week. */
export function childcareHoursPerMonth(child: Child, daysPerWeek: number) {
  if (child.care === "none") return 0;
  return Math.max(0, daysPerWeek) * Math.max(0, child.hoursPerDay) * Math.max(0, child.weeksPerYear) / 12;
}

/** The toeslagen input for a job: its opvangdagen, and whether everyone in the household works. */
export function householdInput(state: NettoplaatjeState, job: JobKey, ownTaxableAnnual: number): HouseholdInput {
  const { household } = state.personal;
  const daysPerWeek = state.jobs[job].childcareDaysPerWeek;
  return {
    hasPartner: household.hasPartner,
    parentsWork: ownTaxableAnnual > 0 && (!household.hasPartner || household.partnerTaxableAnnual > 0),
    assetsAboveLimit: household.assetsAboveLimit,
    children: activeChildren(state).map((child) => ({
      age: child.age,
      care: child.care,
      hoursPerMonth: childcareHoursPerMonth(child, daysPerWeek),
      hourlyPrice: child.hourlyPrice,
    })),
  };
}

/** The household's toetsingsinkomen when this job is the user's job. */
export function householdIncome(state: NettoplaatjeState, ownTaxableAnnual: number) {
  const { household } = state.personal;
  return toetsingsinkomen(ownTaxableAnnual, household.hasPartner ? household.partnerTaxableAnnual : 0, household.deductionsAnnual);
}

/** Child age below which a parent can get the combinatiekorting (younger than 12 on 1 January). */
const COMBINATION_CREDIT_CHILD_AGE = 12;

/**
 * Who in the household gets the combinatiekorting: there must be a child under 12, and it
 * goes to the partner who earns the least (the partner's income field stands in for their
 * labour income). Null when nobody does.
 */
export function combinatiekortingFor(state: NettoplaatjeState, ownLabourIncome: number): "self" | "partner" | null {
  const { household } = state.personal;
  const youngChild = activeChildren(state).some((child) => child.age < COMBINATION_CREDIT_CHILD_AGE);
  if (!household.enabled || !youngChild) return null;
  return !household.hasPartner || ownLabourIncome < household.partnerTaxableAnnual ? "self" : "partner";
}

/**
 * The household's combinatiekorting per year, never more than the income tax the receiving
 * partner has left after the other credits. When the partner earns less, it is the partner's:
 * it then stays the same when your hours change, so working more does not make it vanish.
 */
export function combinatiekortingAnnual(state: NettoplaatjeState, ownLabourIncome: number, ownTaxDue: number): number {
  const { age, taxYear, household } = state.personal;
  switch (combinatiekortingFor(state, ownLabourIncome)) {
    case "self":
      return Math.min(combinationCredit(ownLabourIncome, age, taxYear), Math.max(0, ownTaxDue));
    case "partner":
      // The partner's age is unknown; the user's age stands in for it.
      return Math.min(combinationCredit(household.partnerTaxableAnnual, age, taxYear), incomeTax(household.partnerTaxableAnnual, age, taxYear));
    default:
      return 0;
  }
}

/**
 * Toeslagen and the combinatiekorting for a job at its own taxable income and income tax
 * (from calculateJobTotal, which calls this), or null when the user has not switched them on.
 */
export function allowancesFor(state: NettoplaatjeState, job: JobKey, ownTaxableAnnual: number, taxDue: number): AllowancesResult | null {
  if (!state.personal.household.enabled) return null;
  const allowances = calculateAllowances(householdIncome(state, ownTaxableAnnual), householdInput(state, job, ownTaxableAnnual), state.personal.taxYear);
  const combinatiekortingMonthly = combinatiekortingAnnual(state, ownTaxableAnnual, taxDue) / 12;
  return { ...allowances, combinatiekortingMonthly, totalAllowancesMonthly: allowances.totalAllowancesMonthly + combinatiekortingMonthly };
}

/** Short explanation of the toetsingsinkomen, for the notes under the results. */
export function toetsingsinkomenText(hasPartner: boolean): string {
  return `je belastbare loon (met bijtelling, min je pensioenpremie)${hasPartner ? " plus dat van je partner" : ""}, min aftrekposten`;
}

/** Typical hours per day and weeks per year for each kind of childcare. */
const CARE_TYPICAL: Record<ChildcareType, { hoursPerDay: number; weeksPerYear: number }> = {
  dagopvang: { hoursPerDay: 11, weeksPerYear: 52 },
  bso: { hoursPerDay: 5, weeksPerYear: 48 },
  gastouder: { hoursPerDay: 10, weeksPerYear: 52 },
};

/** Defaults for a kind of childcare; the price is that year's maximum hourly price. */
function careDefaults(care: ChildCare, prices: Record<ChildcareType, number>): Pick<Child, "hoursPerDay" | "weeksPerYear" | "hourlyPrice"> | null {
  return care === "none" ? null : { ...CARE_TYPICAL[care], hourlyPrice: prices[care] };
}

/**
 * Switching the kind of childcare also switches hours, weeks and price to that kind's
 * defaults, but only the values that still hold the old kind's defaults: what the
 * user typed stays.
 */
export function careChangePatch(child: Child, care: ChildCare, prices: Record<ChildcareType, number>): Partial<Child> {
  const before = careDefaults(child.care, prices);
  const after = careDefaults(care, prices);
  const patch: Partial<Child> = { care };
  if (!after) return patch;
  for (const key of ["hoursPerDay", "weeksPerYear", "hourlyPrice"] as const) {
    if (!before || child[key] === before[key]) patch[key] = after[key];
  }
  return patch;
}
