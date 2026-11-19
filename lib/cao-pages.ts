/**
 * Static landing pages per cao ("Cao Ziekenhuizen 2026: netto salaris en pensioen").
 * Every figure comes from lib/caos.ts and the regular calculator, so a page always
 * agrees with what the calculator shows after picking that cao.
 */
import { CAOS, caoSalaryPatch, type Cao } from "./caos.ts";
import { amountState, euro } from "./amounts.ts";
import { updateJobSection, type NettoplaatjeState } from "./job-model.ts";
import { grossToNet } from "./spokes.ts";
import { DEFAULT_TAX_YEAR } from "./tax-years.ts";

/** Example monthly salaries in the table on every cao page. */
export const CAO_EXAMPLE_SALARIES = [2_500, 3_000, 3_500, 4_000, 5_000] as const;
/** The salary used in the highlight and the FAQ answers. */
export const CAO_HIGHLIGHT_SALARY = 3_500;
/** Hours used when the cao sets no full-time week. */
const DEFAULT_FULL_TIME = 40;

export const caoPath = (cao: Cao) => `/cao/${cao.id}`;
/** Opens the bruto-netto calculator with this cao picked (see applyPrefillFromLocation). */
export const caoPrefillPath = (cao: Cao) => `/bruto-netto#cao=${cao.id}`;
export const caoHours = (cao: Cao) => cao.fullTimeHours ?? DEFAULT_FULL_TIME;

/** "cao Ziekenhuizen", for use inside a sentence. */
export const caoInText = (cao: Cao) => cao.name.replace(/^Cao /, "cao ");

/** "8,33%" with up to two decimals. */
export const pct = (value: number) => `${value.toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;

/** Employee premium as % of the pension base: the employee's share of the total premium. */
export const employeeRatePct = (cao: Cao) => cao.pension ? Math.round(cao.pension.totalRatePct * cao.pension.employeeSharePct) / 100 : 0;

/** Full-time job at this gross salary with everything the cao prefills. */
export function caoState(cao: Cao, grossMonthly: number, year = DEFAULT_TAX_YEAR): NettoplaatjeState {
  return updateJobSection(amountState(grossMonthly, year, caoHours(cao)), "current", "salary", caoSalaryPatch(cao));
}

export function caoExample(cao: Cao, grossMonthly: number, year = DEFAULT_TAX_YEAR) {
  return grossToNet(caoState(cao, grossMonthly, year), "current");
}

export type CaoExample = ReturnType<typeof caoExample>;

export function caoFigures(cao: Cao, year = DEFAULT_TAX_YEAR) {
  return {
    cao,
    year,
    highlight: caoExample(cao, CAO_HIGHLIGHT_SALARY, year),
    examples: CAO_EXAMPLE_SALARIES.map((gross) => caoExample(cao, gross, year)),
  };
}

export type CaoFigures = ReturnType<typeof caoFigures>;

export function getCao(slug: string): Cao | undefined {
  return CAOS.find((cao) => cao.id === slug);
}

/** The other cao's in the same sector, for the side links. */
export function sectorSiblings(cao: Cao): Cao[] {
  return CAOS.filter((other) => other.sector === cao.sector && other.id !== cao.id);
}

/** Cao's grouped by sector, both sorted alphabetically. */
export function caosBySector(): Array<{ sector: string; caos: Cao[] }> {
  return [...new Set(CAOS.map((cao) => cao.sector))]
    .sort((a, b) => a.localeCompare(b, "nl"))
    .map((sector) => ({ sector, caos: CAOS.filter((cao) => cao.sector === sector).sort((a, b) => a.name.localeCompare(b.name, "nl")) }));
}

/** "Vakantiegeld 8%" or the cao's own wording when it leaves it open. */
export function holidayText(cao: Cao): string {
  return cao.holidayAllowancePct === null ? "vakantiegeld volgens de opdrachtgever" : `${pct(cao.holidayAllowancePct)} vakantiegeld`;
}

/** "13e maand van 8,33%", "eindejaarsuitkering van 9,05%", "geen 13e maand" or open. */
export function yearEndText(cao: Cao): string {
  if (cao.yearEndBonusPct === null) return "13e maand volgens de opdrachtgever";
  if (cao.yearEndBonusPct === 0) return "geen 13e maand";
  return cao.yearEndBonusPct === 8.33 ? "13e maand van 8,33%" : `eindejaarsuitkering van ${pct(cao.yearEndBonusPct)}`;
}

/** One or two sentences on holiday pay, 13th month and pension, for the page intro. */
export function caoSummary(cao: Cao): string {
  const name = caoInText(cao);
  const pay = cao.holidayAllowancePct === null
    ? `Bij de ${name} volgen vakantiegeld en 13e maand de regeling van de opdrachtgever.`
    : cao.yearEndBonusPct === 0 ? `De ${name} geeft ${holidayText(cao)}, maar geen 13e maand.`
    : `De ${name} geeft ${holidayText(cao)} en een ${yearEndText(cao)}.`;
  const pension = cao.pension
    ? ` Je bouwt pensioen op bij ${cao.pension.fund} en betaalt zelf ${pct(employeeRatePct(cao))} premie over je salaris boven de franchise.`
    : "";
  return pay + pension;
}

const SUFFIX_LENGTH = " | Nettoplaatje".length;

/** Search-result title; drops the bracketed part of a long name to stay within 60 characters. */
export function caoTitle(cao: Cao, year = DEFAULT_TAX_YEAR): string {
  const full = `${cao.name} ${year}: netto salaris en pensioen`;
  if (full.length + SUFFIX_LENGTH <= 60) return full;
  const short = `${cao.name.replace(/\s*\(.*\)$/, "")} ${year}: netto salaris en pensioen`;
  return short.length <= 60 ? short : `${cao.name.replace(/\s*\(.*\)$/, "")} ${year}: netto salaris`;
}

/** Meta description: the longest of a few variants that stays within 160 characters. */
export function caoDescription(figures: CaoFigures): string {
  const { cao, year, highlight } = figures;
  const parts = [
    cao.holidayAllowancePct === null ? null : holidayText(cao),
    cao.yearEndBonusPct === null ? null : yearEndText(cao),
    cao.pension ? `pensioen bij ${cao.pension.fund}` : null,
  ].filter((part): part is string => part !== null);
  const list = (items: string[]) => items.length > 1 ? ` Met ${items.slice(0, -1).join(", ")} en ${items.at(-1)}.` : items.length ? ` Met ${items[0]}.` : "";
  const variant = (name: string, extras: string) =>
    `Bij de ${name} is ${euro(highlight.grossMonthly)} bruto in ${year} ongeveer ${euro(highlight.regularNetMonthly)} netto per maand.${extras}`;
  const shortName = caoInText(cao).replace(/\s*\(.*\)$/, "");
  const variants = [
    variant(caoInText(cao), list(parts)),
    variant(shortName, list(parts)),
    variant(shortName, list(parts.slice(-1))),
    variant(shortName, ""),
  ];
  return variants.find((text) => text.length <= 160) ?? variants[3];
}
