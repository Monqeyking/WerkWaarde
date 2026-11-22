import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { EMBED_DEFAULTS, EMBED_MESSAGE, EMBED_PATH, embedCaoNote, embedMoreUrl, embedResult, embedSnippet } from "../lib/embed.ts";
import { caoExample } from "../lib/cao-pages.ts";
import { findCao, readPrefillCao } from "../lib/caos.ts";
import { readPrefillGross, readPrefillSalaryTerms } from "../lib/job-model.ts";

const near = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${expected}, got ${actual}`);

test("embed without a cao: no pension, the holiday pay it was given", () => {
  const result = embedResult(EMBED_DEFAULTS);
  assert.equal(result.pensionMonthly, 0);
  near(result.holidayGrossAnnual, 3_500 * 12 * 0.08);
  assert.ok(result.regularNetMonthly > 2_500 && result.regularNetMonthly < 3_000);
});

test("embed with a cao gives the same net as that cao's page", () => {
  const input = { ...EMBED_DEFAULTS, caoId: "ziekenhuizen", hoursPerWeek: 36, holidayAllowancePct: 1 };
  const embed = embedResult(input);
  const page = caoExample(findCao("ziekenhuizen")!, 3_500);
  near(embed.regularNetMonthly, page.regularNetMonthly);
  near(embed.pensionMonthly, page.pensionMonthly);
  near(embed.holidayGrossAnnual, page.holidayGrossAnnual, 0.5);
});

test("odd inputs do not break the embed", () => {
  for (const input of [{ ...EMBED_DEFAULTS, grossMonthly: 0 }, { ...EMBED_DEFAULTS, grossMonthly: -50, hoursPerWeek: -1 }, { ...EMBED_DEFAULTS, caoId: "bestaat-niet" }]) {
    const result = embedResult(input);
    assert.ok(Number.isFinite(result.regularNetMonthly));
    assert.ok(result.regularNetMonthly >= 0);
  }
});

test("'more details' opens the full calculator with the same salary and cao", () => {
  const url = new URL(embedMoreUrl({ ...EMBED_DEFAULTS, grossMonthly: 4_210.4, caoId: "horeca" }));
  assert.equal(url.pathname, "/bruto-netto");
  assert.equal(readPrefillGross(url), 4_210);
  assert.equal(readPrefillCao(url)?.id, "horeca");
  assert.equal(readPrefillCao(new URL(embedMoreUrl(EMBED_DEFAULTS))), null);
});

test("the snippet has the iframe, a plain credit link and the resizer", () => {
  const snippet = embedSnippet();
  assert.match(snippet, new RegExp(`<iframe src="https://nettoplaatje\\.nl${EMBED_PATH}"[^>]*data-nettoplaatje`));
  assert.match(snippet, /<a href="https:\/\/nettoplaatje\.nl\/bruto-netto">Nettoplaatje<\/a>/);
  assert.match(snippet, /<script src="https:\/\/nettoplaatje\.nl\/embed\.js" async><\/script>/);
});

test("embed.js listens for the message the embed sends, only from nettoplaatje.nl", () => {
  const script = readFileSync("public/embed.js", "utf8");
  assert.ok(script.includes(`"${EMBED_MESSAGE}"`));
  assert.ok(script.includes('event.origin !== ORIGIN'));
  assert.ok(script.includes('"https://nettoplaatje.nl"'));
});

test("only /embed pages may be framed by other sites", () => {
  const headers = readFileSync("public/_headers", "utf8");
  const block = (path: string) => headers.split(/\r?\n(?=\/)/).find((section) => section.startsWith(`${path}\n`) || section.startsWith(`${path}\r\n`)) ?? "";
  assert.match(block("/*"), /frame-ancestors 'none'/);
  assert.match(block("/*"), /X-Frame-Options: DENY/);
  assert.match(block("/embed/*"), /! X-Frame-Options/);
  assert.doesNotMatch(block("/embed/*"), /frame-ancestors/);
});

test("the details link passes on hours and holiday pay, so the site shows the same result", () => {
  const input = { ...EMBED_DEFAULTS, grossMonthly: 3_200, hoursPerWeek: 24, holidayAllowancePct: 12 };
  const url = new URL(embedMoreUrl(input));
  assert.deepEqual(readPrefillSalaryTerms(url), { hoursPerWeek: 24, holidayAllowancePct: 12 });
  // With a cao that sets holiday pay, the cao decides it on the site as well.
  assert.deepEqual(readPrefillSalaryTerms(new URL(embedMoreUrl({ ...input, caoId: "rijk" }))), { hoursPerWeek: 24 });
  assert.deepEqual(readPrefillSalaryTerms(new URL("https://nettoplaatje.nl/bruto-netto#uren=0&vakantiegeld=abc")), {});
});

test("the cao note names only what that cao adds", () => {
  assert.equal(embedCaoNote(findCao("rijk")!), "Met vakantiegeld, 13e maand en pensioen volgens de cao Rijk.");
  assert.doesNotMatch(embedCaoNote(findCao("horeca")!), /13e maand/);
});

test("a prefill amount that rounds to zero is ignored", () => {
  assert.equal(readPrefillGross(new URL("https://nettoplaatje.nl/bruto-netto#bruto=0.001")), null);
});
