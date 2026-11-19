import assert from "node:assert/strict";
import test from "node:test";
import { CAOS, findCao, readPrefillCao } from "../lib/caos.ts";
import { amountFigures, getAmountPage } from "../lib/amounts.ts";
import { readPrefillGross } from "../lib/job-model.ts";
import {
  CAO_EXAMPLE_SALARIES, caoDescription, caoExample, caoFigures, caoPrefillPath, caoSummary, caoTitle,
  caosBySector, employeeRatePct, getCao, sectorSiblings,
} from "../lib/cao-pages.ts";

/** The title Google shows: with " | Nettoplaatje" when that fits in 60 characters (see pageMetadata). */
const shownTitle = (title: string) => (title.length + " | Nettoplaatje".length <= 60 ? `${title} | Nettoplaatje` : title);

test("every cao has a page slug, a title and a description that fit in search results", () => {
  for (const cao of CAOS) {
    assert.match(cao.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.equal(getCao(cao.id), cao);
    assert.ok(shownTitle(caoTitle(cao)).length <= 60, `${cao.id}: "${caoTitle(cao)}"`);
    const description = caoDescription(caoFigures(cao));
    assert.ok(description.length <= 160, `${cao.id}: description is ${description.length} chars`);
    assert.ok(description.length >= 100, `${cao.id}: description is short`);
    assert.match(description, cao.pension ? new RegExp(`pensioen bij ${cao.pension.fund}`) : /netto/, `${cao.id}: description keeps the details`);
  }
});

test("long cao names drop their bracketed part in the title", () => {
  assert.equal(caoTitle(findCao("vvt")!, 2026), "Cao VVT 2026: netto salaris en pensioen");
  assert.equal(caoTitle(findCao("ziekenhuizen")!, 2026), "Cao Ziekenhuizen 2026: netto salaris en pensioen");
});

test("employee premium is the employee's share of the total premium", () => {
  assert.equal(employeeRatePct(findCao("ziekenhuizen")!), 12.95);
  assert.equal(employeeRatePct(findCao("rijk")!), 8.13);
});

test("cao examples include the pension premium and the cao's holiday pay and 13th month", () => {
  const cao = findCao("ziekenhuizen")!;
  const example = caoExample(cao, 3_500);
  const plain = amountFigures(getAmountPage("3500-per-maand")!);
  assert.ok(example.pensionMonthly > 200 && example.pensionMonthly < 400, `pension ${example.pensionMonthly}`);
  assert.ok(example.regularNetMonthly < plain.regularNetMonthly, "pension lowers the monthly net");
  assert.ok(Math.abs(example.holidayGrossAnnual - 3_500 * 12 * 0.0833) < 1);
  assert.ok(example.yearEndGrossAnnual > 0);
  assert.equal(caoExample(findCao("horeca")!, 3_500).yearEndGrossAnnual, 0);
  const rows = caoFigures(cao).examples;
  assert.deepEqual(rows.map((row) => row.grossMonthly), [...CAO_EXAMPLE_SALARIES]);
  for (let index = 1; index < rows.length; index++) assert.ok(rows[index].regularNetMonthly > rows[index - 1].regularNetMonthly);
});

test("the intro describes holiday pay, 13th month and pension in plain words", () => {
  assert.match(caoSummary(findCao("horeca")!), /maar geen 13e maand/);
  assert.match(caoSummary(findCao("uitzendkrachten-abu")!), /regeling van de opdrachtgever/);
  assert.match(caoSummary(findCao("ziekenhuizen")!), /8,33% vakantiegeld en een 13e maand van 8,33%.*PFZW.*12,95%/);
});

test("sector groups cover every cao once, and siblings share the sector", () => {
  assert.equal(caosBySector().flatMap((group) => group.caos).length, CAOS.length);
  const cao = findCao("vvt")!;
  for (const other of sectorSiblings(cao)) assert.equal(other.sector, cao.sector);
  assert.ok(!sectorSiblings(cao).includes(cao));
});

test("prefill links: a cao page opens the calculator with that cao, unknown ids are ignored", () => {
  const cao = findCao("politie")!;
  const url = new URL(`https://nettoplaatje.nl${caoPrefillPath(cao)}`);
  assert.equal(readPrefillCao(url), cao);
  assert.equal(readPrefillGross(url), null);
  assert.equal(readPrefillCao(new URL("https://nettoplaatje.nl/bruto-netto#cao=bestaat-niet")), null);
  assert.equal(readPrefillCao(new URL("https://nettoplaatje.nl/bruto-netto#bruto=3500")), null);
  const both = new URL("https://nettoplaatje.nl/bruto-netto#bruto=3500&cao=horeca");
  assert.equal(readPrefillCao(both)?.id, "horeca");
  assert.equal(readPrefillGross(both), 3_500);
});
