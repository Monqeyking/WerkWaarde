"use client";

import { useId } from "react";
import { CAOS, caoFilledText, caoSalaryPatch, checkedOnText, findCao } from "../../lib/caos";
import type { JobProfile } from "../../lib/job-model";

const sorted = [...CAOS].sort((a, b) => a.name.localeCompare(b.name, "nl"));

/**
 * "Mijn cao" picker. Choosing a cao prefills holiday allowance, 13th month and
 * the pension scheme; the user can still change every field afterwards.
 */
export function CaoSelect({ salary, onChange }: {
  salary: JobProfile["salary"];
  onChange: (patch: Partial<JobProfile["salary"]>) => void;
}) {
  const id = useId();
  if (sorted.length === 0) return null;
  const cao = findCao(salary.caoId);
  return <div className="field cao-select">
    <span className="field-label"><label htmlFor={id}>Mijn cao</label></span>
    <span className="input-wrap">
      <select id={id} value={cao?.id ?? ""} onChange={(event) => {
        const picked = findCao(event.target.value);
        onChange(picked ? caoSalaryPatch(picked) : { caoId: "" });
      }}>
        <option value="">Geen / zelf invullen</option>
        {/* The label already says "cao", so the options drop the prefix and fit narrow columns. */}
        {sorted.map((option) => <option key={option.id} value={option.id}>{option.name.replace(/^Cao /, "")}</option>)}
      </select>
    </span>
    {cao && <details className="cao-note">
      <summary>{caoFilledText(cao)} ingevuld volgens deze cao. Pas aan als jouw situatie afwijkt.</summary>
      <p>{cao.name}, {cao.period}.{cao.fullTimeHours !== null && <> Voltijd is {cao.fullTimeHours} uur per week.</>}
        {cao.note && <> {cao.note}</>}
        {" "}Gecontroleerd op {checkedOnText(cao)}: <a href={cao.sourceUrl} target="_blank" rel="noreferrer">cao</a>
        {cao.pension && <>, <a href={cao.pension.sourceUrl} target="_blank" rel="noreferrer">{cao.pension.fund}</a></>}.</p>
    </details>}
  </div>;
}
