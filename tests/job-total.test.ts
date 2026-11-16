import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculateSalaryBreakdown, incomeTax } from "../lib/calculator.ts";
import { createDefaultState, toCalculatorInputs, updateJob, updateJobSection, type NettoplaatjeState } from "../lib/job-model.ts";
import { calculateJobTotal, compareJobs } from "../lib/job-total.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

/** Two identical jobs: start from the current job for both. */
function sameJobs(): NettoplaatjeState {
  const state = createDefaultState();
  return { ...state, jobs: { current: state.jobs.current, next: structuredClone(state.jobs.current) } };
}

describe("calculateJobTotal", () => {
  test("net pay matches the salary breakdown when there are no bonuses", () => {
    const state = createDefaultState();
    const total = calculateJobTotal(state, "current");
    near(total.income.netPayMonthly, calculateSalaryBreakdown(toCalculatorInputs(state, "current")).netMonthlyAverage);
  });

  test("a bonus is taxed at the marginal rate", () => {
    const state = updateJobSection(createDefaultState(), "current", "salary", { annualBonus: 1200 });
    const without = calculateJobTotal(createDefaultState(), "current");
    const withBonus = calculateJobTotal(state, "current");
    const extraNet = withBonus.income.netPayMonthly - without.income.netPayMonthly;
    assert.ok(extraNet > 0 && extraNet < 100, `extra net ${extraNet}`);
  });

  test("lease car: pay the contribution and tax on the benefit, no car costs", () => {
    const state = updateJobSection(createDefaultState(), "current", "mobility", { choice: "lease" });
    const total = calculateJobTotal(state, "current");
    near(total.mobility.cashMonthly, -70);
    const taxable = 40_000 * 0.22 - 70 * 12;
    const salaryTaxable = 4500 * 12 * 1.08;
    // Net salary itself is unchanged by the lease; the benefit adds tax on top.
    near(total.income.netPayMonthly, calculateJobTotal(createDefaultState(), "current").income.netPayMonthly);
    near(total.mobility.taxMonthly, (incomeTax(salaryTaxable + taxable) - incomeTax(salaryTaxable)) / 12);
    near(total.mobility.netMonthly, -70 - total.mobility.taxMonthly);
  });

  test("tax for mobility is the extra tax on top of salary", () => {
    const state = updateJobSection(createDefaultState(), "current", "mobility", { choice: "lease", lease: { catalogValue: 30_000, isElectric: false, benefitRatePct: 22, employeeContributionMonthly: 0 } });
    const total = calculateJobTotal(state, "current");
    const salaryTaxable = 4500 * 12 * 1.08;
    near(total.mobility.taxMonthly, (incomeTax(salaryTaxable + 6_600) - incomeTax(salaryTaxable)) / 12);
  });

  test("no arrangement means no mobility money in or out", () => {
    const state = updateJobSection(createDefaultState(), "current", "mobility", { choice: "none" });
    const total = calculateJobTotal(state, "current");
    assert.equal(total.mobility.netMonthly, 0);
  });

  test("home-working allowance is paid for the non-office days", () => {
    const state = updateJobSection(createDefaultState(), "current", "commute", { homeWorkAllowancePerDay: 2 });
    const total = calculateJobTotal(state, "current"); // 40 h = 5 days, 1 office day
    near(total.commute.homeWorkAllowanceMonthly, 4 * 46 / 12 * 2);
  });

  test("net per hour counts travel time as time spent on the job", () => {
    const total = calculateJobTotal(createDefaultState(), "current");
    near(total.netPerHourInclTravel, total.netAfterCostsMonthly / (40 * 46 / 12 + total.commute.travelHoursPerMonth));
  });

  test("childcare and time value", () => {
    let state = updateJob(createDefaultState(), "current", { childcareDaysPerWeek: 2 });
    state = { ...state, personal: { ...state.personal, childcareCostPerDay: 100, timeValue: { include: true, perHour: 15 } } };
    const total = calculateJobTotal(state, "current");
    near(total.commute.childcareMonthly, 2 * 100 * 46 / 12);
    near(total.netAfterCostsAndTimeMonthly, total.netAfterCostsMonthly - total.commute.travelHoursPerMonth * 15);
  });
});

describe("compareJobs", () => {
  test("identical jobs give no difference", () => {
    const comparison = compareJobs(sameJobs());
    near(comparison.netDifferenceMonthly, 0);
    near(comparison.netPerHourDifference, 0);
    near(comparison.totalRewardDifferenceAnnual, 0);
  });

  test("a higher salary raises net pay by less than the gross raise", () => {
    const state = updateJobSection(sameJobs(), "next", "salary", { grossMonthly: 5000 });
    const comparison = compareJobs(state);
    assert.ok(comparison.netDifferenceMonthly > 0);
    assert.ok(comparison.netDifferenceMonthly < 500 * 1.08);
  });

  test("more office days cost money, time and net pay per hour", () => {
    const comparison = compareJobs(createDefaultState()); // 1 vs 4 office days
    assert.ok(comparison.netDifferenceMonthly < 0);
    near(comparison.travelHoursDifferenceMonthly, 17.25);
    assert.ok(comparison.netPerHourDifference < 0);
  });

  test("lists the sections that still hold example values", () => {
    const fresh = compareJobs(createDefaultState());
    assert.equal(fresh.unfilled.length, 8);
    const state = updateJobSection(createDefaultState(), "next", "salary", { grossMonthly: 4800 });
    assert.ok(!compareJobs(state).unfilled.some((item) => item.job === "next" && item.section === "salary"));
  });
});
