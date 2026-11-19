import assert from "node:assert/strict";
import test from "node:test";
import {
  copySectionToNext,
  createDefaultState,
  decodeState,
  encodeState,
  sanitizeState,
  updateChild,
  updateHousehold,
  updateJob,
  updateJobSection,
  updatePersonal,
  type NettoplaatjeState,
} from "../lib/job-model.ts";
import { calculateJobTotal, compareJobs } from "../lib/job-total.ts";
import { activeChildren, careChangePatch, combinatiekortingAnnual, combinatiekortingFor, childcareHoursPerMonth, hasFormalChildcare, householdIncome, householdInput, toetsingsinkomenText } from "../lib/household.ts";
import { taxYear } from "../lib/tax-years.ts";

const householdAllowances = (state: NettoplaatjeState, job: "current" | "next") => calculateJobTotal(state, job).allowances;
import { calculateAllowances } from "../lib/toeslagen.ts";
import { combinationCredit, incomeTax } from "../lib/calculator.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

/** Partners, partner earns € 40.000, one toddler on dagopvang 3 days a week in both jobs. */
function family(): NettoplaatjeState {
  let state = updateHousehold(createDefaultState(), { enabled: true, hasPartner: true, partnerTaxableAnnual: 40_000 });
  state = updateChild(state, "c1", { active: true, age: 2, care: "dagopvang", hoursPerDay: 11, hourlyPrice: 11.23, weeksPerYear: 52 });
  for (const job of ["current", "next"] as const) state = updateJob(state, job, { childcareDaysPerWeek: 3 });
  return updateJobSection(state, "current", "mobility", { choice: "none" });
}

test("household is off by default and changes nothing", () => {
  const state = createDefaultState();
  assert.equal(state.personal.household.enabled, false);
  assert.equal(state.personal.household.hasPartner, false, "a partner without income would silently cancel kinderopvangtoeslag");
  assert.equal(householdAllowances(state, "current"), null);
  assert.deepEqual(activeChildren(state), []);
  assert.equal(encodeState(state), encodeState(sanitizeState({})), "defaults stay out of shared links");
});

test("an older saved state without a household loads with defaults", () => {
  const old = createDefaultState() as Partial<NettoplaatjeState>;
  const { household, ...personal } = old.personal!;
  assert.ok(household);
  const loaded = sanitizeState({ ...old, personal });
  assert.deepEqual(loaded.personal.household, createDefaultState().personal.household);
});

test("sanitize keeps household values within sensible bounds", () => {
  const state = sanitizeState({ personal: { household: { children: {
    c1: { active: true, care: "nanny", age: 25, hoursPerDay: 30, weeksPerYear: 60 },
    c2: { active: true, care: "bso", age: 6.8 },
  } } } });
  const { c1, c2 } = state.personal.household.children;
  assert.equal(c1.care, "none");
  assert.equal(c1.age, 17);
  assert.equal(c1.hoursPerDay, 24);
  assert.equal(c1.weeksPerYear, 52);
  assert.equal(c2.care, "bso");
  assert.equal(c2.age, 6);
});

test("household round-trips through a shared link", () => {
  const state = family();
  assert.deepEqual(decodeState(encodeState(state))?.personal.household, state.personal.household);
});

test("updateChild changes one slot only", () => {
  const state = updateChild(createDefaultState(), "c3", { active: true, age: 9, care: "bso" });
  assert.equal(state.personal.household.children.c3.age, 9);
  assert.deepEqual(state.personal.household.children.c1, createDefaultState().personal.household.children.c1);
  assert.deepEqual(activeChildren(state).map((child) => child.age), [9]);
  assert.equal(hasFormalChildcare(state), true);
  assert.equal(hasFormalChildcare(updateChild(state, "c3", { care: "none" })), false);
});

test("childcare hours per month follow the opvangdagen", () => {
  const child = family().personal.household.children.c1;
  near(childcareHoursPerMonth(child, 3), 3 * 11 * 52 / 12);
  assert.equal(childcareHoursPerMonth({ ...child, care: "none" }, 3), 0);
});

