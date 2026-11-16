"use client";

import { updatePersonal } from "../../lib/job-model";
import { selectableTaxYears, taxYear } from "../../lib/tax-years";
import { useJobModel } from "../../lib/use-job-model";

const years = selectableTaxYears();

/** Tax year switch. Renders nothing while only one year is available. */
export function TaxYearSelect() {
  const [model, setModel] = useJobModel();
  if (years.length < 2) return null;
  const current = taxYear(model.personal.taxYear);
  return <div className="tax-year-box">
    <span className="section-kicker">Belastingjaar</span>
    <div className="period-toggle" role="radiogroup" aria-label="Belastingjaar">
      {years.map((year) => <button key={year} type="button" role="radio" aria-checked={current.year === year}
        className={current.year === year ? "active" : ""} onClick={() => setModel((state) => updatePersonal(state, { taxYear: year }))}>
        {year}{taxYear(year).published ? "" : " (voorlopig)"}
      </button>)}
    </div>
    {!current.published && <small className="tax-year-note">{current.source}</small>}
  </div>;
}
