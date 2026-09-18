export type CalculatorInputs = {
  salary: number;
  holidayAllowance: number;
  pensionInputMode: "monthly" | "scheme";
  pensionEmployeeMonthly: number;
  pensionEmployerMonthly: number;
  pensionTotalRate: number;
  pensionEmployeeShare: number;
  pensionFranchise: number;
  pensionIncludesHoliday: boolean;
  age: number;
  leaseBudget: number;
  mobilityBudget: number;
  carValue: number;
  benefitRate: number;
  employeeContribution: number;
  businessKm: number;
  privateKm: number;
  reimbursementRate: number;
  mobilityUsesOwnCar: boolean;
  mobilityUsesPublicTransport: boolean;
  publicTransportMonthly: number;
  mobilityUsesBike: boolean;
  bikeMonthly: number;
  mobilityUsesSharedCar: boolean;
  sharedCarMonthly: number;
  leaseIsElectric: boolean;
  ownCarIsElectric: boolean;
  fuelConsumption: number;
  fuelPrice: number;
  electricConsumption: number;
  electricityPrice: number;
  otherCarCostRate: number;
  includeDepreciation: boolean;
  depreciationMonthly: number;
  taxYear: number;
};

export type ScenarioResult = {
  lease: { monthlyImpact: number; taxCost: number; employeeContribution: number; netValue: number; taxableBenefit: number };
  mobility: { grossBudget: number; taxCost: number; taxableBudget: number; taxFreeTravelReimbursement: number; netBudget: number; energyCosts: number; otherCarCosts: number; depreciationCosts: number; carCosts: number; publicTransportCost: number; bikeCost: number; sharedCarCost: number; transportCosts: number; netAmount: number };
  ownCar: { reimbursement: number; taxFreeReimbursement: number; taxableReimbursement: number; energyCosts: number; otherCarCosts: number; depreciationCosts: number; carCosts: number; netResult: number };
  salary: { grossMonthly: number; holidayMonthly: number; grossMonthlyAverage: number; pensionMonthly: number; employerPensionMonthly: number; totalPensionMonthly: number; pensionableAnnual: number; pensionBase: number; taxableAnnual: number; taxMonthly: number; taxBenefitMonthly: number; netMonthlyRegular: number; netMonthlyAverage: number };
  baselineNet: number;
  winner: "lease" | "mobility" | "ownCar";
  difference: number;
  differenceAnnual: number;
  breakEven: { targetTotalNet: number; alternatives: Array<{ scenario: "lease" | "mobility" | "ownCar"; grossSalary: number | null; grossPackage: number | null; totalNet: number | null }> };
};

export type ScenarioKey = "lease" | "mobility" | "ownCar";
export const ALL_SCENARIOS: ScenarioKey[] = ["lease", "mobility", "ownCar"];

// The 2026 statutory maximum for an employee's own transport is €0.23/km.
// The actual employer rate remains an input and can be lower, such as €0.22/km.
export const TAX_FREE_KM_RATE_2026 = 0.23;
const EV_BIJTELLING_RATE_2026 = 0.18;
const EV_BIJTELLING_THRESHOLD_2026 = 30_000;
const STANDARD_BIJTELLING_RATE_2026 = 0.22;
const MAX_PENSIONABLE_SALARY_2026 = 137_800;

type Bracket = { limit: number; rate: number };
const BOX_1_BRACKETS_2026: Bracket[] = [
  { limit: 38_883, rate: 0.3575 },
  { limit: 78_426, rate: 0.3756 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.495 },
];

function taxBeforeCredits(income: number, age: number) {
  const brackets = age >= 67
    ? [{ limit: 38_883, rate: 0.1785 }, { limit: 78_426, rate: 0.3756 }, { limit: Number.POSITIVE_INFINITY, rate: 0.495 }]
    : BOX_1_BRACKETS_2026;
  let previousLimit = 0;
  let total = 0;
  for (const bracket of brackets) {
    const taxableInBracket = Math.max(0, Math.min(income, bracket.limit) - previousLimit);
    total += taxableInBracket * bracket.rate;
    previousLimit = bracket.limit;
    if (income <= bracket.limit) break;
  }
  return total;
}

function generalTaxCredit(income: number, age: number) {
  if (age >= 67) {
    if (income <= 29_736) return 1_556;
    if (income <= 78_426) return Math.max(0, 1_556 - 0.03195 * (income - 29_736));
    return 0;
  }
  if (income <= 29_736) return 3_115;
  if (income <= 78_426) return Math.max(0, 3_115 - 0.06398 * (income - 29_736));
  return 0;
}

