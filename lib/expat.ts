/**
 * Expatregeling (30%-regeling): an employer may pay part of the wage as a tax-free
 * allowance for extraterritorial costs. The contract salary stays the same; only the
 * taxable part shrinks, so the employee keeps more net.
 *
 * Rules (Belastingdienst, see TaxYearParams.expatRuling.sourceUrl):
 * - at most `rate` (30% in 2026, 27% from 2027) of the wage including the allowance;
 * - the wage without the allowance must stay above the salary norm, so near the norm
 *   the allowance is only the part above it;
 * - at most `rate` × WNT-norm per full year.
 * The calculator applies it to the whole taxable wage (salary, holiday allowance,
 * bonuses, after the employee's pension premium), for a full year.
 */
import { DEFAULT_TAX_YEAR, taxYear } from "./tax-years.ts";

export type ExpatOption = "none" | "standard" | "youngMaster";
export const EXPAT_OPTIONS: readonly ExpatOption[] = ["none", "standard", "youngMaster"];

/** Tax-free allowance per year for a taxable wage (including the allowance) of `wageAnnual`. */
export function expatAllowance(wageAnnual: number, option: ExpatOption | undefined, year = DEFAULT_TAX_YEAR): number {
  if (!option || option === "none" || wageAnnual <= 0) return 0;
  const { rate, salaryNorm, salaryNormYoungMaster, wntNorm } = taxYear(year).expatRuling;
  const norm = option === "youngMaster" ? salaryNormYoungMaster : salaryNorm;
  return Math.max(0, Math.min(wageAnnual * rate, wageAnnual - norm, wntNorm * rate));
}

/** The wage that is still taxed after the allowance. */
export function taxableAfterExpat(wageAnnual: number, option: ExpatOption | undefined, year = DEFAULT_TAX_YEAR): number {
  return Math.max(0, wageAnnual - expatAllowance(wageAnnual, option, year));
}

/** Why the allowance is lower than the full percentage, for the explanation under the result. */
export function expatLimit(wageAnnual: number, option: ExpatOption | undefined, year = DEFAULT_TAX_YEAR): "none" | "belowNorm" | "norm" | "cap" | "full" {
  if (!option || option === "none") return "none";
  const { rate, salaryNorm, salaryNormYoungMaster, wntNorm } = taxYear(year).expatRuling;
  const norm = option === "youngMaster" ? salaryNormYoungMaster : salaryNorm;
  if (wageAnnual <= norm) return "belowNorm";
  const full = wageAnnual * rate;
  if (wageAnnual - norm < full && wageAnnual - norm < wntNorm * rate) return "norm";
  if (wntNorm * rate < full) return "cap";
  return "full";
}