test("toeslagen use the job's taxable income plus the partner's", () => {
  const state = family();
  const own = calculateJobTotal(state, "current").taxableAnnual;
  const result = householdAllowances(state, "current")!;
  near(result.toetsingsinkomen, own + 40_000);
  const expected = calculateAllowances(own + 40_000, householdInput(state, "current", own));
  near(result.kinderopvangtoeslagMonthly, expected.kinderopvangtoeslagMonthly);
  near(result.kindgebondenBudgetMonthly, expected.kindgebondenBudgetMonthly);
  assert.ok(result.kinderopvangtoeslagMonthly > 0);
});

test("deductions lower the toetsingsinkomen; a single parent ignores the partner field", () => {
  const state = updateHousehold(family(), { deductionsAnnual: 6_000 });
  assert.equal(householdIncome(state, 50_000), 84_000);
  assert.equal(householdIncome(updateHousehold(state, { hasPartner: false }), 50_000), 44_000);
});

test("no kinderopvangtoeslag when the partner does not work", () => {
  const state = updateHousehold(family(), { partnerTaxableAnnual: 0 });
  const result = householdAllowances(state, "current")!;
  assert.equal(result.kinderopvangtoeslagMonthly, 0);
  assert.ok(result.childcareNetMonthly > 0);
});

test("fewer opvangdagen in a job means fewer childcare costs and less toeslag", () => {
  const state = updateJob(family(), "next", { childcareDaysPerWeek: 2 });
  const current = householdAllowances(state, "current")!;
  const next = householdAllowances(state, "next")!;
  assert.ok(next.childcareGrossMonthly < current.childcareGrossMonthly);
  assert.ok(next.kinderopvangtoeslagMonthly < current.kinderopvangtoeslagMonthly);
});

test("a lease car's bijtelling raises the toetsingsinkomen", () => {
  const state = updateHousehold(family(), { partnerTaxableAnnual: 45_000 });
  const without = householdAllowances(state, "current")!;
  const lease = householdAllowances(updateJobSection(state, "current", "mobility", { choice: "lease" }), "current")!;
  assert.ok(lease.toetsingsinkomen > without.toetsingsinkomen);
  assert.ok(lease.kinderopvangtoeslagMonthly <= without.kinderopvangtoeslagMonthly);
});

test("job total: toeslagen are part of what is left, and the childcare bill is the full price", () => {
  const state = family();
  const on = calculateJobTotal(state, "current");
  const off = calculateJobTotal(updateHousehold(state, { enabled: false }), "current");
  assert.equal(off.allowances, null);
  assert.equal(off.commute.childcareMonthly, 0, "simple field still 0 when toeslagen are off");
  near(on.commute.childcareMonthly, on.allowances!.childcareGrossMonthly);
  near(on.netAfterCostsMonthly, off.netAfterCostsMonthly - on.commute.childcareMonthly + on.allowances!.totalAllowancesMonthly);
});

test("job total: without formal childcare the simple per-day field still counts", () => {
  let state = updateChild(family(), "c1", { care: "none" });
  state = updatePersonal(state, { childcareCostPerDay: 20 });
  const total = calculateJobTotal(state, "current");
  near(total.commute.childcareMonthly, 3 * 20 * state.personal.workWeeksPerYear / 12);
  assert.equal(total.allowances!.kinderopvangtoeslagMonthly, 0);
  assert.ok(total.allowances!.kindgebondenBudgetMonthly >= 0);
});

test("comparing jobs: a lease car in the new job can cost toeslag", () => {
  let state = updateHousehold(family(), { partnerTaxableAnnual: 35_000 });
  state = copySectionToNext(copySectionToNext(state, "salary"), "commute");
  state = updateJobSection(state, "next", "mobility", { choice: "lease" });
  const comparison = compareJobs(state);
  assert.ok(comparison.next.allowances!.toetsingsinkomen > comparison.current.allowances!.toetsingsinkomen);
  assert.ok(comparison.next.allowances!.totalAllowancesMonthly < comparison.current.allowances!.totalAllowancesMonthly);
});

const prices = taxYear(2026).allowances.kinderopvangtoeslag.maxHourlyPrice;

test("switching to bso brings bso hours, weeks and maximum price", () => {
  const child = createDefaultState().personal.household.children.c1;
  assert.deepEqual(careChangePatch(child, "bso", prices), { care: "bso", hoursPerDay: 5, weeksPerYear: 48, hourlyPrice: prices.bso });
  assert.deepEqual(careChangePatch(child, "gastouder", prices), { care: "gastouder", hoursPerDay: 10, weeksPerYear: 52, hourlyPrice: prices.gastouder });
});

