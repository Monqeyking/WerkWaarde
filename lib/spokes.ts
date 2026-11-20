/**
 * Calculations for the single-topic calculator pages (bruto-netto, bijtelling,
 * kilometervergoeding, arbeidsvoorwaarden). They all read the shared model and
 * reuse calculateJobTotal, so every page agrees with the total overview.
 */
import { annualCarBenefit, incomeTax } from "./calculator.ts";
import { DEFAULT_TAX_YEAR, taxYear } from "./tax-years.ts";
import { expatLimit, taxableAfterExpat, type ExpatOption } from "./expat.ts";
import { calculateJobTotal } from "./job-total.ts";
import { toCalculatorInputs, type JobKey, type MobilityChoice, type NettoplaatjeState } from "./job-model.ts";

/** Weeks in a year, used to turn monthly pay into an hourly wage. */
const WEEKS_PER_YEAR = 52;
const HOURS_PER_WORKING_DAY = 8;

/** Share of an extra euro of income that goes to income tax (including the phase-out of tax credits). */
export function marginalRate(taxableAnnual: number, age: number, year = DEFAULT_TAX_YEAR) {
  const step = 100;
  return (incomeTax(taxableAnnual + step, age, year) - incomeTax(taxableAnnual, age, year)) / step;
}

function withMobilityChoice(state: NettoplaatjeState, job: JobKey, choice: MobilityChoice): NettoplaatjeState {
  const profile = state.jobs[job];
  return { ...state, jobs: { ...state.jobs, [job]: { ...profile, mobility: { ...profile.mobility, choice } } } };
}

/** Taxable salary income per year: the wage minus the tax-free expatregeling allowance. */
function salaryTaxableAnnual(state: NettoplaatjeState, job: JobKey) {
  const { income } = calculateJobTotal(withMobilityChoice(state, job, "none"), job);
  return (income.netPayMonthly + income.taxMonthly - income.expatAllowanceMonthly) * 12;
}

/**
 * Share of an extra euro of gross wage that goes to tax, with the expatregeling applied to
 * the new wage as well (without the regeling this equals marginalRate on the taxable income).
 */
function marginalRateOnWage(wageAnnual: number, expat: ExpatOption, age: number, year: number) {
  const step = 100;
  return (incomeTax(taxableAfterExpat(wageAnnual + step, expat, year), age, year) - incomeTax(taxableAfterExpat(wageAnnual, expat, year), age, year)) / step;
}

export type GrossToNet = {
  grossMonthly: number;
  pensionMonthly: number;
  /** Tax on a regular month (salary only, without holiday allowance or bonuses). */
  regularTaxMonthly: number;
  regularNetMonthly: number;
  holidayGrossAnnual: number;
  yearEndGrossAnnual: number;
  bonusGrossAnnual: number;
  /** Tax rate that applies to holiday allowance, 13th month and bonus. */
  extraTaxRate: number;
  holidayNetAnnual: number;
  yearEndNetAnnual: number;
  bonusNetAnnual: number;
  netAnnual: number;
  netMonthlyAverage: number;
  grossAnnual: number;
  /** Total income tax as a share of gross income. */
  effectiveRate: number;
  marginalRate: number;
  /** Gross raise needed for €100 more net per month. */
  grossFor100Net: number;
  netPerHour: number;
  /** Tax-free allowance per year under the expatregeling (0 without it). */
  expatAllowanceAnnual: number;
  /** The tax-free part of a regular month's salary under the expatregeling. */
  expatAllowanceRegularMonthly: number;
  /** Why the allowance is what it is: see expatLimit in lib/expat.ts. */
  expatLimit: ReturnType<typeof expatLimit>;
};

