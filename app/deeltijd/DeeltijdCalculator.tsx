"use client";

import { useMemo, useState } from "react";
import { CaoSelect } from "../components/CaoSelect";
import { Field } from "../components/Field";
import { HouseholdInputs } from "../components/HouseholdInputs";
import { Checkbox, Highlight, SpokeCalculator, ToTotal, useSpokeModel } from "../components/Spoke";
import { updateJob, updateJobSection, updatePersonal, type JobProfile, type NettoplaatjeState } from "../../lib/job-model";
import { compareScenarios, fullTimeHoursFor, hoursTable, type HoursScenario, type ScenarioComparison } from "../../lib/part-time";
import { toetsingsinkomenText } from "../../lib/household";
import { decimal, money, signedMoney } from "../../lib/format";

const PROEFBEREKENING = "https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen/content/hulpmiddel-proefberekening-toeslagen";

/** Hours in one working day: the default comparison is one day more (or less, at full time). */
const DAY_HOURS = 8;

/** The step closest to `target`, other than `exclude`. */
function closestStep(steps: number[], target: number, exclude: number) {
  return steps.filter((hours) => hours !== exclude)
    .reduce((best, hours) => Math.abs(hours - target) < Math.abs(best - target) ? hours : best, Number.POSITIVE_INFINITY);
}

/** Default pair to compare: the current hours and one working day more, or one day less when already at the top. */
function defaultPair(steps: number[], current: number): [number, number] {
  if (steps.length < 2) return [steps[0] ?? current, steps[0] ?? current];
  const top = steps[steps.length - 1];
  return current < top ? [current, closestStep(steps, current + DAY_HOURS, current)] : [closestStep(steps, current - DAY_HOURS, current), current];
}

const hoursLabel = (hours: number) => `${decimal(hours)} uur`;

