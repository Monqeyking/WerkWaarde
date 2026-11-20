import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { AMOUNT_PAGES, amountPath } from "../lib/amounts.ts";
import { EN_ARTICLES } from "../lib/en-articles.ts";
import { EN_AMOUNT_PAGES, dutchAmountPath, enAmountDescription, enAmountFigures, enAmountPath, enAmountTitle, euroEn } from "../lib/en-amounts.ts";
import { moneyEn, percentEn } from "../lib/format.ts";
import { LANGUAGE_PAIRS, languageAlternates } from "../lib/hreflang.ts";
import { langForPath, pathForHtmlFile, setHtmlLang } from "../lib/lang.ts";

const SUFFIX = " | Nettoplaatje";

test("English formatting", () => {
  assert.equal(moneyEn(5000), "€5,000");
  assert.equal(moneyEn(-121.4), "−€121");
  assert.equal(percentEn(0.4947), "49.5%");
  assert.equal(euroEn(60000.4), "€60,000");
});

test("English salary pages: titles fit, descriptions are 120–160 characters", () => {
  for (const page of EN_AMOUNT_PAGES) {
    const figures = enAmountFigures(page);
    const title = enAmountTitle(figures) + SUFFIX;
    assert.ok(title.length <= 60, `${page.slug}: "${title}" is ${title.length} chars`);
    const description = enAmountDescription(figures);
    assert.ok(description.length >= 120 && description.length <= 160, `${page.slug}: description is ${description.length} chars: ${description}`);
  }
});

test("salary pages show more net with the ruling above the norm and the same below it", () => {
  const figures = (slug: string) => enAmountFigures(EN_AMOUNT_PAGES.find((page) => page.slug === slug)!);
  const high = figures("100000-gross-per-year");
  assert.ok(high.ruling.netAnnual > high.without.netAnnual + 5_000);
  // € 100.000 incl. holiday allowance: 30% of the wage is tax-free.
  assert.ok(Math.abs(high.ruling.expatAllowanceAnnual - 30_000) < 1);
  // € 3.000 a month is € 38.880 a year with holiday allowance: below the standard norm, above the young-master norm.
  const low = figures("3000-gross-per-month");
  assert.equal(low.ruling.expatAllowanceAnnual, 0);
  assert.equal(low.ruling.netAnnual, low.without.netAnnual);
  assert.ok(low.youngMaster.netAnnual > low.without.netAnnual);
  // Without the ruling the English page agrees with the Dutch page for the same amount.
  const dutch = AMOUNT_PAGES.find((page) => page.slug === "60000-per-jaar")!;
  assert.equal(dutchAmountPath(EN_AMOUNT_PAGES.find((page) => page.slug === "60000-gross-per-year")!), amountPath(dutch));
});

test("hreflang pairs point both ways and only at existing pages", () => {
  const enPaths = new Set(EN_AMOUNT_PAGES.map(enAmountPath));
  const nlPaths = new Set(AMOUNT_PAGES.map(amountPath));
  for (const [nl, en] of LANGUAGE_PAIRS) {
    assert.deepEqual(languageAlternates(nl), languageAlternates(en));
    assert.equal(languageAlternates(en)?.["x-default"], nl);
    assert.ok(nlPaths.has(nl) || existsSync(`app${nl}/page.tsx`), nl);
    assert.ok(enPaths.has(en) || existsSync(`app${en}/page.tsx`), en);
  }
  assert.equal(languageAlternates("/en/30-percent-ruling"), undefined);
  assert.equal(languageAlternates("/totaal"), undefined);
});

test("English guides: unique slugs, valid links, titles and descriptions fit", () => {
  const slugs = new Set(EN_ARTICLES.map((article) => article.slug));
  assert.equal(slugs.size, EN_ARTICLES.length);
  const validPath = (path: string) => path.startsWith("/en/guides/") ? slugs.has(path.slice("/en/guides/".length)) : existsSync(`app${path}/page.tsx`);
  for (const article of EN_ARTICLES) {
    assert.match(article.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(validPath(article.calculator.href), `${article.slug}: ${article.calculator.href}`);
    for (const related of article.related) assert.ok(slugs.has(related) && related !== article.slug, `${article.slug}: related ${related}`);
    const title = (article.seoTitle ?? article.title) + SUFFIX;
    assert.ok(title.length <= 60, `${article.slug}: "${title}" is ${title.length} chars`);
    assert.ok(article.description.length >= 120 && article.description.length <= 160, `${article.slug}: description is ${article.description.length} chars`);
    for (const text of [article.intro, ...article.sections.flatMap((section) => section.paragraphs)]) {
      for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) assert.ok(validPath(match[2]), `${article.slug}: ${match[2]}`);
      assert.doesNotMatch(text, /NaN|undefined|Infinity/, `${article.slug}: broken figure`);
    }
  }
});

test("exported English pages get lang=en, Dutch pages keep lang=nl", () => {
  assert.equal(langForPath("/en"), "en");
  assert.equal(langForPath("/en/salary/60000-gross-per-year"), "en");
  assert.equal(langForPath("/energie"), "nl");
  assert.equal(langForPath("/"), "nl");
  assert.equal(pathForHtmlFile("en.html"), "/en");
  assert.equal(pathForHtmlFile("en\\guides\\dutch-income-tax-rates.html"), "/en/guides/dutch-income-tax-rates");
  assert.equal(pathForHtmlFile("en/index.html"), "/en");
  assert.equal(pathForHtmlFile("index.html"), "/");
  assert.equal(setHtmlLang('<!DOCTYPE html><html lang="nl"><head>', "en"), '<!DOCTYPE html><html lang="en"><head>');
});

test("a prefill link from a yearly salary page gives back exactly that yearly amount", async () => {
  const { readPrefillGross } = await import("../lib/job-model.ts");
  const page = EN_AMOUNT_PAGES.find((p) => p.slug === "60000-gross-per-year")!;
  const monthly = readPrefillGross(new URL(`https://nettoplaatje.nl/en#bruto=${enAmountFigures(page).grossMonthly.toFixed(2)}`))!;
  assert.equal(Math.round(monthly * 12.96), 60_000);
});
