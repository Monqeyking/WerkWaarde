/**
 * What happens at a given income, for the amount pages: the tax bracket, how the
 * algemene heffingskorting and arbeidskorting behave, what that does to a raise, and
 * what it means for zorgtoeslag, kindgebonden budget and pension. Everything is derived
 * from the year's parameters in tax-years.ts, so the text stays right when the figures
 * change and differs per income instead of repeating one template.
 */
import { employmentTaxCredit, generalTaxCredit } from "./calculator.ts";
import { percent, ratePercent } from "./format.ts";
import { zorgtoeslagAnnual } from "./toeslagen.ts";
import { DEFAULT_TAX_YEAR, taxYear } from "./tax-years.ts";

/** Age used on the amount pages: below the AOW age. */
const AGE = 35;
/** A threshold this close above the income (share of the income) gets its own note. */
const NEAR_SHARE = 0.08;
/** Thresholds closer together than this are reported as one. */
const SAME_THRESHOLD = 100;

const eur = (amount: number) => `€ ${Math.round(amount).toLocaleString("nl-NL")}`;
const cents = (rate: number) => `${ratePercent(Math.abs(rate)).replace("%", "")} cent`;

/** The income levels where the marginal rate or an allowance changes, for a tax year. */
export function incomeThresholds(year = DEFAULT_TAX_YEAR) {
  const params = taxYear(year);
  const general = params.generalCredit;
  const employment = params.employmentCredit;
  const phaseOut = employment[employment.length - 1];
  const zorg = params.allowances.zorgtoeslag;
  const zorgEnd = (premiums: number, normRate: number) =>
    zorg.thresholdIncome + (zorg.standardPremium * premiums - normRate * zorg.thresholdIncome) / zorg.phaseOutRate;
  return {
    brackets: params.brackets,
    generalStart: general.phaseOutFrom,
    generalEnd: general.phaseOutFrom + general.max / general.phaseOutRate,
    employmentPeak: phaseOut.from,
    employmentEnd: phaseOut.rate < 0 ? phaseOut.from + phaseOut.base / -phaseOut.rate : Number.POSITIVE_INFINITY,
    zorgEndSingle: zorgEnd(1, zorg.normRateSingle),
    zorgEndPartner: zorgEnd(2, zorg.normRatePartner),
  };
}

/** One part of the marginal rate: the bracket rate, or a credit that shrinks (+) or grows (−). */
export type RatePart = { label: string; rate: number };

/** The marginal rate at an income, split into its parts. */
export function marginalParts(income: number, year = DEFAULT_TAX_YEAR): RatePart[] {
  const params = taxYear(year);
  const bracket = params.brackets.find((b) => income < b.limit) ?? params.brackets[params.brackets.length - 1];
  const parts: RatePart[] = [{ label: "belastingschijf", rate: bracket.rate }];
  const step = 1;
  const general = (generalTaxCredit(income, AGE, params) - generalTaxCredit(income + step, AGE, params)) / step;
  if (general > 0.0005) parts.push({ label: "minder algemene heffingskorting", rate: general });
  const employment = (employmentTaxCredit(income, AGE, params) - employmentTaxCredit(income + step, AGE, params)) / step;
  if (employment > 0.0005) parts.push({ label: "minder arbeidskorting", rate: employment });
  if (employment < -0.0005) parts.push({ label: "extra arbeidskorting", rate: employment });
  return parts;
}

export type AmountTip = { text: string; href?: string; link?: string };

export type AmountContext = {
  year: number;
  /** Taxable income per year the text is about (salary plus holiday allowance). */
  income: number;
  bracketIndex: number;
  generalCredit: number;
  generalCreditMax: number;
  employmentCredit: number;
  employmentCreditMax: number;
  /** Marginal rate just above the income, the sum of `parts`. */
  marginal: number;
  parts: RatePart[];
  zorgtoeslagMonthly: number;
  paragraphs: string[];
  tips: AmountTip[];
  /** Answer to "what does a raise yield, and why?", for the FAQ. */
  raiseAnswer: string;
  /** The marginal rate changes within a few hundred euros above this income. */
  rateChangesSoon: boolean;
};

const BRACKET_NAMES = ["eerste", "tweede", "derde", "vierde"];

