import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { ARTICLES } from "../lib/articles.ts";
import { CALCULATORS } from "../lib/calculators.ts";

const pageExists = (path: string) => existsSync(`app${path === "/" ? "" : path}/page.tsx`);
const slugs = new Set(ARTICLES.map((article) => article.slug));

function validPath(path: string) {
  if (path.startsWith("/vragen/")) return slugs.has(path.slice("/vragen/".length));
  return pageExists(path);
}

test("every calculator in the list has a page", () => {
  for (const tool of CALCULATORS) assert.ok(pageExists(tool.href), tool.href);
});

test("articles have unique slugs, valid related slugs and calculator links", () => {
  assert.equal(slugs.size, ARTICLES.length);
  for (const article of ARTICLES) {
    assert.match(article.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(validPath(article.calculator.href), `${article.slug}: ${article.calculator.href}`);
    for (const related of article.related) assert.ok(slugs.has(related) && related !== article.slug, `${article.slug}: related ${related}`);
    assert.ok(article.description.length <= 160, `${article.slug}: description too long`);
  }
});

test("inline links in articles point to existing pages", () => {
  for (const article of ARTICLES) {
    const texts = [article.intro, ...article.sections.flatMap((section) => section.paragraphs)];
    for (const text of texts) {
      for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)) assert.ok(validPath(match[2]), `${article.slug}: ${match[2]}`);
      assert.doesNotMatch(text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, ""), /[[\]]/, `${article.slug}: stray brackets`);
    }
  }
});
