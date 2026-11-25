/**
 * "Wat is bijzonder aan deze cao?": what sets a cao apart from the others on the site and
 * from the cao's in its own sector, in money at the example salary. Every statement is
 * computed from lib/caos.ts and the regular calculator, so the pages differ where the
 * cao's really differ instead of repeating one template.
 */
import { amountState, euro } from "./amounts.ts";
import { CAOS, type Cao } from "./caos.ts";
import { CAO_HIGHLIGHT_SALARY, caoExample, caoHours, caoInText, employeeRatePct, pct, sectorSiblings } from "./cao-pages.ts";
import { moneyCents, percent } from "./format.ts";
import { grossToNet } from "./spokes.ts";
import { DEFAULT_TAX_YEAR, taxYear } from "./tax-years.ts";

const WEEKS_PER_YEAR = 52;
const LONGEST_WEEK = 40;

/** Total of holiday allowance and 13th month / year-end payment, in %; null when the cao leaves them open. */
export const extrasPct = (cao: Cao) =>
  cao.holidayAllowancePct === null || cao.yearEndBonusPct === null ? null : cao.holidayAllowancePct + cao.yearEndBonusPct;

/** Employer's part of the pension premium, as % of the pension base. */
export const employerRatePct = (cao: Cao) => cao.pension ? Math.round(cao.pension.totalRatePct * (100 - cao.pension.employeeSharePct)) / 100 : 0;

/** Employer pension contribution per year at a monthly gross salary. */
export function employerPensionAnnual(cao: Cao, grossMonthly: number, year = DEFAULT_TAX_YEAR) {
  const share = cao.pension?.employeeSharePct ?? 0;
  if (!share) return 0;
  return caoExample(cao, grossMonthly, year).pensionMonthly * 12 * (100 - share) / share;
}

/** "het hoogste", "het op een na hoogste", "het laagste", or a comparison with the rest. */
function rankText(value: number, values: number[], higher: string, lower: string) {
  const above = values.filter((other) => other > value + 1e-9).length;
  const below = values.filter((other) => other < value - 1e-9).length;
  const same = values.length - above - below - 1;
  const shared = same > 0 ? `, samen met ${same} andere cao${same === 1 ? "" : "'s"}` : "";
  if (above === 0) return `${higher}${shared}`;
  if (below === 0) return `${lower}${shared}`;
  return above < below ? `hoger dan bij ${below} van de ${values.length - 1} andere cao's` : `lager dan bij ${above} van de ${values.length - 1} andere cao's`;
}

