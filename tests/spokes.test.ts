import assert from "node:assert/strict";
import test from "node:test";
import { calculateJobTotal } from "../lib/job-total.ts";
import { createDefaultState, updateJobSection, type NettoplaatjeState } from "../lib/job-model.ts";
import { grossToNet, kmAllowance, leaseCost, marginalRate, totalReward } from "../lib/spokes.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

function withSalary(patch: Parameters<typeof updateJobSection<"salary">>[3]): NettoplaatjeState {
  return updateJobSection(createDefaultState(), "current", "salary", patch);
}

test("marginal rate in the middle band includes both tax credit phase-outs", () => {
  near(marginalRate(58_000, 35), 0.3756 + 0.06398 + 0.0651, 0.0001);
  near(marginalRate(20_000, 35), 0.3575 - 0.31009, 0.0001);
});

test("gross to net: regular month plus extras add up to the annual net", () => {
  const state = withSalary({ grossMonthly: 4000, holidayAllowancePct: 8, yearEndBonusPct: 8.33, annualBonus: 2000, pensionEmployeeMonthly: 150, pensionMode: "monthly" });
  const result = grossToNet(state, "current");
  near(result.regularNetMonthly * 12 + result.holidayNetAnnual + result.yearEndNetAnnual + result.bonusNetAnnual, result.netAnnual);
  near(result.netAnnual, calculateJobTotal({ ...state, jobs: { ...state.jobs, current: { ...state.jobs.current, mobility: { ...state.jobs.current.mobility, choice: "none" } } } }, "current").income.netPayMonthly * 12);
  assert.ok(result.extraTaxRate > 0.4 && result.extraTaxRate < 0.55, `extra tax rate ${result.extraTaxRate}`);
  near(result.grossFor100Net, 100 / (1 - result.marginalRate));
});

test("gross to net ignores the mobility choice", () => {
  const base = withSalary({ grossMonthly: 5000 });
  const lease = updateJobSection(base, "current", "mobility", { choice: "lease" });
  assert.equal(grossToNet(lease, "current").netAnnual, grossToNet(base, "current").netAnnual);
});

test("gross to net without extras: regular month is the average month", () => {
  const result = grossToNet(withSalary({ grossMonthly: 3000, holidayAllowancePct: 0 }), "current");
  near(result.regularNetMonthly, result.netMonthlyAverage);
});

test("lease cost: electric bijtelling is blended above the cap and cost is tax plus contribution", () => {
  const state = updateJobSection(createDefaultState(), "current", "mobility", {
    lease: { catalogValue: 40_000, isElectric: true, benefitRatePct: 22, employeeContributionMonthly: 50 },
  });
  const result = leaseCost(state, "current");
  near(result.annualBenefit, 30_000 * 0.18 + 10_000 * 0.22);
  near(result.taxableBenefitMonthly, (7_600 - 600) / 12);
  near(result.netCostMonthly, result.taxMonthly + 50);
  assert.ok(result.taxMonthly > 0);
});

test("km allowance: tax only above €0,25 and break-even covers the car costs", () => {
  const base = createDefaultState();
  const atLimit = kmAllowance(base, "current");
  assert.equal(atLimit.taxAnnual, 0);
  near(atLimit.costPerKm, 7.5 * 2 / 100 + 0.15);
  near(atLimit.kmAnnual, 1 * 46 * 25 * 2);

  const above = kmAllowance(updateJobSection(base, "current", "mobility", { reimbursementPerKm: 0.35, extraBusinessKmPerYear: 1000 }), "current");
  near(above.taxableAnnual, above.kmAnnual * 0.10);
  assert.ok(above.taxAnnual > 0);
  near(above.extraKmAnnual, 1000);
  near(above.netAnnual, above.reimbursementAnnual - above.taxAnnual - above.costAnnual);

  const atBreakEven = kmAllowance(updateJobSection(base, "current", "mobility", { reimbursementPerKm: atLimit.breakEvenRate }), "current");
  near(atBreakEven.netAnnual, 0, 1);
});

test("total reward values extra vacation days at the day wage", () => {
  let state = withSalary({ grossMonthly: 4500, hoursPerWeek: 40, holidayAllowancePct: 8, pensionEmployerMonthly: 300, pensionMode: "monthly" });
  state = updateJobSection(state, "current", "benefits", { vacationDays: 25, trainingBudgetAnnual: 1000, otherAnnual: 0 });
  const result = totalReward(state, "current");
  assert.equal(result.legalMinimumVacationDays, 20);
  assert.equal(result.extraVacationDays, 5);
  near(result.dayWage, 4500 * 12 / 260);
  near(result.totalAnnual, 54_000 + 4_320 + 3_600 + 1_000 + 5 * 4500 * 12 / 260);
  near(result.totalPerHour, result.totalAnnual / (40 * 52));

  const partTime = totalReward(updateJobSection(state, "current", "salary", { hoursPerWeek: 24 }), "current");
  near(partTime.legalMinimumVacationDays, 12);
});
