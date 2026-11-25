import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AMOUNT_PAGES, RETIRED_AMOUNT_PAGES, amountFigures, amountPath, amountTitle, getAmountPage, monthlyGrossFor, nearbyAmounts, prefillPath,
} from "../lib/amounts.ts";
import { MAX_INPUT, readPrefillGross } from "../lib/job-model.ts";

const near = (actual: number, expected: number, tolerance: number) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("amount pages have unique slugs and a sensible count", () => {
  const slugs = AMOUNT_PAGES.map((page) => page.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  // Few pages on purpose: dozens of near-identical pages read as thin content.
  assert.ok(slugs.length >= 8 && slugs.length <= 14, `${slugs.length} pages`);
  assert.equal(getAmountPage("3500-per-maand")?.amount, 3500);
  assert.equal(getAmountPage("1234-per-maand"), undefined);
});

test("every removed amount page redirects to the calculator with its amount", () => {
  const live = new Set(AMOUNT_PAGES.map((page) => page.slug));
  const rules = new Map(readFileSync("public/_redirects", "utf8").split(/\r?\n/)
    .filter((line) => line.startsWith("/bruto-netto/"))
    .map((line) => { const [from, to, status] = line.trim().split(/\s+/); return [from, { to, status }] as const; }));
  assert.equal(rules.size, RETIRED_AMOUNT_PAGES.length);
  for (const page of RETIRED_AMOUNT_PAGES) {
    assert.ok(!live.has(page.slug), `${page.slug} is both live and retired`);
    assert.deepEqual(rules.get(amountPath(page)), { to: prefillPath(page), status: "301" }, page.slug);
  }
});

test("€ 3.200 per month matches the 2026 example (about € 2.731 net)", () => {
  near(amountFigures({ slug: "", kind: "maand", amount: 3200 }, 2026).regularNetMonthly, 2731, 3);
});

test("a yearly amount includes holiday allowance", () => {
  const page = getAmountPage("60000-per-jaar")!;
  near(monthlyGrossFor(page) * 12 * 1.08, 60_000, 0.01);
  near(amountFigures(page).grossAnnual, 60_000, 0.5);
});

test("net rises with gross, and part time earns less", () => {
  const monthly = AMOUNT_PAGES.filter((page) => page.kind === "maand").map((page) => amountFigures(page));
  for (let index = 1; index < monthly.length; index += 1) {
    assert.ok(monthly[index].regularNetMonthly > monthly[index - 1].regularNetMonthly);
  }
  for (const figures of monthly) {
    const [h32, h36] = figures.partTime;
    assert.ok(h32.netMonthly < h36.netMonthly && h36.netMonthly < figures.regularNetMonthly);
  }
});

test("titles fit in search results (about 60 chars with the site suffix)", () => {
  for (const page of AMOUNT_PAGES) {
    const title = `${amountTitle(amountFigures(page))} | Nettoplaatje`;
    assert.ok(title.length <= 62, `${page.slug}: "${title}" is ${title.length} chars`);
  }
});

test("nearby amounts stay within the same kind and include the page itself", () => {
  const page = getAmountPage("3500-per-maand")!;
  const around = nearbyAmounts(page);
  assert.deepEqual(around.map((other) => other.amount), [3000, 3250, 3500, 3750, 4000]);
  assert.ok(around.every((other) => other.kind === "maand"));
  assert.equal(around[2], page);
  assert.deepEqual(nearbyAmounts(getAmountPage("40000-per-jaar")!).map((other) => other.amount), [35000, 37500, 40000, 42500, 45000]);
});

test("prefill link carries the monthly gross and is read back safely", () => {
  const url = new URL(prefillPath(getAmountPage("60000-per-jaar")!), "https://nettoplaatje.nl");
  assert.equal(url.pathname, "/bruto-netto");
  assert.equal(url.search, "", "the amount travels in the fragment");
  assert.equal(readPrefillGross(url), Math.round(60_000 / 12.96));
  assert.equal(readPrefillGross(new URL("https://nettoplaatje.nl/bruto-netto#bruto=abc")), null);
  assert.equal(readPrefillGross(new URL("https://nettoplaatje.nl/bruto-netto#bruto=-5")), null);
  assert.equal(readPrefillGross(new URL(`https://nettoplaatje.nl/bruto-netto#bruto=${MAX_INPUT * 10}`)), null);
  assert.equal(readPrefillGross(new URL("https://nettoplaatje.nl/bruto-netto")), null);
});