export default function DeeltijdCalculator() {
  const { model, setModel, job, setJob } = useSpokeModel();
  const profile = model.jobs[job];
  const { salary, commute } = profile;
  const { household } = model.personal;
  const [followWork, setFollowWork] = useState(true);
  const [pair, setPair] = useState<[number, number] | null>(null);

  const table = useMemo(() => hoursTable(model, job, { childcareFollowsWorkDays: followWork }), [model, job, followWork]);
  const steps = table.map((row) => row.hoursPerWeek);
  const [fromHours, toHours] = pair && steps.includes(pair[0]) && steps.includes(pair[1]) && pair[0] !== pair[1]
    ? pair : defaultPair(steps, salary.hoursPerWeek);
  const from = table.find((row) => row.hoursPerWeek === fromHours);
  const to = table.find((row) => row.hoursPerWeek === toHours);
  const step = from && to ? compareScenarios(from, to) : null;

  const setSalary = (patch: Partial<JobProfile["salary"]>) => setModel((current) => updateJobSection(current, job, "salary", patch));

  return <SpokeCalculator job={job} onJobChange={setJob} inputsTitle="Je baan en gezin"
    results={step && from && to
      ? <>
        <Results model={model} table={table} from={from} to={to} step={step} onPick={(a, b) => setPair([a, b])} steps={steps} />
        <ToTotal job={job} setModel={setModel} title="Vergelijk ook twee banen" note="Salaris, uren en opvang staan al in je totaaloverzicht. Vul daar auto, reizen en extra's in." button="Naar totaaloverzicht" />
      </>
      : <p className="choice-note">Vul je uren per week in om de vergelijking te zien.</p>}>
    <Field label="Bruto per maand" value={salary.grossMonthly} onChange={(grossMonthly) => setSalary({ grossMonthly })} suffix="€" hint="Je vaste bruto maandsalaris bij je huidige uren, zoals op je loonstrook: niet het voltijdbedrag uit de salarisschaal. Zonder vakantiegeld. Krijg je elke maand een vaste toeslag, zoals ORT of ploegentoeslag? Tel het gemiddelde erbij op." step={50} />
    <div className="two-fields">
      <Field label="Uren per week" value={salary.hoursPerWeek} onChange={(hoursPerWeek) => setSalary({ hoursPerWeek })} suffix="uur" max={60} />
      <Field label="Voltijd" value={fullTimeHoursFor(salary)} onChange={(fullTimeHours) => setSalary({ fullTimeHours })} suffix="uur" max={60}
        hint="Een volle werkweek bij je werkgever. Je cao vult dit in. Pensioenfranchise en uren-staffel rekenen hiermee." />
    </div>
    <CaoSelect salary={salary} onChange={setSalary} />
    <div className="two-fields">
      <Field label="Kantoordagen" value={commute.officeDaysPerWeek} onChange={(officeDaysPerWeek) => setModel((current) => updateJobSection(current, job, "commute", { officeDaysPerWeek }))} suffix="p/w" max={7} step={0.5}
        hint="Bij minder werkdagen ga je hooguit zo vaak naar kantoor als je werkt. Reiskosten en reistijd vul je in bij het totaaloverzicht." />
      <Field label="Opvangdagen" value={profile.childcareDaysPerWeek} onChange={(childcareDaysPerWeek) => setModel((current) => updateJob(current, job, { childcareDaysPerWeek }))} suffix="p/w" max={5} step={0.5}
        hint="Dagen per week dat je kind(eren) naar de opvang gaan bij je huidige uren." />
    </div>
    {profile.childcareDaysPerWeek > 0 && <Checkbox checked={followWork} onChange={setFollowWork} label="Opvangdagen gaan mee met je werkdagen" small="Een dag minder werken is een opvangdag minder." />}
    {profile.childcareDaysPerWeek > 0 && !household.enabled && <Field label="Kinderopvang per opvangdag" value={model.personal.childcareCostPerDay} onChange={(childcareCostPerDay) => setModel((current) => updatePersonal(current, { childcareCostPerDay }))} suffix="€" step={5}
      hint="Wat je per dag netto betaalt, na kinderopvangtoeslag. Zet 'Toeslagen meerekenen' aan om de toeslag uit te laten rekenen." />}

    <details className="total-section household-section" open={household.enabled}>
      <summary><span className="section-number">€</span><strong>Toeslagen meerekenen</strong><span className={`section-status ${household.enabled ? "done" : ""}`}>{household.enabled ? "Aan" : "Uit"}</span></summary>
      <div className="total-section-body">
        <HouseholdInputs model={model} setModel={setModel} partnerHint="Blijft gelijk in alle scenario's." />
      </div>
    </details>
  </SpokeCalculator>;
}

type WaterfallRow = { label: string; value: number; kind?: "start" | "total" };

function waterfallRows(step: ScenarioComparison): WaterfallRow[] {
  const rows: WaterfallRow[] = [
    { label: "Bruto, incl. vakantiegeld en extra's", value: step.gross, kind: "start" },
    { label: "Eigen pensioenpremie", value: -step.pension },
    { label: "Loonheffing", value: -step.tax },
    { label: "Leaseauto, budget of eigen auto", value: step.mobility },
    { label: "Lunch, parkeren en andere werkkosten", value: -step.workCosts },
    { label: "Kinderopvang", value: -step.childcareGross },
    { label: "Kinderopvangtoeslag", value: step.kinderopvangtoeslag },
    { label: "Kindgebonden budget en zorgtoeslag", value: step.otherAllowances },
    { label: "Combinatiekorting", value: step.combinatiekorting },
    { label: "Wat je huishouden overhoudt", value: step.householdNet, kind: "total" },
  ];
  return rows.filter((row) => row.kind || Math.abs(row.value) >= 0.5);
}

