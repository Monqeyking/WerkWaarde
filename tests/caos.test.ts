import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculatePensionBreakdown } from "../lib/calculator.ts";
import { CAOS, caoFilledText, caoSalaryPatch, checkedOnText, findCao } from "../lib/caos.ts";
import { createDefaultState, sanitizeState, toCalculatorInputs } from "../lib/job-model.ts";

describe("cao data", () => {
  test("ids are unique", () => {
    assert.equal(new Set(CAOS.map((cao) => cao.id)).size, CAOS.length);
  });

  test("every value is in a sensible range and has a source", () => {
    for (const cao of CAOS) {
      assert.ok(cao.fullTimeHours === null || (cao.fullTimeHours >= 30 && cao.fullTimeHours <= 40), `${cao.id}: hours`);
      assert.ok(cao.holidayAllowancePct === null || (cao.holidayAllowancePct >= 8 && cao.holidayAllowancePct <= 20), `${cao.id}: holiday allowance`);
      assert.ok(cao.yearEndBonusPct === null || (cao.yearEndBonusPct >= 0 && cao.yearEndBonusPct <= 15), `${cao.id}: year-end bonus`);
      assert.match(cao.sourceUrl, /^https:\/\//, `${cao.id}: source`);
      assert.match(cao.checkedOn, /^\d{4}-\d{2}-\d{2}$/, `${cao.id}: checked on`);
      if (cao.pension) {
        assert.ok(cao.pension.totalRatePct > 0 && cao.pension.totalRatePct <= 40, `${cao.id}: pension rate`);
        assert.ok(cao.pension.employeeSharePct >= 0 && cao.pension.employeeSharePct <= 100, `${cao.id}: employee share`);
        assert.ok(cao.pension.franchise >= 0 && cao.pension.franchise <= 25_000, `${cao.id}: franchise`);
        assert.match(cao.pension.sourceUrl, /^https:\/\//, `${cao.id}: pension source`);
      }
    }
  });
});

describe("applying a cao", () => {
  const withPension = CAOS.find((cao) => cao.pension && cao.holidayAllowancePct !== null && cao.yearEndBonusPct !== null);

  test("prefills holiday allowance, 13th month and the pension scheme, not the salary", { skip: !withPension }, () => {
    const patch = caoSalaryPatch(withPension!);
    assert.equal(patch.caoId, withPension!.id);
    assert.equal(patch.holidayAllowancePct, withPension!.holidayAllowancePct);
    assert.equal(patch.yearEndBonusPct, withPension!.yearEndBonusPct);
    assert.equal(patch.pensionMode, "scheme");
    assert.equal(patch.pensionTotalRatePct, withPension!.pension!.totalRatePct);
    assert.equal(patch.grossMonthly, undefined);
    assert.equal(patch.hoursPerWeek, undefined);
    assert.equal(patch.fullTimeHours, withPension!.fullTimeHours ?? 0);
  });

  test("a stored cao id survives sanitizing, an unknown one is dropped", () => {
    const state = createDefaultState();
    state.jobs.current.salary.caoId = "bestaat-niet";
    assert.equal(sanitizeState(state).jobs.current.salary.caoId, "");
    if (CAOS[0]) {
      state.jobs.current.salary.caoId = CAOS[0].id;
      assert.equal(sanitizeState(state).jobs.current.salary.caoId, CAOS[0].id);
    }
  });

  test("a cao that leaves holiday allowance to the employer does not overwrite it", () => {
    const abu = findCao("uitzendkrachten-abu")!;
    const patch = caoSalaryPatch(abu);
    assert.equal("holidayAllowancePct" in patch, false);
    assert.equal("yearEndBonusPct" in patch, false);
    assert.equal(patch.pensionMode, "scheme");
    assert.equal(caoFilledText(abu), "Pensioen");
    assert.equal(caoFilledText(findCao("rijk")!), "Vakantiegeld, 13e maand en pensioen");
  });

  test("Cao Rijk at € 4.000: employee pays 30% of 27.1% over salary plus holiday allowance minus the franchise", () => {
    const state = createDefaultState();
    state.jobs.current.salary = { ...state.jobs.current.salary, grossMonthly: 4000, ...caoSalaryPatch(findCao("rijk")!) };
    const pension = calculatePensionBreakdown(toCalculatorInputs(state, "current"));
    const expected = (4000 * 12 * 1.08 - 19_200) * 0.271 * 0.3 / 12;
    assert.ok(Math.abs(pension.employeeMonthly - expected) < 0.01, `${pension.employeeMonthly} vs ${expected}`);
    assert.ok(Math.abs(expected - 221.14) < 0.01);
  });

  test("the fund's salary cap limits the pension base (Horeca: € 52.294)", () => {
    const state = createDefaultState();
    state.jobs.current.salary = { ...state.jobs.current.salary, grossMonthly: 5000, ...caoSalaryPatch(findCao("horeca")!) };
    const pension = calculatePensionBreakdown(toCalculatorInputs(state, "current"));
    assert.equal(pension.pensionableAnnual, 52_294);
    const expected = (52_294 - 15_308) * 0.168 * 0.5 / 12;
    assert.ok(Math.abs(pension.employeeMonthly - expected) < 0.01, `${pension.employeeMonthly} vs ${expected}`);
    // Without a cao the fiscal maximum applies, so the same salary is fully pensionable.
    state.jobs.current.salary.pensionMaxSalary = 0;
    assert.equal(calculatePensionBreakdown(toCalculatorInputs(state, "current")).pensionableAnnual, 5000 * 12 * 1.08);
  });

  test("picking a cao without a cap clears a cap from an earlier pick", () => {
    assert.equal(caoSalaryPatch(findCao("horeca")!).pensionMaxSalary, 52_294);
    assert.equal(caoSalaryPatch(findCao("rijk")!).pensionMaxSalary, 0);
  });

  test("findCao and the checked-on date", () => {
    assert.equal(findCao(""), undefined);
    assert.equal(checkedOnText(CAOS[0]), "16 november 2026");
  });
});
