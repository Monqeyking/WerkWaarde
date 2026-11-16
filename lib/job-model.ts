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
import { findCao } from "./caos.ts";
import { DEFAULT_TAX_YEAR, selectableTaxYears } from "./tax-years.ts";
import type { WorkPatternInputs } from "./work-costs.ts";

export const MODEL_VERSION = 1;
export const STORAGE_KEY = "nettoplaatje:v1";
export const SHARE_PARAM = "p";
/** No calculator input is meaningful above this; caps absurd values from shared links. */
export const MAX_INPUT = 10_000_000;
/** Longer encodings are ignored instead of parsed. */
const MAX_SHARE_LENGTH = 4_000;

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
    /** Pension fund's cap on pensionable salary per year; 0 = only the fiscal maximum. */
    pensionMaxSalary: number;
    /** Cao the conditions were prefilled from; empty when filled in by hand. */
    caoId: string;
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
    pensionTotalRatePct: 20, pensionEmployeeSharePct: 33.33, pensionFranchise: 19172, pensionIncludesHoliday: true, pensionMaxSalary: 0, caoId: "",
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
      age: 35, taxYear: DEFAULT_TAX_YEAR, workWeeksPerYear: 46,
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
    return (typeof input === "number" && Number.isFinite(input) ? Math.min(MAX_INPUT, Math.max(0, input)) : template) as T;
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
    if (!findCao(job.salary.caoId)) job.salary.caoId = "";
  }
  state.personal.workWeeksPerYear = Math.min(52, state.personal.workWeeksPerYear);
  // Only years the interface offers; an unpublished or unknown year falls back to the default.
  if (!selectableTaxYears().includes(state.personal.taxYear)) state.personal.taxYear = DEFAULT_TAX_YEAR;
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
  if (encoded.length > MAX_SHARE_LENGTH) return null;
  try {
    return sanitizeState(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return null;
  }
}

/**
 * Shared inputs travel in the URL fragment (#p=...). Browsers never send the
 * fragment to a server, so amounts stay out of hosting logs and referrers.
 * Older links used the query string (?p=...); those still work.
 */
export function shareHash(state: NettoplaatjeState) {
  return `#${SHARE_PARAM}=${encodeState(state)}`;
}

