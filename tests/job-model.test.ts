import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculateScenarios } from "../lib/calculator.ts";
import {
  commuteKmPerYear,
  copySectionToNext,
  createDefaultState,
  decodeState,
  encodeState,
  loadState,
  sanitizeState,
  saveState,
  STORAGE_KEY,
  toCalculatorInputs,
  toWorkPatternInputs,
  updateJobSection,
  type KeyValueStorage,
} from "../lib/job-model.ts";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = value; },
    removeItem: (key) => { delete data[key]; },
  };
}

describe("sanitizeState", () => {
  test("garbage becomes the defaults", () => {
    for (const input of [null, undefined, 42, "x", [], { jobs: "nope" }]) {
      assert.deepEqual(sanitizeState(input), createDefaultState());
    }
  });

  test("keeps valid values and repairs invalid ones", () => {
    const state = sanitizeState({
      personal: { age: 52, workWeeksPerYear: 60, unknownKey: 1 },
      jobs: {
        current: { salary: { grossMonthly: 5200, hoursPerWeek: "40", pensionMode: "hacked" } },
        next: { salary: { grossMonthly: -100 }, commute: { officeDaysPerWeek: 9 }, mobility: { choice: "lease" } },
      },
    });
    assert.equal(state.personal.age, 52);
    assert.equal(state.personal.workWeeksPerYear, 52);
    assert.equal("unknownKey" in state.personal, false);
    assert.equal(state.jobs.current.salary.grossMonthly, 5200);
    assert.equal(state.jobs.current.salary.hoursPerWeek, 40);
    assert.equal(state.jobs.current.salary.pensionMode, "monthly");
    assert.equal(state.jobs.next.salary.grossMonthly, 0);
    assert.equal(state.jobs.next.commute.officeDaysPerWeek, 7);
    assert.equal(state.jobs.next.mobility.choice, "lease");
  });

  test("rejects NaN and Infinity", () => {
    const state = sanitizeState({ personal: { age: Number.NaN, workWeeksPerYear: Number.POSITIVE_INFINITY } });
    assert.equal(state.personal.age, 35);
    assert.equal(state.personal.workWeeksPerYear, 46);
  });
});

describe("share links", () => {
  test("round-trip preserves the state", () => {
    let state = createDefaultState();
    state = updateJobSection(state, "next", "salary", { grossMonthly: 5100, annualBonus: 2500 });
    state = updateJobSection(state, "next", "mobility", { choice: "lease" });
    assert.deepEqual(decodeState(encodeState(state)), state);
  });

  test("defaults encode to a tiny, URL-safe string", () => {
    const encoded = encodeState(createDefaultState());
    assert.ok(encoded.length < 10);
    assert.match(encoded, /^[A-Za-z0-9_-]*$/);
  });

  test("invalid links return null instead of throwing", () => {
    assert.equal(decodeState("%%%not-base64"), null);
    assert.equal(decodeState("bm90IGpzb24"), null); // "not json"
  });
});

describe("storage", () => {
  test("save then load", () => {
    const storage = memoryStorage();
    const state = updateJobSection(createDefaultState(), "current", "salary", { grossMonthly: 3900 });
    saveState(storage, state);
    assert.deepEqual(loadState(storage), state);
  });

  test("corrupt or missing storage falls back to defaults", () => {
    assert.deepEqual(loadState(memoryStorage({ [STORAGE_KEY]: "{broken" })), createDefaultState());
    assert.deepEqual(loadState(undefined), createDefaultState());
    const throwing: KeyValueStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => {} };
    assert.deepEqual(loadState(throwing), createDefaultState());
    assert.doesNotThrow(() => saveState(throwing, createDefaultState()));
  });
});

describe("updates", () => {
  test("updating a section marks it as filled and leaves the other job alone", () => {
    const before = createDefaultState();
    const after = updateJobSection(before, "next", "commute", { oneWayKm: 40 });
    assert.equal(after.jobs.next.commute.oneWayKm, 40);
    assert.equal(after.jobs.next.commute.oneWayMinutes, before.jobs.next.commute.oneWayMinutes);
    assert.equal(after.filled.next.commute, true);
    assert.equal(after.filled.current.commute, false);
    assert.equal(after.jobs.current, before.jobs.current);
    assert.equal(before.jobs.next.commute.oneWayKm, 25, "original state is not mutated");
  });

  test("copy a section from the current job to the new job", () => {
    let state = updateJobSection(createDefaultState(), "current", "benefits", { vacationDays: 30 });
    state = copySectionToNext(state, "benefits");
    assert.equal(state.jobs.next.benefits.vacationDays, 30);
    assert.notEqual(state.jobs.next.benefits, state.jobs.current.benefits);
  });
});

describe("adapters to the existing calculators", () => {
  test("business km = commuting km + extra business trips", () => {
    let state = updateJobSection(createDefaultState(), "next", "mobility", { extraBusinessKmPerYear: 3000 });
    state = updateJobSection(state, "next", "commute", { officeDaysPerWeek: 3, oneWayKm: 20 });
    assert.equal(commuteKmPerYear(state, "next"), 3 * 46 * 20 * 2);
    assert.equal(toCalculatorInputs(state, "next").businessKm, 5520 + 3000);
  });

  test("calculator inputs produce a working comparison", () => {
    const result = calculateScenarios(toCalculatorInputs(createDefaultState(), "current"));
    assert.ok(Number.isFinite(result.salary.netMonthlyAverage));
    assert.ok(result.salary.netMonthlyAverage > 0);
  });

  test("work pattern inputs take each job's own values", () => {
    const inputs = toWorkPatternInputs(createDefaultState());
    assert.equal(inputs.currentOfficeDays, 1);
    assert.equal(inputs.newOfficeDays, 4);
    assert.equal(inputs.workWeeksPerYear, 46);
  });
});
