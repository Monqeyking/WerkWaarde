import assert from "node:assert/strict";
import test from "node:test";
import { calculateSalaryBreakdown, incomeTax } from "../lib/calculator.ts";
import { expatAllowance, expatLimit, taxableAfterExpat } from "../lib/expat.ts";
import { createDefaultState, sanitizeState, toCalculatorInputs, updateJobSection } from "../lib/job-model.ts";
import { calculateJobTotal } from "../lib/job-total.ts";
import { grossToNet } from "../lib/spokes.ts";
import { taxYear } from "../lib/tax-years.ts";

const near = (actual: number, expected: number, tolerance = 0.5) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("Belastingdienst examples 2026: 30%, the salary norm and the WNT maximum", () => {
  // "Inhoud van de expatregeling": € 70.000 incl. allowance -> max € 21.000.
  near(expatAllowance(70_000, "standard", 2026), 21_000);
  // € 50.000 incl. allowance: the rest must stay above € 48.013 -> € 1.987.
  near(expatAllowance(50_000, "standard", 2026), 1_987);
  assert.equal(expatLimit(50_000, "standard", 2026), "norm");
  // At or above € 262.000 the maximum is € 78.600.
  near(expatAllowance(262_000, "standard", 2026), 78_600);
  near(expatAllowance(400_000, "standard", 2026), 78_600);
  assert.equal(expatLimit(400_000, "standard", 2026), "cap");
});

test("lower norm under 30 with a master's degree, nothing below the norm, nothing without the regeling", () => {
  near(expatAllowance(40_000, "youngMaster", 2026), 40_000 - 36_497);
  assert.equal(expatAllowance(40_000, "standard", 2026), 0);
  assert.equal(expatLimit(40_000, "standard", 2026), "belowNorm");
  assert.equal(expatAllowance(100_000, "none", 2026), 0);
  assert.equal(expatAllowance(100_000, undefined, 2026), 0);
  assert.equal(taxableAfterExpat(100_000, "standard", 2026), 70_000);
});

test("27% from 2027", () => {
  assert.equal(taxYear(2027).expatRuling.rate, 0.27);
  near(expatAllowance(100_000, "standard", 2027), 27_000);
});

test("net pay keeps the whole wage and pays tax only on the taxable rest", () => {
  const state = updateJobSection(createDefaultState(), "current", "salary", { grossMonthly: 6_000, expatRuling: "standard" });
  const total = calculateJobTotal(state, "current");
  const wage = 6_000 * 12 * 1.08;
  near(total.income.expatAllowanceMonthly * 12, wage * 0.3);
  near(total.income.netPayMonthly * 12, wage - incomeTax(wage * 0.7, 35, 2026), 1);
  // Toeslagen and other income tests use the taxable part only.
  near(total.taxableAnnual, wage * 0.7, 1);
});

test("without the regeling nothing changes, and all calculators agree with it", () => {
  const base = createDefaultState();
  const withRuling = updateJobSection(base, "current", "salary", { expatRuling: "standard", grossMonthly: 7_000 });
  const plain = updateJobSection(base, "current", "salary", { grossMonthly: 7_000 });
  assert.equal(calculateJobTotal(plain, "current").income.expatAllowanceMonthly, 0);
  assert.ok(grossToNet(withRuling, "current").regularNetMonthly > grossToNet(plain, "current").regularNetMonthly + 500);
  // The mobility calculator's salary breakdown uses the same regular-month method.
  near(calculateSalaryBreakdown(toCalculatorInputs(withRuling, "current")).netMonthlyRegular, grossToNet(withRuling, "current").regularNetMonthly, 1);
});

test("stored or shared state with an unknown value falls back to no regeling", () => {
  const raw = JSON.parse(JSON.stringify(createDefaultState()));
  raw.jobs.current.salary.expatRuling = "everything";
  delete raw.jobs.next.salary.expatRuling;
  const state = sanitizeState(raw);
  assert.equal(state.jobs.current.salary.expatRuling, "none");
  assert.equal(state.jobs.next.salary.expatRuling, "none");
});
