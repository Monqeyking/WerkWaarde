/**
 * The bruto-netto calculator that other sites can put on their pages in an
 * iframe (/embed/bruto-netto). It keeps its inputs in memory only: no cookies,
 * no storage, no ads, so the hosting site needs no consent banner for it.
 */
import { caoSalaryPatch, findCao, type Cao } from "./caos.ts";
import { amountState } from "./amounts.ts";
import { PREFILL_HOLIDAY_PARAM, PREFILL_HOURS_PARAM, updateJobSection, type NettoplaatjeState } from "./job-model.ts";
import { grossToNet, type GrossToNet } from "./spokes.ts";
import { SITE_URL } from "./site.ts";
import { DEFAULT_TAX_YEAR } from "./tax-years.ts";

export type EmbedInput = { grossMonthly: number; hoursPerWeek: number; holidayAllowancePct: number; caoId: string };

export const EMBED_DEFAULTS: EmbedInput = { grossMonthly: 3_500, hoursPerWeek: 40, holidayAllowancePct: 8, caoId: "" };

export const EMBED_PATH = "/embed/bruto-netto";
/** Fixed height that fits the embed on a phone, also with a cao; embed.js shrinks it to the content. */
export const EMBED_HEIGHT = 720;
/** Message the embed posts to its parent so embed.js can size the iframe. */
export const EMBED_MESSAGE = "nettoplaatje:height";

/** A job with the embed's inputs; a chosen cao sets holiday pay, 13th month and pension. */
export function embedState(input: EmbedInput, year = DEFAULT_TAX_YEAR): NettoplaatjeState {
  const state = updateJobSection(amountState(Math.max(0, input.grossMonthly), year, Math.max(0, input.hoursPerWeek)), "current", "salary", {
    holidayAllowancePct: Math.max(0, input.holidayAllowancePct),
  });
  const cao = findCao(input.caoId);
  return cao ? updateJobSection(state, "current", "salary", caoSalaryPatch(cao)) : state;
}

export function embedResult(input: EmbedInput, year = DEFAULT_TAX_YEAR): GrossToNet {
  return grossToNet(embedState(input, year), "current");
}

/** The full calculator on Nettoplaatje with the same salary, hours, holiday pay and cao filled in. */
export function embedMoreUrl(input: EmbedInput): string {
  const hash = new URLSearchParams({ bruto: String(Math.round(input.grossMonthly)) });
  const cao = findCao(input.caoId);
  // Always passed on: the site may have other hours or holiday pay saved from an earlier visit.
  hash.set(PREFILL_HOURS_PARAM, String(input.hoursPerWeek));
  // A cao with its own holiday pay sets it on the site too, as in the embed itself.
  if (cao?.holidayAllowancePct == null) hash.set(PREFILL_HOLIDAY_PARAM, String(input.holidayAllowancePct));
  if (cao) hash.set("cao", input.caoId);
  return `${SITE_URL}/bruto-netto#${hash.toString()}`;
}

/** The note under the embed's result: only what the chosen cao actually adds to it. */
export function embedCaoNote(cao: Cao): string {
  const parts = ["vakantiegeld", cao.yearEndBonusPct ? "13e maand" : null, cao.pension ? "pensioen" : null].filter((part): part is string => part !== null);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} en ${parts.at(-1)}` : parts[0];
  return `Met ${list} volgens de ${cao.name.replace(/^Cao /, "cao ")}.`;
}

/** The code a site owner pastes: the iframe, a normal credit link below it, and the optional resizer. */
export function embedSnippet(): string {
  return [
    `<iframe src="${SITE_URL}${EMBED_PATH}" title="Bruto-nettocalculator van Nettoplaatje" loading="lazy" data-nettoplaatje style="width:100%;max-width:640px;height:${EMBED_HEIGHT}px;border:0"></iframe>`,
    `<p style="font-size:13px">Bruto-nettocalculator van <a href="${SITE_URL}/bruto-netto">Nettoplaatje</a></p>`,
    `<script src="${SITE_URL}/embed.js" async></script>`,
  ].join("\n");
}
