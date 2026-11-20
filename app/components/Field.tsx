"use client";

import { useId, useState } from "react";

/** Tappable info button: the hint opens below the label, so it also works on touch screens. */
function InfoToggle({ hint, open, onToggle, controls, infoLabel }: { hint: string; open: boolean; onToggle: () => void; controls: string; infoLabel: string }) {
  return <button type="button" className="info-dot" aria-label={`${infoLabel}: ${hint}`} aria-expanded={open} aria-controls={controls} title={hint}
    onClick={(event) => { event.preventDefault(); onToggle(); }}>i</button>;
}

export function Field({ label, value, onChange, suffix, hint, step = 1, min = 0, max, infoLabel = "Uitleg" }: {
  label: string; value: number; onChange: (value: number) => void; suffix?: string; hint?: string;
  step?: number; min?: number; max?: number;
  /** Screen-reader prefix of the info button; "Explanation" on English pages. */
  infoLabel?: string;
}) {
  const [showHint, setShowHint] = useState(false);
  const hintId = useId();
  const inputId = useId();
  // A div, not a wrapping <label>: the info button inside would otherwise become the label's control instead of the input.
  return <div className="field">
    <span className="field-label"><label htmlFor={inputId}>{label}</label> {hint && <InfoToggle hint={hint} open={showHint} onToggle={() => setShowHint((open) => !open)} controls={hintId} infoLabel={infoLabel} />}</span>
    {hint && showHint && <span className="field-hint" id={hintId}>{hint}</span>}
    <span className="input-wrap"><input id={inputId} aria-describedby={hint && showHint ? hintId : undefined} type="number" value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))} min={min} max={max} step={step}
      inputMode={step < 1 ? "decimal" : "numeric"} />{suffix && <span className="input-suffix">{suffix}</span>}</span>
  </div>;
}