/** Explanation of what happens at this taxable annual income (salary plus holiday allowance, no pension). */
export function amountContext(income: number, year = DEFAULT_TAX_YEAR): AmountContext {
  const params = taxYear(year);
  const t = incomeThresholds(year);
  const brackets = params.brackets;
  const bracketIndex = Math.max(0, brackets.findIndex((b) => income < b.limit));
  const bracket = brackets[bracketIndex];
  const top = brackets[brackets.length - 1];
  // Rates just above the income, so a page a few euros below a threshold explains the rate a raise gets.
  const parts = marginalParts(income + 50, year);
  const marginal = parts.reduce((sum, part) => sum + part.rate, 0);
  const generalCredit = generalTaxCredit(income, AGE, params);
  const employmentCredit = employmentTaxCredit(income, AGE, params);
  const employmentCreditMax = Math.max(...params.employmentCredit.map((s) => s.base));
  const zorgAnnual = zorgtoeslagAnnual(income, false, false, year);
  const keep100 = 100 * (1 - marginal);

  // A threshold just above this income: within €100 a raise lands past it at once,
  // further away the rate changes after a raise of that size.
  const candidates = [
    ...brackets.slice(0, -1).map((b, index) => ({ at: b.limit, label: index === brackets.length - 2 ? "het toptarief" : `de ${BRACKET_NAMES[index + 1] ?? `${index + 2}e`} schijf` })),
    { at: t.generalStart, label: "de afbouw van de algemene heffingskorting" },
    { at: t.generalEnd, label: "het einde van de algemene heffingskorting" },
    { at: t.employmentPeak, label: "de afbouw van de arbeidskorting" },
    { at: t.employmentEnd, label: "het einde van de arbeidskorting" },
  ].filter((c) => Number.isFinite(c.at) && c.at > income && c.at - income <= income * NEAR_SHARE).sort((a, b) => a.at - b.at);
  let thresholdNote: string | undefined;
  let atThreshold = false;
  if (candidates.length > 0) {
    const first = candidates[0];
    const labels = candidates.filter((c) => c.at - first.at < SAME_THRESHOLD).map((c) => c.label);
    const label = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} en ${labels[labels.length - 1]}` : labels[0];
    const above = marginalParts(first.at + 50, year).reduce((sum, part) => sum + part.rate, 0);
    atThreshold = first.at - income < 100;
    thresholdNote = atThreshold
      ? `Je zit maar ${eur(first.at - income)} per jaar onder ${label}. Een loonsverhoging valt daar dus meteen in.`
      : `Je zit ${eur(first.at - income)} per jaar onder ${label}. Verdien je meer dan dat, dan gaat er van elke extra euro ${percent(above)} naar belasting in plaats van ${percent(marginal)}.`;
  }
  const inlineNote = atThreshold && thresholdNote ? ` ${thresholdNote}` : "";

  const paragraphs: string[] = [];

  // 1. The bracket.
  const ordinal = BRACKET_NAMES[bracketIndex] ?? `${bracketIndex + 1}e`;
  if (bracketIndex === 0) {
    paragraphs.push(`Met ${eur(income)} per jaar, vakantiegeld meegeteld, valt je hele inkomen in de eerste belastingschijf. Daarin betaal je ${ratePercent(bracket.rate)} loonbelasting en premies volksverzekeringen. De tweede schijf, met ${ratePercent(brackets[1].rate)}, begint bij ${eur(brackets[0].limit)}.${inlineNote}`);
  } else if (bracket === top) {
    paragraphs.push(`Met ${eur(income)} per jaar, vakantiegeld meegeteld, betaal je over het deel boven ${eur(brackets[bracketIndex - 1].limit)} het toptarief van ${ratePercent(top.rate)}. Over de eerste ${eur(brackets[0].limit)} betaal je ${ratePercent(brackets[0].rate)}, daartussen ${ratePercent(brackets[1].rate)}.`);
  } else {
    paragraphs.push(`Met ${eur(income)} per jaar, vakantiegeld meegeteld, zit je in de ${ordinal} belastingschijf. Over de eerste ${eur(brackets[bracketIndex - 1].limit)} betaal je ${ratePercent(brackets[bracketIndex - 1].rate)}, over het deel daarboven ${ratePercent(bracket.rate)}. Het toptarief van ${ratePercent(top.rate)} begint bij ${eur(brackets[brackets.length - 2].limit)}.${inlineNote}`);
  }

  // 2. The two big credits.
  const general = params.generalCredit;
  const generalText = income < t.generalStart
    ? `Je krijgt de volledige algemene heffingskorting van ${eur(general.max)}. Die wordt kleiner boven ${eur(t.generalStart)}.`
    : generalCredit > 0
      ? `De algemene heffingskorting wordt boven ${eur(t.generalStart)} kleiner, met ${cents(general.phaseOutRate)} per extra euro. Bij jouw inkomen is er nog ${eur(generalCredit)} van de ${eur(general.max)} over.`
      : `De algemene heffingskorting is bij dit inkomen helemaal afgebouwd. Vanaf ongeveer ${eur(t.generalEnd)} krijg je die niet meer.`;
  const segment = [...params.employmentCredit].reverse().find((s) => income >= s.from) ?? params.employmentCredit[0];
  const employmentText = employmentCredit <= 0
    ? `De arbeidskorting is op: die is vanaf ongeveer ${eur(t.employmentEnd)} helemaal afgebouwd.`
    : segment.rate < 0
      ? `Ook de arbeidskorting wordt kleiner: boven ${eur(t.employmentPeak)} gaat er ${cents(segment.rate)} per extra euro af. Je hebt nog ${eur(employmentCredit)} arbeidskorting, van maximaal ${eur(employmentCreditMax)}.`
      : `De arbeidskorting is ${eur(employmentCredit)} en groeit nog met ${cents(segment.rate)} per extra euro, tot ${eur(employmentCreditMax)} bij ${eur(t.employmentPeak)}.`;
  paragraphs.push(`${generalText} ${employmentText}`);

  // 3. What that adds up to (the rates just above the income, so they match a raise).
  const breakdown = parts.map((part, index) => {
    if (index === 0) return `${ratePercent(part.rate)} ${part.label}`;
    const value = ratePercent(Math.abs(part.rate));
    return part.rate < 0 ? `min ${value} ${part.label}` : `plus ${value} ${part.label}`;
  }).join(", ");
  const sumCore = `ongeveer ${percent(marginal)} naar belasting: ${breakdown}. Van ${eur(100)} opslag houd je ${eur(keep100)} netto over.`;
  paragraphs.push(`Van elke extra euro bruto gaat daardoor ${sumCore}`);

  // 4. The threshold just above, when a raise of a few hundred euros changes the rate.
  const rateChangesSoon = Boolean(thresholdNote) && !atThreshold;
  if (rateChangesSoon && thresholdNote) paragraphs.push(thresholdNote);
  if (bracket === top && employmentCredit > 0 && Number.isFinite(t.employmentEnd)) {
    paragraphs.push(`Dat is meer dan het toptarief, omdat de arbeidskorting hier nog wordt afgebouwd. Pas vanaf ongeveer ${eur(t.employmentEnd)} per jaar is die op, en daalt je marginale tarief weer naar ${ratePercent(top.rate)}.`);
  }

  // Tips: toeslagen, raises, pension.
  const tips: AmountTip[] = [];
  const allowances = params.allowances;
  if (zorgAnnual > 0) {
    tips.push({ text: `Ben je alleenstaand en blijft je vermogen onder ${eur(allowances.assetLimit.single)}, dan heb je bij dit inkomen recht op ongeveer ${eur(zorgAnnual / 12)} zorgtoeslag per maand. Die wordt kleiner naarmate je meer verdient en stopt rond ${eur(t.zorgEndSingle)} per jaar. Met een toeslagpartner telt jullie samengetelde inkomen, en ligt die grens rond ${eur(t.zorgEndPartner)}.` });
  } else if (income < t.zorgEndPartner) {
    tips.push({ text: `Als alleenstaande krijg je bij dit inkomen geen zorgtoeslag meer: die stopt rond ${eur(t.zorgEndSingle)} per jaar. Met een toeslagpartner telt jullie samengetelde inkomen; die grens ligt rond ${eur(t.zorgEndPartner)}.` });
  }
  const kgb = allowances.kindgebondenBudget;
  const kgbLink = { href: "/vragen/kindgebonden-budget-2026", link: "Hoeveel kindgebonden budget krijg je?" };
  if (income < kgb.thresholdSingle) {
    tips.push({ text: `Heb je kinderen, dan krijg je bij dit inkomen het volledige kindgebonden budget. Dat wordt lager boven een toetsingsinkomen van ${eur(kgb.thresholdSingle)} als alleenstaande, of ${eur(kgb.thresholdPartner)} samen met een toeslagpartner.`, ...kgbLink });
  } else if (bracket !== top) {
    tips.push({ text: `Krijg je kindgebonden budget, dan wordt dat boven ${eur(kgb.thresholdSingle)} als alleenstaande (of ${eur(kgb.thresholdPartner)} samen) verlaagd met ${percent(kgb.phaseOutRate)} van het meerdere, tot het op is. Zolang je het nog krijgt, komt dat bovenop het tarief hierboven.`, ...kgbLink });
  }
  if (marginal >= 0.5) {
    tips.push({ text: `Bij een marginaal tarief van ${percent(marginal)} is pensioenpremie die je werkgever van je loon inhoudt relatief goedkoop: ${eur(100)} extra premie kost je netto maar ongeveer ${eur(keep100)}, zolang je salaris onder de pensioengrens van ${eur(params.maxPensionableSalary)} blijft.`, href: "/vragen/waarde-pensioen-en-arbeidsvoorwaarden", link: "Wat zijn je pensioen en arbeidsvoorwaarden waard?" });
    tips.push({ text: "Om dezelfde reden levert een extra werkdag minder op dan je uurloon doet vermoeden.", href: "/vragen/loont-meer-uren-werken", link: "Loont het om meer uren te gaan werken?" });
  } else {
    tips.push({
      text: rateChangesSoon
        ? "Van een loonsverhoging houd je bij dit inkomen nog meer dan de helft over, maar boven de grens hierboven minder."
        : `Van een loonsverhoging houd je bij dit inkomen nog meer dan de helft over. Voor ${eur(100)} netto meer per maand heb je ongeveer ${eur(100 / (1 - marginal))} bruto opslag nodig.`,
      href: "/vragen/bruto-voor-100-euro-netto-meer", link: "Hoeveel bruto heb je nodig voor € 100 netto meer?",
    });
  }

  const sum = `Van elke extra euro bruto gaat ${sumCore}`;
  const raiseAnswer = thresholdNote ? `${sum} ${thresholdNote}` : sum;

  return {
    year, income, bracketIndex, generalCredit, generalCreditMax: general.max, employmentCredit, employmentCreditMax,
    marginal, parts, zorgtoeslagMonthly: zorgAnnual / 12, paragraphs, tips, raiseAnswer, rateChangesSoon,
  };
}
