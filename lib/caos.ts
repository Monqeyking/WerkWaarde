/**
 * Employment conditions from large Dutch collective agreements (cao's).
 * Hand-maintained from the cao parties' and pension funds' own publications;
 * every entry names its sources and the date it was last checked. Choosing a
 * cao only prefills fields, the user can still change everything.
 */

import type { JobProfile } from "./job-model.ts";

export type CaoPension = {
  fund: string;
  /** Total premium (employer + employee) as % of the pension base. */
  totalRatePct: number;
  /** Employee's part of the total premium, in % of that total. */
  employeeSharePct: number;
  /** Yearly amount on which no pension is built up. */
  franchise: number;
  /** Whether the holiday allowance counts as pensionable salary. */
  includesHoliday: boolean;
  sourceUrl: string;
};

export type Cao = {
  id: string;
  name: string;
  sector: string;
  /** Term of the agreement, written out in Dutch. */
  period: string;
  /** Full-time hours per week; shown as information, not prefilled. Null when the cao sets none. */
  fullTimeHours: number | null;
  /** Null when the cao leaves it to the employer; the field is then left alone. */
  holidayAllowancePct: number | null;
  /** End-of-year payment or 13th month as % of annual salary; 0 when there is none, null when the cao leaves it open. */
  yearEndBonusPct: number | null;
  /** Null when the pension scheme could not be verified; the pension fields are then left alone. */
  pension: CaoPension | null;
  sourceUrl: string;
  /** Short caveat shown with the prefilled values. */
  note?: string;
  /** ISO date the figures were last checked against the sources. */
  checkedOn: string;
};

const CHECKED = "2026-11-16";
const ABP_2026 = "https://www.abp.nl/content/dam/abp/documenten/formulieren-tabellen/premietabel-2026.pdf";
const MAX_SHARE_NOTE = "Het werknemersdeel van de pensioenpremie is het maximum dat je werkgever mag inhouden.";

