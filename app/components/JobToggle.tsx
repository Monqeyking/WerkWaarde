"use client";

import Link from "next/link";
import type { JobKey } from "../../lib/job-model";

/** Choose which job a stand-alone calculator fills in for the total overview. */
export function JobToggle({ job, onChange }: { job: JobKey; onChange: (job: JobKey) => void }) {
  return <div className="job-toggle-box">
    <div>
      <span className="section-kicker">Je vult in voor</span>
      <small>Je invoer wordt bewaard en telt mee in <Link href="/totaal">je totaaloverzicht</Link>.</small>
    </div>
    <div className="period-toggle job-toggle" role="radiogroup" aria-label="Voor welke baan vul je in?">
      {(["current", "next"] as JobKey[]).map((key) => <button key={key} type="button" role="radio" aria-checked={job === key}
        className={job === key ? "active" : ""} onClick={() => onChange(key)}>{key === "current" ? "Huidige baan" : "Nieuwe baan"}</button>)}
    </div>
  </div>;
}
