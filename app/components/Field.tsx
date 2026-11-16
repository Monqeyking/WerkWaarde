"use client";

import { useId, useState } from "react";

/** Tappable info button: the hint opens below the label, so it also works on touch screens. */
function InfoToggle({ hint, open, onToggle, controls }: { hint: string; open: boolean; onToggle: () => void; controls: string }) {
  return <button type="button" className="info-dot" aria-label={`Uitleg: ${hint}`} aria-expanded={open} aria-controls={controls} title={hint}
    onClick={(event) => { event.preventDefault(); onToggle(); }}>i</button>;
}

export function Field({ label, value, onChange, suffix, hint, step = 1, min = 0, max }: {
  label: string; value: number; onChange: (value: number) => void; suffix?: string; hint?: string;
  step?: number; min?: number; max?: number;
}) {
  const [showHint, setShowHint] = useState(false);
  const hintId = useId();
  return <label className="field">
    <span className="field-label">{label} {hint && <InfoToggle hint={hint} open={showHint} onToggle={() => setShowHint((open) => !open)} controls={hintId} />}</span>
    {hint && showHint && <span className="field-hint" id={hintId}>{hint}</span>}
    <span className="input-wrap"><input type="number" value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))} min={min} max={max} step={step}
      inputMode={step < 1 ? "decimal" : "numeric"} />{suffix && <span className="input-suffix">{suffix}</span>}</span>
  </label>;
}
