/**
 * Reading what people type into the number fields. They type amounts the way
 * they write them: "3.500", "€ 3.500,-", "3500,50" or "3,500" on an English page.
 */

/**
 * The number in a typed text, or null when it is not a number.
 * - Euro signs, "EUR", "%", spaces and a trailing ",-" are ignored.
 * - With both "." and ",", the last one is the decimal separator.
 * - A single separator followed by exactly three digits is a thousands separator
 *   ("3.500" and "3,500" are 3500), except in a decimal field (`decimalField`,
 *   such as a percentage or a price per km), where "8,333" stays 8.333.
 */
export function parseNumberInput(text: string, decimalField = false): number | null {
  let s = text.toLowerCase().replace(/€|eur(o)?|%|\s/g, "").replace(/[.,]-+$/, "").replace(/−/g, "-");
  const negative = s.startsWith("-");
  if (negative) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let decimalSep: "." | "," | null = null;
  let thousandsSep: "." | "," | null = null;
  if (lastDot >= 0 && lastComma >= 0) {
    decimalSep = lastDot > lastComma ? "." : ",";
    thousandsSep = decimalSep === "." ? "," : ".";
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? "." : ",";
    const parts = s.split(sep);
    const thousands = parts.length > 2
      || (!decimalField && parts[1].length === 3 && parts[0] !== "" && !/^0+$/.test(parts[0]));
    if (thousands) thousandsSep = sep;
    else decimalSep = sep;
  }

  const [intPart, fracPart = ""] = decimalSep ? s.split(decimalSep) : [s];
  if (/[.,]/.test(fracPart)) return null;
  let digits = intPart;
  if (thousandsSep && intPart.includes(thousandsSep)) {
    const groups = intPart.split(thousandsSep);
    if (groups[0].length < 1 || groups[0].length > 3 || groups.slice(1).some((group) => group.length !== 3)) return null;
    digits = groups.join("");
  }
  if (/[.,]/.test(digits)) return null;
  const value = Number(`${digits || "0"}.${fracPart || "0"}`);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** A number as the field shows it when you are not typing: "8,33" on Dutch pages, "8.33" on English ones. */
export function formatNumberInput(value: number, lang: "nl" | "en" = "nl"): string {
  if (!Number.isFinite(value)) return "";
  const text = String(Math.round(value * 10_000) / 10_000);
  return lang === "nl" ? text.replace(".", ",") : text;
}

/** Keeps a value within the field's limits. */
export function clampNumber(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
