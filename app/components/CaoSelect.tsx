"use client";

import Link from "next/link";
import { useId } from "react";
import { CAOS, caoFilledText, caoSalaryPatch, checkedOnText, findCao } from "../../lib/caos";
import { money } from "../../lib/format";
import type { JobProfile } from "../../lib/job-model";

/** Cao's grouped by sector, both sorted alphabetically, for the dropdown. */
const groups = [...new Set(CAOS.map((cao) => cao.sector))]
  .sort((a, b) => a.localeCompare(b, "nl"))
  .map((sector) => ({
    sector,
    caos: CAOS.filter((cao) => cao.sector === sector).sort((a, b) => a.name.localeCompare(b.name, "nl")),
  }));

/**
 * "Mijn cao" picker. Choosing a cao prefills holiday allowance, 13th month and
 * the pension scheme; the user can still change every field afterwards.
 */
export function CaoSelect({ salary, onChange }: {
  salary: JobProfile["salary"];
  onChange: (patch: Partial<JobProfile["salary"]>) => void;
}) {
  const id = useId();
  if (CAOS.length === 0) return null;
  const cao = findCao(salary.caoId);
  return <div className="field cao-select">
    <span className="field-label"><label htmlFor={id}>Mijn cao</label></span>
    <span className="input-wrap">
      <select id={id} value={cao?.id ?? ""} onChange={(event) => {
        const picked = findCao(event.target.value);
        onChange(picked ? caoSalaryPatch(picked) : { caoId: "" });
      }}>
        <option value="">Geen / zelf invullen</option>
        {groups.map((group) => <optgroup key={group.sector} label={group.sector}>
          {/* The label already says "cao", so the options drop the prefix and fit narrow columns. */}
          {group.caos.map((option) => <option key={option.id} value={option.id}>{option.name.replace(/^Cao /, "")}</option>)}
        </optgroup>)}
      </select>
    </span>
    {cao && <details className="cao-note">
      <summary>{caoFilledText(cao)} ingevuld volgens deze cao. Pas aan als jouw situatie afwijkt.</summary>
      <p>{cao.name}, {cao.period}.
        {cao.fullTimeHours !== null && <> Voltijd is {cao.fullTimeHours.toLocaleString("nl-NL")} uur per week.</>}
        {cao.pension?.maxSalary && <> Pensioen wordt opgebouwd tot {money(cao.pension.maxSalary)} salaris per jaar.</>}
        {cao.note && <> {cao.note}</>}
        {" "}Gecontroleerd op {checkedOnText(cao)}: <a href={cao.sourceUrl} target="_blank" rel="noreferrer">cao</a>
        {cao.pension && <>, <a href={cao.pension.sourceUrl} target="_blank" rel="noreferrer">{cao.pension.fund}</a></>}.
        {" "}<Link href={`/cao/${cao.id}`}>Meer over de {cao.name.replace(/^Cao /, "cao ")}</Link>.</p>
    </details>}
  </div>;
}
