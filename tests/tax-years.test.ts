import assert from "node:assert/strict";
import test from "node:test";
import { annualCarBenefit, incomeTax } from "../lib/calculator.ts";
import { calculateJobTotal } from "../lib/job-total.ts";
import { createDefaultState, sanitizeState, updatePersonal } from "../lib/job-model.ts";
import { DEFAULT_TAX_YEAR, TAX_YEARS, creditAt, electricBijtellingText, kmLimitText, selectableTaxYears, taxYear } from "../lib/tax-years.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("default year is 2026 and only published years are selectable", () => {
  assert.equal(DEFAULT_TAX_YEAR, 2026);
  assert.deepEqual(selectableTaxYears(), TAX_YEARS.filter((params) => params.published).map((params) => params.year));
  assert.ok(selectableTaxYears().includes(2026));
  assert.equal(taxYear(1999).year, DEFAULT_TAX_YEAR, "unknown years fall back to the default");
});

test("incomeTax without a year equals 2026", () => {
  for (const income of [0, 15_000, 38_883, 50_000, 100_000]) {
    assert.equal(incomeTax(income), incomeTax(income, 35, 2026));
    assert.equal(incomeTax(income, 70), incomeTax(income, 70, 2026));
  }
});

test("2027 provisional figures: brackets, general credit and arbeidskorting from the Belastingplan", () => {
  const brackets = 39_247 * 0.3609 + (50_000 - 39_247) * 0.3802;
  const general = 3_154 - 0.06638 * (50_000 - 30_910);
  const employment = 5_773 - 0.0651 * (50_000 - 47_834);
  near(incomeTax(50_000, 35, 2027), brackets - general - employment);
  // The general credit runs out at the end of bracket 2, as in the official tables.
  near(3_154 - 0.06638 * (78_426 - 30_910), 0, 2);
});

test("credit segments connect at every knikpunt (no jumps)", () => {
  for (const params of TAX_YEARS) {
    for (const segments of [params.employmentCredit, params.employmentCreditAow]) {
      for (let index = 1; index < segments.length; index += 1) {
        const previous = segments[index - 1];
        const reached = previous.base + previous.rate * (segments[index].from - previous.from);
        near(reached, segments[index].base, 2);
      }
      assert.equal(creditAt(segments, 0), 0);
      assert.equal(creditAt(segments, 1_000_000), 0);
    }
  }
});

test("electric bijtelling uses the year's rate", () => {
  near(annualCarBenefit(40_000, true, 22, 2026), 30_000 * 0.18 + 10_000 * 0.22);
  near(annualCarBenefit(40_000, true, 22, 2027), 30_000 * 0.20 + 10_000 * 0.22);
  near(annualCarBenefit(40_000, false, 22, 2027), 8_800);
});

test("the model's tax year drives the total", () => {
  const state2026 = createDefaultState();
  const state2027 = updatePersonal(state2026, { taxYear: 2027 });
  const tax2026 = calculateJobTotal(state2026, "current").income.taxMonthly;
  const tax2027 = calculateJobTotal(state2027, "current").income.taxMonthly;
  assert.notEqual(tax2026, tax2027);
});

test("stored or shared states with an unavailable year fall back to the default", () => {
  assert.equal(sanitizeState({ personal: { taxYear: 1999 } }).personal.taxYear, DEFAULT_TAX_YEAR);
  if (!taxYear(2027).published) assert.equal(sanitizeState({ personal: { taxYear: 2027 } }).personal.taxYear, DEFAULT_TAX_YEAR);
  assert.equal(sanitizeState({ personal: { taxYear: 2026 } }).personal.taxYear, 2026);
});

test("year texts for hints", () => {
  assert.equal(kmLimitText(2026), "€ 0,25");
  assert.equal(electricBijtellingText(2026), "18% tot € 30.000, 22% over de rest");
  assert.equal(electricBijtellingText(2027), "20% tot € 30.000, 22% over de rest");
});