/** The encoded shared state in a URL, from the fragment or (older links) the query. */
export function readSharedParam(url: URL): string | null {
  const fromHash = new URLSearchParams(url.hash.replace(/^#/, "")).get(SHARE_PARAM);
  return fromHash || url.searchParams.get(SHARE_PARAM);
}

/** The same URL without any shared state, for the address bar. */
export function withoutSharedParam(url: URL): URL {
  const clean = new URL(url);
  clean.searchParams.delete(SHARE_PARAM);
  clean.hash = "";
  return clean;
}

/** Fragment key the amount pages use to open the calculator with a gross salary (#bruto=3500). */
export const PREFILL_GROSS_PARAM = "bruto";

/** The monthly gross salary in a prefill link, or null when there is none or it is not a sensible amount. */
export function readPrefillGross(url: URL): number | null {
  const raw = new URLSearchParams(url.hash.replace(/^#/, "")).get(PREFILL_GROSS_PARAM);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 && value <= MAX_INPUT ? Math.round(value) : null;
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

/**
 * Where each calculator field lives in the shared model. Used to write edits
 * from the stand-alone calculators back into the model, so every page and the
 * total stay in sync.
 */
type ModelPath =
  | { scope: "job"; section: SectionKey; key: string; group?: "lease" | "mix"; extra?: Record<string, unknown> }
  | { scope: "job-root"; key: "childcareDaysPerWeek"; marks: SectionKey }
  | { scope: "personal"; key: string; group?: "car" | "timeValue" };

const salaryPath = (key: string, extra?: Record<string, unknown>): ModelPath => ({ scope: "job", section: "salary", key, extra });
const mobilityPath = (key: string, group?: "lease" | "mix"): ModelPath => ({ scope: "job", section: "mobility", key, group });
const commutePath = (key: string): ModelPath => ({ scope: "job", section: "commute", key });
const personalPath = (key: string, group?: "car" | "timeValue"): ModelPath => ({ scope: "personal", key, group });

const CALCULATOR_PATHS: Record<Exclude<keyof CalculatorInputs, "businessKm">, ModelPath> = {
  salary: salaryPath("grossMonthly"),
  holidayAllowance: salaryPath("holidayAllowancePct"),
  pensionInputMode: salaryPath("pensionMode"),
  pensionEmployeeMonthly: salaryPath("pensionEmployeeMonthly"),
  pensionEmployerMonthly: salaryPath("pensionEmployerMonthly"),
  pensionTotalRate: salaryPath("pensionTotalRatePct"),
  pensionEmployeeShare: salaryPath("pensionEmployeeSharePct"),
  pensionFranchise: salaryPath("pensionFranchise"),
  pensionIncludesHoliday: salaryPath("pensionIncludesHoliday"),
  pensionMaxSalary: salaryPath("pensionMaxSalary"),
  age: personalPath("age"),
  taxYear: personalPath("taxYear"),
  leaseBudget: mobilityPath("leaseBudget"),
  mobilityBudget: mobilityPath("mobilityBudget"),
  carValue: mobilityPath("catalogValue", "lease"),
  benefitRate: mobilityPath("benefitRatePct", "lease"),
  employeeContribution: mobilityPath("employeeContributionMonthly", "lease"),
  leaseIsElectric: mobilityPath("isElectric", "lease"),
  reimbursementRate: mobilityPath("reimbursementPerKm"),
  mobilityUsesOwnCar: mobilityPath("ownCar", "mix"),
  mobilityUsesPublicTransport: mobilityPath("publicTransport", "mix"),
  mobilityUsesBike: mobilityPath("bike", "mix"),
  mobilityUsesSharedCar: mobilityPath("sharedCar", "mix"),
  publicTransportMonthly: mobilityPath("publicTransportMonthly"),
  bikeMonthly: mobilityPath("bikeMonthly"),
  sharedCarMonthly: mobilityPath("sharedCarMonthly"),
  privateKm: personalPath("privateKmPerYear", "car"),
  ownCarIsElectric: personalPath("isElectric", "car"),
  fuelConsumption: personalPath("fuelConsumption", "car"),
  fuelPrice: personalPath("fuelPrice", "car"),
  electricConsumption: personalPath("electricConsumption", "car"),
  electricityPrice: personalPath("electricityPrice", "car"),
  otherCarCostRate: personalPath("otherCostPerKm", "car"),
  includeDepreciation: personalPath("includeDepreciation", "car"),
  depreciationMonthly: personalPath("depreciationMonthly", "car"),
};

type WorkPatternPath = { job: JobKey | null; path: ModelPath };
const forJob = (job: JobKey, path: ModelPath): WorkPatternPath => ({ job, path });
const shared = (path: ModelPath): WorkPatternPath => ({ job: null, path });

const WORK_PATTERN_PATHS: Record<keyof WorkPatternInputs, WorkPatternPath> = {
  currentGrossSalary: forJob("current", salaryPath("grossMonthly")),
  newGrossSalary: forJob("next", salaryPath("grossMonthly")),
  currentPensionMonthly: forJob("current", salaryPath("pensionEmployeeMonthly", { pensionMode: "monthly" })),
  newPensionMonthly: forJob("next", salaryPath("pensionEmployeeMonthly", { pensionMode: "monthly" })),
  age: shared(personalPath("age")),
  holidayAllowance: forJob("current", salaryPath("holidayAllowancePct")),
  currentOfficeDays: forJob("current", commutePath("officeDaysPerWeek")),
  newOfficeDays: forJob("next", commutePath("officeDaysPerWeek")),
  currentChildcareDays: forJob("current", { scope: "job-root", key: "childcareDaysPerWeek", marks: "commute" }),
  newChildcareDays: forJob("next", { scope: "job-root", key: "childcareDaysPerWeek", marks: "commute" }),
  workWeeksPerYear: shared(personalPath("workWeeksPerYear")),
  currentOneWayKm: forJob("current", commutePath("oneWayKm")),
  newOneWayKm: forJob("next", commutePath("oneWayKm")),
  currentCommuteMinutesOneWay: forJob("current", commutePath("oneWayMinutes")),
  newCommuteMinutesOneWay: forJob("next", commutePath("oneWayMinutes")),
  currentReimbursementRate: forJob("current", mobilityPath("reimbursementPerKm")),
  newReimbursementRate: forJob("next", mobilityPath("reimbursementPerKm")),
  fuelConsumption: shared(personalPath("fuelConsumption", "car")),
  fuelPrice: shared(personalPath("fuelPrice", "car")),
  ownCarIsElectric: shared(personalPath("isElectric", "car")),
  electricConsumption: shared(personalPath("electricConsumption", "car")),
  electricityPrice: shared(personalPath("electricityPrice", "car")),
  otherVariableCostRate: shared(personalPath("variableCostPerKm", "car")),
  currentParkingPerOfficeDay: forJob("current", commutePath("parkingPerOfficeDay")),
  newParkingPerOfficeDay: forJob("next", commutePath("parkingPerOfficeDay")),
  currentLunchPerOfficeDay: forJob("current", commutePath("lunchPerOfficeDay")),
  newLunchPerOfficeDay: forJob("next", commutePath("lunchPerOfficeDay")),
  childcareCostPerDay: shared(personalPath("childcareCostPerDay")),
  currentOtherOfficeCostPerDay: forJob("current", commutePath("otherPerOfficeDay")),
  newOtherOfficeCostPerDay: forJob("next", commutePath("otherPerOfficeDay")),
  includeTimeValue: shared(personalPath("include", "timeValue")),
  timeValuePerHour: shared(personalPath("perHour", "timeValue")),
};

type Value = number | boolean | string;

function applyPath(state: NettoplaatjeState, job: JobKey, path: ModelPath, value: Value): NettoplaatjeState {
  if (path.scope === "personal") {
    const patch = path.group
      ? { [path.group]: { ...state.personal[path.group], [path.key]: value } }
      : { [path.key]: value };
    return updatePersonal(state, patch as Partial<PersonalSettings>);
  }
  if (path.scope === "job-root") {
    const updated = updateJob(state, job, { [path.key]: value } as Partial<JobProfile>);
    return { ...updated, filled: { ...updated.filled, [job]: { ...updated.filled[job], [path.marks]: true } } };
  }
  const section = state.jobs[job][path.section] as Record<string, unknown>;
  const patch = path.group
    ? { [path.group]: { ...(section[path.group] as Record<string, unknown>), [path.key]: value } }
    : { [path.key]: value, ...path.extra };
  return updateJobSection(state, job, path.section, patch as Partial<JobProfile[SectionKey]>);
}

/** Write one field of the mobility/salary calculator back into the model. */
export function applyCalculatorInput<K extends keyof CalculatorInputs>(
  state: NettoplaatjeState,
  job: JobKey,
  key: K,
  value: CalculatorInputs[K],
): NettoplaatjeState {
  if (key === "businessKm") {
    // Business km are derived: commuting km + extra trips. Store the part above commuting.
    const extra = Math.max(0, (value as number) - commuteKmPerYear(state, job));
    return updateJobSection(state, job, "mobility", { extraBusinessKmPerYear: extra });
  }
  return applyPath(state, job, CALCULATOR_PATHS[key as Exclude<keyof CalculatorInputs, "businessKm">], value as Value);
}

/** Write one field of the work-pattern calculator back into the model. */
export function applyWorkPatternInput<K extends keyof WorkPatternInputs>(
  state: NettoplaatjeState,
  key: K,
  value: WorkPatternInputs[K],
): NettoplaatjeState {
  const target = WORK_PATTERN_PATHS[key];
  return applyPath(state, target.job ?? "current", target.path, value as Value);
}

/** Map the mobility calculator's scenario names to the model's choices. */
export const SCENARIO_TO_CHOICE = { lease: "lease", mobility: "mobilityBudget", ownCar: "ownCar" } as const satisfies Record<string, MobilityChoice>;

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
    pensionMaxSalary: salary.pensionMaxSalary,
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