function employmentTaxCredit(income: number, age: number) {
  if (age >= 67) {
    if (income <= 11_965) return income * 0.04156;
    if (income <= 25_845) return 498 + (income - 11_965) * 0.15483;
    if (income <= 45_592) return 2_647 + (income - 25_845) * 0.00974;
    if (income <= 132_920) return Math.max(0, 2_840 - (income - 45_592) * 0.0325);
    return 0;
  }
  if (income <= 11_965) return income * 0.08324;
  if (income <= 25_845) return 996 + (income - 11_965) * 0.31009;
  if (income <= 45_592) return 5_300 + (income - 25_845) * 0.0195;
  if (income <= 132_920) return Math.max(0, 5_685 - (income - 45_592) * 0.0651);
  return 0;
}

/** Indicative annual income tax for a Dutch employee, based on 2026 rates. */
export function incomeTax(annualIncome: number, age = 35) {
  const income = Math.max(0, annualIncome);
  const credits = generalTaxCredit(income, age) + employmentTaxCredit(income, age);
  return Math.max(0, taxBeforeCredits(income, age) - credits);
}

function annualGrossSalary(inputs: CalculatorInputs) {
  return Math.max(0, inputs.salary) * 12 * (1 + Math.max(0, inputs.holidayAllowance) / 100);
}

export function calculatePensionBreakdown(inputs: CalculatorInputs) {
  const grossAnnual = Math.max(0, inputs.salary) * 12;
  const pensionableAnnual = Math.min(
    MAX_PENSIONABLE_SALARY_2026,
    grossAnnual * (inputs.pensionIncludesHoliday ? 1 + Math.max(0, inputs.holidayAllowance) / 100 : 1),
  );

  if (inputs.pensionInputMode === "scheme") {
    const franchise = Math.max(0, inputs.pensionFranchise);
    const pensionBase = Math.max(0, pensionableAnnual - franchise);
    const totalAnnual = pensionBase * Math.max(0, inputs.pensionTotalRate) / 100;
    const employeeAnnual = totalAnnual * Math.min(100, Math.max(0, inputs.pensionEmployeeShare)) / 100;
    return {
      employeeAnnual,
      employeeMonthly: employeeAnnual / 12,
      employerAnnual: Math.max(0, totalAnnual - employeeAnnual),
      employerMonthly: Math.max(0, totalAnnual - employeeAnnual) / 12,
      totalAnnual,
      totalMonthly: totalAnnual / 12,
      pensionableAnnual,
      pensionBase,
    };
  }

  const employeeMonthly = Math.max(0, inputs.pensionEmployeeMonthly);
  const employerMonthly = Math.max(0, inputs.pensionEmployerMonthly);
  return {
    employeeAnnual: employeeMonthly * 12,
    employeeMonthly,
    employerAnnual: employerMonthly * 12,
    employerMonthly,
    totalAnnual: (employeeMonthly + employerMonthly) * 12,
    totalMonthly: employeeMonthly + employerMonthly,
    pensionableAnnual,
    pensionBase: Math.max(0, pensionableAnnual - Math.max(0, inputs.pensionFranchise)),
  };
}

function annualTaxableSalary(inputs: CalculatorInputs) {
  return Math.max(0, annualGrossSalary(inputs) - calculatePensionBreakdown(inputs).employeeAnnual);
}

function taxDelta(inputs: CalculatorInputs, additionalAnnualIncome: number) {
  return Math.max(0, incomeTax(annualTaxableSalary(inputs) + additionalAnnualIncome, inputs.age) - incomeTax(annualTaxableSalary(inputs), inputs.age));
}