export const CAOS: readonly Cao[] = [
  {
    id: "rijk", name: "Cao Rijk", sector: "Rijksoverheid", period: "1 januari – 31 december 2026",
    fullTimeHours: 36, holidayAllowancePct: 8, yearEndBonusPct: 8.5,
    pension: { fund: "ABP", totalRatePct: 27.1, employeeSharePct: 30, franchise: 19_200, includesHoliday: true, sourceUrl: ABP_2026 },
    sourceUrl: "https://www.caorijk.nl/cao-rijk/1.-algemeen/hoofdstuk-9/individueel-keuzebudget",
    note: "Vakantiegeld en 13e maand komen samen uit het Individueel Keuzebudget van 16,5%.",
    checkedOn: CHECKED,
  },
  {
    id: "gemeenten", name: "Cao Gemeenten", sector: "Gemeenten", period: "1 april 2025 – 31 maart 2027",
    fullTimeHours: 36, holidayAllowancePct: 8, yearEndBonusPct: 9.05,
    pension: { fund: "ABP", totalRatePct: 27.1, employeeSharePct: 30, franchise: 19_200, includesHoliday: true, sourceUrl: ABP_2026 },
    sourceUrl: "https://www.caogemeenten.nl/cao-gemeenten-2025-2027/individueel-keuzebudget",
    note: "Vakantiegeld en 13e maand komen samen uit het Individueel Keuzebudget van 17,05%.",
    checkedOn: CHECKED,
  },
  {
    id: "primair-onderwijs", name: "Cao Primair onderwijs", sector: "Onderwijs", period: "1 november 2025 – 28 februari 2027",
    fullTimeHours: 40, holidayAllowancePct: 8, yearEndBonusPct: 8.33,
    pension: { fund: "ABP", totalRatePct: 27.1, employeeSharePct: 30, franchise: 19_200, includesHoliday: true, sourceUrl: ABP_2026 },
    sourceUrl: "https://www.cnv.nl/documents/5312/Cao_PO_2025-2027.pdf",
    note: "De oktobertoelage is een vast bedrag; vul die in bij bonus als je hem krijgt.",
    checkedOn: CHECKED,
  },
  {
    id: "ziekenhuizen", name: "Cao Ziekenhuizen", sector: "Zorg", period: "1 februari 2025 – 31 januari 2027",
    fullTimeHours: 36, holidayAllowancePct: 8.33, yearEndBonusPct: 8.33,
    pension: { fund: "PFZW", totalRatePct: 25.9, employeeSharePct: 50, franchise: 17_283, includesHoliday: true, sourceUrl: "https://www.pfzw.nl/werkgevers/premie-en-factuur/premiepercentages-en-franchises.html" },
    sourceUrl: "https://www.fnv.nl/getmedia/f920eb0e-c6c2-4fe0-a943-ad54741630f9/1158-ziekenhuizen-cao-01-02-2025-tm-31-01-2027-v20102025.pdf?ext=.pdf",
    checkedOn: CHECKED,
  },
  {
    id: "vvt", name: "Cao VVT (verpleeg- en verzorgingshuizen, thuiszorg)", sector: "Zorg", period: "1 september 2026 – 15 september 2028",
    fullTimeHours: 36, holidayAllowancePct: 8, yearEndBonusPct: 8.33,
    pension: { fund: "PFZW", totalRatePct: 25.9, employeeSharePct: 50, franchise: 17_283, includesHoliday: true, sourceUrl: "https://www.actiz.nl/sites/default/files/2026-01/Salarisinformatie%202026%20%28versie%20januari%202026%29.pdf" },
    sourceUrl: "https://zoek.officielebekendmakingen.nl/stcrt-2025-25154.html",
    checkedOn: CHECKED,
  },
  {
    id: "supermarkten", name: "Cao Supermarkten (VGL)", sector: "Retail", period: "2 juli 2024 – 31 maart 2026, nieuwe cao in onderhandeling",
    fullTimeHours: 40, holidayAllowancePct: 8, yearEndBonusPct: 0,
    pension: { fund: "Bpf Levensmiddelen", totalRatePct: 27.6, employeeSharePct: 28.84, franchise: 19_583.5, includesHoliday: true, sourceUrl: "https://werkgever.bpfl.nl/api/cms/media/4306a409-067b-4b4a-a8e2-9432f5934222" },
    sourceUrl: "https://www.fnv.nl/getmedia/18c9c6e7-339c-46d3-963e-af97eb245d25/608-vgl-cao-2024-2026-v10032025.pdf?ext=.pdf",
    note: "Sommige ketens hebben een eigen pensioenregeling; check dan je loonstrook.",
    checkedOn: CHECKED,
  },
  {
    id: "uitzendkrachten-abu", name: "Cao Uitzendkrachten (ABU)", sector: "Uitzendwerk", period: "1 januari 2026 – 31 december 2028",
    fullTimeHours: null, holidayAllowancePct: null, yearEndBonusPct: null,
    pension: { fund: "StiPP", totalRatePct: 23.4, employeeSharePct: 32.05, franchise: 17_297, includesHoliday: true, sourceUrl: "https://www.stippensioen.nl/werkgever/nieuws/definitieve-cijfers-en-bedragen-2026-zijn-bekend/" },
    sourceUrl: "https://www.abu.nl/app/uploads/2026/09/CAO-voor-Uitzendkrachten-2026-2028-NL-webversie-mei-2026.pdf",
    note: "Vakantiegeld, 13e maand en uren volgen de regeling van de opdrachtgever (minimaal 8% vakantiegeld). De franchise is omgerekend van € 9,24 per uur bij 36 uur per week.",
    checkedOn: CHECKED,
  },
  {
    id: "metaal-en-techniek", name: "Cao Metaal en Techniek", sector: "Techniek", period: "1 februari 2026 – 31 januari 2028",
    fullTimeHours: 38, holidayAllowancePct: 8, yearEndBonusPct: 0,
    pension: { fund: "PMT", totalRatePct: 27.98, employeeSharePct: 36.74, franchise: 19_172, includesHoliday: true, sourceUrl: "https://www.pmt.nl/media/to5b5hdk/pmt402_laag2_2026.pdf" },
    sourceUrl: "https://www.fnv.nl/getmedia/a448b42a-3973-4332-b70c-ef914eb250c7/529-metaal-en-techniek-metaalbewerkingsbedrijf-cao-01-02-2026-31-01-2028-v19032026.pdf?ext=.pdf",
    note: `${MAX_SHARE_NOTE} Pensioen wordt opgebouwd tot € 99.321 salaris per jaar.`,
    checkedOn: CHECKED,
  },
  {
    id: "metalektro", name: "Cao Metalektro", sector: "Techniek", period: "1 januari – 31 december 2026",
    fullTimeHours: 40, holidayAllowancePct: 8, yearEndBonusPct: 0,
    pension: { fund: "PME", totalRatePct: 27.98, employeeSharePct: 38.92, franchise: 19_172, includesHoliday: true, sourceUrl: "https://www.pmepensioen.nl/rekencijfers" },
    sourceUrl: "https://www.fnv.nl/getmedia/5d171cbc-1373-43c9-9d71-06fd03042fbf/315-metalektro-cao-01-01-2026-tm-31-12-2026-v06032026.pdf?ext=.pdf",
    note: `${MAX_SHARE_NOTE} Pensioen wordt opgebouwd tot € 100.731 salaris per jaar.`,
    checkedOn: CHECKED,
  },
  {
    id: "bouw-en-infra", name: "Cao Bouw & Infra", sector: "Bouw", period: "1 januari 2025 – 31 maart 2027",
    fullTimeHours: 40, holidayAllowancePct: 8, yearEndBonusPct: 0,
    pension: { fund: "bpfBOUW", totalRatePct: 25.93, employeeSharePct: 36.64, franchise: 19_172, includesHoliday: true, sourceUrl: "https://werkgevers.bpfbouw.nl/content/dam/dep-wg/bpfbouw/documenten/rekenregels/totaal/Verkorte-versie-totaal-2026.pdf" },
    sourceUrl: "https://www.bter-bouw.nl/content/dam/bter/documenten/juridisch/cao%20bouw%20infra%202025%202027.pdf",
    note: "Pensioenpremie voor bouwplaatsmedewerkers; voor UTA-personeel is de verdeling iets anders. Pensioen wordt opgebouwd tot € 82.495 salaris per jaar.",
    checkedOn: CHECKED,
  },
];