test("switching childcare keeps values the user typed", () => {
  const child = { ...createDefaultState().personal.household.children.c1, hourlyPrice: 12.5 };
  assert.deepEqual(careChangePatch(child, "bso", prices), { care: "bso", hoursPerDay: 5, weeksPerYear: 48 });
  assert.deepEqual(careChangePatch(child, "none", prices), { care: "none" });
  const fromNone = { ...child, care: "none" as const };
  assert.equal(careChangePatch(fromNone, "dagopvang", prices).hourlyPrice, prices.dagopvang, "coming from no childcare takes all defaults");
});

test("the toetsingsinkomen note mentions the partner only when there is one", () => {
  assert.match(toetsingsinkomenText(true), /partner/);
  assert.doesNotMatch(toetsingsinkomenText(false), /partner/);
});

test("combinatiekorting: 11,45% of labour income above the threshold, up to the maximum", () => {
  assert.equal(combinationCredit(6_239), 0);
  near(combinationCredit(20_000), (20_000 - 6_239) * 0.1145);
  assert.equal(combinationCredit(32_720), 3_032);
  assert.equal(combinationCredit(60_000), 3_032);
  assert.equal(combinationCredit(60_000, 68), 1_513, "lower at AOW age");
});

test("combinatiekorting: only with a child under 12, for the partner who earns the least", () => {
  let state = updateHousehold(createDefaultState(), { enabled: true, hasPartner: false });
  assert.equal(combinatiekortingFor(state, 30_000), null, "no children");
  state = updateChild(state, "c1", { active: true, age: 11, care: "none" });
  assert.equal(combinatiekortingFor(state, 30_000), "self", "single parent");
  assert.equal(combinatiekortingFor(updateChild(state, "c1", { age: 12 }), 30_000), null);
  const partner = updateHousehold(state, { hasPartner: true, partnerTaxableAnnual: 40_000 });
  assert.equal(combinatiekortingFor(partner, 30_000), "self");
  assert.equal(combinatiekortingFor(partner, 50_000), "partner");
  assert.equal(combinatiekortingFor(updateHousehold(state, { enabled: false }), 30_000), null);
});

test("combinatiekorting: earning more than the partner moves it to the partner instead of losing it", () => {
  let state = updateHousehold(createDefaultState(), { enabled: true, hasPartner: true, partnerTaxableAnnual: 40_000 });
  state = updateChild(state, "c1", { active: true, age: 4, care: "none" });
  near(combinatiekortingAnnual(state, 50_000, incomeTax(50_000)), combinationCredit(40_000));
  assert.equal(combinatiekortingAnnual(updateHousehold(state, { partnerTaxableAnnual: 0 }), 50_000, incomeTax(50_000)), 0, "a partner without work gets none");
});

test("combinatiekorting is never more than the tax left to pay", () => {
  const state = updateChild(updateHousehold(createDefaultState(), { enabled: true }), "c1", { active: true, age: 4, care: "none" });
  const tax = incomeTax(15_000);
  assert.ok(tax < combinationCredit(15_000));
  near(combinatiekortingAnnual(state, 15_000, tax), tax);
  near(combinatiekortingAnnual(state, 30_000, incomeTax(30_000)), incomeTax(30_000)); // still capped at € 30.000
  near(combinatiekortingAnnual(state, 40_000, incomeTax(40_000)), combinationCredit(40_000));
});

test("job total: the combinatiekorting is part of what is left", () => {
  let state = updateHousehold(createDefaultState(), { enabled: true, hasPartner: false });
  state = updateChild(state, "c1", { active: true, age: 4, care: "none" });
  state = updateJobSection(state, "current", "salary", { grossMonthly: 2_400 });
  state = updateJobSection(state, "current", "mobility", { choice: "none" });
  const total = calculateJobTotal(state, "current");
  const allowances = total.allowances!;
  near(allowances.combinatiekortingMonthly, Math.min(combinationCredit(total.taxableAnnual), incomeTax(total.taxableAnnual)) / 12);
  assert.ok(allowances.combinatiekortingMonthly > 0);
  near(allowances.totalAllowancesMonthly, allowances.zorgtoeslagMonthly + allowances.kindgebondenBudgetMonthly + allowances.kinderopvangtoeslagMonthly + allowances.combinatiekortingMonthly);
});
