"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Field } from "../../components/Field";
import { caosBySector } from "../../../lib/cao-pages";
import { findCao } from "../../../lib/caos";
import { EMBED_DEFAULTS, EMBED_MESSAGE, embedMoreUrl, embedResult, type EmbedInput } from "../../../lib/embed";
import { money } from "../../../lib/format";
import { DEFAULT_TAX_YEAR } from "../../../lib/tax-years";

const groups = caosBySector();

/** Tells the parent page how tall the calculator is, so embed.js can size the iframe. */
function useReportHeight() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.parent === window) return;
    const report = () => window.parent.postMessage({ type: EMBED_MESSAGE, height: Math.ceil(node.getBoundingClientRect().height) }, "*");
    const observer = new ResizeObserver(report);
    observer.observe(node);
    report();
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function EmbedCalculator() {
  const [input, setInput] = useState<EmbedInput>(EMBED_DEFAULTS);
  const set = (patch: Partial<EmbedInput>) => setInput((current) => ({ ...current, ...patch }));
  const result = useMemo(() => embedResult(input), [input]);
  const cao = findCao(input.caoId);
  const caoId = useId();
  const ref = useReportHeight();

  return <div className="embed" ref={ref}>
    <div className="embed-head">
      <strong>Bruto naar netto {DEFAULT_TAX_YEAR}</strong>
      <a href={embedMoreUrl(input)} target="_blank" rel="noopener" className="embed-brand">Netto<span>plaatje</span></a>
    </div>
    <div className="embed-grid">
      <div className="embed-inputs">
        <Field label="Bruto per maand" value={input.grossMonthly} onChange={(grossMonthly) => set({ grossMonthly })} suffix="€" step={50} max={100_000}
          hint="Je vaste bruto maandsalaris voor jouw uren, zoals op je loonstrook, zonder vakantiegeld." />
        <Field label="Uren per week" value={input.hoursPerWeek} onChange={(hoursPerWeek) => set({ hoursPerWeek })} suffix="uur" max={60} />
        <div className="field">
          <span className="field-label"><label htmlFor={caoId}>Cao (optioneel)</label></span>
          <span className="input-wrap"><select id={caoId} value={input.caoId} onChange={(event) => set({ caoId: event.target.value })}>
            <option value="">Geen / weet ik niet</option>
            {groups.map((group) => <optgroup key={group.sector} label={group.sector}>
              {group.caos.map((option) => <option key={option.id} value={option.id}>{option.name.replace(/^Cao /, "")}</option>)}
            </optgroup>)}
          </select></span>
        </div>
        {!cao && <Field label="Vakantiegeld" value={input.holidayAllowancePct} onChange={(holidayAllowancePct) => set({ holidayAllowancePct })} suffix="%" step={0.1} max={20} />}
      </div>
      <div className="embed-results" aria-live="polite">
        <span className="embed-label">Netto per maand</span>
        <strong className="embed-amount">{money(result.regularNetMonthly)}</strong>
        <div className="spoke-table">
          <div><span>Bruto salaris</span><strong>{money(result.grossMonthly)}</strong></div>
          {result.pensionMonthly > 0 && <div><span>Pensioenpremie</span><strong>{money(-result.pensionMonthly)}</strong></div>}
          <div><span>Loonheffing</span><strong>{money(-result.regularTaxMonthly)}</strong></div>
          <div className="spoke-total"><span>Netto per jaar{cao?.yearEndBonusPct ? ", met vakantiegeld en 13e maand" : ", met vakantiegeld"}</span><strong>{money(result.netAnnual)}</strong></div>
        </div>
        <p className="embed-note">{cao ? `Met vakantiegeld, 13e maand en pensioen volgens de ${cao.name.replace(/^Cao /, "cao ")}.` : "Zonder pensioeninhouding. Kies je cao om die mee te rekenen."} Indicatie, geen advies.</p>
        <a className="primary-button embed-more" href={embedMoreUrl(input)} target="_blank" rel="noopener">Meer details op Nettoplaatje →</a>
      </div>
    </div>
  </div>;
}
