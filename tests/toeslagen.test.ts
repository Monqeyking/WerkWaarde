import assert from "node:assert/strict";
import test from "node:test";
import { TAX_YEARS } from "../lib/tax-years.ts";
import {
  calculateAllowances,
  kindgebondenBudgetAnnual,
  kindgebondenBudgetMax,
  kinderopvangPercentage,
  kinderopvangtoeslag,
  toetsingsinkomen,
  zorgtoeslagAnnual,
  type ChildInput,
} from "../lib/toeslagen.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

const child = (patch: Partial<ChildInput> = {}): ChildInput => ({ age: 2, care: "dagopvang", hoursPerMonth: 100, hourlyPrice: 11, ...patch });

test("toetsingsinkomen adds the partner and subtracts deductions, never below zero", () => {
  assert.equal(toetsingsinkomen(50_000), 50_000);
  assert.equal(toetsingsinkomen(50_000, 30_000, 8_000), 72_000);
  assert.equal(toetsingsinkomen(10_000, 0, 20_000), 0);
  assert.equal(toetsingsinkomen(-5, -5, -5), 0);
});

test("zorgtoeslag 2026 reproduces the Belastingdienst table", () => {
  // [income, partner, euros per month] from belastingdienst.nl "Hoeveel zorgtoeslag"
  const rows: Array<[number, boolean, number]> = [
    [29_500, false, 129], [30_000, false, 126], [33_000, false, 91], [36_000, false, 57], [39_000, false, 23],
    [29_500, true, 246], [35_000, true, 186], [40_000, true, 129], [45_000, true, 72], [50_000, true, 15],
  ];
  for (const [income, partner, monthly] of rows) near(zorgtoeslagAnnual(income, partner) / 12, monthly, 1.5);
  assert.equal(zorgtoeslagAnnual(41_100, false), 0, "none from about € 41.000 alone");
  assert.equal(zorgtoeslagAnnual(51_500, true), 0, "none from about € 51.500 together");
  assert.equal(zorgtoeslagAnnual(20_000, false, true), 0, "none with wealth above the limit");
});

test("kindgebonden budget 2026: maximum amounts", () => {
  assert.equal(kindgebondenBudgetMax([], true), 0);
  assert.equal(kindgebondenBudgetMax([4], true), 2_580);
  assert.equal(kindgebondenBudgetMax([4, 8], true), 5_160);
  assert.equal(kindgebondenBudgetMax([8], false), 5_996, "alleenstaande-ouderkop");
  assert.equal(kindgebondenBudgetMax([4, 8], false), 8_576);
  assert.equal(kindgebondenBudgetMax([11, 12, 15, 16, 17, 18], true), 5 * 2_580 + 2 * 724 + 2 * 964, "18+ does not count");
});

test("kindgebonden budget 2026 matches the worked examples", () => {
  near(kindgebondenBudgetAnnual(44_000, [4, 8], true), 4_790.72); // Henk en Karin
  near(kindgebondenBudgetAnnual(52_000, [13, 16], true), 5_870.72); // Frank en Robin
  near(kindgebondenBudgetAnnual(31_000, [8], false), 5_899.94); // Carla, alleenstaand
  assert.equal(kindgebondenBudgetAnnual(39_141, [4], true), 2_580, "full amount up to the threshold");
  assert.equal(kindgebondenBudgetAnnual(100_000, [4], true), 0);
  assert.equal(kindgebondenBudgetAnnual(30_000, [4], true, true), 0, "none with wealth above the limit");
});

test("kinderopvangtoeslag percentages follow the 2026 table", () => {
  assert.equal(kinderopvangPercentage(0, true), 0.96);
  assert.equal(kinderopvangPercentage(56_412, true), 0.96);
  assert.equal(kinderopvangPercentage(56_413, true), 0.955);
  assert.equal(kinderopvangPercentage(56_413, false), 0.956);
  assert.equal(kinderopvangPercentage(95_000, true), 0.767);
  assert.equal(kinderopvangPercentage(500_000, true), 0.365);
  assert.equal(kinderopvangPercentage(500_000, false), 0.682);
});

test("kinderopvangtoeslag tables are sorted and never rise with income", () => {
  for (const params of TAX_YEARS) {
    const { table } = params.allowances.kinderopvangtoeslag;
    assert.equal(table[0][0], 0, `${params.year}: table starts at 0`);
    for (let index = 1; index < table.length; index += 1) {
      assert.ok(table[index][0] > table[index - 1][0], `${params.year}: sorted at ${table[index][0]}`);
      assert.ok(table[index][1] <= table[index - 1][1] && table[index][2] <= table[index - 1][2], `${params.year}: falls at ${table[index][0]}`);
      assert.ok(table[index][2] >= table[index][1], `${params.year}: other children get at least the first-child rate`);
    }
  }
});

test("kinderopvangtoeslag caps the hourly price and the hours", () => {
  const [result] = kinderopvangtoeslag(50_000, { parentsWork: true, children: [child({ hourlyPrice: 12.5 })] });
  near(result.grossMonthly, 1_250);
  near(result.allowanceMonthly, 100 * 11.23 * 0.96);
  near(result.netMonthly, 1_250 - 100 * 11.23 * 0.96);
  const [capped] = kinderopvangtoeslag(50_000, { parentsWork: true, children: [child({ hoursPerMonth: 300 })] });
  assert.equal(capped.hoursPerMonth, 230);
  const [cheap] = kinderopvangtoeslag(50_000, { parentsWork: true, children: [child({ care: "bso", hourlyPrice: 9 })] });
  near(cheap.allowanceMonthly, 100 * 9 * 0.96, 0.001);
});

test("kinderopvangtoeslag: the child with the most hours is the first child", () => {
  const results = kinderopvangtoeslag(100_000, { parentsWork: true, children: [
    child({ care: "bso", hoursPerMonth: 40, hourlyPrice: 9 }),
    child({ hoursPerMonth: 120 }),
    child({ care: "none", hoursPerMonth: 200 }),
  ] });
  assert.equal(results.length, 2, "a child without childcare is skipped");
  assert.deepEqual(results.map((result) => result.firstChild), [false, true]);
  assert.equal(results[1].percentage, 0.721);
  assert.equal(results[0].percentage, 0.905);
});

test("kinderopvangtoeslag requires working parents", () => {
  const [result] = kinderopvangtoeslag(30_000, { parentsWork: false, children: [child()] });
  assert.equal(result.allowanceMonthly, 0);
  near(result.netMonthly, result.grossMonthly);
});

test("calculateAllowances adds everything up per month", () => {
  const household = { hasPartner: true, parentsWork: true, assetsAboveLimit: false, children: [child(), child({ age: 7, care: "bso", hoursPerMonth: 50, hourlyPrice: 9.5 })] };
  const result = calculateAllowances(45_000, household);
  near(result.kindgebondenBudgetMonthly, kindgebondenBudgetAnnual(45_000, [2, 7], true) / 12);
  near(result.zorgtoeslagMonthly, zorgtoeslagAnnual(45_000, true) / 12);
  near(result.kinderopvangtoeslagMonthly, 100 * 11 * 0.96 + 50 * 9.5 * 0.96);
  near(result.childcareNetMonthly, result.childcareGrossMonthly - result.kinderopvangtoeslagMonthly);
  near(result.totalAllowancesMonthly, result.zorgtoeslagMonthly + result.kindgebondenBudgetMonthly + result.kinderopvangtoeslagMonthly);
  assert.equal(calculateAllowances(45_000, { ...household, children: [] }).kinderopvangtoeslagMonthly, 0);
});
