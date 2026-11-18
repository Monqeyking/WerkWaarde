/**
 * Part time versus full time: what working more or fewer hours in a job brings
 * the household, after tax, toeslagen, childcare and work-related costs.
 *
 * A scenario keeps the job's hourly wage and changes only the hours. Office days
 * shrink when there are fewer working days; childcare days move along with the
 * working days (optional). The partner's income stays the same in every scenario,
 * so it is left out of the household amount: what counts is what this job adds.
 */
import { calculateJobTotal, workingDaysPerWeek } from "./job-total.ts";
import type { JobKey, JobProfile, NettoplaatjeState } from "./job-model.ts";

/** Full time when neither the user nor a cao says otherwise. */
const DEFAULT_FULL_TIME_HOURS = 40;
/** The hours table: these shares of the full-time week. */
const STEP_SHARES = [0.6, 0.7, 0.8, 0.9, 1] as const;
const MAX_CHILDCARE_DAYS = 5;

export type ScenarioOptions = {
  /** One working day less also means one opvangdag less (only when there is childcare). Default true. */
  childcareFollowsWorkDays?: boolean;
};

export type HoursScenario = {
  hoursPerWeek: number;
  workDaysPerWeek: number;
  officeDaysPerWeek: number;
  childcareDaysPerWeek: number;
  /** Monthly average of salary, holiday allowance, 13th month and bonus. */
  grossMonthly: number;
  pensionMonthly: number;
  taxMonthly: number;
  /** grossMonthly − pensionMonthly − taxMonthly. */
  netPayMonthly: number;
  /** Net effect of the mobility arrangement (lease, budget or own car). */
  mobilityMonthly: number;
  /** Parking, lunch and other office-day costs minus the thuiswerkvergoeding. */
  workCostsMonthly: number;
  childcareGrossMonthly: number;
  kinderopvangtoeslagMonthly: number;
  /** Childcare costs after kinderopvangtoeslag. */
  childcareNetMonthly: number;
  zorgtoeslagMonthly: number;
  kindgebondenBudgetMonthly: number;
  /** What this job adds to the household each month: net pay + mobility − work costs − childcare + toeslagen. */
  householdNetMonthly: number;
  /** householdNetMonthly per hour spent on the job, travel time included. */
  netPerHour: number;
  /** Null when toeslagen are not switched on. */
  toetsingsinkomen: number | null;
};

/** Full-time hours for the hours table: the cao or user value, otherwise 40 (or more if the contract is longer). */
export function fullTimeHoursFor(salary: Pick<JobProfile["salary"], "hoursPerWeek" | "fullTimeHours">) {
  return salary.fullTimeHours > 0 ? salary.fullTimeHours : Math.max(DEFAULT_FULL_TIME_HOURS, salary.hoursPerWeek);
}

/** The model as it would be if this job had `hours` per week at the same hourly wage. */
export function scenarioState(state: NettoplaatjeState, job: JobKey, hours: number, options: ScenarioOptions = {}): NettoplaatjeState {
  const profile = state.jobs[job];
  const { salary, commute } = profile;
  const ratio = salary.hoursPerWeek > 0 ? Math.max(0, hours) / salary.hoursPerWeek : 0;
  const workDays = workingDaysPerWeek(hours);
  const dayChange = workDays - workingDaysPerWeek(salary.hoursPerWeek);
  const followWork = options.childcareFollowsWorkDays ?? true;
  const childcareDays = profile.childcareDaysPerWeek > 0 && followWork
    ? Math.min(MAX_CHILDCARE_DAYS, Math.max(0, profile.childcareDaysPerWeek + dayChange))
    : profile.childcareDaysPerWeek;
  const scaled: JobProfile = {
    ...profile,
    salary: {
      ...salary,
      hoursPerWeek: Math.max(0, hours),
      grossMonthly: salary.grossMonthly * ratio,
      annualBonus: salary.annualBonus * ratio,
      // Monthly amounts from a payslip: pro rata is exact when the franchise scales with part time.
      pensionEmployeeMonthly: salary.pensionEmployeeMonthly * ratio,
      pensionEmployerMonthly: salary.pensionEmployerMonthly * ratio,
    },
    commute: { ...commute, officeDaysPerWeek: Math.min(commute.officeDaysPerWeek, workDays) },
    childcareDaysPerWeek: childcareDays,
  };
  return { ...state, jobs: { ...state.jobs, [job]: scaled } };
}

