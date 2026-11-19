/**
 * The "nettoplaatje": everything a job costs and yields, per month, so two jobs
 * can be compared in one overview.
 *
 * All amounts are monthly averages over the year (holiday allowance, year-end
 * bonus and other annual payments spread over 12 months). Tax is calculated
 * once over all taxable income together, so a bonus or a lease car's benefit
 * is taxed at the person's actual marginal rate.
 */
import {
  calculateLease,
  calculateMobilityBudget,
  calculatePensionBreakdown,
  calculateVehicleCosts,
  incomeTax,
} from "./calculator.ts";
import { taxYear } from "./tax-years.ts";
import { allowancesFor, hasFormalChildcare } from "./household.ts";
import type { AllowancesResult } from "./toeslagen.ts";
import {
  JOB_KEYS,
  SECTION_KEYS,
  officeDaysPerMonth,
  toCalculatorInputs,
  type JobKey,
  type MobilityChoice,
  type NettoplaatjeState,
  type SectionKey,
} from "./job-model.ts";

/** Hours in a standard working day, used to derive working days from contract hours. */
const HOURS_PER_WORKING_DAY = 8;

export type JobTotal = {
  income: {
    grossMonthly: number;
    holidayMonthly: number;
    yearEndMonthly: number;
    bonusMonthly: number;
    pensionEmployeeMonthly: number;
    taxMonthly: number;
    /** Net pay from salary, holiday allowance and bonuses (before mobility and work costs). */
    netPayMonthly: number;
  };
  mobility: {
    choice: MobilityChoice;
    /** Money in or out because of the mobility arrangement, before tax. */
    cashMonthly: number;
    /** Extra income tax caused by the arrangement (bijtelling, taxable budget, km rate above the limit). */
    taxMonthly: number;
    netMonthly: number;
  };
  commute: {
    officeDaysPerMonth: number;
    kmPerMonth: number;
    travelHoursPerMonth: number;
    parkingMonthly: number;
    lunchMonthly: number;
    otherMonthly: number;
    /**
     * Childcare costs. With toeslagen on and children in formal childcare: the full bill
     * before kinderopvangtoeslag (the toeslag is in `allowances`). Otherwise the user's own
     * net amount per opvangdag.
     */
    childcareMonthly: number;
    homeWorkAllowanceMonthly: number;
    timeValueMonthly: number;
  };
  /** Toeslagen at this job's income, or null when the user has not switched them on. */
  allowances: AllowancesResult | null;
  /** What is left each month after mobility, work-related costs and childcare, toeslagen included. */
  netAfterCostsMonthly: number;
  /** Same, minus the money value of travel time if the user enabled it. */
  netAfterCostsAndTimeMonthly: number;
  workHoursPerMonth: number;
  /** Net amount left per hour spent on the job, travel time included. */
  netPerHourInclTravel: number;
  /**
   * Box 1 income from this job per year: salary, holiday allowance and bonuses minus the
   * employee's pension premium, plus taxable mobility (bijtelling). The own part of the
   * toetsingsinkomen for toeslagen.
   */
  taxableAnnual: number;
  benefits: {
    employerPensionMonthly: number;
    vacationDays: number;
    trainingBudgetAnnual: number;
    otherAnnual: number;
  };
  /** Gross annual reward: salary, holiday allowance, bonuses, employer pension and other budgets. */
  totalRewardAnnual: number;
};

/** Working days per week from contract hours, at 8 hours a day and at most 5 days. */
export function workingDaysPerWeek(hoursPerWeek: number) {
  return Math.min(5, Math.max(0, hoursPerWeek) / HOURS_PER_WORKING_DAY);
}

function mobilityPart(state: NettoplaatjeState, job: JobKey) {
  const inputs = toCalculatorInputs(state, job);
  const { mobility } = state.jobs[job];
  switch (mobility.choice) {
    case "lease": {
      const lease = calculateLease(inputs);
      return { cashMonthly: -lease.employeeContribution, taxableAnnual: lease.taxableBenefit * 12 };
    }
    case "mobilityBudget": {
      const budget = calculateMobilityBudget(inputs);
      return { cashMonthly: budget.grossBudget - budget.transportCosts, taxableAnnual: budget.taxableBudget * 12 };
    }
    case "ownCar": {
      const rate = Math.max(0, inputs.reimbursementRate);
      const businessKm = Math.max(0, inputs.businessKm);
      const reimbursement = businessKm * rate / 12;
      const costs = calculateVehicleCosts(inputs).carCosts;
      return { cashMonthly: reimbursement - costs, taxableAnnual: businessKm * Math.max(0, rate - taxYear(state.personal.taxYear).taxFreeKmRate) };
    }
    case "none":
      return { cashMonthly: 0, taxableAnnual: 0 };
  }
}

