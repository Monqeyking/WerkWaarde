/**
 * Connects the shared model's household to the toeslagen calculation.
 *
 * The toetsingsinkomen is the job's own box 1 income (salary, bonuses and
 * bijtelling minus the employee's pension premium) plus
 * the partner's income, minus deductions. Childcare hours follow the job's
 * opvangdagen, so a job with fewer opvangdagen also gets less kinderopvangtoeslag.
 */
import { CHILD_SLOTS, type Child, type JobKey, type NettoplaatjeState } from "./job-model.ts";
import { calculateAllowances, toetsingsinkomen, type AllowancesResult, type HouseholdInput } from "./toeslagen.ts";

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

/**
 * Toeslagen for a job at its own taxable income (from calculateJobTotal, which calls
 * this), or null when the user has not switched them on.
 */
export function allowancesFor(state: NettoplaatjeState, job: JobKey, ownTaxableAnnual: number): AllowancesResult | null {
  if (!state.personal.household.enabled) return null;
  return calculateAllowances(householdIncome(state, ownTaxableAnnual), householdInput(state, job, ownTaxableAnnual), state.personal.taxYear);
}
