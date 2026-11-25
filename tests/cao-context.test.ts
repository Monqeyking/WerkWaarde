import assert from "node:assert/strict";
import test from "node:test";
import { caoContext, employerPensionAnnual, extrasPct } from "../lib/cao-context.ts";
import { CAOS, findCao } from "../lib/caos.ts";
import { caoExample } from "../lib/cao-pages.ts";
import { TAX_YEARS } from "../lib/tax-years.ts";

const text = (id: string) => caoContext(findCao(id)!, 2026).paragraphs.join(" ");

test("every cao gets a complete explanation in every tax year", () => {
  for (const { year } of TAX_YEARS) {
    for (const cao of CAOS) {
      const context = caoContext(cao, year);
      assert.ok(context.paragraphs.length >= 3, `${year} ${cao.id}`);
      assert.doesNotMatch(context.paragraphs.join(" "), /undefined|NaN|Infinity|null/, `${year} ${cao.id}`);
    }
  }
});

test("the explanation names what sets a cao apart", () => {
  assert.match(text("politie"), /17,86% van je jaarsalaris extra\. Dat is het hoogste van de cao's hier/);
  assert.match(text("horeca"), /tot €\s52\.294 per jaar, de laagste grens/);
  assert.match(text("horeca"), /het laagste werkgeversdeel/);
  assert.match(text("ziekenhuizen"), /het hoogste eigen deel/);
  assert.match(text("uitzendkrachten-abu"), /regeling van de opdrachtgever/);
  assert.match(text("mbo"), /De cao MBO, de cao Primair onderwijs en de cao Voortgezet onderwijs regelen .* hetzelfde/);
  assert.match(text("metalektro"), /pensioen bij PME in plaats van PMT/);
});

test("employer pension and the comparison with a plain job follow the calculator", () => {
  const cao = findCao("beroepsgoederenvervoer")!;
  const own = caoExample(cao, 3_500, 2026).pensionMonthly * 12;
  // Employee pays 33,87% of the total, so the employer pays the rest.
  assert.ok(Math.abs(employerPensionAnnual(cao, 3_500, 2026) - own * (100 - 33.87) / 33.87) < 0.01);
  assert.ok(caoContext(findCao("politie")!, 2026).netVersusPlain > 0);
  assert.ok(caoContext(cao, 2026).netVersusPlain < 0);
  assert.equal(extrasPct(findCao("uitzendkrachten-abu")!), null);
});

test("cao's with different terms get a different explanation", () => {
  const texts = CAOS.map((cao) => caoContext(cao, 2026).paragraphs.join(" ").replace(/[\d.,%€]+/g, "#"));
  assert.equal(new Set(texts).size, CAOS.length);
});