export function calculateJobTotal(state: NettoplaatjeState, job: JobKey): JobTotal {
  const profile = state.jobs[job];
  const { personal } = state;
  const { salary, commute, benefits } = profile;
  const weeks = personal.workWeeksPerYear;

  // Income and tax
  const pension = calculatePensionBreakdown(toCalculatorInputs(state, job));
  const grossAnnual = salary.grossMonthly * 12;
  const holidayAnnual = grossAnnual * salary.holidayAllowancePct / 100;
  const yearEndAnnual = grossAnnual * salary.yearEndBonusPct / 100;
  const bonusAnnual = salary.annualBonus;
  const salaryTaxable = Math.max(0, grossAnnual + holidayAnnual + yearEndAnnual + bonusAnnual - pension.employeeAnnual);
  const salaryTax = incomeTax(salaryTaxable, personal.age, personal.taxYear);

  const mobility = mobilityPart(state, job);
  const totalTax = incomeTax(salaryTaxable + mobility.taxableAnnual, personal.age, personal.taxYear);
  const mobilityTaxMonthly = Math.max(0, totalTax - salaryTax) / 12;

  const netPayMonthly = (salaryTaxable - salaryTax) / 12;
  const mobilityNetMonthly = mobility.cashMonthly - mobilityTaxMonthly;

  const taxableAnnual = salaryTaxable + mobility.taxableAnnual;
  const allowances = allowancesFor(state, job, taxableAnnual, totalTax);
  // With toeslagen on and children in formal childcare, the detailed calculation replaces
  // the simple "net cost per opvangdag" field.
  const detailedChildcare = allowances !== null && hasFormalChildcare(state);

  // Commuting and other work-related costs
  const daysPerMonth = officeDaysPerMonth(state, job);
  const travelHoursPerMonth = daysPerMonth * commute.oneWayMinutes * 2 / 60;
  const homeDaysPerWeek = Math.max(0, workingDaysPerWeek(salary.hoursPerWeek) - commute.officeDaysPerWeek);
  const commuteTotals = {
    officeDaysPerMonth: daysPerMonth,
    kmPerMonth: daysPerMonth * commute.oneWayKm * 2,
    travelHoursPerMonth,
    parkingMonthly: daysPerMonth * commute.parkingPerOfficeDay,
    lunchMonthly: daysPerMonth * commute.lunchPerOfficeDay,
    otherMonthly: daysPerMonth * commute.otherPerOfficeDay,
    childcareMonthly: detailedChildcare ? allowances.childcareGrossMonthly : profile.childcareDaysPerWeek * personal.childcareCostPerDay * weeks / 12,
    // Thuiswerkvergoeding is usually tax-free within the legal limit, so it counts as net.
    homeWorkAllowanceMonthly: homeDaysPerWeek * weeks / 12 * commute.homeWorkAllowancePerDay,
    timeValueMonthly: personal.timeValue.include ? travelHoursPerMonth * personal.timeValue.perHour : 0,
  };

  const netAfterCostsMonthly = netPayMonthly + mobilityNetMonthly + commuteTotals.homeWorkAllowanceMonthly
    - commuteTotals.parkingMonthly - commuteTotals.lunchMonthly - commuteTotals.otherMonthly - commuteTotals.childcareMonthly
    + (allowances?.totalAllowancesMonthly ?? 0);
  const workHoursPerMonth = salary.hoursPerWeek * weeks / 12;
  const hoursIncludingTravel = workHoursPerMonth + travelHoursPerMonth;

  return {
    income: {
      grossMonthly: salary.grossMonthly,
      holidayMonthly: holidayAnnual / 12,
      yearEndMonthly: yearEndAnnual / 12,
      bonusMonthly: bonusAnnual / 12,
      pensionEmployeeMonthly: pension.employeeMonthly,
      taxMonthly: salaryTax / 12,
      netPayMonthly,
    },
    mobility: {
      choice: profile.mobility.choice,
      cashMonthly: mobility.cashMonthly,
      taxMonthly: mobilityTaxMonthly,
      netMonthly: mobilityNetMonthly,
    },
    taxableAnnual,
    allowances,
    commute: commuteTotals,
    netAfterCostsMonthly,
    netAfterCostsAndTimeMonthly: netAfterCostsMonthly - commuteTotals.timeValueMonthly,
    workHoursPerMonth,
    netPerHourInclTravel: hoursIncludingTravel > 0 ? netAfterCostsMonthly / hoursIncludingTravel : 0,
    benefits: {
      employerPensionMonthly: pension.employerMonthly,
      vacationDays: benefits.vacationDays,
      trainingBudgetAnnual: benefits.trainingBudgetAnnual,
      otherAnnual: benefits.otherAnnual,
    },
    totalRewardAnnual: grossAnnual + holidayAnnual + yearEndAnnual + bonusAnnual
      + pension.employerAnnual + benefits.trainingBudgetAnnual + benefits.otherAnnual,
  };
}

export type JobComparison = {
  current: JobTotal;
  next: JobTotal;
  /** next − current, monthly */
  netDifferenceMonthly: number;
  netDifferenceAnnual: number;
  netPerHourDifference: number;
  travelHoursDifferenceMonthly: number;
  vacationDaysDifference: number;
  totalRewardDifferenceAnnual: number;
  /** Sections that still hold example values, per job. */
  unfilled: Array<{ job: JobKey; section: SectionKey }>;
};

export function compareJobs(state: NettoplaatjeState): JobComparison {
  const current = calculateJobTotal(state, "current");
  const next = calculateJobTotal(state, "next");
  const unfilled = JOB_KEYS.flatMap((job) =>
    SECTION_KEYS.filter((section) => !state.filled[job][section]).map((section) => ({ job, section })));
  return {
    current,
    next,
    netDifferenceMonthly: next.netAfterCostsMonthly - current.netAfterCostsMonthly,
    netDifferenceAnnual: (next.netAfterCostsMonthly - current.netAfterCostsMonthly) * 12,
    netPerHourDifference: next.netPerHourInclTravel - current.netPerHourInclTravel,
    travelHoursDifferenceMonthly: next.commute.travelHoursPerMonth - current.commute.travelHoursPerMonth,
    vacationDaysDifference: next.benefits.vacationDays - current.benefits.vacationDays,
    totalRewardDifferenceAnnual: next.totalRewardAnnual - current.totalRewardAnnual,
    unfilled,
  };
}