/** The single biggest reason the gross change does not reach the household. */
function biggestLeak(step: ScenarioComparison): string | null {
  const sign = Math.sign(step.gross) || 1;
  const leaks = [
    // The combinatiekorting is a tax credit, so it counts against the tax.
    { label: "loonheffing en pensioenpremie", value: step.tax + step.pension - step.combinatiekorting },
    { label: "kinderopvang (na kinderopvangtoeslag)", value: step.childcareGross - step.kinderopvangtoeslag },
    { label: "kindgebonden budget en zorgtoeslag", value: -step.otherAllowances },
    { label: "werk- en reiskosten", value: step.workCosts - step.mobility },
  ].map((leak) => ({ ...leak, value: leak.value * sign })).sort((a, b) => b.value - a.value);
  return leaks[0] && leaks[0].value > 0.5 ? leaks[0].label : null;
}

/** What one euro of gross change does for the household, in words that also work when it costs money. */
function HighlightText({ more, kept, step }: { more: boolean; kept: number; step: ScenarioComparison }) {
  const cents = Math.round(Math.abs(kept) * 100);
  const perYear = signedMoney(step.householdNet * 12);
  if (more && kept >= 0) return <>Van elke extra euro bruto houdt je huishouden {cents} cent over: een marginale druk van {100 - cents}%. Per jaar is dat {perYear}.</>;
  if (more) return <>Meer werken kost je huishouden hier geld: per extra euro bruto ga je er {cents} cent op achteruit. Per jaar is dat {perYear}.</>;
  if (step.householdNet <= 0) return <>Je levert {money(-step.gross)} bruto per maand in, maar je huishouden houdt maar {money(-step.householdNet)} minder over: {cents} cent per euro.</>;
  return <>Minder werken levert je huishouden hier geld op: {money(step.householdNet)} per maand meer, ondanks {money(-step.gross)} minder bruto.</>;
}

function Results({ model, table, from, to, step, steps, onPick }: {
  model: NettoplaatjeState; table: HoursScenario[]; from: HoursScenario; to: HoursScenario; step: ScenarioComparison;
  steps: number[]; onPick: (from: number, to: number) => void;
}) {
  const { household } = model.personal;
  const more = to.hoursPerWeek > from.hoursPerWeek;
  const rows = waterfallRows(step);
  const scale = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  const leak = biggestLeak(step);
  const kept = step.keptPerEuro;
  const partnerWithoutIncome = household.enabled && household.hasPartner && household.partnerTaxableAnnual <= 0;

  return <>
    <div className="hours-picker">
      {/* Picking the hours already on the other side swaps the two, so the pair never collapses. */}
      <HoursChoice label="Van" steps={steps} value={from.hoursPerWeek}
        onChange={(hours) => onPick(hours, hours === to.hoursPerWeek ? from.hoursPerWeek : to.hoursPerWeek)} />
      <HoursChoice label="Naar" steps={steps} value={to.hoursPerWeek}
        onChange={(hours) => onPick(hours === from.hoursPerWeek ? to.hoursPerWeek : from.hoursPerWeek, hours)} />
    </div>
    <Highlight label={`Van ${hoursLabel(from.hoursPerWeek)} naar ${hoursLabel(to.hoursPerWeek)} per week`} value={`${signedMoney(step.householdNet)} per maand`}>
      {kept !== null && <HighlightText more={more} kept={kept} step={step} />}
    </Highlight>

    <div className="comparison-panel">
      <div className="section-heading compact-heading"><div><span className="section-kicker">Waar het blijft</span><h2>Per maand</h2></div></div>
      <div className="bars waterfall">
        {rows.map((row) => <div key={row.label} className={`bar-row${row.kind === "total" ? " waterfall-total" : ""}`}>
          <div className="bar-label"><span>{row.label}</span><strong>{signedMoney(row.value)}</strong></div>
          <div className="bar-track"><div className={`bar-fill ${row.kind === "start" ? "blue" : row.value >= 0 ? "teal" : "orange"}`} style={{ width: `${Math.min(100, Math.abs(row.value) / scale * 100)}%` }}></div></div>
        </div>)}
      </div>
      {leak && <div className="difference-note"><span className="check">!</span><span>{more
        ? <>Het meeste van je extra bruto gaat op aan <strong>{leak}</strong>.</>
        : <>Je levert minder in dan je bruto daalt, vooral door <strong>{leak}</strong>.</>}</span></div>}
      {from.toetsingsinkomen !== null && to.toetsingsinkomen !== null && <p className="choice-note">Toeslagen gerekend op een toetsingsinkomen van {money(from.toetsingsinkomen)} → {money(to.toetsingsinkomen)} per jaar: {toetsingsinkomenText(household.hasPartner)}.</p>}
    </div>

    {partnerWithoutIncome && <p className="ev-rule-note">Zonder inkomen van je partner krijg je geen kinderopvangtoeslag: beide partners moeten werken.</p>}
    {household.enabled && household.receivesRentAllowance && <p className="ev-rule-note">Huurtoeslag rekenen we niet mee. Die daalt meestal ook als je meer verdient. Bekijk het met de <a href={PROEFBEREKENING} target="_blank" rel="noreferrer">proefberekening van de Belastingdienst</a>.</p>}
    {!household.enabled && <p className="ev-rule-note">Zonder toeslagen gerekend. Heb je kinderen op de opvang of recht op toeslag? Zet links &lsquo;Toeslagen meerekenen&rsquo; aan: daar zit vaak het grootste verschil.</p>}

    <details className="hours-details">
      <summary>Bekijk alle urentallen</summary>
      <HoursTable table={table} highlight={[from.hoursPerWeek, to.hoursPerWeek]} allowances={household.enabled} />
    </details>
  </>;
}