export function grossToNet(state: NettoplaatjeState, job: JobKey): GrossToNet {
  const total = calculateJobTotal(withMobilityChoice(state, job, "none"), job);
  const { income } = total;
  const age = state.personal.age;
  const year = state.personal.taxYear;
  const hoursPerWeek = state.jobs[job].salary.hoursPerWeek;

  const expat = state.jobs[job].salary.expatRuling;
  const wageAnnual = (income.netPayMonthly + income.taxMonthly) * 12;
  // Under the expatregeling the same share of every payment is tax-free.
  const taxableShare = wageAnnual > 0 ? 1 - income.expatAllowanceMonthly * 12 / wageAnnual : 1;
  const regularTaxableAnnual = Math.max(0, (income.grossMonthly - income.pensionEmployeeMonthly) * 12) * taxableShare;
  const regularTax = incomeTax(regularTaxableAnnual, age, year);
  const totalTax = income.taxMonthly * 12;

  const holidayGrossAnnual = income.holidayMonthly * 12;
  const yearEndGrossAnnual = income.yearEndMonthly * 12;
  const bonusGrossAnnual = income.bonusMonthly * 12;
  const extraGross = holidayGrossAnnual + yearEndGrossAnnual + bonusGrossAnnual;
  const extraTax = Math.max(0, totalTax - regularTax);
  const extraTaxRate = extraGross > 0 ? extraTax / extraGross : marginalRate(regularTaxableAnnual, age, year);
  const grossAnnual = income.grossMonthly * 12 + extraGross;
  const rate = marginalRateOnWage(wageAnnual, expat, age, year);
  const regularNetMonthly = income.grossMonthly - income.pensionEmployeeMonthly - regularTax / 12;

  return {
    grossMonthly: income.grossMonthly,
    pensionMonthly: income.pensionEmployeeMonthly,
    regularTaxMonthly: regularTax / 12,
    regularNetMonthly,
    holidayGrossAnnual,
    yearEndGrossAnnual,
    bonusGrossAnnual,
    extraTaxRate,
    holidayNetAnnual: holidayGrossAnnual * (1 - extraTaxRate),
    yearEndNetAnnual: yearEndGrossAnnual * (1 - extraTaxRate),
    bonusNetAnnual: bonusGrossAnnual * (1 - extraTaxRate),
    netAnnual: income.netPayMonthly * 12,
    netMonthlyAverage: income.netPayMonthly,
    grossAnnual,
    effectiveRate: grossAnnual > 0 ? totalTax / grossAnnual : 0,
    marginalRate: rate,
    grossFor100Net: rate < 1 ? 100 / (1 - rate) : 0,
    netPerHour: hoursPerWeek > 0 ? regularNetMonthly * 12 / (hoursPerWeek * WEEKS_PER_YEAR) : 0,
    expatAllowanceAnnual: income.expatAllowanceMonthly * 12,
    expatAllowanceRegularMonthly: Math.max(0, income.grossMonthly - income.pensionEmployeeMonthly) * (1 - taxableShare),
    expatLimit: expatLimit(wageAnnual, expat, year),
  };
}

export type LeaseCost = {
  catalogValue: number;
  isElectric: boolean;
  annualBenefit: number;
  /** Bijtelling as a share of the catalogue value (blended for electric cars above the cap). */
  benefitRate: number;
  contributionMonthly: number;
  taxableBenefitMonthly: number;
  taxMonthly: number;
  /** What the car costs you net each month: tax on the benefit plus your own contribution. */
  netCostMonthly: number;
  netCostAnnual: number;
  marginalRate: number;
};

export function leaseCost(state: NettoplaatjeState, job: JobKey): LeaseCost {
  const leaseState = withMobilityChoice(state, job, "lease");
  const { lease } = state.jobs[job].mobility;
  const total = calculateJobTotal(leaseState, job);
  const annualBenefit = annualCarBenefit(lease.catalogValue, lease.isElectric, lease.benefitRatePct, state.personal.taxYear);
  const contributionAnnual = lease.employeeContributionMonthly * 12;
  return {
    catalogValue: lease.catalogValue,
    isElectric: lease.isElectric,
    annualBenefit,
    benefitRate: lease.catalogValue > 0 ? annualBenefit / lease.catalogValue : 0,
    contributionMonthly: lease.employeeContributionMonthly,
    taxableBenefitMonthly: Math.max(0, annualBenefit - contributionAnnual) / 12,
    taxMonthly: total.mobility.taxMonthly,
    netCostMonthly: -total.mobility.netMonthly,
    netCostAnnual: -total.mobility.netMonthly * 12,
    marginalRate: marginalRate(salaryTaxableAnnual(state, job), state.personal.age, state.personal.taxYear),
  };
}

export type KmAllowance = {
  commuteKmAnnual: number;
  extraKmAnnual: number;
  kmAnnual: number;
  ratePerKm: number;
  reimbursementAnnual: number;
  taxFreeAnnual: number;
  taxableAnnual: number;
  taxAnnual: number;
  /** Energy plus other variable costs per km (fuel or charging, maintenance, tyres). */
  costPerKm: number;
  costAnnual: number;
  /** Reimbursement after tax, minus the car costs of the reimbursed km. */
  netAnnual: number;
  netMonthly: number;
  /** Rate per km at which the reimbursement exactly covers the car costs after tax. */
  breakEvenRate: number;
};

