"use client";

import { useId, useState } from "react";
import { clampNumber, formatNumberInput, parseNumberInput } from "../../lib/number-input";

/** Tappable info button: the hint opens below the label, so it also works on touch screens. */
export function InfoToggle({ hint, open, onToggle, controls, infoLabel }: { hint: string; open: boolean; onToggle: () => void; controls: string; infoLabel: string }) {
  return <button type="button" className="info-dot" aria-label={`${infoLabel}: ${hint}`} aria-expanded={open} aria-controls={controls} title={hint}
    onClick={(event) => { event.preventDefault(); onToggle(); }}>i</button>;
}

const MESSAGES = {
  nl: { info: "Uitleg", invalid: "Vul alleen een getal in, bijvoorbeeld 3500.", range: (limit: string) => `Wordt gerekend als ${limit}.` },
  en: { info: "Explanation", invalid: "Enter a number only, for example 3500.", range: (limit: string) => `Calculated as ${limit}.` },
};

/**
 * Number field that accepts what people actually type: "3.500", "€ 3.500,-", "3500,50".
 * While you type, the text stays as typed and only valid numbers reach the calculation,
 * kept within min and max. On leaving the field it shows the number that is used.
 */
export function Field({ label, value, onChange, suffix, hint, step = 1, min = 0, max, lang = "nl" }: {
  label: string; value: number; onChange: (value: number) => void; suffix?: string; hint?: string;
  step?: number; min?: number; max?: number;
  /** Page language: the decimal separator shown and the language of the messages. */
  lang?: "nl" | "en";
}) {
  const [showHint, setShowHint] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const hintId = useId();
  const inputId = useId();
  const errorId = useId();
  const text = MESSAGES[lang];
  const decimalField = step < 1;
  const parsed = draft === null || draft.trim() === "" ? null : parseNumberInput(draft, decimalField);
  const invalid = draft !== null && draft.trim() !== "" && parsed === null;
  const clamped = parsed === null ? null : clampNumber(parsed, min, max);
  const error = invalid ? text.invalid : clamped !== null && clamped !== parsed ? text.range(formatNumberInput(clamped, lang)) : null;
  const describedBy = [hint && showHint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  // A div, not a wrapping <label>: the info button inside would otherwise become the label's control instead of the input.
  return <div className="field">
    <span className="field-label"><label htmlFor={inputId}>{label}</label> {hint && <InfoToggle hint={hint} open={showHint} onToggle={() => setShowHint((open) => !open)} controls={hintId} infoLabel={text.info} />}</span>
    {hint && showHint && <span className="field-hint" id={hintId}>{hint}</span>}
    <span className="input-wrap"><input id={inputId} aria-describedby={describedBy} aria-invalid={invalid || undefined} type="text"
      value={draft ?? formatNumberInput(value, lang)} autoComplete="off" spellCheck={false}
      onFocus={() => setDraft(formatNumberInput(value, lang))}
      onChange={(event) => {
        setDraft(event.target.value);
        const next = parseNumberInput(event.target.value, decimalField);
        if (next !== null) onChange(clampNumber(next, min, max));
      }}
      onBlur={() => setDraft(null)}
      inputMode={decimalField ? "decimal" : "numeric"} />{suffix && <span className="input-suffix">{suffix}</span>}</span>
    {error && <span className="field-error" id={errorId} role="status">{error}</span>}
  </div>;
}
