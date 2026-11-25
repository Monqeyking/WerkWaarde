import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { enAmountContext, fullRulingFrom } from "../lib/en-amount-context.ts";
import { EN_AMOUNT_PAGES, EN_RETIRED_AMOUNT_PAGES, enAmountFigures, enAmountPath, enPrefillPath } from "../lib/en-amounts.ts";
import { TAX_YEARS } from "../lib/tax-years.ts";

const at = (slug: string, year = 2026) => enAmountContext(enAmountFigures(EN_AMOUNT_PAGES.find((page) => page.slug === slug)!, year));

test("few English salary pages, and every removed one redirects to the calculator", () => {
  assert.ok(EN_AMOUNT_PAGES.length >= 3 && EN_AMOUNT_PAGES.length <= 8, `${EN_AMOUNT_PAGES.length} pages`);
  const live = new Set(EN_AMOUNT_PAGES.map((page) => page.slug));
  const rules = new Map(readFileSync("public/_redirects", "utf8").split(/\r?\n/)
    .filter((line) => line.startsWith("/en/"))
    .map((line) => { const [from, to, status] = line.trim().split(/\s+/); return [from, { to, status }] as const; }));
  assert.equal(rules.size, EN_RETIRED_AMOUNT_PAGES.length);
  for (const page of EN_RETIRED_AMOUNT_PAGES) {
    assert.ok(!live.has(page.slug), `${page.slug} is both live and retired`);
    assert.deepEqual(rules.get(enAmountPath(page)), { to: enPrefillPath(page), status: "301" }, page.slug);
  }
});

test("the pages cover all three zones of the 30% ruling", () => {
  assert.equal(at("3000-gross-per-month").zone, "belowNorm");
  assert.equal(at("60000-gross-per-year").zone, "norm");
  assert.equal(at("70000-gross-per-year").zone, "full");
  assert.match(at("3000-gross-per-month").rulingParagraphs[0], /under 30 with a master's degree/);
  assert.match(at("60000-gross-per-year").rulingParagraphs.join(" "), /every extra euro goes into the tax-free allowance/);
  assert.match(at("100000-gross-per-year").taxParagraphs.join(" "), /more than the top rate/);
  assert.match(at("100000-gross-per-year").rulingParagraphs[0], /Without the ruling part of your salary would be taxed at the top rate/);
});

test("the full ruling starts where 30% of the salary equals the part above the norm", () => {
  const from = fullRulingFrom(2026);
  assert.ok(Math.abs(from * 0.3 - (from - 48_013)) < 0.01);
  // In the norm zone a raise is tax-free under the ruling.
  assert.equal(enAmountFigures(EN_AMOUNT_PAGES.find((page) => page.slug === "60000-gross-per-year")!, 2026).ruling.marginalRate, 0);
});

test("every tax year gives a complete explanation on every English page", () => {
  for (const { year } of TAX_YEARS) {
    for (const page of EN_AMOUNT_PAGES) {
      const context = enAmountContext(enAmountFigures(page, year));
      const text = [...context.taxParagraphs, ...context.rulingParagraphs, context.raiseAnswer].join(" ");
      assert.doesNotMatch(text, /undefined|NaN|Infinity/, `${year} ${page.slug}`);
      assert.ok(context.rulingParagraphs.length >= 1 && context.taxParagraphs.length >= 3, `${year} ${page.slug}`);
    }
  }
});

test("pages in different zones get a different explanation", () => {
  const texts = EN_AMOUNT_PAGES.map((page) => {
    const context = enAmountContext(enAmountFigures(page, 2026));
    return [...context.rulingParagraphs, ...context.taxParagraphs].join(" ").replace(/[\d.,%€]+/g, "#");
  });
  assert.equal(new Set(texts).size, EN_AMOUNT_PAGES.length);
});
