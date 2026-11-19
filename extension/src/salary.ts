/**
 * Finds gross salaries in vacancy text ("€ 3.903 - € 5.503 per maand",
 * "€ 2.913 - € 4.370 p/m", "Tot € 4.822,50 per maand") and turns them into
 * an indicative net amount with the same calculation as nettoplaatje.nl.
 */
import { HOLIDAY_PCT, amountState } from "../../lib/amounts.ts";
import { grossToNet } from "../../lib/spokes.ts";
import { DEFAULT_TAX_YEAR } from "../../lib/tax-years.ts";

export type Period = "maand" | "jaar" | "uur";
/** `bound` is set for "tot € 4.800" (an upper limit) or "vanaf € 3.000" (a lower limit). */
export type Salary = { min: number; max: number; period: Period; bound?: "tot" | "vanaf" };

/** Hours per week the extension assumes: vacancies show the full-time salary. */
export const FULL_TIME_HOURS = 40;
const WEEKS_PER_YEAR = 52;

/** Plausible gross amounts per period; anything outside is not a salary (a bonus, a travel allowance). */
const RANGES: Record<Period, [number, number]> = {
  uur: [8, 250],
  maand: [800, 30_000],
  jaar: [10_000, 400_000],
};

/** "3.903", "4.822,50", "3.903,-", "45000" → number. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(/,-$/, "").replace(/\.$/, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

const AMOUNT = String.raw`€\s?(\d[\d.]*(?:,(?:\d{1,2}|-))?)`;
const RANGE_SEPARATOR = String.raw`\s*(?:-|–|—|tot(?:\s+maximaal)?|t\/m)\s*`;
const SALARY = new RegExp(`(?:(tot|max(?:imaal)?|vanaf|min(?:imaal)?)\\s+)?${AMOUNT}(?:${RANGE_SEPARATOR}${AMOUNT})?`, "i");

function periodIn(text: string): Period | null {
  if (/per\s+maand|p\/m\b|p\.m\.|\/\s?maand|\bmaandsalaris|per\s+mnd|\/mnd/i.test(text)) return "maand";
  if (/per\s+jaar|p\/j\b|\/\s?jaar|jaarsalaris|\bjaarlijks/i.test(text)) return "jaar";
  if (/per\s+uur|p\/u\b|\/\s?uur|uurloon|uurtarief/i.test(text)) return "uur";
  return null;
}

/**
 * The salary in a short piece of text, or null. Without "per maand" (or similar)
 * only a range counts, and its period follows from the amounts; a lone amount
 * without a period is too often something else.
 */
export function parseSalary(text: string): Salary | null {
  if (text.length > 300) return null;
  const match = SALARY.exec(text);
  if (!match) return null;
  const first = parseAmount(match[2]);
  const second = match[3] ? parseAmount(match[3]) : null;
  if (first === null || (match[3] && second === null)) return null;
  const isRange = second !== null;
  const period = periodIn(text) ?? (isRange ? periodFromAmount(first) : null);
  if (!period) return null;
  const [low, high] = RANGES[period];
  const min = Math.min(first, second ?? first);
  const max = Math.max(first, second ?? first);
  if (min < low || max > high || max > min * 4) return null;
  const prefix = match[1]?.toLowerCase();
  const bound = isRange || !prefix ? undefined : prefix.startsWith("t") || prefix.startsWith("max") ? "tot" : "vanaf";
  return { min, max, period, ...(bound && { bound }) };
}

function periodFromAmount(amount: number): Period {
  if (amount < 150) return "uur";
  return amount >= 15_000 ? "jaar" : "maand";
}

/** Monthly gross salary for an amount in a period. A yearly salary is read as including 8% holiday pay. */
export function monthlyGross(amount: number, period: Period): number {
  if (period === "maand") return amount;
  if (period === "jaar") return amount / (12 * (1 + HOLIDAY_PCT / 100));
  return amount * FULL_TIME_HOURS * WEEKS_PER_YEAR / 12;
}

/** Net in the same period as the vacancy: per month (a regular month), per year (with holiday pay) or per hour. */
export function netFor(amount: number, period: Period, year = DEFAULT_TAX_YEAR): number {
  const result = grossToNet(amountState(monthlyGross(amount, period), year, FULL_TIME_HOURS), "current");
  if (period === "maand") return result.regularNetMonthly;
  if (period === "jaar") return result.netAnnual;
  return result.regularNetMonthly * 12 / (FULL_TIME_HOURS * WEEKS_PER_YEAR);
}

const euro = (value: number, cents: boolean) =>
  `€ ${value.toLocaleString("nl-NL", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;

/** "≈ € 2.680 – € 3.470 netto p/m" */
export function netLabel(salary: Salary, year = DEFAULT_TAX_YEAR): string {
  const cents = salary.period === "uur";
  const low = netFor(salary.min, salary.period, year);
  const high = netFor(salary.max, salary.period, year);
  const suffix = { maand: "p/m", jaar: "per jaar", uur: "per uur" }[salary.period];
  const amounts = salary.min === salary.max ? euro(low, cents) : `${euro(low, cents)} – ${euro(high, cents)}`;
  return `${salary.bound ? `${salary.bound} ` : ""}≈ ${amounts} netto ${suffix}`;
}

/** Explanation shown on hover. */
export function netTooltip(salary: Salary, year = DEFAULT_TAX_YEAR): string {
  const base = `Indicatie van Nettoplaatje voor ${year}: voltijd, ${HOLIDAY_PCT}% vakantiegeld, zonder pensioeninhouding.`;
  const extra = salary.period === "jaar" ? " Jaarbedrag gelezen als inclusief vakantiegeld." : salary.period === "maand" ? " Netto in een gewone maand, zonder vakantiegeld." : "";
  return `${base}${extra} Klik voor het hele plaatje.`;
}

/** The bruto-netto calculator with the middle of the range filled in as a monthly salary. */
export function detailUrl(salary: Salary): string {
  const middle = monthlyGross((salary.min + salary.max) / 2, salary.period);
  return `https://nettoplaatje.nl/bruto-netto#bruto=${Math.round(middle / 10) * 10}`;
}
