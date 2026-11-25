/**
 * English explanation for the salary pages: what happens to tax at this salary, and
 * what the 30% ruling does here. The ruling has three very different zones (below the
 * salary norm, limited by the norm, the full percentage), so the text differs per page
 * instead of repeating one template. Built from the same facts as the Dutch amount pages.
 */
import { incomeFacts, type ThresholdKey } from "./amount-context.ts";
import { expatAllowance } from "./expat.ts";
import type { EnAmountFigures } from "./en-amounts.ts";
import { moneyEn, percentEn } from "./format.ts";
import { TAX_YEARS, taxYear } from "./tax-years.ts";

const eur = (amount: number) => moneyEn(Math.round(amount));
/** Rate to two decimals, as on the Dutch pages: 0.3575 → "35.75%", 0.06398 → "6.4%". */
const ratePercentEn = (rate: number) => `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(Math.round(rate * 10_000) / 100)}%`;
const cents = (rate: number) => `${ratePercentEn(Math.abs(rate)).replace("%", "")} cents`;

const THRESHOLD_NAMES: Record<Exclude<ThresholdKey["kind"], "bracket">, string> = {
  generalStart: "the phase-out of the general tax credit",
  generalEnd: "the end of the general tax credit",
  employmentPeak: "the phase-out of the labour tax credit",
  employmentEnd: "the end of the labour tax credit",
};
const thresholdName = (key: ThresholdKey) =>
  key.kind === "bracket" ? (key.top ? "the top rate" : `tax bracket ${key.index + 1}`) : THRESHOLD_NAMES[key.kind];
const joinAnd = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0];

/** Salary from which the full ruling percentage applies: below it, the salary norm limits the allowance. */
export function fullRulingFrom(year: number) {
  const { rate, salaryNorm } = taxYear(year).expatRuling;
  return salaryNorm / (1 - rate);
}

export type EnAmountContext = {
  /** How tax works at this salary without the ruling. */
  taxParagraphs: string[];
  /** What the 30% ruling does at this salary. */
  rulingParagraphs: string[];
  /** Answer to "how much of a raise do you keep?", with and without the ruling. */
  raiseAnswer: string;
  zone: "belowNorm" | "norm" | "full";
};

