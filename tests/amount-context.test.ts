import assert from "node:assert/strict";
import test from "node:test";
import { incomeTax } from "../lib/calculator.ts";
import { amountContext, incomeThresholds, marginalParts } from "../lib/amount-context.ts";
import { AMOUNT_PAGES, amountFigures } from "../lib/amounts.ts";
import { TAX_YEARS } from "../lib/tax-years.ts";
import { zorgtoeslagAnnual } from "../lib/toeslagen.ts";

const near = (actual: number, expected: number, tolerance: number) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("2026 thresholds follow from the tax parameters", () => {
  const t = incomeThresholds(2026);
  assert.equal(t.generalStart, 29_736);
  near(t.generalEnd, 78_424, 2); // 29.736 + 3.115 / 6,398%
  assert.equal(t.employmentPeak, 45_592);
  near(t.employmentEnd, 132_920, 2); // 45.592 + 5.685 / 6,51%
  near(zorgtoeslagAnnual(t.zorgEndSingle, false, false, 2026), 0, 0.01);
  near(zorgtoeslagAnnual(t.zorgEndPartner, true, false, 2026), 0, 0.01);
  assert.ok(zorgtoeslagAnnual(t.zorgEndSingle - 500, false, false, 2026) > 0);
});

test("the marginal parts add up to the real change in tax", () => {
  for (const income of [20_000, 27_000, 33_000, 42_000, 60_000, 90_000, 150_000]) {
    const sum = marginalParts(income, 2026).reduce((total, part) => total + part.rate, 0);
    near(sum, (incomeTax(income + 10, 35, 2026) - incomeTax(income, 35, 2026)) / 10, 0.0001);
  }
});

test("the explanation agrees with the page's own marginal rate", () => {
  for (const page of AMOUNT_PAGES) {
    const f = amountFigures(page, 2026);
    const context = amountContext(f.grossAnnual, 2026);
    near(context.marginal, f.marginalRate, 0.001);
    assert.ok(context.paragraphs.length >= 3, page.slug);
    assert.ok(context.tips.length >= 2, page.slug);
  }
});

test("pages in different income bands get a different explanation", () => {
  const texts = AMOUNT_PAGES.map((page) => amountContext(amountFigures(page, 2026).grossAnnual, 2026).paragraphs.join(" ").replace(/[\d.,%€]+/g, "#"));
  // Without the numbers, the 11 pages still fall into at least five different explanations.
  assert.ok(new Set(texts).size >= 5, `${new Set(texts).size} distinct texts`);
});

test("threshold notes: € 3.000 is just below the second bracket, € 6.000 just below the top rate", () => {
  const at = (slug: string) => amountContext(amountFigures(AMOUNT_PAGES.find((page) => page.slug === slug)!, 2026).grossAnnual, 2026);
  assert.match(at("3000-per-maand").paragraphs[0], /maar € 3 per jaar onder de tweede schijf/);
  assert.match(at("3500-per-maand").paragraphs.join(" "), /onder de afbouw van de arbeidskorting/);
  assert.match(at("6000-per-maand").paragraphs.join(" "), /onder het einde van de algemene heffingskorting en het toptarief/);
  assert.match(at("8000-per-maand").paragraphs.join(" "), /meer dan het toptarief/);
  assert.equal(at("2000-per-maand").bracketIndex, 0);
  assert.ok(at("2000-per-maand").zorgtoeslagMonthly > 100);
  assert.equal(at("5000-per-maand").zorgtoeslagMonthly, 0);
});

test("every tax year gives a complete, consistent explanation on every page", () => {
  for (const { year } of TAX_YEARS) {
    for (const page of AMOUNT_PAGES) {
      const f = amountFigures(page, year);
      const context = amountContext(f.grossAnnual, year);
      near(context.marginal, f.marginalRate, 0.001);
      const text = [...context.paragraphs, ...context.tips.map((tip) => tip.text), context.raiseAnswer].join(" ");
      assert.doesNotMatch(text, /undefined|NaN|Infinity/, `${year} ${page.slug}`);
    }
  }
});