export function kmAllowance(state: NettoplaatjeState, job: JobKey): KmAllowance {
  const inputs = toCalculatorInputs(state, job);
  const { mobility } = state.jobs[job];
  const { car } = state.personal;
  const kmAnnual = Math.max(0, inputs.businessKm);
  const extraKmAnnual = Math.max(0, mobility.extraBusinessKmPerYear);
  const rate = Math.max(0, mobility.reimbursementPerKm);
  const { age, taxYear: year } = state.personal;
  const kmLimit = taxYear(year).taxFreeKmRate;
  const taxableAnnual = kmAnnual * Math.max(0, rate - kmLimit);
  const baseTaxable = salaryTaxableAnnual(state, job);
  const taxAnnual = Math.max(0, incomeTax(baseTaxable + taxableAnnual, age, year) - incomeTax(baseTaxable, age, year));
  const energyPerKm = car.isElectric ? car.electricConsumption * car.electricityPrice / 100 : car.fuelConsumption * car.fuelPrice / 100;
  const costPerKm = energyPerKm + Math.max(0, car.otherCostPerKm);
  const reimbursementAnnual = kmAnnual * rate;
  const costAnnual = kmAnnual * costPerKm;
  const netAnnual = reimbursementAnnual - taxAnnual - costAnnual;
  const rateAboveLimit = marginalRate(baseTaxable, age, year);
  const breakEvenRate = costPerKm <= kmLimit
    ? costPerKm
    : kmLimit + (costPerKm - kmLimit) / Math.max(0.01, 1 - rateAboveLimit);
  return {
    commuteKmAnnual: kmAnnual - extraKmAnnual,
    extraKmAnnual,
    kmAnnual,
    ratePerKm: rate,
    reimbursementAnnual,
    taxFreeAnnual: kmAnnual * Math.min(rate, kmLimit),
    taxableAnnual,
    taxAnnual,
    costPerKm,
    costAnnual,
    netAnnual,
    netMonthly: netAnnual / 12,
    breakEvenRate,
  };
}

export type RewardItem = { key: string; label: string; annual: number };

export type TotalReward = {
  items: RewardItem[];
  totalAnnual: number;
  daysPerWeek: number;
  legalMinimumVacationDays: number;
  extraVacationDays: number;
  dayWage: number;
  grossPerHour: number;
  totalPerHour: number;
  /** Share of the total reward that is not the fixed monthly salary. */
  extrasShare: number;
};

export function totalReward(state: NettoplaatjeState, job: JobKey): TotalReward {
  const total = calculateJobTotal(state, job);
  const { salary, benefits } = state.jobs[job];
  const hoursPerWeek = Math.max(0, salary.hoursPerWeek);
  const daysPerWeek = Math.min(5, hoursPerWeek / HOURS_PER_WORKING_DAY);
  // Dutch law: at least four times the number of working days per week.
  const legalMinimumVacationDays = 4 * daysPerWeek;
  const extraVacationDays = Math.max(0, benefits.vacationDays - legalMinimumVacationDays);
  const baseAnnual = salary.grossMonthly * 12;
  const dayWage = daysPerWeek > 0 ? baseAnnual / (WEEKS_PER_YEAR * daysPerWeek) : 0;

  const items: RewardItem[] = [
    { key: "salary", label: "Bruto salaris", annual: baseAnnual },
    { key: "holiday", label: "Vakantiegeld", annual: total.income.holidayMonthly * 12 },
    { key: "yearEnd", label: "13e maand / eindejaarsuitkering", annual: total.income.yearEndMonthly * 12 },
    { key: "bonus", label: "Bonus", annual: total.income.bonusMonthly * 12 },
    { key: "pension", label: "Pensioenbijdrage werkgever", annual: total.benefits.employerPensionMonthly * 12 },
    { key: "training", label: "Opleidingsbudget", annual: benefits.trainingBudgetAnnual },
    { key: "other", label: "Overige vergoedingen", annual: benefits.otherAnnual },
    { key: "vacation", label: "Extra vakantiedagen boven wettelijk minimum", annual: extraVacationDays * dayWage },
  ];
  const totalAnnual = items.reduce((sum, item) => sum + item.annual, 0);
  const annualHours = hoursPerWeek * WEEKS_PER_YEAR;
  return {
    items,
    totalAnnual,
    daysPerWeek,
    legalMinimumVacationDays,
    extraVacationDays,
    dayWage,
    grossPerHour: annualHours > 0 ? baseAnnual / annualHours : 0,
    totalPerHour: annualHours > 0 ? totalAnnual / annualHours : 0,
    extrasShare: totalAnnual > 0 ? 1 - baseAnnual / totalAnnual : 0,
  };
}
