import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultState, updateChild, updateHousehold, updateJob, updateJobSection, type NettoplaatjeState } from "../lib/job-model.ts";
import { calculateJobTotal } from "../lib/job-total.ts";
import { compareScenarios, fullTimeHoursFor, hoursScenario, hoursSteps, hoursTable, scenarioState, type HoursScenario } from "../lib/part-time.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

/** € 4.500 at 40 hours, no car, 2 office days, € 10 lunch, no childcare. */
function single(): NettoplaatjeState {
  let state = updateJobSection(createDefaultState(), "current", "mobility", { choice: "none" });
  state = updateJobSection(state, "current", "salary", { grossMonthly: 4_500, hoursPerWeek: 40, fullTimeHours: 40 });
  return updateJobSection(state, "current", "commute", { officeDaysPerWeek: 2, lunchPerOfficeDay: 10 });
}

/** The same job in a family: partner € 40.000, toddler on dagopvang 4 days, toeslagen on. */
function family(): NettoplaatjeState {
  let state = updateHousehold(single(), { enabled: true, hasPartner: true, partnerTaxableAnnual: 40_000 });
  state = updateChild(state, "c1", { active: true, age: 2, care: "dagopvang", hoursPerDay: 11, hourlyPrice: 11.23, weeksPerYear: 52 });
  return updateJob(state, "current", { childcareDaysPerWeek: 4 });
}

const sumOfParts = (scenario: HoursScenario) => scenario.netPayMonthly + scenario.mobilityMonthly - scenario.workCostsMonthly
  - scenario.childcareNetMonthly + scenario.zorgtoeslagMonthly + scenario.kindgebondenBudgetMonthly + scenario.combinatiekortingMonthly;

test("full-time hours: cao or user value, otherwise 40 or the contract when that is longer", () => {
  assert.equal(fullTimeHoursFor({ hoursPerWeek: 32, fullTimeHours: 36 }), 36);
  assert.equal(fullTimeHoursFor({ hoursPerWeek: 32, fullTimeHours: 0 }), 40);
  assert.equal(fullTimeHoursFor({ hoursPerWeek: 45, fullTimeHours: 0 }), 45);
});

test("hours steps: 60% to 100% of full time, plus the current hours", () => {
  assert.deepEqual(hoursSteps(single(), "current"), [24, 28, 32, 36, 40]);
  const cao36 = updateJobSection(single(), "current", "salary", { hoursPerWeek: 30, fullTimeHours: 36 });
  assert.deepEqual(hoursSteps(cao36, "current"), [22, 25, 29, 30, 32, 36]);
  assert.deepEqual(hoursSteps(updateJobSection(single(), "current", "salary", { hoursPerWeek: 0 }), "current"), []);
  assert.equal(hoursTable(single(), "current").length, 5);
});

test("at the current hours the scenario equals the job total", () => {
  const scenario = hoursScenario(single(), "current", 40);
  const total = calculateJobTotal(single(), "current");
  near(scenario.householdNetMonthly, total.netAfterCostsMonthly);
  assert.equal(scenario.toetsingsinkomen, null);
});

test("salary, bonus and payslip pension scale with the hours", () => {
  let state = updateJobSection(single(), "current", "salary", { annualBonus: 2_000, pensionMode: "monthly", pensionEmployeeMonthly: 200, pensionEmployerMonthly: 400 });
  state = scenarioState(state, "current", 32);
  const { salary } = state.jobs.current;
  assert.equal(salary.grossMonthly, 3_600);
  assert.equal(salary.hoursPerWeek, 32);
  assert.equal(salary.annualBonus, 1_600);
  assert.equal(salary.pensionEmployeeMonthly, 160);
  assert.equal(salary.pensionEmployerMonthly, 320);
  assert.equal(salary.fullTimeHours, 40, "full time stays the same");
});

test("office days shrink with the working days", () => {
  const state = updateJobSection(single(), "current", "commute", { officeDaysPerWeek: 4 });
  assert.equal(scenarioState(state, "current", 24).jobs.current.commute.officeDaysPerWeek, 3);
  assert.equal(scenarioState(state, "current", 36).jobs.current.commute.officeDaysPerWeek, 4);
});

