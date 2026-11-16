/**
 * Shared data model for Nettoplaatje.
 *
 * Every calculator page fills part of the same object: personal settings plus a
 * "current" and a "next" job. The total overview reads all of it. Keeping one
 * source of truth means the user never enters the same value twice and the
 * pages can never disagree.
 *
 * This module is framework-free so it can be unit tested with `node --test`.
 */
import type { CalculatorInputs } from "./calculator.ts";
import type { WorkPatternInputs } from "./work-costs.ts";

export const MODEL_VERSION = 1;
export const STORAGE_KEY = "nettoplaatje:v1";
export const SHARE_PARAM = "p";

export type JobKey = "current" | "next";
export const JOB_KEYS: JobKey[] = ["current", "next"];

/** Parts of a job that a calculator page can fill in. */
export type SectionKey = "salary" | "mobility" | "commute" | "benefits";
export const SECTION_KEYS: SectionKey[] = ["salary", "mobility", "commute", "benefits"];

export type MobilityChoice = "none" | "lease" | "mobilityBudget" | "ownCar";
const MOBILITY_CHOICES: MobilityChoice[] = ["none", "lease", "mobilityBudget", "ownCar"];
const PENSION_MODES: Array<JobProfile["salary"]["pensionMode"]> = ["monthly", "scheme"];

/** Things about the person, the same for both jobs. */
export type PersonalSettings = {
  age: number;
  taxYear: number;
  workWeeksPerYear: number;
  car: {
    isElectric: boolean;
    fuelConsumption: number;
    fuelPrice: number;
    electricConsumption: number;
    electricityPrice: number;
    /** Maintenance, insurance and road tax per km; excludes energy and depreciation. */
    otherCostPerKm: number;
    /** Variable costs only (tyres, maintenance): used for extra commuting km. */
    variableCostPerKm: number;
    includeDepreciation: boolean;
    depreciationMonthly: number;
    privateKmPerYear: number;
  };
  childcareCostPerDay: number;
  timeValue: { include: boolean; perHour: number };
};

export type JobProfile = {
  salary: {
    grossMonthly: number;
    hoursPerWeek: number;
    holidayAllowancePct: number;
    /** 13th month / end-of-year bonus as % of annual base salary. */
    yearEndBonusPct: number;
    annualBonus: number;
    pensionMode: "monthly" | "scheme";
    pensionEmployeeMonthly: number;
    pensionEmployerMonthly: number;
    pensionTotalRatePct: number;
    pensionEmployeeSharePct: number;
    pensionFranchise: number;
    pensionIncludesHoliday: boolean;
  };
  mobility: {
    choice: MobilityChoice;
    leaseBudget: number;
    mobilityBudget: number;
    lease: {
      catalogValue: number;
      isElectric: boolean;
      benefitRatePct: number;
      employeeContributionMonthly: number;
    };
    reimbursementPerKm: number;
    /** Business trips on top of commuting, per year. */
    extraBusinessKmPerYear: number;
    mix: { ownCar: boolean; publicTransport: boolean; bike: boolean; sharedCar: boolean };
    publicTransportMonthly: number;
    bikeMonthly: number;
    sharedCarMonthly: number;
  };
  commute: {
    officeDaysPerWeek: number;
    oneWayKm: number;
    oneWayMinutes: number;
    parkingPerOfficeDay: number;
    lunchPerOfficeDay: number;
    otherPerOfficeDay: number;
    homeWorkAllowancePerDay: number;
  };
  benefits: {
    vacationDays: number;
    trainingBudgetAnnual: number;
    otherAnnual: number;
  };
  childcareDaysPerWeek: number;
};

export type NettoplaatjeState = {
  version: typeof MODEL_VERSION;
  personal: PersonalSettings;
  jobs: Record<JobKey, JobProfile>;
  /** Which sections the user has actually filled in, so the total can show "not filled" instead of €0. */
  filled: Record<JobKey, Record<SectionKey, boolean>>;
};

