/**
 * Tax parameters per year. Everything year-specific lives here, so adding a
 * year means adding one object.
 *
 * A year with `published: false` is calculated and tested, but not offered in
 * the interface until the official figures are final.
 */

export type Bracket = { limit: number; rate: number };
/** Piecewise-linear credit: from `from` the credit is `base + rate × (income − from)`. */
export type CreditSegment = { from: number; base: number; rate: number };

export type TaxYearParams = {
  year: number;
  /** Shown in the year selector; false hides the year until the figures are final. */
  published: boolean;
  /** Where the figures come from, shown in the interface for unpublished or provisional years. */
  source: string;
  brackets: Bracket[];
  bracketsAow: Bracket[];
  generalCredit: { max: number; maxAow: number; phaseOutFrom: number; phaseOutRate: number; phaseOutRateAow: number };
  employmentCredit: CreditSegment[];
  employmentCreditAow: CreditSegment[];
  /** Highest annual salary on which pension may be accrued. */
  maxPensionableSalary: number;
  bijtelling: { standardRate: number; electricRate: number; electricCap: number };
  /** Maximum tax-free reimbursement per business km. */
  taxFreeKmRate: number;
};

const TOP_RATE = 0.495;

const TAX_2026: TaxYearParams = {
  year: 2026,
  published: true,
  source: "Belastingdienst, tarieven en heffingskortingen 2026",
  brackets: [
    { limit: 38_883, rate: 0.3575 },
    { limit: 78_426, rate: 0.3756 },
    { limit: Number.POSITIVE_INFINITY, rate: TOP_RATE },
  ],
  bracketsAow: [
    { limit: 38_883, rate: 0.1785 },
    { limit: 78_426, rate: 0.3756 },
    { limit: Number.POSITIVE_INFINITY, rate: TOP_RATE },
  ],
  generalCredit: { max: 3_115, maxAow: 1_556, phaseOutFrom: 29_736, phaseOutRate: 0.06398, phaseOutRateAow: 0.03195 },
  employmentCredit: [
    { from: 0, base: 0, rate: 0.08324 },
    { from: 11_965, base: 996, rate: 0.31009 },
    { from: 25_845, base: 5_300, rate: 0.0195 },
    { from: 45_592, base: 5_685, rate: -0.0651 },
  ],
  employmentCreditAow: [
    { from: 0, base: 0, rate: 0.04156 },
    { from: 11_965, base: 498, rate: 0.15483 },
    { from: 25_845, base: 2_647, rate: 0.00974 },
    { from: 45_592, base: 2_840, rate: -0.0325 },
  ],
  maxPensionableSalary: 137_800,
  bijtelling: { standardRate: 0.22, electricRate: 0.18, electricCap: 30_000 },
  taxFreeKmRate: 0.25,
};

/**
 * 2027 — PROVISIONAL, not shown in the interface.
 *
 * Based on the Belastingplan 2027 (Prinsjesdag, 15 September 2026) with the
 * tweede nota van wijziging (20 October 2026) and amendment 37022-42 (Grinwis /
 * Van Brenk, adopted by the Tweede Kamer on 12 November 2026):
 * - rates of brackets 1 and 2 lowered by 0.14 percentage point (36.23 → 36.09, 38.16 → 38.02; AOW 18.33 → 18.19);
 * - arbeidskorting: maximum 5,929 − 40 (nota) − 116 (amendment) = 5,773; phase-out from 47,834 at 6.51%.
 * Not yet published, so ESTIMATED here: the arbeidskorting build-up knikpunten
 * (2026 values scaled), the AOW arbeidskorting, and the maximum pensionable salary.
 * The Eerste Kamer votes on 15 December 2026; replace with the Belastingdienst figures after that.
 */
const TAX_2027: TaxYearParams = {
  year: 2027,
  published: false,
  source: "Voorlopig: Belastingplan 2027 zoals aangenomen door de Tweede Kamer (12 november 2026), nog niet definitief",
  brackets: [
    { limit: 39_247, rate: 0.3609 },
    { limit: 78_426, rate: 0.3802 },
    { limit: Number.POSITIVE_INFINITY, rate: TOP_RATE },
  ],
  bracketsAow: [
    { limit: 39_247, rate: 0.1819 },
    { limit: 78_426, rate: 0.3802 },
    { limit: Number.POSITIVE_INFINITY, rate: TOP_RATE },
  ],
  generalCredit: { max: 3_154, maxAow: 1_596, phaseOutFrom: 30_910, phaseOutRate: 0.06638, phaseOutRateAow: 0.03358 },
  employmentCredit: [
    { from: 0, base: 0, rate: 0.08169 }, // estimated
    { from: 12_553, base: 1_025, rate: 0.2992 }, // estimated
    { from: 27_116, base: 5_383, rate: 0.0188 }, // estimated
    { from: 47_834, base: 5_773, rate: -0.0651 },
  ],
  employmentCreditAow: [ // estimated: about half of the regular credit, as in 2026
    { from: 0, base: 0, rate: 0.04087 },
    { from: 12_553, base: 513, rate: 0.14968 },
    { from: 27_116, base: 2_693, rate: 0.00941 },
    { from: 47_834, base: 2_888, rate: -0.0325 },
  ],
  maxPensionableSalary: 137_800, // estimated: 2026 value until the 2027 figure is published
  bijtelling: { standardRate: 0.22, electricRate: 0.20, electricCap: 30_000 },
  taxFreeKmRate: 0.25,
};

export const TAX_YEARS: readonly TaxYearParams[] = [TAX_2026, TAX_2027];
export const DEFAULT_TAX_YEAR = 2026;

/** Show unpublished years too, for checking provisional figures before they go live. */
const previewUnpublished = process.env.NEXT_PUBLIC_PREVIEW_TAX_YEARS === "1";

/** Years the user can choose in the interface. */
export function selectableTaxYears(): number[] {
  return TAX_YEARS.filter((params) => params.published || previewUnpublished).map((params) => params.year);
}

/** Parameters for a year; unknown years fall back to the default year. */
export function taxYear(year: number | undefined): TaxYearParams {
  return TAX_YEARS.find((params) => params.year === year) ?? TAX_YEARS.find((params) => params.year === DEFAULT_TAX_YEAR)!;
}

const percentText = (rate: number) => `${(rate * 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;
const euroText = (amount: number) => `€ ${amount.toLocaleString("nl-NL", { minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** "€ 0,25": the tax-free km maximum of a year, for hints and labels. */
export function kmLimitText(year: number) {
  return euroText(taxYear(year).taxFreeKmRate);
}

/** "18% tot € 30.000, 22% over de rest": electric car bijtelling of a year. */
export function electricBijtellingText(year: number) {
  const { electricRate, electricCap, standardRate } = taxYear(year).bijtelling;
  return `${percentText(electricRate)} tot ${euroText(electricCap)}, ${percentText(standardRate)} over de rest`;
}

/** "22%": standard bijtelling of a year. */
export function standardBijtellingText(year: number) {
  return percentText(taxYear(year).bijtelling.standardRate);
}

/** Value of a piecewise-linear credit at an income, never below zero. */
export function creditAt(segments: readonly CreditSegment[], income: number): number {
  let active = segments[0];
  for (const segment of segments) if (income >= segment.from) active = segment;
  return Math.max(0, active.base + active.rate * (income - active.from));
}
