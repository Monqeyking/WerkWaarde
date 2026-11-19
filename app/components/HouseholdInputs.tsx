"use client";

import { Field } from "./Field";
import { Checkbox } from "./Spoke";
import {
  CHILD_SLOTS,
  updateChild,
  updateHousehold,
  type Child,
  type ChildCare,
  type ChildSlot,
  type Household,
  type NettoplaatjeState,
} from "../../lib/job-model";
import { taxYear, type ChildcareType } from "../../lib/tax-years";
import { careChangePatch } from "../../lib/household";
import { money } from "../../lib/format";

const CARE_LABELS: Record<ChildCare, string> = {
  none: "Geen opvang (of school / oppas)",
  dagopvang: "Dagopvang",
  bso: "Buitenschoolse opvang",
  gastouder: "Gastouder",
};

type SetModel = (update: (state: NettoplaatjeState) => NettoplaatjeState) => void;

/**
 * "Toeslagen meerekenen": the household (partner, children, deductions, wealth) that
 * zorgtoeslag, kindgebonden budget and kinderopvangtoeslag depend on. Shared by the
 * part-time calculator and the total overview, so both use the same answers.
 */
export function HouseholdInputs({ model, setModel, partnerHint }: { model: NettoplaatjeState; setModel: SetModel; partnerHint?: string }) {
  const { household } = model.personal;
  const setHousehold = (patch: Partial<Omit<Household, "children">>) => setModel((current) => updateHousehold(current, patch));
  const setChild = (slot: ChildSlot, patch: Partial<Child>) => setModel((current) => updateChild(current, slot, patch));
  const freeSlot = CHILD_SLOTS.find((slot) => !household.children[slot].active);
  const { assetLimit: limits, kinderopvangtoeslag } = taxYear(model.personal.taxYear).allowances;

  return <>
    <Checkbox checked={household.enabled} onChange={(enabled) => setHousehold({ enabled })} label="Reken toeslagen mee"
      small="Kinderopvangtoeslag, kindgebonden budget, zorgtoeslag en de combinatiekorting, op het inkomen van je huishouden." />
    {household.enabled && <>
      <Checkbox checked={household.hasPartner} onChange={(hasPartner) => setHousehold({ hasPartner })} label="Ik heb een toeslagpartner" />
      {household.hasPartner && <Field label="Bruto jaarinkomen partner" value={household.partnerTaxableAnnual} onChange={(partnerTaxableAnnual) => setHousehold({ partnerTaxableAnnual })} suffix="€/jr" step={1000}
        hint={`Inclusief vakantiegeld en bonus, min de eigen pensioenpremie van je partner.${partnerHint ? ` ${partnerHint}` : ""}`} />}
      <Field label="Aftrekposten per jaar" value={household.deductionsAnnual} onChange={(deductionsAnnual) => setHousehold({ deductionsAnnual })} suffix="€/jr" step={500}
        hint="Bijvoorbeeld hypotheekrente. Die verlaagt je toetsingsinkomen en dus verhoogt je toeslagen." />
      <ChildrenInputs kids={household.children} onChange={setChild} prices={kinderopvangtoeslag.maxHourlyPrice} />
      {freeSlot && <button type="button" className="copy-button" onClick={() => setChild(freeSlot, { active: true })}>+ Kind toevoegen</button>}
      <Checkbox checked={household.assetsAboveLimit} onChange={(assetsAboveLimit) => setHousehold({ assetsAboveLimit })} label="Vermogen boven de grens"
        small={`Meer dan ${money(limits.single)} (alleen) of ${money(limits.partner)} (samen): geen zorgtoeslag en kindgebonden budget.`} />
      <Checkbox checked={household.receivesRentAllowance} onChange={(receivesRentAllowance) => setHousehold({ receivesRentAllowance })} label="Ik krijg huurtoeslag"
        small="Die rekenen we niet uit." />
    </>}
  </>;
}

function ChildrenInputs({ kids, onChange, prices }: {
  kids: Household["children"]; onChange: (slot: ChildSlot, patch: Partial<Child>) => void; prices: Record<ChildcareType, number>;
}) {
  const active = CHILD_SLOTS.filter((slot) => kids[slot].active);
  return <>{active.map((slot, index) => {
    const child = kids[slot];
    return <div key={slot} className="child-card">
      <div className="child-card-heading"><strong>Kind {index + 1}</strong>
        <button type="button" className="link-button" onClick={() => onChange(slot, { active: false })}>Verwijderen</button></div>
      <div className="two-fields">
        <Field label="Leeftijd" value={child.age} onChange={(age) => onChange(slot, { age })} suffix="jaar" max={17} />
        <div className="field">
          <span className="field-label"><label htmlFor={`care-${slot}`}>Opvang</label></span>
          <span className="input-wrap"><select id={`care-${slot}`} value={child.care} onChange={(event) => onChange(slot, careChangePatch(child, event.target.value as ChildCare, prices))}>
            {(Object.keys(CARE_LABELS) as ChildCare[]).map((care) => <option key={care} value={care}>{CARE_LABELS[care]}</option>)}
          </select></span>
        </div>
      </div>
      {child.care !== "none" && <>
        <div className="two-fields">
          <Field label="Uren per dag" value={child.hoursPerDay} onChange={(hoursPerDay) => onChange(slot, { hoursPerDay })} suffix="u" max={24} step={0.5} />
          <Field label="Uurprijs" value={child.hourlyPrice} onChange={(hourlyPrice) => onChange(slot, { hourlyPrice })} suffix="€" step={0.01}
            hint="Wat je opvang per uur rekent. Boven de maximum uurprijs betaal je het verschil helemaal zelf." />
        </div>
        <details className="child-more">
          <summary>Meer opties · {child.weeksPerYear} weken per jaar</summary>
          <Field label="Opvangweken per jaar" value={child.weeksPerYear} onChange={(weeksPerYear) => onChange(slot, { weeksPerYear })} suffix="weken" max={52}
            hint="Weken per jaar in je contract: meestal 52 voor dagopvang, vaak 40 of 48 voor bso." />
        </details>
      </>}
    </div>;
  })}</>;
}
