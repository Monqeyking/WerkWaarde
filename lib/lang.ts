/**
 * Language of a page. The English pages live under /en. The root layout renders
 * <html lang="nl">; scripts/html-lang.mjs rewrites it in the exported English
 * pages, and app/components/HtmlLang.tsx keeps it right during client navigation.
 */
export type Lang = "nl" | "en";

export const langForPath = (path: string): Lang => (path === "/en" || path.startsWith("/en/") ? "en" : "nl");

/** Replace the lang attribute of the <html> tag. */
export const setHtmlLang = (html: string, lang: Lang) => html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

/** Site path for an exported HTML file, relative to out/: "en/salary/x.html" → "/en/salary/x". */
export function pathForHtmlFile(relativeFile: string) {
  const path = `/${relativeFile.replace(/\\/g, "/").replace(/\.html$/, "").replace(/(^|\/)index$/, "")}`;
  return path.length > 1 ? path.replace(/\/$/, "") : "/";
}
