import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculateScenarios } from "../lib/calculator.ts";
import {
  applyCalculatorInput,
  applyWorkPatternInput,
  commuteKmPerYear,
  copySectionToNext,
  createDefaultState,
  decodeState,
  encodeState,
  loadState,
  MAX_INPUT,
  readSharedParam,
  sanitizeState,
  shareHash,
  withoutSharedParam,
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
    assert.equal(decodeState("a".repeat(5_000)), null, "oversized links are ignored");
  });

  test("shared amounts travel in the fragment, never in the query", () => {
    const state = updateJobSection(createDefaultState(), "next", "salary", { grossMonthly: 5100 });
    const url = new URL("/totaal" + shareHash(state), "https://nettoplaatje.nl");
    assert.equal(url.search, "");
    assert.match(url.hash, /^#p=/);
    assert.deepEqual(decodeState(readSharedParam(url) ?? ""), state);
  });

  test("older query links still load, and the cleaned URL drops both forms", () => {
    const state = updateJobSection(createDefaultState(), "current", "salary", { grossMonthly: 3900 });
    const legacy = new URL(`https://nettoplaatje.nl/totaal?p=${encodeState(state)}&utm_source=x`);
    assert.deepEqual(decodeState(readSharedParam(legacy) ?? ""), state);
    assert.equal(withoutSharedParam(legacy).toString(), "https://nettoplaatje.nl/totaal?utm_source=x");
    assert.equal(withoutSharedParam(new URL("https://nettoplaatje.nl/totaal#p=abc")).toString(), "https://nettoplaatje.nl/totaal");
    assert.equal(readSharedParam(new URL("https://nettoplaatje.nl/totaal")), null);
  });

  test("absurd shared values are capped", () => {
    const state = sanitizeState({ jobs: { current: { salary: { grossMonthly: 1e308 } } } });
    assert.equal(state.jobs.current.salary.grossMonthly, MAX_INPUT);
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

describe("writing calculator edits back into the model", () => {
  test("every mobility-calculator field round-trips through the model", () => {
    const base = toCalculatorInputs(createDefaultState(), "next");
    for (const key of Object.keys(base) as Array<keyof typeof base>) {
      if (key === "businessKm") continue;
      const original = base[key];
      const changed = typeof original === "boolean" ? !original
        : typeof original === "number" ? original + 7
        : original === "monthly" ? "scheme" : "monthly";
      const state = applyCalculatorInput(createDefaultState(), "next", key, changed as never);
      assert.deepEqual(toCalculatorInputs(state, "next")[key], changed, `field ${key}`);
      // job-specific fields must not leak into the other job
      if (!["age", "taxYear", "privateKm", "ownCarIsElectric", "fuelConsumption", "fuelPrice", "electricConsumption", "electricityPrice", "otherCarCostRate", "includeDepreciation", "depreciationMonthly"].includes(key)) {
        assert.deepEqual(toCalculatorInputs(state, "current")[key], toCalculatorInputs(createDefaultState(), "current")[key], `field ${key} leaked`);
      }
    }
  });

  test("business km are stored as extra km above commuting", () => {
    const state = applyCalculatorInput(createDefaultState(), "current", "businessKm", 15_000);
    assert.equal(state.jobs.current.mobility.extraBusinessKmPerYear, 15_000 - 2_300);
    assert.equal(toCalculatorInputs(state, "current").businessKm, 15_000);
    assert.equal(applyCalculatorInput(createDefaultState(), "current", "businessKm", 1_000).jobs.current.mobility.extraBusinessKmPerYear, 0);
  });

  test("every work-pattern field round-trips through the model", () => {
    const base = toWorkPatternInputs(createDefaultState());
    for (const key of Object.keys(base) as Array<keyof typeof base>) {
      const original = base[key];
      const changed = typeof original === "boolean" ? !original : (original as number) + 3;
      const state = applyWorkPatternInput(createDefaultState(), key, changed as never);
      assert.deepEqual(toWorkPatternInputs(state)[key], changed, `field ${key}`);
    }
  });

  test("edits mark the right section as filled", () => {
    let state = applyCalculatorInput(createDefaultState(), "next", "carValue", 50_000);
    assert.equal(state.filled.next.mobility, true);
    assert.equal(state.filled.next.salary, false);
    state = applyWorkPatternInput(state, "newChildcareDays", 2);
    assert.equal(state.filled.next.commute, true);
    state = applyWorkPatternInput(state, "currentPensionMonthly", 150);
    assert.equal(state.jobs.current.salary.pensionMode, "monthly");
    assert.equal(state.filled.current.salary, true);
  });
});
