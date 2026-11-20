"use client";

import { useId } from "react";
import type { ExpatOption } from "../../lib/expat";
import { money } from "../../lib/format";
import type { JobProfile } from "../../lib/job-model";
import { taxYear } from "../../lib/tax-years";

type Limit = "none" | "belowNorm" | "norm" | "cap" | "full";

/**
 * Expatregeling (30%-regeling) picker with a short explanation of what it does
 * for this salary. The amounts come from the tax year.
 */
export function ExpatSelect({ salary, onChange, year, allowanceAnnual, limit }: {
  salary: JobProfile["salary"];
  onChange: (patch: Partial<JobProfile["salary"]>) => void;
  year: number;
  allowanceAnnual: number;
  limit: Limit;
}) {
  const id = useId();
  const rules = taxYear(year).expatRuling;
  const pct = `${Math.round(rules.rate * 100)}%`;
  const norm = salary.expatRuling === "youngMaster" ? rules.salaryNormYoungMaster : rules.salaryNorm;
  return <div className="field">
    <span className="field-label"><label htmlFor={id}>Expatregeling ({pct}-regeling)</label></span>
    <span className="input-wrap">
      <select id={id} value={salary.expatRuling} onChange={(event) => onChange({ expatRuling: event.target.value as ExpatOption })}>
        <option value="none">Nee</option>
        <option value="standard">Ja</option>
        <option value="youngMaster">Ja, jonger dan 30 met masterdiploma</option>
      </select>
    </span>
    {salary.expatRuling === "none"
      ? <p className="choice-note">Voor werknemers die uit het buitenland zijn aangenomen en de regeling van de Belastingdienst hebben gekregen.</p>
      : <p className="choice-note">
        {limit === "belowNorm" && <>Je belastbare loon is niet hoger dan de salarisnorm van {money(norm)} per jaar, dus de regeling levert niets op.</>}
        {limit === "norm" && <>Je werkgever mag {money(allowanceAnnual)} per jaar onbelast geven: alleen het deel boven de salarisnorm van {money(norm)}, want je belaste loon moet daarboven blijven.</>}
        {limit === "cap" && <>Je werkgever mag het maximum van {money(allowanceAnnual)} per jaar onbelast geven ({pct} van {money(rules.wntNorm)}).</>}
        {limit === "full" && <>Je werkgever mag {pct} van je loon onbelast geven: {money(allowanceAnnual)} per jaar. Over de rest betaal je loonheffing.</>}
        {" "}Gerekend over een heel jaar, met de normen van {year}. <a href={rules.sourceUrl} target="_blank" rel="noreferrer">Belastingdienst</a>
      </p>}
  </div>;
}