export function calculateSalaryBreakdown(inputs: CalculatorInputs) {
  const grossMonthly = Math.max(0, inputs.salary);
  const holidayMonthly = grossMonthly * Math.max(0, inputs.holidayAllowance) / 100;
  const grossMonthlyAverage = grossMonthly + holidayMonthly;
  const pension = calculatePensionBreakdown(inputs);
  const pensionMonthly = pension.employeeMonthly;
  const taxableAnnual = annualTaxableSalary(inputs);
  const taxMonthly = incomeTax(taxableAnnual, inputs.age) / 12;
  const taxWithoutPension = incomeTax(annualGrossSalary(inputs), inputs.age) / 12;
  const taxBenefitMonthly = Math.max(0, taxWithoutPension - taxMonthly);
  const netMonthlyRegular = grossMonthly - pensionMonthly - taxMonthly;
  const netMonthlyAverage = grossMonthlyAverage - pensionMonthly - taxMonthly;
  return { grossMonthly, holidayMonthly, grossMonthlyAverage, pensionMonthly, employerPensionMonthly: pension.employerMonthly, totalPensionMonthly: pension.totalMonthly, pensionableAnnual: pension.pensionableAnnual, pensionBase: pension.pensionBase, taxableAnnual, taxMonthly, taxBenefitMonthly, netMonthlyRegular, netMonthlyAverage };
}

export function calculateLease(inputs: CalculatorInputs) {
  const carValue = Math.max(0, inputs.carValue);
  const annualBenefit = inputs.leaseIsElectric
    ? Math.min(carValue, EV_BIJTELLING_THRESHOLD_2026) * EV_BIJTELLING_RATE_2026
      + Math.max(0, carValue - EV_BIJTELLING_THRESHOLD_2026) * STANDARD_BIJTELLING_RATE_2026
    : carValue * Math.max(0, inputs.benefitRate) / 100;
  const annualContribution = Math.max(0, inputs.employeeContribution) * 12;
  const taxableBenefit = Math.max(0, annualBenefit - annualContribution);
  const taxCost = taxDelta(inputs, taxableBenefit) / 12;
  const contribution = Math.max(0, inputs.employeeContribution);
  const monthlyImpact = -(taxCost + contribution);
  return { monthlyImpact, taxCost, employeeContribution: contribution, netValue: Math.max(0, inputs.leaseBudget) + monthlyImpact, taxableBenefit: taxableBenefit / 12 };
}

export function calculateMobilityBudget(inputs: CalculatorInputs) {
  const grossBudget = Math.max(0, inputs.mobilityBudget);
  const reimbursedModes = inputs.mobilityUsesOwnCar || inputs.mobilityUsesBike;
  const requestedTravelReimbursement = reimbursedModes
    ? Math.max(0, inputs.businessKm) * Math.min(Math.max(0, inputs.reimbursementRate), TAX_FREE_KM_RATE_2026) / 12
    : 0;
  const taxFreeTravelReimbursement = Math.min(grossBudget, requestedTravelReimbursement);
  const taxableBudget = Math.max(0, grossBudget - taxFreeTravelReimbursement);
  const taxCost = taxDelta(inputs, taxableBudget * 12) / 12;
  // The tax-free km reimbursement is paid from the budget, not on top of it.
  const netBudget = taxableBudget - taxCost + taxFreeTravelReimbursement;
  const vehicleCosts = inputs.mobilityUsesOwnCar
    ? calculateVehicleCosts(inputs)
    : { energyCosts: 0, otherCarCosts: 0, depreciationCosts: 0, carCosts: 0 };
  const publicTransportCost = inputs.mobilityUsesPublicTransport ? Math.max(0, inputs.publicTransportMonthly) : 0;
  const bikeCost = inputs.mobilityUsesBike ? Math.max(0, inputs.bikeMonthly) : 0;
  const sharedCarCost = inputs.mobilityUsesSharedCar ? Math.max(0, inputs.sharedCarMonthly) : 0;
  const transportCosts = vehicleCosts.carCosts + publicTransportCost + bikeCost + sharedCarCost;
  return { grossBudget, taxCost, taxableBudget, taxFreeTravelReimbursement, netBudget, ...vehicleCosts, publicTransportCost, bikeCost, sharedCarCost, transportCosts, netAmount: netBudget - transportCosts };
}

export function calculateVehicleCosts(inputs: CalculatorInputs) {
  const totalKm = Math.max(0, inputs.businessKm) + Math.max(0, inputs.privateKm);
  const energyConsumption = Math.max(0, inputs.ownCarIsElectric ? inputs.electricConsumption : inputs.fuelConsumption);
  const energyPrice = Math.max(0, inputs.ownCarIsElectric ? inputs.electricityPrice : inputs.fuelPrice);
  const energyCosts = (totalKm / 100) * energyConsumption * energyPrice / 12;
  const otherCarCosts = totalKm * Math.max(0, inputs.otherCarCostRate) / 12;
  const depreciationCosts = inputs.includeDepreciation ? Math.max(0, inputs.depreciationMonthly) : 0;
  return { energyCosts, otherCarCosts, depreciationCosts, carCosts: energyCosts + otherCarCosts + depreciationCosts };
}