/** Everything this job brings the household at `hours` per week. */
export function hoursScenario(state: NettoplaatjeState, job: JobKey, hours: number, options: ScenarioOptions = {}): HoursScenario {
  const scenario = scenarioState(state, job, hours, options);
  const profile = scenario.jobs[job];
  const total = calculateJobTotal(scenario, job);
  const { allowances } = total;
  // The job total already uses the detailed childcare bill when toeslagen are on.
  const childcareGrossMonthly = total.commute.childcareMonthly;
  const kinderopvangtoeslagMonthly = allowances?.kinderopvangtoeslagMonthly ?? 0;
  const childcareNetMonthly = childcareGrossMonthly - kinderopvangtoeslagMonthly;
  const zorgtoeslagMonthly = allowances?.zorgtoeslagMonthly ?? 0;
  const kindgebondenBudgetMonthly = allowances?.kindgebondenBudgetMonthly ?? 0;
  const { income, commute } = total;
  const grossMonthly = income.grossMonthly + income.holidayMonthly + income.yearEndMonthly + income.bonusMonthly;
  const workCostsMonthly = commute.parkingMonthly + commute.lunchMonthly + commute.otherMonthly - commute.homeWorkAllowanceMonthly;
  const householdNetMonthly = total.netAfterCostsMonthly;
  const hoursSpent = total.workHoursPerMonth + commute.travelHoursPerMonth;
  return {
    hoursPerWeek: profile.salary.hoursPerWeek,
    workDaysPerWeek: workingDaysPerWeek(profile.salary.hoursPerWeek),
    officeDaysPerWeek: profile.commute.officeDaysPerWeek,
    childcareDaysPerWeek: profile.childcareDaysPerWeek,
    grossMonthly,
    pensionMonthly: income.pensionEmployeeMonthly,
    taxMonthly: income.taxMonthly,
    netPayMonthly: income.netPayMonthly,
    mobilityMonthly: total.mobility.netMonthly,
    workCostsMonthly,
    childcareGrossMonthly,
    kinderopvangtoeslagMonthly,
    childcareNetMonthly,
    zorgtoeslagMonthly,
    kindgebondenBudgetMonthly,
    householdNetMonthly,
    netPerHour: hoursSpent > 0 ? householdNetMonthly / hoursSpent : 0,
    toetsingsinkomen: allowances?.toetsingsinkomen ?? null,
  };
}

/** Hours for the table: 60% to 100% of full time in whole hours, plus the current contract hours. */
export function hoursSteps(state: NettoplaatjeState, job: JobKey): number[] {
  const { salary } = state.jobs[job];
  if (salary.hoursPerWeek <= 0) return [];
  const fullTime = fullTimeHoursFor(salary);
  const steps = STEP_SHARES.map((share) => Math.round(fullTime * share));
  return [...new Set([...steps, salary.hoursPerWeek])].sort((a, b) => a - b);
}

export function hoursTable(state: NettoplaatjeState, job: JobKey, options: ScenarioOptions = {}): HoursScenario[] {
  return hoursSteps(state, job).map((hours) => hoursScenario(state, job, hours, options));
}

export type ScenarioComparison = {
  fromHours: number;
  toHours: number;
  gross: number;
  pension: number;
  tax: number;
  mobility: number;
  workCosts: number;
  childcareGross: number;
  kinderopvangtoeslag: number;
  /** Zorgtoeslag + kindgebonden budget. */
  otherAllowances: number;
  /**
   * Change in what the household keeps. Adds up as
   * gross − pension − tax + mobility − workCosts − childcareGross + kinderopvangtoeslag + otherAllowances.
   */
  householdNet: number;
  /** Euros kept per extra euro gross (0–1 in normal cases); null when gross does not change. */
  keptPerEuro: number | null;
  /** 1 − keptPerEuro: the share lost to tax, lower toeslagen and extra costs. */
  marginalPressure: number | null;
};

/** Monthly change from one scenario to another (to − from), split into the parts of a waterfall. */
export function compareScenarios(from: HoursScenario, to: HoursScenario): ScenarioComparison {
  const gross = to.grossMonthly - from.grossMonthly;
  const householdNet = to.householdNetMonthly - from.householdNetMonthly;
  const keptPerEuro = Math.abs(gross) > 0.005 ? householdNet / gross : null;
  return {
    fromHours: from.hoursPerWeek,
    toHours: to.hoursPerWeek,
    gross,
    pension: to.pensionMonthly - from.pensionMonthly,
    tax: to.taxMonthly - from.taxMonthly,
    mobility: to.mobilityMonthly - from.mobilityMonthly,
    workCosts: to.workCostsMonthly - from.workCostsMonthly,
    childcareGross: to.childcareGrossMonthly - from.childcareGrossMonthly,
    kinderopvangtoeslag: to.kinderopvangtoeslagMonthly - from.kinderopvangtoeslagMonthly,
    otherAllowances: (to.zorgtoeslagMonthly + to.kindgebondenBudgetMonthly) - (from.zorgtoeslagMonthly + from.kindgebondenBudgetMonthly),
    householdNet,
    keptPerEuro,
    marginalPressure: keptPerEuro === null ? null : 1 - keptPerEuro,
  };
}
