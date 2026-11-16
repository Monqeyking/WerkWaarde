import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  calculateLease,
  calculateMobilityBudget,
  calculateOwnCar,
  calculatePensionBreakdown,
  calculateSalaryBreakdown,
  calculateScenarios,
  calculateVehicleCosts,
  incomeTax,
  type CalculatorInputs,
} from "../lib/calculator.ts";

/** Same example values as the mobility calculator's defaults. */
const base: CalculatorInputs = {
  salary: 4500, holidayAllowance: 8, pensionInputMode: "monthly", pensionEmployeeMonthly: 0, pensionEmployerMonthly: 0,
  pensionTotalRate: 20, pensionEmployeeShare: 25, pensionFranchise: 19172, pensionIncludesHoliday: true, age: 35,
  leaseBudget: 625, mobilityBudget: 850, carValue: 40000, benefitRate: 22, employeeContribution: 70,
  businessKm: 15000, privateKm: 10000, reimbursementRate: 0.25,
  mobilityUsesOwnCar: true, mobilityUsesPublicTransport: false, publicTransportMonthly: 0,
  mobilityUsesBike: false, bikeMonthly: 0, mobilityUsesSharedCar: false, sharedCarMonthly: 0,
  leaseIsElectric: false, ownCarIsElectric: false, fuelConsumption: 7.5, fuelPrice: 2,
  electricConsumption: 18, electricityPrice: 0.3, otherCarCostRate: 0.15,
  includeDepreciation: false, depreciationMonthly: 0, taxYear: 2026,
};

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

// Expected values are worked out by hand from the 2026 brackets and tax credits.
describe("incomeTax (2026)", () => {
  test("middle income: brackets 1–2 minus general and employment tax credit", () => {
    near(incomeTax(50_000), 10_859.67);
  });

  test("low income: credits almost cancel the tax", () => {
    near(incomeTax(20_000), 547.43);
  });

  test("never negative", () => {
    assert.equal(incomeTax(10_000), 0);
    assert.equal(incomeTax(-5_000), 0);
  });

  test("high income: top bracket, no general tax credit", () => {
    near(incomeTax(100_000), 37_289.11);
  });

  test("AOW age uses the reduced first bracket and credits", () => {
    near(incomeTax(30_000, 67), 1_119.96);
  });
});

describe("pension", () => {
  test("scheme mode: premium over pensionable salary minus franchise", () => {
    const pension = calculatePensionBreakdown({ ...base, pensionInputMode: "scheme" });
    near(pension.pensionableAnnual, 58_320);
    near(pension.pensionBase, 39_148);
    near(pension.totalAnnual, 7_829.6);
    near(pension.employeeAnnual, 1_957.4);
    near(pension.employerAnnual, 5_872.2);
  });

  test("pensionable salary is capped at the 2026 maximum", () => {
    const pension = calculatePensionBreakdown({ ...base, pensionInputMode: "scheme", salary: 20_000 });
    near(pension.pensionableAnnual, 137_800);
  });

  test("employee contribution lowers tax but is still deducted", () => {
    const without = calculateSalaryBreakdown(base);
    const withPension = calculateSalaryBreakdown({ ...base, pensionEmployeeMonthly: 200 });
    assert.ok(withPension.taxMonthly < without.taxMonthly);
    assert.ok(withPension.taxBenefitMonthly > 0);
    near(without.netMonthlyRegular - withPension.netMonthlyRegular, 200 - withPension.taxBenefitMonthly);
  });

  test("a regular month is taxed without the holiday allowance (€ 3.500 → about € 2.906)", () => {
    const salary = calculateSalaryBreakdown({ ...base, salary: 3500 });
    near(salary.netMonthlyRegular, 3500 - incomeTax(42_000) / 12);
    near(salary.netMonthlyRegular, 2906, 1);
    // The yearly average still spreads the tax on the holiday allowance.
    near(salary.netMonthlyAverage, 3500 * 1.08 - incomeTax(45_360) / 12);
  });
});

describe("lease car", () => {
  test("fuel car: catalogue value × rate, minus own contribution", () => {
    const lease = calculateLease(base);
    near(lease.taxableBenefit, (40_000 * 0.22 - 70 * 12) / 12);
    near(lease.netValue, 625 - lease.taxCost - 70);
  });

  test("electric car: 18% up to €30,000 and 22% above", () => {
    const lease = calculateLease({ ...base, leaseIsElectric: true, employeeContribution: 0 });
    near(lease.taxableBenefit, (30_000 * 0.18 + 10_000 * 0.22) / 12);
  });
});

describe("mobility budget", () => {
  test("tax-free km reimbursement comes out of the budget first", () => {
    const mobility = calculateMobilityBudget(base);
    near(mobility.taxFreeTravelReimbursement, 15_000 * 0.25 / 12);
    near(mobility.taxableBudget, 850 - 312.5);
  });

  test("the tax-free part is capped at €0.25/km and at the budget", () => {
    near(calculateMobilityBudget({ ...base, reimbursementRate: 0.3 }).taxFreeTravelReimbursement, 312.5);
    const small = calculateMobilityBudget({ ...base, mobilityBudget: 200 });
    near(small.taxFreeTravelReimbursement, 200);
    assert.equal(small.taxCost, 0);
  });

  test("no tax-free km reimbursement without own car or bike", () => {
    const mobility = calculateMobilityBudget({ ...base, mobilityUsesOwnCar: false, mobilityUsesPublicTransport: true, publicTransportMonthly: 120 });
    assert.equal(mobility.taxFreeTravelReimbursement, 0);
    near(mobility.transportCosts, 120);
  });
});

describe("own car", () => {
  test("vehicle costs follow the explanation page example", () => {
    const costs = calculateVehicleCosts(base);
    near(costs.energyCosts, 312.5);
    near(costs.otherCarCosts, 312.5);
  });

  test("reimbursement above €0.25/km is taxed", () => {
    const atLimit = calculateOwnCar({ ...base, reimbursementRate: 0.25 });
    const above = calculateOwnCar({ ...base, reimbursementRate: 0.3 });
    assert.equal(atLimit.taxableReimbursement, 0);
    assert.ok(above.taxableReimbursement > 0);
    near(above.netResult, above.reimbursement - above.taxableReimbursement - above.carCosts);
  });
});

describe("scenario comparison", () => {
  test("break-even only lists the selected scenarios", () => {
    const result = calculateScenarios(base, ["lease", "mobility"]);
    const listed = result.breakEven.alternatives.map((alternative) => alternative.scenario);
    assert.equal(listed.length, 1);
    assert.ok(!listed.includes("ownCar"));
    assert.ok(!listed.includes(result.winner));
  });

  test("break-even salary reaches the winner's total net", () => {
    const result = calculateScenarios(base);
    for (const alternative of result.breakEven.alternatives) {
      assert.ok(alternative.totalNet !== null);
      near(alternative.totalNet!, result.breakEven.targetTotalNet, 1);
    }
  });

  test("winner is the highest of the selected scenarios", () => {
    const result = calculateScenarios(base, ["mobility", "ownCar"]);
    assert.ok(result.winner !== "lease");
    near(result.difference, Math.abs(result.mobility.netAmount - result.ownCar.netResult));
  });
});
