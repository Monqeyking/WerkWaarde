import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { detailUrl, monthlyGross, netFor, netLabel, parseAmount, parseSalary } from "../extension/src/salary.ts";
import { amountFigures, getAmountPage } from "../lib/amounts.ts";
import { readPrefillGross } from "../lib/job-model.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("Dutch amounts: thousands with dots, cents with a comma, ',-' and a full stop after", () => {
  assert.equal(parseAmount("3.903"), 3_903);
  assert.equal(parseAmount("4.822,50"), 4_822.5);
  assert.equal(parseAmount("3.903,-"), 3_903);
  assert.equal(parseAmount("45000"), 45_000);
  assert.equal(parseAmount("4.102."), 4_102);
  assert.equal(parseAmount("18,5"), 18.5);
  assert.equal(parseAmount("3.90"), null);
});

test("salaries as the vacancy sites show them (November 2026)", () => {
  // Indeed
  assert.deepEqual(parseSalary("€ 3.903 - € 5.503 per maand"), { min: 3_903, max: 5_503, period: "maand" });
  assert.deepEqual(parseSalary("Tot € 4.822,50 per maand"), { min: 4_822.5, max: 4_822.5, period: "maand", bound: "tot" });
  assert.deepEqual(parseSalary("€ 3.903,- tot maximaal € 5.503, - bruto per maand"), { min: 3_903, max: 5_503, period: "maand" });
  // Werkzoeken.nl
  assert.deepEqual(parseSalary("€ 2.913 - € 4.370 p/m"), { min: 2_913, max: 4_370, period: "maand" });
  assert.deepEqual(parseSalary("€ 4.102 p/m"), { min: 4_102, max: 4_102, period: "maand" });
  // Nationale Vacaturebank search results: a range without a period
  assert.deepEqual(parseSalary("€3.333 - €4.457"), { min: 3_333, max: 4_457, period: "maand" });
  assert.deepEqual(parseSalary("€ 16,50 - € 19,00 per uur"), { min: 16.5, max: 19, period: "uur" });
  assert.deepEqual(parseSalary("€ 45.000 - € 60.000 per jaar"), { min: 45_000, max: 60_000, period: "jaar" });
  assert.deepEqual(parseSalary("Vanaf € 3.000 per maand"), { min: 3_000, max: 3_000, period: "maand", bound: "vanaf" });
});

test("amounts that are not a salary are left alone", () => {
  assert.equal(parseSalary("€4.244"), null, "a lone amount without a period");
  assert.equal(parseSalary("€ 50 per maand internetvergoeding"), null);
  assert.equal(parseSalary("€ 2.500 bonus per jaar"), null);
  assert.equal(parseSalary("€ 0,23 per km"), null);
  assert.equal(parseSalary("€ 1.000 - € 9.000 per maand"), null, "too wide to be one salary");
  assert.equal(parseSalary("Geen bedrag"), null);
  assert.equal(parseSalary(`${"Lange tekst. ".repeat(30)}€ 3.000 per maand`), null);
});

test("the net matches the amount pages on the site", () => {
  const page = amountFigures(getAmountPage("3500-per-maand")!);
  near(netFor(3_500, "maand"), page.regularNetMonthly);
  const yearly = amountFigures(getAmountPage("60000-per-jaar")!);
  near(netFor(60_000, "jaar"), yearly.netAnnual);
  near(monthlyGross(20, "uur"), 20 * 40 * 52 / 12);
  assert.ok(netFor(20, "uur") > 10 && netFor(20, "uur") < 20);
});

test("labels and the link to the full calculator", () => {
  assert.match(netLabel({ min: 3_903, max: 5_503, period: "maand" }), /^≈ € [\d.]+ – € [\d.]+ netto p\/m$/);
  assert.match(netLabel({ min: 4_822.5, max: 4_822.5, period: "maand", bound: "tot" }), /^tot ≈ € [\d.]+ netto p\/m$/);
  assert.match(netLabel({ min: 18, max: 18, period: "uur" }), /^≈ € \d+,\d\d netto per uur$/);
  assert.equal(readPrefillGross(new URL(detailUrl({ min: 3_000, max: 4_000, period: "maand" }))), 3_500);
  assert.equal(readPrefillGross(new URL(detailUrl({ min: 60_000, max: 60_000, period: "jaar" }))), 4_630);
});

test("manifest: runs only on the three vacancy sites and asks for no permissions", () => {
  const manifest = JSON.parse(readFileSync("extension/static/manifest.json", "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://nl.indeed.com/*", "https://www.nationalevacaturebank.nl/*", "https://www.werkzoeken.nl/*",
  ]);
  assert.ok(manifest.description.length <= 132, "Chrome Web Store limit");
  assert.ok(manifest.name.length <= 75);
});