function HoursChoice({ label, steps, value, onChange }: { label: string; steps: number[]; value: number; onChange: (hours: number) => void }) {
  return <div className="hours-choice">
    <span className="section-kicker">{label}</span>
    <div className="period-toggle" role="radiogroup" aria-label={`${label} uren per week`}>
      {steps.map((hours) => <button key={hours} type="button" role="radio" aria-checked={value === hours} className={value === hours ? "active" : ""} onClick={() => onChange(hours)}>{decimal(hours)}</button>)}
    </div>
  </div>;
}

function HoursTable({ table, highlight, allowances }: { table: HoursScenario[]; highlight: [number, number]; allowances: boolean }) {
  return <div className="hours-table" role="table" aria-label="Wat elk aantal uren oplevert, per maand">
    <div className="hours-table-row hours-table-head" role="row">
      <span role="columnheader">Uren</span><span role="columnheader">Bruto</span><span role="columnheader">Netto loon</span>
      <span role="columnheader">{allowances ? "Toeslagen" : "Toeslagen (uit)"}</span><span role="columnheader">Opvang</span>
      <strong role="columnheader">Over</strong><span role="columnheader">Per uur</span>
    </div>
    {table.map((row) => <div key={row.hoursPerWeek} role="row" className={`hours-table-row${highlight.includes(row.hoursPerWeek) ? " selected" : ""}`}>
      <span role="cell">{decimal(row.hoursPerWeek)}</span>
      <span role="cell">{money(row.grossMonthly)}</span>
      <span role="cell">{money(row.netPayMonthly)}</span>
      <span role="cell">{money(row.kinderopvangtoeslagMonthly + row.zorgtoeslagMonthly + row.kindgebondenBudgetMonthly + row.combinatiekortingMonthly)}</span>
      <span role="cell">{money(-row.childcareGrossMonthly)}</span>
      <strong role="cell">{money(row.householdNetMonthly)}</strong>
      <span role="cell">{money(row.netPerHour)}</span>
    </div>)}
    <small className="hours-table-note">Per maand, gemiddeld over het jaar. &lsquo;Toeslagen&rsquo; is inclusief de combinatiekorting. &lsquo;Over&rsquo; is netto loon plus toeslagen, min opvang, werkkosten en je auto-regeling. Het inkomen van je partner staat er niet in.</small>
  </div>;
}
