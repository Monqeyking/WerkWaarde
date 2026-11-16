"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { JobKey, NettoplaatjeState } from "../../lib/job-model";
import { useJobModel } from "../../lib/use-job-model";
import { JobToggle } from "./JobToggle";

/** Shared model plus which job this calculator page is filling in. */
export function useSpokeModel() {
  const [model, setModel] = useJobModel();
  const [job, setJob] = useState<JobKey>("current");
  return { model, setModel, job, setJob };
}

/** Two-column calculator: inputs left, live results right (stacked on mobile). */
export function SpokeCalculator({ job, onJobChange, inputsTitle, children, results }: {
  job: JobKey; onJobChange: (job: JobKey) => void; inputsTitle: string; children: ReactNode; results: ReactNode;
}) {
  return <section className="calculator-wrap shell spoke-calculator" id="calculator">
    <div className="calculator-shell">
      <aside className="inputs-panel">
        <div className="panel-heading"><div><span className="section-kicker">Jouw situatie</span><h2>{inputsTitle}</h2></div><span className="lock-icon">⌁</span></div>
        <p className="panel-intro">De voorbeeldwaarden zijn ingevuld. Pas ze aan voor een persoonlijke indicatie.</p>
        <JobToggle job={job} onChange={onJobChange} />
        <div className="input-section last-section">{children}</div>
      </aside>
      <div className="results-panel">
        <div className="results-heading"><div><span className="section-kicker">Jouw uitkomst</span><h2>Indicatie</h2></div><span className="live-badge"><span></span> Live berekend</span></div>
        {results}
      </div>
    </div>
  </section>;
}

export function Highlight({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return <div className="work-highlight spoke-highlight">
    <span className="section-kicker">{label}</span>
    <strong>{value}</strong>
    {children && <p>{children}</p>}
  </div>;
}

export function Metrics({ items }: { items: Array<{ label: string; value: string; note?: string }> }) {
  return <div className="work-metrics">
    {items.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong>{item.note && <small>{item.note}</small>}</div>)}
  </div>;
}

export type TableRow = { label: string; value: string; total?: boolean; muted?: boolean };

export function SpokeTable({ rows, head }: { rows: TableRow[]; head?: [string, string] }) {
  return <div className="spoke-table">
    {head && <div className="spoke-table-head"><span>{head[0]}</span><strong>{head[1]}</strong></div>}
    {rows.map((row) => <div key={row.label} className={row.total ? "spoke-total" : row.muted ? "spoke-muted" : undefined}><span>{row.label}</span><strong>{row.value}</strong></div>)}
  </div>;
}

export function Checkbox({ checked, onChange, label, small }: { checked: boolean; onChange: (checked: boolean) => void; label: string; small?: string }) {
  return <label className="checkbox-row compact-checkbox">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="checkbox-box">✓</span>
    <span><strong>{label}</strong>{small && <small>{small}</small>}</span>
  </label>;
}

/** Call to action that optionally updates the model, then opens the total overview. */
export function ToTotal({ job, title, note, button, apply, setModel }: {
  job: JobKey; title: string; note: string; button: string;
  apply?: (state: NettoplaatjeState) => NettoplaatjeState;
  setModel: (update: (state: NettoplaatjeState) => NettoplaatjeState) => void;
}) {
  const router = useRouter();
  const go = () => {
    if (apply) setModel(apply);
    router.push("/totaal");
  };
  return <div className="to-total">
    <div><span className="section-kicker">Naar je totaaloverzicht · {job === "current" ? "huidige" : "nieuwe"} baan</span><strong>{title}</strong><small>{note}</small></div>
    <div className="to-total-buttons"><button type="button" className="primary-button" onClick={go}>{button} →</button></div>
  </div>;
}
