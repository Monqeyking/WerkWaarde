/** Dutch number formatting used across all calculators. */

const euroFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euroCentsFormat = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimalFormat = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });

/**
 * Sign in front of the currency with a real minus sign ("−€ 121", "+€ 214"),
 * instead of the browser default "€ -121". Values that round to zero show no sign.
 */
function formatSigned(format: Intl.NumberFormat, value: number, precision: number, alwaysSign: boolean) {
  const rounded = Math.round(value * precision) / precision;
  if (rounded === 0 || !Number.isFinite(rounded)) return format.format(0);
  const sign = rounded < 0 ? "−" : alwaysSign ? "+" : "";
  return sign + format.format(Math.abs(rounded));
}

/** "€ 1.234" or "−€ 46" */
export const money = (value: number) => formatSigned(euroFormat, value, 1, false);
/** "+€ 214" or "−€ 46" */
export const signedMoney = (value: number) => formatSigned(euroFormat, value, 1, true);
export const moneyCents = (value: number) => formatSigned(euroCentsFormat, value, 100, false);
export const signedMoneyCents = (value: number) => formatSigned(euroCentsFormat, value, 100, true);
export const decimal = (value: number) => formatSigned(decimalFormat, value, 10, false);
export const signedDecimal = (value: number) => formatSigned(decimalFormat, value, 10, true);
/** Share as a percentage: 0.4947 → "49,5%" */
export const percent = (share: number) => `${decimal(share * 100)}%`;