const defaultJob = (officeDaysPerWeek: number): JobProfile => ({
  salary: {
    grossMonthly: 4500, hoursPerWeek: 40, holidayAllowancePct: 8, yearEndBonusPct: 0, annualBonus: 0,
    pensionMode: "monthly", pensionEmployeeMonthly: 0, pensionEmployerMonthly: 0,
    pensionTotalRatePct: 20, pensionEmployeeSharePct: 33.33, pensionFranchise: 19172, pensionIncludesHoliday: true,
  },
  mobility: {
    choice: "ownCar", leaseBudget: 625, mobilityBudget: 850,
    lease: { catalogValue: 40000, isElectric: false, benefitRatePct: 22, employeeContributionMonthly: 70 },
    reimbursementPerKm: 0.25, extraBusinessKmPerYear: 0,
    mix: { ownCar: true, publicTransport: false, bike: false, sharedCar: false },
    publicTransportMonthly: 0, bikeMonthly: 0, sharedCarMonthly: 0,
  },
  commute: {
    officeDaysPerWeek, oneWayKm: 25, oneWayMinutes: 45,
    parkingPerOfficeDay: 0, lunchPerOfficeDay: 8, otherPerOfficeDay: 0, homeWorkAllowancePerDay: 0,
  },
  benefits: { vacationDays: 25, trainingBudgetAnnual: 0, otherAnnual: 0 },
  childcareDaysPerWeek: 0,
});

const noneFilled = (): Record<SectionKey, boolean> => ({ salary: false, mobility: false, commute: false, benefits: false });

export function createDefaultState(): NettoplaatjeState {
  return {
    version: MODEL_VERSION,
    personal: {
      age: 35, taxYear: 2026, workWeeksPerYear: 46,
      car: {
        isElectric: false, fuelConsumption: 7.5, fuelPrice: 2, electricConsumption: 18, electricityPrice: 0.3,
        otherCostPerKm: 0.15, variableCostPerKm: 0.08, includeDepreciation: false, depreciationMonthly: 0, privateKmPerYear: 10000,
      },
      childcareCostPerDay: 0,
      timeValue: { include: false, perHour: 0 },
    },
    jobs: { current: defaultJob(1), next: defaultJob(4) },
    filled: { current: noneFilled(), next: noneFilled() },
  };
}

type Plain = Record<string, unknown>;
const isPlainObject = (value: unknown): value is Plain =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Overlay untrusted input (localStorage, a shared URL) on a known-good template.
 * Only keys that exist in the template are taken, and only with the same type;
 * numbers must be finite and non-negative. Anything else falls back to the template.
 */
function overlay<T>(template: T, input: unknown): T {
  if (isPlainObject(template)) {
    const source = isPlainObject(input) ? input : {};
    const result: Plain = {};
    for (const [key, value] of Object.entries(template)) result[key] = overlay(value, source[key]);
    return result as T;
  }
  if (typeof template === "number") {
    return (typeof input === "number" && Number.isFinite(input) ? Math.max(0, input) : template) as T;
  }
  if (typeof template === "boolean" || typeof template === "string") {
    return (typeof input === typeof template ? input : template) as T;
  }
  return template;
}

/** Turn anything (possibly malformed or from an older version) into a valid state. */
export function sanitizeState(input: unknown): NettoplaatjeState {
  const state = overlay(createDefaultState(), input);
  state.version = MODEL_VERSION;
  for (const key of JOB_KEYS) {
    const job = state.jobs[key];
    if (!MOBILITY_CHOICES.includes(job.mobility.choice)) job.mobility.choice = "ownCar";
    if (!PENSION_MODES.includes(job.salary.pensionMode)) job.salary.pensionMode = "monthly";
    job.commute.officeDaysPerWeek = Math.min(7, job.commute.officeDaysPerWeek);
    job.childcareDaysPerWeek = Math.min(7, job.childcareDaysPerWeek);
    job.salary.pensionEmployeeSharePct = Math.min(100, job.salary.pensionEmployeeSharePct);
  }
  state.personal.workWeeksPerYear = Math.min(52, state.personal.workWeeksPerYear);
  return state;
}

