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
  allowances: AllowanceParams;
};

export type ChildcareType = "dagopvang" | "bso" | "gastouder";

/** Toeslagen: zorgtoeslag, kindgebonden budget and kinderopvangtoeslag. Huurtoeslag is not calculated. */
export type AllowanceParams = {
  /** Wealth above which there is no zorgtoeslag or kindgebonden budget (kinderopvangtoeslag has no wealth test). */
  assetLimit: { single: number; partner: number };
  zorgtoeslag: {
    /** Annual standard premium per adult. */
    standardPremium: number;
    /** Drempelinkomen: the minimum wage on which the norm premium is based. */
    thresholdIncome: number;
    /** Normpercentage over the drempelinkomen. */
    normRateSingle: number;
    normRatePartner: number;
    /** Afbouwpercentage over the toetsingsinkomen above the drempelinkomen. */
    phaseOutRate: number;
  };
  kindgebondenBudget: {
    perChild: number;
    /** Extra per child of 12 to 15 years old. */
    age12: number;
    /** Extra per child of 16 or 17 years old. */
    age16: number;
    /** Alleenstaande-ouderkop. */
    singleParent: number;
    thresholdSingle: number;
    thresholdPartner: number;
    phaseOutRate: number;
  };
  kinderopvangtoeslag: {
    maxHourlyPrice: Record<ChildcareType, number>;
    maxHoursPerMonth: number;
    /** Rows sorted by `from`: percentage for the child with the most hours, and for every other child. */
    table: ReadonlyArray<readonly [from: number, firstChildPct: number, otherChildPct: number]>;
  };
};

/** Rijksoverheid, "Bedragen kinderopvangtoeslag 2026". Below € 56.413 everyone gets 96%. */
const KOT_TABLE_2026: AllowanceParams["kinderopvangtoeslag"]["table"] = [
  [0, 96, 96], [56_413, 95.5, 95.6], [58_185, 94.8, 95.6], [59_958, 93.9, 95.6], [61_896, 92.4, 95.6],
  [65_696, 91.6, 95.2], [69_493, 90.5, 94.6], [73_293, 88.2, 94.2], [77_095, 85.9, 93.9], [80_892, 83.7, 93.2],
  [84_694, 81.2, 92.7], [88_492, 78.9, 92.2], [92_292, 76.7, 91.5], [96_092, 74.3, 90.9], [99_890, 72.1, 90.5],
  [103_695, 69.6, 90.2], [107_493, 67.3, 89.5], [111_291, 65.1, 89.1], [115_091, 62.7, 88.6], [118_964, 60.6, 87.9],
  [122_858, 58.5, 87.4], [126_748, 56.4, 87.0], [130_639, 54.2, 86.7], [134_528, 52.3, 86.0], [138_421, 50.4, 85.4],
  [142_313, 48.5, 85.0], [146_206, 46.5, 84.4], [150_093, 44.5, 84.0], [153_983, 42.5, 83.3], [157_878, 40.5, 82.7],
  [161_767, 38.5, 81.7], [165_658, 36.5, 81.4], [169_548, 36.5, 80.6], [173_441, 36.5, 79.7], [177_336, 36.5, 79.1],
  [181_224, 36.5, 78.2], [185_115, 36.5, 77.7], [189_003, 36.5, 76.9], [192_897, 36.5, 76.2], [196_790, 36.5, 75.5],
  [200_682, 36.5, 74.5], [204_572, 36.5, 74.0], [208_459, 36.5, 73.3], [212_354, 36.5, 72.5], [216_243, 36.5, 71.8],
  [220_135, 36.5, 71.2], [224_027, 36.5, 70.4], [227_916, 36.5, 69.6], [231_808, 36.5, 69.1], [235_698, 36.5, 68.2],
];

const ALLOWANCES_2026: AllowanceParams = {
  assetLimit: { single: 146_011, partner: 184_633 },
  // Norm percentages: Staatscourant 2025, 42977. Standard premium and drempelinkomen reproduce
  // the Belastingdienst table (maximum € 129 / € 246 per month).
  zorgtoeslag: { standardPremium: 2_119, thresholdIncome: 29_736, normRateSingle: 0.01912, normRatePartner: 0.04289, phaseOutRate: 0.1373 },
  kindgebondenBudget: {
    perChild: 2_580, age12: 724, age16: 964, singleParent: 3_416,
    thresholdSingle: 29_736, thresholdPartner: 39_141, phaseOutRate: 0.076,
  },
  kinderopvangtoeslag: {
    maxHourlyPrice: { dagopvang: 11.23, bso: 9.98, gastouder: 8.49 },
    maxHoursPerMonth: 230,
    table: KOT_TABLE_2026,
  },
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
  allowances: ALLOWANCES_2026,
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
  // ESTIMATED: 2026 values. Still open for 2027: the kinderopvangtoeslag table of the
  // Prinsjesdag wijzigingsbesluit (vaste voet first child 39.1%), the proposed second
  // kindgebonden budget phase-out from € 60.000, and the final zorgtoeslag figures.
  allowances: ALLOWANCES_2026,
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