export function calculateOwnCar(inputs: CalculatorInputs) {
  const businessKm = Math.max(0, inputs.businessKm);
  const rate = Math.max(0, inputs.reimbursementRate);
  const reimbursement = businessKm * rate / 12;
  const taxFreeReimbursement = businessKm * Math.min(rate, TAX_FREE_KM_RATE_2026) / 12;
  const taxablePart = businessKm * Math.max(0, rate - TAX_FREE_KM_RATE_2026) / 12;
  const taxCost = taxDelta(inputs, taxablePart * 12) / 12;
  const vehicleCosts = calculateVehicleCosts(inputs);
  return { reimbursement, taxFreeReimbursement, taxableReimbursement: taxCost, ...vehicleCosts, netResult: reimbursement - taxCost - vehicleCosts.carCosts };
}

function scenarioValue(inputs: CalculatorInputs, scenario: "lease" | "mobility" | "ownCar") {
  if (scenario === "lease") return calculateLease(inputs).netValue;
  if (scenario === "mobility") return calculateMobilityBudget(inputs).netAmount;
  return calculateOwnCar(inputs).netResult;
}

function totalNetForScenario(inputs: CalculatorInputs, scenario: "lease" | "mobility" | "ownCar") {
  // Use the annual average, including holiday allowance, for all scenarios.
  // This keeps the break-even comparison consistent when the salary changes.
  return calculateSalaryBreakdown(inputs).netMonthlyAverage + scenarioValue(inputs, scenario);
}

function findBreakEvenSalary(inputs: CalculatorInputs, scenario: "lease" | "mobility" | "ownCar", targetTotalNet: number) {
  const currentSalary = Math.max(0, inputs.salary);
  let low = 0;
  let high = Math.max(10_000, currentSalary * 2.5);
  while (totalNetForScenario({ ...inputs, salary: high }, scenario) < targetTotalNet && high < 50_000) high *= 1.5;
  if (totalNetForScenario({ ...inputs, salary: high }, scenario) < targetTotalNet) return null;

  for (let iteration = 0; iteration < 55; iteration += 1) {
    const middle = (low + high) / 2;
    if (totalNetForScenario({ ...inputs, salary: middle }, scenario) >= targetTotalNet) high = middle;
    else low = middle;
  }
  return high;
}

export function calculateScenarios(inputs: CalculatorInputs, selectedScenarios: ScenarioKey[] = ALL_SCENARIOS): ScenarioResult {
  const lease = calculateLease(inputs);
  const mobility = calculateMobilityBudget(inputs);
  const ownCar = calculateOwnCar(inputs);
  const salary = calculateSalaryBreakdown(inputs);
  const selected = ALL_SCENARIOS.filter((scenario) => selectedScenarios.includes(scenario));
  const scenarios = selected.length > 0 ? selected : ALL_SCENARIOS;
  const values = scenarios.map((key) => ({
    key,
    value: key === "lease" ? lease.netValue : key === "mobility" ? mobility.netAmount : ownCar.netResult,
  }));
  const sorted = [...values].sort((a, b) => b.value - a.value);
  const winner = sorted[0].key;
  const targetTotalNet = salary.netMonthlyAverage + sorted[0].value;
  const alternatives = (Object.keys(labelsForBreakEven) as Array<"lease" | "mobility" | "ownCar">)
    .filter((scenario) => scenario !== winner)
    .map((scenario) => {
      const grossSalary = findBreakEvenSalary(inputs, scenario, targetTotalNet);
      return {
        scenario,
        grossSalary,
        grossPackage: scenario === "mobility" && grossSalary !== null ? grossSalary + Math.max(0, inputs.mobilityBudget) : null,
        totalNet: grossSalary === null ? null : totalNetForScenario({ ...inputs, salary: grossSalary }, scenario),
      };
    });
  return {
    lease,
    mobility,
    ownCar,
    salary,
    baselineNet: salary.netMonthlyAverage,
    winner,
    difference: sorted[0].value - sorted[1].value,
    differenceAnnual: (sorted[0].value - sorted[1].value) * 12,
    breakEven: { targetTotalNet, alternatives },
  };
}

const labelsForBreakEven = { lease: true, mobility: true, ownCar: true };