export function enAmountContext(f: EnAmountFigures): EnAmountContext {
  const { year, without, ruling, youngMaster } = f;
  const wage = without.grossAnnual;
  const facts = incomeFacts(wage, year);
  const { brackets, bracketIndex, bracket, top, parts, marginal, thresholds: t, params } = facts;
  const keep100 = 100 * (1 - marginal);

  // Tax without the ruling.
  const taxParagraphs: string[] = [];
  const atThreshold = facts.threshold?.atThreshold ?? false;
  const thresholdNote = facts.threshold && (facts.threshold.atThreshold
    ? `You are only ${eur(facts.threshold.at - wage)} a year below ${joinAnd(facts.threshold.keys.map(thresholdName))}, so a raise lands past it at once.`
    : `You are ${eur(facts.threshold.at - wage)} a year below ${joinAnd(facts.threshold.keys.map(thresholdName))}. Above that, ${percentEn(facts.threshold.above)} of every extra euro goes to tax instead of ${percentEn(marginal)}.`);
  const inlineNote = atThreshold && thresholdNote ? ` ${thresholdNote}` : "";
  if (bracketIndex === 0) {
    taxParagraphs.push(`On ${eur(wage)} a year, holiday allowance included, all your income falls in the first tax bracket of ${ratePercentEn(bracket.rate)} (income tax and national insurance together). The second bracket, at ${ratePercentEn(brackets[1].rate)}, starts at ${eur(brackets[0].limit)}.${inlineNote}`);
  } else if (bracket === top) {
    taxParagraphs.push(`On ${eur(wage)} a year, holiday allowance included, the part above ${eur(brackets[bracketIndex - 1].limit)} is taxed at the top rate of ${ratePercentEn(top.rate)}. The first ${eur(brackets[0].limit)} is taxed at ${ratePercentEn(brackets[0].rate)}, the part in between at ${ratePercentEn(brackets[1].rate)}.`);
  } else {
    taxParagraphs.push(`On ${eur(wage)} a year, holiday allowance included, you are in the second tax bracket: ${ratePercentEn(brackets[bracketIndex - 1].rate)} on the first ${eur(brackets[bracketIndex - 1].limit)} and ${ratePercentEn(bracket.rate)} on the rest (income tax and national insurance together). The top rate of ${ratePercentEn(top.rate)} starts at ${eur(brackets[brackets.length - 2].limit)}.${inlineNote}`);
  }
  const general = params.generalCredit;
  const generalText = wage < t.generalStart
    ? `You get the full general tax credit (algemene heffingskorting) of ${eur(general.max)}; it shrinks above ${eur(t.generalStart)}.`
    : facts.generalCredit > 0
      ? `The general tax credit (algemene heffingskorting) shrinks above ${eur(t.generalStart)} by ${cents(general.phaseOutRate)} per extra euro; at your salary ${eur(facts.generalCredit)} of the ${eur(general.max)} is left.`
      : `The general tax credit (algemene heffingskorting) is fully phased out at this salary, from about ${eur(t.generalEnd)}.`;
  const employmentText = facts.employmentCredit <= 0
    ? `The labour tax credit (arbeidskorting) is gone too: it is fully phased out from about ${eur(t.employmentEnd)}.`
    : facts.employmentSegmentRate < 0
      ? `The labour tax credit (arbeidskorting) shrinks as well: above ${eur(t.employmentPeak)} by ${cents(facts.employmentSegmentRate)} per extra euro. You have ${eur(facts.employmentCredit)} left of a maximum of ${eur(facts.employmentCreditMax)}.`
      : `Your labour tax credit (arbeidskorting) is ${eur(facts.employmentCredit)} and still grows by ${cents(facts.employmentSegmentRate)} per extra euro, up to ${eur(facts.employmentCreditMax)} at ${eur(t.employmentPeak)}.`;
  taxParagraphs.push(`${generalText} ${employmentText}`);
  const breakdown = parts.map((part, index) => {
    const value = ratePercentEn(Math.abs(part.rate));
    if (index === 0) return `${value} bracket rate`;
    if (part.kind === "general") return `plus ${value} less general tax credit`;
    return part.rate < 0 ? `minus ${value} more labour tax credit` : `plus ${value} less labour tax credit`;
  }).join(", ");
  const sum = `about ${percentEn(marginal)} of every extra euro gross goes to tax: ${breakdown}. Of a €100 raise you keep ${eur(keep100)}.`;
  taxParagraphs.push(`Without the 30% ruling, ${sum}`);
  if (thresholdNote && !atThreshold) taxParagraphs.push(thresholdNote);
  if (bracket === top && facts.employmentCredit > 0 && Number.isFinite(t.employmentEnd)) {
    taxParagraphs.push(`That is more than the top rate, because the labour tax credit is still being phased out here. Only from about ${eur(t.employmentEnd)} a year is it gone, and the marginal rate drops back to ${ratePercentEn(top.rate)}.`);
  }

  // The 30% ruling.
  const rules = params.expatRuling;
  const rate = percentEn(rules.rate);
  const fullFrom = fullRulingFrom(year);
  const rulingParagraphs: string[] = [];
  const zone: EnAmountContext["zone"] = ruling.expatAllowanceAnnual <= 0 ? "belowNorm" : ruling.expatLimit === "norm" ? "norm" : "full";
  const youngExtra = youngMaster.expatAllowanceAnnual - ruling.expatAllowanceAnnual;
  const youngText = youngExtra > 1
    ? ` If you are under 30 with a master's degree, the lower norm of ${eur(rules.salaryNormYoungMaster)} applies: then ${eur(youngMaster.expatAllowanceAnnual)} a year can be tax-free${youngMaster.expatLimit === "norm" ? ", the part above that norm" : `, the full ${rate}`}.`
    : "";

  if (zone === "belowNorm") {
    rulingParagraphs.push(`The ruling only works if your taxable salary stays above the salary norm of ${eur(rules.salaryNorm)} a year after the allowance. At ${eur(wage)} you are ${eur(rules.salaryNorm - wage)} below it, so the standard ruling gives nothing here.${youngText}`);
  } else if (zone === "norm") {
    const share = ruling.expatAllowanceAnnual / wage;
    rulingParagraphs.push(`The tax-free allowance can be up to ${rate} of your salary, but your taxable salary must stay at the norm of ${eur(rules.salaryNorm)} or above. At ${eur(wage)} that second rule decides: only the part above the norm, ${eur(ruling.expatAllowanceAnnual)} a year (${percentEn(share)} of your salary), is tax-free. You take home ${eur(ruling.netAnnual - without.netAnnual)} a year more than without the ruling.${youngText}`);
    rulingParagraphs.push(`A side effect worth knowing in salary talks: until your salary reaches about ${eur(fullFrom)}, every extra euro goes into the tax-free allowance, because your taxable salary stays at the norm. A raise up to that point is paid out in full, without tax.`);
  } else {
    const taxable = wage - ruling.expatAllowanceAnnual;
    const taxableFacts = incomeFacts(taxable, year);
    const crossesTop = facts.bracket === top && taxableFacts.bracket !== top;
    rulingParagraphs.push(`At this salary the full ${rate} applies: ${eur(ruling.expatAllowanceAnnual)} a year is paid tax-free, and you are taxed as if you earned ${eur(taxable)}. You take home ${eur(ruling.netAnnual - without.netAnnual)} a year more than without the ruling.${crossesTop ? ` Without the ruling part of your salary would be taxed at the top rate of ${ratePercentEn(top.rate)}; with it, your taxable salary stays below ${eur(brackets[brackets.length - 2].limit)}.` : ""}`);
    rulingParagraphs.push(`It also lowers the tax on a raise: ${rate} of every extra euro is tax-free and the rest is taxed at your rate on ${eur(taxable)}, so about ${percentEn(ruling.marginalRate)} of a raise goes to tax instead of ${percentEn(without.marginalRate)}.${wage < fullFrom * 1.1 ? ` You are just above the ${eur(fullFrom)} where the full percentage starts; below it, the salary norm limits the allowance.` : ""}`);
    const next = TAX_YEARS.find((other) => other.year === year + 1);
    if (next && next.expatRuling.rate < rules.rate && wage * (1 - next.expatRuling.rate) >= 1.25 * next.expatRuling.salaryNorm) {
      rulingParagraphs.push(`From ${next.year} the maximum drops to ${percentEn(next.expatRuling.rate)}: at this salary that is about ${eur(expatAllowance(wage, "standard", next.year))} a year tax-free instead of ${eur(ruling.expatAllowanceAnnual)}.`);
    }
  }

  const rulingRaise = zone === "belowNorm" ? "" : zone === "norm"
    ? ` With the 30% ruling, a raise up to about ${eur(fullFrom)} a year is tax-free, because it goes into the allowance.`
    : ` With the 30% ruling about ${percentEn(ruling.marginalRate)} goes to tax, so you keep ${eur(100 * (1 - ruling.marginalRate))} of €100.`;
  const raiseAnswer = `Without the ruling, ${sum}${thresholdNote ? ` ${thresholdNote}` : ""}${rulingRaise}`;

  return { taxParagraphs, rulingParagraphs, raiseAnswer, zone };
}