test("childcare days follow the working days, unless switched off", () => {
  const state = family();
  assert.equal(scenarioState(state, "current", 32).jobs.current.childcareDaysPerWeek, 3);
  assert.equal(scenarioState(state, "current", 24).jobs.current.childcareDaysPerWeek, 2);
  assert.equal(scenarioState(state, "current", 32, { childcareFollowsWorkDays: false }).jobs.current.childcareDaysPerWeek, 4);
  assert.equal(scenarioState(single(), "current", 24).jobs.current.childcareDaysPerWeek, 0, "no childcare stays none");
});

test("the household amount is the sum of its parts in every scenario", () => {
  for (const state of [single(), family()]) {
    for (const scenario of hoursTable(state, "current")) near(sumOfParts(scenario), scenario.householdNetMonthly);
    for (const scenario of hoursTable(state, "current")) near(scenario.netPayMonthly, scenario.grossMonthly - scenario.pensionMonthly - scenario.taxMonthly);
  }
});

test("the comparison's parts add up to the change in household amount", () => {
  const table = hoursTable(family(), "current");
  const step = compareScenarios(table[2], table[4]);
  assert.equal(step.fromHours, 32);
  assert.equal(step.toHours, 40);
  near(step.gross - step.pension - step.tax + step.mobility - step.workCosts - step.childcareGross + step.kinderopvangtoeslag + step.otherAllowances + step.combinatiekorting, step.householdNet);
  near((step.keptPerEuro ?? 0) + (step.marginalPressure ?? 0), 1);
  assert.equal(compareScenarios(table[0], table[0]).keptPerEuro, null);
});

test("with children in childcare, working more keeps less of each extra euro", () => {
  const without = compareScenarios(hoursScenario(single(), "current", 32), hoursScenario(single(), "current", 40));
  const withKids = compareScenarios(hoursScenario(family(), "current", 32), hoursScenario(family(), "current", 40));
  assert.ok(without.marginalPressure! > 0.3 && without.marginalPressure! < 0.6, `pressure ${without.marginalPressure}`);
  assert.ok(withKids.marginalPressure! > without.marginalPressure!, "extra opvangdag and lower toeslag cost more");
  assert.ok(withKids.childcareGross > 0, "one more opvangdag");
  assert.ok(withKids.kinderopvangtoeslag > 0, "more hours, more toeslag in euros");
});

test("toeslagen are only counted when switched on", () => {
  const off = updateHousehold(family(), { enabled: false });
  const scenario = hoursScenario(off, "current", 32);
  assert.equal(scenario.kinderopvangtoeslagMonthly, 0);
  assert.equal(scenario.zorgtoeslagMonthly + scenario.kindgebondenBudgetMonthly, 0);
  assert.equal(scenario.toetsingsinkomen, null);
  assert.ok(hoursScenario(family(), "current", 32).toetsingsinkomen! > 40_000);
});

test("gross and household amount rise with the hours", () => {
  const table = hoursTable(family(), "current");
  for (let index = 1; index < table.length; index += 1) {
    assert.ok(table[index].grossMonthly > table[index - 1].grossMonthly);
    assert.ok(table[index].householdNetMonthly > table[index - 1].householdNetMonthly);
  }
});

/** Single parent at € 2.250 for 24 of 36 hours, toddler on dagopvang 3 days: gets the combinatiekorting. */
function singleParent(): NettoplaatjeState {
  let state = updateJobSection(single(), "current", "salary", { grossMonthly: 2_250, hoursPerWeek: 24, fullTimeHours: 36 });
  state = updateHousehold(state, { enabled: true, hasPartner: false });
  state = updateChild(state, "c1", { active: true, age: 2, care: "dagopvang", hoursPerDay: 11, hourlyPrice: 11.23, weeksPerYear: 52 });
  return updateJob(state, "current", { childcareDaysPerWeek: 3 });
}

test("a single parent's extra hours also raise the combinatiekorting, and the parts still add up", () => {
  const state = singleParent();
  const from = hoursScenario(state, "current", 24);
  const to = hoursScenario(state, "current", 32);
  assert.ok(from.combinatiekortingMonthly > 0);
  assert.ok(to.combinatiekortingMonthly > from.combinatiekortingMonthly);
  near(sumOfParts(from), from.householdNetMonthly);
  const step = compareScenarios(from, to);
  near(step.gross - step.pension - step.tax + step.mobility - step.workCosts - step.childcareGross + step.kinderopvangtoeslag + step.otherAllowances + step.combinatiekorting, step.householdNet);
});
