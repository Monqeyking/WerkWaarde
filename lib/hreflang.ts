/**
 * Dutch and English pages with the same content, linked with hreflang so search
 * engines show the right language. Only real equivalents belong here: the Dutch
 * bruto-netto calculator and the English home page (also a gross-to-net
 * calculator), and salary pages for the same amount.
 */
import { EN_AMOUNT_PAGES, dutchAmountPath, enAmountPath } from "./en-amounts.ts";

export const LANGUAGE_PAIRS: ReadonlyArray<readonly [nl: string, en: string]> = [
  ["/bruto-netto", "/en"],
  ...EN_AMOUNT_PAGES.flatMap((page) => {
    const dutch = dutchAmountPath(page);
    return dutch ? [[dutch, enAmountPath(page)] as const] : [];
  }),
];

/** hreflang alternates for a path, or undefined when the page has no translation. Dutch is the default. */
export function languageAlternates(path: string): { nl: string; en: string; "x-default": string } | undefined {
  const pair = LANGUAGE_PAIRS.find(([nl, en]) => nl === path || en === path);
  return pair && { nl: pair[0], en: pair[1], "x-default": pair[0] };
}