const join = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} en ${items[items.length - 1]}` : items[0] ?? "";
const shortName = (cao: Cao) => caoInText(cao).replace(/\s*\(.*\)$/, "");

/** The terms on which two cao's differ, as short Dutch phrases about `cao`. */
function differences(cao: Cao, other: Cao): string[] {
  const diffs: string[] = [];
  if (cao.holidayAllowancePct !== other.holidayAllowancePct && cao.holidayAllowancePct !== null && other.holidayAllowancePct !== null) {
    diffs.push(`${pct(cao.holidayAllowancePct)} vakantiegeld in plaats van ${pct(other.holidayAllowancePct)}`);
  }
  if (cao.yearEndBonusPct !== other.yearEndBonusPct && cao.yearEndBonusPct !== null && other.yearEndBonusPct !== null) {
    diffs.push(cao.yearEndBonusPct === 0 ? "geen 13e maand"
      : other.yearEndBonusPct === 0 ? `een eindejaarsuitkering van ${pct(cao.yearEndBonusPct)}, waar die geen heeft`
      : `een eindejaarsuitkering van ${pct(cao.yearEndBonusPct)} in plaats van ${pct(other.yearEndBonusPct)}`);
  }
  if (cao.fullTimeHours !== other.fullTimeHours && cao.fullTimeHours !== null && other.fullTimeHours !== null) {
    diffs.push(`een voltijdweek van ${cao.fullTimeHours} in plaats van ${other.fullTimeHours} uur`);
  }
  if (cao.pension && other.pension && cao.pension.fund !== other.pension.fund) {
    diffs.push(`pensioen bij ${cao.pension.fund} in plaats van ${other.pension.fund}`);
  } else if (cao.pension && other.pension && employeeRatePct(cao) !== employeeRatePct(other)) {
    diffs.push(`een eigen pensioenpremie van ${pct(employeeRatePct(cao))} in plaats van ${pct(employeeRatePct(other))}`);
  }
  return diffs;
}

export type CaoContext = { paragraphs: string[]; netVersusPlain: number; employerAnnual: number };

export function caoContext(cao: Cao, year = DEFAULT_TAX_YEAR, others: readonly Cao[] = CAOS): CaoContext {
  const gross = CAO_HIGHLIGHT_SALARY;
  const name = caoInText(cao);
  const h = caoExample(cao, gross, year);
  const paragraphs: string[] = [];

  // 1. Holiday pay and 13th month, compared with the other cao's.
  const extras = extrasPct(cao);
  const withExtras = others.filter((other) => extrasPct(other) !== null);
  const noThirteenth = others.filter((other) => other.yearEndBonusPct === 0 && other.id !== cao.id);
  if (extras === null) {
    paragraphs.push(`De ${name} laat vakantiegeld en een 13e maand over aan de regeling van de opdrachtgever, met minimaal 8% vakantiegeld. Wat je krijgt, hangt dus af van het bedrijf waar je werkt.`);
  } else if (cao.yearEndBonusPct === 0) {
    paragraphs.push(`De ${name} kent geen 13e maand, net als ${noThirteenth.length} andere cao's hier, zoals de ${join(noThirteenth.slice(0, 3).map(shortName))}. Je vaste extra is alleen ${pct(cao.holidayAllowancePct ?? 8)} vakantiegeld: bij ${euro(gross)} bruto per maand ${euro(h.holidayGrossAnnual)} bruto per jaar.`);
  } else {
    paragraphs.push(`Met ${pct(cao.holidayAllowancePct ?? 8)} vakantiegeld en een ${cao.yearEndBonusPct === 8.33 ? "13e maand" : "eindejaarsuitkering"} van ${pct(cao.yearEndBonusPct ?? 0)} krijg je samen ${pct(Math.round(extras * 100) / 100)} van je jaarsalaris extra. Dat is ${rankText(extras, withExtras.filter((other) => other.id !== cao.id).map((other) => extrasPct(other) ?? 0).concat(extras), "het hoogste van de cao's hier", "het laagste van de cao's hier")}. Bij ${euro(gross)} bruto per maand is dat ${euro(h.holidayGrossAnnual + h.yearEndGrossAnnual)} bruto per jaar, waarvan ongeveer ${euro(h.holidayNetAnnual + h.yearEndNetAnnual)} netto.`);
  }

  // 2. Pension: own premium, employer premium, cap.
  const employerAnnual = employerPensionAnnual(cao, gross, year);
  if (cao.pension) {
    const p = cao.pension;
    const withPension = others.filter((other) => other.pension);
    const ownRates = withPension.map(employeeRatePct);
    const employerRates = withPension.map(employerRatePct);
    paragraphs.push(`Voor je pensioen bij ${p.fund} betaal je zelf ${pct(employeeRatePct(cao))} van de grondslag, ${rankText(employeeRatePct(cao), ownRates, "het hoogste eigen deel", "het laagste eigen deel")}. Je werkgever betaalt ${pct(employerRatePct(cao))}, ${rankText(employerRatePct(cao), employerRates, "het hoogste werkgeversdeel", "het laagste werkgeversdeel")}. Bij ${euro(gross)} bruto is dat ${euro(h.pensionMonthly)} per maand van jou en ongeveer ${euro(employerAnnual)} per jaar van je werkgever.`);
    const fiscalMax = taxYear(year).maxPensionableSalary;
    if (p.maxSalary && p.maxSalary < fiscalMax) {
      const lowest = Math.min(...withPension.map((other) => other.pension?.maxSalary ?? fiscalMax));
      paragraphs.push(`Pensioen bouw je via deze regeling op over je salaris tot ${euro(p.maxSalary)} per jaar${p.maxSalary === lowest ? ", de laagste grens van alle cao's hier" : ""}. Verdien je meer, dan bouw je over het deel daarboven hier geen pensioen op, terwijl dat fiscaal tot ${euro(fiscalMax)} mag. Vraag dan na of je werkgever een aanvullende regeling heeft.`);
    }
  }

  // 3. Net compared with a job without 13th month and pension.
  const plain = grossToNet(amountState(gross, year, caoHours(cao)), "current");
  const netVersusPlain = h.netAnnual - plain.netAnnual;
  const why = netVersusPlain >= 0
    ? (cao.pension ? "De 13e maand weegt zwaarder dan je eigen pensioenpremie." : "Dat komt door de 13e maand.")
    : cao.yearEndBonusPct === null ? "Dat is je eigen pensioenpremie; een 13e maand van de opdrachtgever zit hier niet in."
    : cao.yearEndBonusPct ? "Je eigen pensioenpremie is hoger dan wat de eindejaarsuitkering netto oplevert." : "Dat is je eigen pensioenpremie, zonder 13e maand ertegenover.";
  paragraphs.push(`Vergeleken met een baan met hetzelfde bruto salaris, 8% vakantiegeld, geen 13e maand en geen pensioen houd je bij de ${shortName(cao)} ${euro(Math.abs(netVersusPlain))} per jaar ${netVersusPlain >= 0 ? "meer" : "minder"} netto over. ${why}${employerAnnual > 0 ? ` Daar staat ${euro(employerAnnual)} per jaar aan werkgeverspremie voor je pensioen tegenover, die je netto niet ziet.` : ""}`);

  // 4. The full-time week.
  if (cao.fullTimeHours !== null && cao.fullTimeHours < LONGEST_WEEK) {
    const hourly = gross * 12 / (WEEKS_PER_YEAR * cao.fullTimeHours);
    const hourly40 = gross * 12 / (WEEKS_PER_YEAR * LONGEST_WEEK);
    paragraphs.push(`Voltijd is hier ${cao.fullTimeHours} uur per week. Bij hetzelfde maandsalaris is je uurloon daardoor ${percent(hourly / hourly40 - 1)} hoger dan bij een werkweek van 40 uur: ${moneyCents(hourly)} in plaats van ${moneyCents(hourly40)} bruto per uur. Vergelijk je een vacature onder een andere cao, kijk dan naar het uurloon.`);
  } else if (cao.fullTimeHours === LONGEST_WEEK) {
    const shorter = others.filter((other) => other.fullTimeHours !== null && other.fullTimeHours < LONGEST_WEEK);
    const same = others.filter((other) => other.fullTimeHours === LONGEST_WEEK && other.id !== cao.id);
    paragraphs.push(`Voltijd is hier 40 uur per week, de langste werkweek van de cao's hier, net als bij ${same.length} andere. Bij ${shorter.length} cao's is voltijd 36 of 38 uur: daar hoort bij hetzelfde maandsalaris een hoger uurloon.`);
  }

  // 5. The other cao's in the same sector.
  const siblings = sectorSiblings(cao).filter((other) => others.includes(other));
  if (siblings.length > 0) {
    const same = siblings.filter((other) => differences(cao, other).length === 0);
    const sentences = siblings.filter((other) => !same.includes(other))
      .map((other) => `Ten opzichte van de ${shortName(other)} heeft de ${shortName(cao)} ${join(differences(cao, other))}.`);
    if (same.length > 0) {
      sentences.push(`${["de " + shortName(cao), ...same.map((other) => `de ${shortName(other)}`)].map((text, index) => index === 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text).reduce((all, text, index, list) => index === 0 ? text : `${all}${index === list.length - 1 ? " en " : ", "}${text}`, "")} regelen vakantiegeld, 13e maand, werkweek en pensioen hetzelfde; het verschil zit in de salarisschalen en andere afspraken.`);
    }
    paragraphs.push(sentences.join(" "));
  }

  return { paragraphs, netVersusPlain, employerAnnual };
}