export function findCao(id: string): Cao | undefined {
  return CAOS.find((cao) => cao.id === id);
}

/** Salary fields to set when the user picks this cao. Gross salary and hours are left alone. */
export function caoSalaryPatch(cao: Cao): Partial<JobProfile["salary"]> {
  return {
    caoId: cao.id,
    ...(cao.holidayAllowancePct !== null && { holidayAllowancePct: cao.holidayAllowancePct }),
    ...(cao.yearEndBonusPct !== null && { yearEndBonusPct: cao.yearEndBonusPct }),
    ...(cao.pension && {
      pensionMode: "scheme" as const,
      pensionTotalRatePct: cao.pension.totalRatePct,
      pensionEmployeeSharePct: cao.pension.employeeSharePct,
      pensionFranchise: cao.pension.franchise,
      pensionIncludesHoliday: cao.pension.includesHoliday,
    }),
  };
}

/** "Vakantiegeld, 13e maand en pensioen": only the parts this cao fills in. */
export function caoFilledText(cao: Cao): string {
  const parts = [
    cao.holidayAllowancePct !== null ? "vakantiegeld" : null,
    cao.yearEndBonusPct !== null ? "13e maand" : null,
    cao.pension ? "pensioen" : null,
  ].filter((part): part is string => part !== null);
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} en ${parts[parts.length - 1]}` : parts[0] ?? "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "16 november 2026" for an ISO date. */
export function checkedOnText(cao: Cao): string {
  const [year, month, day] = cao.checkedOn.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