/** Only the leaves that differ from `template`, so shared links stay short. */
function diff(template: unknown, value: unknown): unknown {
  if (isPlainObject(template) && isPlainObject(value)) {
    const result: Plain = {};
    for (const key of Object.keys(template)) {
      const child = diff(template[key], value[key]);
      if (child !== undefined) result[key] = child;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }
  return Object.is(template, value) ? undefined : value;
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string) {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Compact, URL-safe encoding of the state (only values that differ from the defaults). */
export function encodeState(state: NettoplaatjeState): string {
  const changes = diff(createDefaultState(), state) ?? {};
  return toBase64Url(JSON.stringify(changes));
}

/** Decode a shared link. Returns null for anything that is not a valid encoding. */
export function decodeState(encoded: string): NettoplaatjeState | null {
  try {
    return sanitizeState(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return null;
  }
}

/** Minimal Storage interface so tests can pass a fake. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadState(storage: KeyValueStorage | undefined): NettoplaatjeState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : createDefaultState();
  } catch {
    // Private mode, blocked storage or corrupt JSON: start fresh.
    return createDefaultState();
  }
}

export function saveState(storage: KeyValueStorage | undefined, state: NettoplaatjeState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; the calculator keeps working in memory.
  }
}

/** Update one section of one job and mark it as filled in. */
export function updateJobSection<S extends SectionKey>(
  state: NettoplaatjeState,
  job: JobKey,
  section: S,
  patch: Partial<JobProfile[S]>,
): NettoplaatjeState {
  return {
    ...state,
    jobs: { ...state.jobs, [job]: { ...state.jobs[job], [section]: { ...state.jobs[job][section], ...patch } } },
    filled: { ...state.filled, [job]: { ...state.filled[job], [section]: true } },
  };
}

export function updateJob(state: NettoplaatjeState, job: JobKey, patch: Partial<JobProfile>): NettoplaatjeState {
  return { ...state, jobs: { ...state.jobs, [job]: { ...state.jobs[job], ...patch } } };
}

export function updatePersonal(state: NettoplaatjeState, patch: Partial<PersonalSettings>): NettoplaatjeState {
  return { ...state, personal: { ...state.personal, ...patch } };
}

/** "Same as current job" for one section of the new job. */
export function copySectionToNext(state: NettoplaatjeState, section: SectionKey): NettoplaatjeState {
  return updateJobSection(state, "next", section, structuredClone(state.jobs.current[section]));
}

/** Office days per month, averaged over the year. */
export function officeDaysPerMonth(state: NettoplaatjeState, job: JobKey) {
  return state.jobs[job].commute.officeDaysPerWeek * state.personal.workWeeksPerYear / 12;
}

/** Home–work kilometres per year (return trips). */
export function commuteKmPerYear(state: NettoplaatjeState, job: JobKey) {
  const { officeDaysPerWeek, oneWayKm } = state.jobs[job].commute;
  return officeDaysPerWeek * state.personal.workWeeksPerYear * oneWayKm * 2;
}

/** Inputs for the existing mobility/salary calculator, for one job. */
export function toCalculatorInputs(state: NettoplaatjeState, job: JobKey): CalculatorInputs {
  const { salary, mobility } = state.jobs[job];
  const { car } = state.personal;
  return {
    salary: salary.grossMonthly,
    holidayAllowance: salary.holidayAllowancePct,
    pensionInputMode: salary.pensionMode,
    pensionEmployeeMonthly: salary.pensionEmployeeMonthly,
    pensionEmployerMonthly: salary.pensionEmployerMonthly,
    pensionTotalRate: salary.pensionTotalRatePct,
    pensionEmployeeShare: salary.pensionEmployeeSharePct,
    pensionFranchise: salary.pensionFranchise,
    pensionIncludesHoliday: salary.pensionIncludesHoliday,
    age: state.personal.age,
    leaseBudget: mobility.leaseBudget,
    mobilityBudget: mobility.mobilityBudget,
    carValue: mobility.lease.catalogValue,
    benefitRate: mobility.lease.benefitRatePct,
    employeeContribution: mobility.lease.employeeContributionMonthly,
    leaseIsElectric: mobility.lease.isElectric,
    businessKm: commuteKmPerYear(state, job) + mobility.extraBusinessKmPerYear,
    privateKm: car.privateKmPerYear,
    reimbursementRate: mobility.reimbursementPerKm,
    mobilityUsesOwnCar: mobility.mix.ownCar,
    mobilityUsesPublicTransport: mobility.mix.publicTransport,
    publicTransportMonthly: mobility.publicTransportMonthly,
    mobilityUsesBike: mobility.mix.bike,
    bikeMonthly: mobility.bikeMonthly,
    mobilityUsesSharedCar: mobility.mix.sharedCar,
    sharedCarMonthly: mobility.sharedCarMonthly,
    ownCarIsElectric: car.isElectric,
    fuelConsumption: car.fuelConsumption,
    fuelPrice: car.fuelPrice,
    electricConsumption: car.electricConsumption,
    electricityPrice: car.electricityPrice,
    otherCarCostRate: car.otherCostPerKm,
    includeDepreciation: car.includeDepreciation,
    depreciationMonthly: car.depreciationMonthly,
    taxYear: state.personal.taxYear,
  };
}

/** Inputs for the existing work-pattern calculator (current vs next job). */
export function toWorkPatternInputs(state: NettoplaatjeState): WorkPatternInputs {
  const { current, next } = state.jobs;
  const { personal } = state;
  return {
    currentGrossSalary: current.salary.grossMonthly,
    newGrossSalary: next.salary.grossMonthly,
    currentPensionMonthly: current.salary.pensionEmployeeMonthly,
    newPensionMonthly: next.salary.pensionEmployeeMonthly,
    age: personal.age,
    holidayAllowance: current.salary.holidayAllowancePct,
    currentOfficeDays: current.commute.officeDaysPerWeek,
    newOfficeDays: next.commute.officeDaysPerWeek,
    currentChildcareDays: current.childcareDaysPerWeek,
    newChildcareDays: next.childcareDaysPerWeek,
    workWeeksPerYear: personal.workWeeksPerYear,
    currentOneWayKm: current.commute.oneWayKm,
    newOneWayKm: next.commute.oneWayKm,
    currentCommuteMinutesOneWay: current.commute.oneWayMinutes,
    newCommuteMinutesOneWay: next.commute.oneWayMinutes,
    currentReimbursementRate: current.mobility.reimbursementPerKm,
    newReimbursementRate: next.mobility.reimbursementPerKm,
    fuelConsumption: personal.car.fuelConsumption,
    fuelPrice: personal.car.fuelPrice,
    ownCarIsElectric: personal.car.isElectric,
    electricConsumption: personal.car.electricConsumption,
    electricityPrice: personal.car.electricityPrice,
    otherVariableCostRate: personal.car.variableCostPerKm,
    currentParkingPerOfficeDay: current.commute.parkingPerOfficeDay,
    newParkingPerOfficeDay: next.commute.parkingPerOfficeDay,
    currentLunchPerOfficeDay: current.commute.lunchPerOfficeDay,
    newLunchPerOfficeDay: next.commute.lunchPerOfficeDay,
    childcareCostPerDay: personal.childcareCostPerDay,
    currentOtherOfficeCostPerDay: current.commute.otherPerOfficeDay,
    newOtherOfficeCostPerDay: next.commute.otherPerOfficeDay,
    includeTimeValue: personal.timeValue.include,
    timeValuePerHour: personal.timeValue.perHour,
  };
}
