"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CaoSelect } from "../components/CaoSelect";
import { Field } from "../components/Field";
import { HouseholdInputs } from "../components/HouseholdInputs";
import { hasFormalChildcare } from "../../lib/household";
import { calculatePensionBreakdown } from "../../lib/calculator";
import { TaxYearSelect } from "../components/TaxYearSelect";
import { electricBijtellingText, kmLimitText } from "../../lib/tax-years";
import {
  copySectionToNext,
  toCalculatorInputs,
  createDefaultState,
  updateJob,
  updateJobSection,
  updatePersonal,
  type JobKey,
  type JobProfile,
  type MobilityChoice,
  type NettoplaatjeState,
  type PersonalSettings,
  type SectionKey,
} from "../../lib/job-model";
import { compareJobs, type JobTotal } from "../../lib/job-total";
import { decimal, money, moneyCents, signedDecimal, signedMoney, signedMoneyCents } from "../../lib/format";
import { applySharedStateFromLocation, shareUrl, useJobModel } from "../../lib/use-job-model";


const jobLabels: Record<JobKey, string> = { current: "Huidige baan", next: "Nieuwe baan" };
const sectionLabels: Record<SectionKey, string> = { salary: "Salaris", mobility: "Mobiliteit", commute: "Woon-werk", benefits: "Arbeidsvoorwaarden" };
const mobilityOptions: Array<{ key: MobilityChoice; label: string }> = [
  { key: "ownCar", label: "Eigen auto" },
  { key: "lease", label: "Leaseauto" },
  { key: "mobilityBudget", label: "Mobiliteitsbudget" },
  { key: "none", label: "Geen auto" },
];

type SetState = (update: (current: NettoplaatjeState) => NettoplaatjeState) => void;

function markFilled(state: NettoplaatjeState, job: JobKey, section: SectionKey): NettoplaatjeState {
  return { ...state, filled: { ...state.filled, [job]: { ...state.filled[job], [section]: true } } };
}

/** A collapsible input section with both jobs side by side. */
function InputSection({ number, title, section, state, setState, open, children }: {
  number: string; title: string; section?: SectionKey; state: NettoplaatjeState; setState: SetState; open?: boolean; children: ReactNode;
}) {
  const filledCount = section ? (["current", "next"] as JobKey[]).filter((job) => state.filled[job][section]).length : null;
  return <details className="total-section" open={open}>
    <summary>
      <span className="section-number">{number}</span>
      <strong>{title}</strong>
      {filledCount !== null && <span className={`section-status ${filledCount === 2 ? "done" : ""}`}>{filledCount === 2 ? "Ingevuld" : filledCount === 1 ? "1 van 2" : "Voorbeeld"}</span>}
    </summary>
    <div className="total-section-body">
      {children}
      {section && <button type="button" className="copy-button" onClick={() => setState((current) => copySectionToNext(current, section))}>
        Nieuwe baan gelijk aan huidige baan
      </button>}
    </div>
  </details>;
}

function JobColumns({ render }: { render: (job: JobKey) => ReactNode }) {
  return <div className="pattern-grid">
    {(["current", "next"] as JobKey[]).map((job) => <div key={job} className={`pattern-card ${job === "current" ? "current" : "new"}`}>
      <span className="pattern-label">{jobLabels[job]}</span>
      {render(job)}
    </div>)}
  </div>;
}

function Checkbox({ checked, onChange, label, small }: { checked: boolean; onChange: (checked: boolean) => void; label: string; small?: string }) {
  return <label className="checkbox-row compact-checkbox">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="checkbox-box">✓</span>
    <span><strong>{label}</strong>{small && <small>{small}</small>}</span>
  </label>;
}

/** Pension worked out from a scheme (e.g. a cao's): show the amounts, with a way back to typing them in. */
function SchemePension({ state, job, onManual }: { state: NettoplaatjeState; job: JobKey; onManual: (amounts: { pensionEmployeeMonthly: number; pensionEmployerMonthly: number }) => void }) {
  const pension = calculatePensionBreakdown(toCalculatorInputs(state, job));
  return <p className="choice-note">Pensioen volgens de regeling: {money(pension.employeeMonthly)} eigen inleg en {money(pension.employerMonthly)} van je werkgever per maand.{" "}
    <button type="button" className="link-button" onClick={() => onManual({ pensionEmployeeMonthly: Math.round(pension.employeeMonthly), pensionEmployerMonthly: Math.round(pension.employerMonthly) })}>Zelf invullen</button></p>;
}

function Inputs({ state, setState }: { state: NettoplaatjeState; setState: SetState }) {
  const section = <S extends SectionKey>(job: JobKey, name: S) =>
    (patch: Partial<JobProfile[S]>) => setState((current) => updateJobSection(current, job, name, patch));
  const salary = (job: JobKey) => section(job, "salary");
  const mobility = (job: JobKey) => section(job, "mobility");
  const commute = (job: JobKey) => section(job, "commute");
  const benefits = (job: JobKey) => section(job, "benefits");
  const personal = (patch: Partial<PersonalSettings>) => setState((current) => updatePersonal(current, patch));
  const car = (patch: Partial<PersonalSettings["car"]>) => setState((current) => updatePersonal(current, { car: { ...current.personal.car, ...patch } }));
  const detailedChildcare = state.personal.household.enabled && hasFormalChildcare(state);
  const usesOwnCar = (["current", "next"] as JobKey[]).some((job) => ["ownCar", "mobilityBudget"].includes(state.jobs[job].mobility.choice));
  const { car: carSettings } = state.personal;

  return <>
    <InputSection number="01" title="Salaris en pensioen" section="salary" state={state} setState={setState} open>
      <JobColumns render={(job) => {
        const value = state.jobs[job].salary;
        const set = salary(job);
        return <>
          <Field label="Bruto per maand" value={value.grossMonthly} onChange={(grossMonthly) => set({ grossMonthly })} suffix="€" hint="Je vaste bruto maandsalaris, zonder vakantiegeld." step={50} />
          <Field label="Uren per week" value={value.hoursPerWeek} onChange={(hoursPerWeek) => set({ hoursPerWeek })} suffix="uur" max={60} />
          <CaoSelect salary={value} onChange={set} />
          <Field label="Vakantiegeld" value={value.holidayAllowancePct} onChange={(holidayAllowancePct) => set({ holidayAllowancePct })} suffix="%" step={0.1} max={20} />
          <Field label="13e maand / eindejaars" value={value.yearEndBonusPct} onChange={(yearEndBonusPct) => set({ yearEndBonusPct })} suffix="%" hint="Een 13e maand is 8,33% van het jaarsalaris. Vul 0 in als je die niet krijgt." step={0.01} max={50} />
          <Field label="Bonus per jaar" value={value.annualBonus} onChange={(annualBonus) => set({ annualBonus })} suffix="€" hint="Verwachte bruto bonus of winstdeling per jaar." step={100} />
          {value.pensionMode === "scheme" ? <SchemePension state={state} job={job} onManual={(amounts) => set({ ...amounts, pensionMode: "monthly" })} /> : <>
            <Field label="Eigen pensioeninleg" value={value.pensionEmployeeMonthly} onChange={(pensionEmployeeMonthly) => set({ pensionEmployeeMonthly, pensionMode: "monthly" })} suffix="€/mnd" hint="De werknemersbijdrage pensioen op je loonstrook." />
            <Field label="Pensioen werkgever" value={value.pensionEmployerMonthly} onChange={(pensionEmployerMonthly) => set({ pensionEmployerMonthly, pensionMode: "monthly" })} suffix="€/mnd" hint="Wat je werkgever per maand aan je pensioen bijdraagt. Telt niet als netto, wel als totale beloning." />
          </>}
        </>;
      }} />
    </InputSection>

    <InputSection number="02" title="Auto en mobiliteit" section="mobility" state={state} setState={setState}>
      <JobColumns render={(job) => {
        const value = state.jobs[job].mobility;
        const set = mobility(job);
        return <>
          <div className="choice-group" role="radiogroup" aria-label={`Mobiliteit ${jobLabels[job].toLowerCase()}`}>
            {mobilityOptions.map((option) => <button key={option.key} type="button" role="radio" aria-checked={value.choice === option.key}
              className={value.choice === option.key ? "active" : ""} onClick={() => set({ choice: option.key })}>{option.label}</button>)}
          </div>
          {value.choice === "lease" && <>
            <Checkbox checked={value.lease.isElectric} onChange={(isElectric) => set({ lease: { ...value.lease, isElectric } })} label="Volledig elektrisch" small={electricBijtellingText(state.personal.taxYear)} />
            <Field label="Cataloguswaarde" value={value.lease.catalogValue} onChange={(catalogValue) => set({ lease: { ...value.lease, catalogValue } })} suffix="€" step={500} />
            {!value.lease.isElectric && <Field label="Bijtelling" value={value.lease.benefitRatePct} onChange={(benefitRatePct) => set({ lease: { ...value.lease, benefitRatePct } })} suffix="%" step={0.1} />}
            <Field label="Eigen bijdrage" value={value.lease.employeeContributionMonthly} onChange={(employeeContributionMonthly) => set({ lease: { ...value.lease, employeeContributionMonthly } })} suffix="€/mnd" />
          </>}
          {value.choice === "mobilityBudget" && <Field label="Mobiliteitsbudget" value={value.mobilityBudget} onChange={(mobilityBudget) => set({ mobilityBudget })} suffix="€/mnd" hint="Het bruto bedrag dat je laat uitbetalen. Je eigen auto-kosten worden ervan afgetrokken." step={25} />}
          {(value.choice === "ownCar" || value.choice === "mobilityBudget") && <>
            <Field label="Km-vergoeding" value={value.reimbursementPerKm} onChange={(reimbursementPerKm) => set({ reimbursementPerKm })} suffix="€/km" hint={`In ${state.personal.taxYear} is maximaal ${kmLimitText(state.personal.taxYear)} per km onbelast. Vul 0 in als je geen vergoeding krijgt.`} step={0.01} />
            <Field label="Extra zakelijke km" value={value.extraBusinessKmPerYear} onChange={(extraBusinessKmPerYear) => set({ extraBusinessKmPerYear })} suffix="km/jaar" hint="Zakelijke ritten bovenop woon-werk. Woon-werk km rekenen we uit je kantoordagen." step={500} />
          </>}
          {value.choice === "none" && <p className="choice-note">Je reist met fiets, OV of lopend. Eventuele kosten vul je in bij woon-werk.</p>}
        </>;
      }} />
      <p className="section-link">Twijfel je tussen lease, budget of eigen auto? <Link href="/mobiliteit">Vergelijk de opties in detail →</Link></p>
    </InputSection>

    <InputSection number="03" title="Woon-werk en dagelijkse kosten" section="commute" state={state} setState={setState}>
      <JobColumns render={(job) => {
        const value = state.jobs[job].commute;
        const set = commute(job);
        return <>
          <Field label="Kantoordagen per week" value={value.officeDaysPerWeek} onChange={(officeDaysPerWeek) => set({ officeDaysPerWeek })} suffix="dagen" step={0.5} max={7} />
          <Field label="Afstand enkele reis" value={value.oneWayKm} onChange={(oneWayKm) => set({ oneWayKm })} suffix="km" />
          <Field label="Reistijd enkele reis" value={value.oneWayMinutes} onChange={(oneWayMinutes) => set({ oneWayMinutes })} suffix="min" step={5} />
          <Field label="Parkeren per kantoordag" value={value.parkingPerOfficeDay} onChange={(parkingPerOfficeDay) => set({ parkingPerOfficeDay })} suffix="€" step={0.5} />
          <Field label="Lunch en koffie per dag" value={value.lunchPerOfficeDay} onChange={(lunchPerOfficeDay) => set({ lunchPerOfficeDay })} suffix="€" step={0.5} />
          <Field label="Thuiswerkvergoeding" value={value.homeWorkAllowancePerDay} onChange={(homeWorkAllowancePerDay) => set({ homeWorkAllowancePerDay })} suffix="€/dag" hint="Per thuiswerkdag. Thuiswerkdagen = je werkdagen (uit je uren) minus je kantoordagen." step={0.01} />
          <Field label="Opvangdagen per week" value={state.jobs[job].childcareDaysPerWeek} onChange={(childcareDaysPerWeek) => setState((current) => markFilled(updateJob(current, job, { childcareDaysPerWeek }), job, "commute"))} suffix="dagen" step={0.5} max={7} />
        </>;
      }} />
      {detailedChildcare
        ? <p className="choice-note">Opvangkosten en kinderopvangtoeslag rekenen we uit met je kinderen bij &lsquo;Huishouden en toeslagen&rsquo;.</p>
        : <Field label="Kinderopvang per opvangdag" value={state.personal.childcareCostPerDay} onChange={(childcareCostPerDay) => personal({ childcareCostPerDay })} suffix="€" hint="Wat je per dag netto betaalt, na eventuele kinderopvangtoeslag. Of laat de toeslag uitrekenen bij 'Huishouden en toeslagen'." />}
    </InputSection>

    <InputSection number="04" title="Overige arbeidsvoorwaarden" section="benefits" state={state} setState={setState}>
      <JobColumns render={(job) => {
        const value = state.jobs[job].benefits;
        const set = benefits(job);
        return <>
          <Field label="Vakantiedagen per jaar" value={value.vacationDays} onChange={(vacationDays) => set({ vacationDays })} suffix="dagen" max={60} />
          <Field label="Opleidingsbudget" value={value.trainingBudgetAnnual} onChange={(trainingBudgetAnnual) => set({ trainingBudgetAnnual })} suffix="€/jaar" step={100} />
          <Field label="Overige budgetten" value={value.otherAnnual} onChange={(otherAnnual) => set({ otherAnnual })} suffix="€/jaar" hint="Bijvoorbeeld een fietsplan, sportbudget of telefoon. Telt als totale beloning, niet als netto." step={100} />
        </>;
      }} />
    </InputSection>

    <InputSection number="05" title="Huishouden en toeslagen" state={state} setState={setState} open={state.personal.household.enabled}>
      <HouseholdInputs model={state} setModel={setState} partnerHint="Is in beide banen gelijk." />
      <p className="choice-note">Toeslagen hangen af van je inkomen, ook van de bijtelling van een leaseauto. Zo zie je of de nieuwe baan je toeslag kost. Meer per aantal uren zie je bij <Link href="/deeltijd">Deeltijd of voltijd</Link>.</p>
    </InputSection>

    <InputSection number="06" title="Over jou en je auto" state={state} setState={setState}>
      <div className="two-fields">
        <Field label="Leeftijd" value={state.personal.age} onChange={(age) => personal({ age })} suffix="jaar" min={16} max={100} />
        <Field label="Werkweken per jaar" value={state.personal.workWeeksPerYear} onChange={(workWeeksPerYear) => personal({ workWeeksPerYear })} suffix="weken" hint="52 weken minus vakantie en feestdagen. 46 is een gebruikelijke schatting." max={52} />
      </div>
      {usesOwnCar && <>
        <Checkbox checked={carSettings.isElectric} onChange={(isElectric) => car({ isElectric })} label="Mijn eigen auto is elektrisch" />
        <div className="two-fields">
          {carSettings.isElectric ? <>
            <Field label="Verbruik" value={carSettings.electricConsumption} onChange={(electricConsumption) => car({ electricConsumption })} suffix="kWh/100" step={0.1} />
            <Field label="Stroomprijs" value={carSettings.electricityPrice} onChange={(electricityPrice) => car({ electricityPrice })} suffix="€/kWh" step={0.01} />
          </> : <>
            <Field label="Verbruik" value={carSettings.fuelConsumption} onChange={(fuelConsumption) => car({ fuelConsumption })} suffix="l/100" step={0.1} />
            <Field label="Brandstofprijs" value={carSettings.fuelPrice} onChange={(fuelPrice) => car({ fuelPrice })} suffix="€/l" step={0.01} />
          </>}
          <Field label="Overige autokosten" value={carSettings.otherCostPerKm} onChange={(otherCostPerKm) => car({ otherCostPerKm })} suffix="€/km" hint="Onderhoud, verzekering en wegenbelasting per km, zonder brandstof en afschrijving." step={0.01} />
          <Field label="Privé-km per jaar" value={carSettings.privateKmPerYear} onChange={(privateKmPerYear) => car({ privateKmPerYear })} suffix="km" step={500} />
        </div>
        <Checkbox checked={carSettings.includeDepreciation} onChange={(includeDepreciation) => car({ includeDepreciation })} label="Afschrijving eigen auto meenemen" small="Aan te raden als je eigen auto met een leaseauto vergelijkt." />
        {carSettings.includeDepreciation && <Field label="Afschrijving per maand" value={carSettings.depreciationMonthly} onChange={(depreciationMonthly) => car({ depreciationMonthly })} suffix="€/mnd" step={10} />}
      </>}
      <Checkbox checked={state.personal.timeValue.include} onChange={(include) => personal({ timeValue: { ...state.personal.timeValue, include } })} label="Reistijd ook in geld uitdrukken" small="Optioneel: wat is een uur van je vrije tijd je waard?" />
      {state.personal.timeValue.include && <Field label="Waarde per uur" value={state.personal.timeValue.perHour} onChange={(perHour) => personal({ timeValue: { ...state.personal.timeValue, perHour } })} suffix="€/uur" />}
    </InputSection>
  </>;
}

type Row = { label: string; pick: (total: JobTotal) => number; hideWhenZero?: boolean };

function BreakdownTable({ current, next, period }: { current: JobTotal; next: JobTotal; period: "month" | "year" }) {
  const factor = period === "year" ? 12 : 1;
  const allRows: Row[] = [
    { label: "Netto loon incl. vakantiegeld en bonus", pick: (total) => total.income.netPayMonthly },
    { label: "Auto en mobiliteit (netto)", pick: (total) => total.mobility.netMonthly },
    { label: "Thuiswerkvergoeding", pick: (total) => total.commute.homeWorkAllowanceMonthly, hideWhenZero: true },
    { label: "Parkeren", pick: (total) => -total.commute.parkingMonthly, hideWhenZero: true },
    { label: "Lunch en koffie", pick: (total) => -total.commute.lunchMonthly, hideWhenZero: true },
    { label: "Overige kosten", pick: (total) => -total.commute.otherMonthly, hideWhenZero: true },
    { label: "Kinderopvang", pick: (total) => -total.commute.childcareMonthly, hideWhenZero: true },
    { label: "Kinderopvangtoeslag", pick: (total) => total.allowances?.kinderopvangtoeslagMonthly ?? 0, hideWhenZero: true },
    { label: "Kindgebonden budget en zorgtoeslag", pick: (total) => (total.allowances?.kindgebondenBudgetMonthly ?? 0) + (total.allowances?.zorgtoeslagMonthly ?? 0), hideWhenZero: true },
  ];
  const rows = allRows.filter((row) => !row.hideWhenZero || row.pick(current) !== 0 || row.pick(next) !== 0);
  return <div className="work-table">
    <div className="work-table-head"><span></span><strong>Huidig</strong><strong>Nieuw</strong><strong>Verschil</strong></div>
    {rows.map((row) => <div key={row.label}><span>{row.label}</span><strong>{money(row.pick(current) * factor)}</strong><strong>{money(row.pick(next) * factor)}</strong><strong>{signedMoney((row.pick(next) - row.pick(current)) * factor)}</strong></div>)}
    <div className="work-total"><span>Netto over</span><strong>{money(current.netAfterCostsMonthly * factor)}</strong><strong>{money(next.netAfterCostsMonthly * factor)}</strong><strong>{signedMoney((next.netAfterCostsMonthly - current.netAfterCostsMonthly) * factor)}</strong></div>
  </div>;
}

function Results({ state, setState }: { state: NettoplaatjeState; setState: SetState }) {
  const comparison = useMemo(() => compareJobs(state), [state]);
  const { current, next } = comparison;
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [copied, setCopied] = useState(false);
  const better = comparison.netDifferenceMonthly >= 0;
  const timeIncluded = state.personal.timeValue.include;

  const share = async () => {
    const url = shareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Kopieer deze link:", url);
    }
  };

  const reset = () => {
    if (window.confirm("Alle ingevulde gegevens wissen en opnieuw beginnen?")) setState(() => createDefaultState());
  };

  const unfilledByJob = (["current", "next"] as JobKey[])
    .map((job) => ({ job, sections: comparison.unfilled.filter((item) => item.job === job).map((item) => sectionLabels[item.section].toLowerCase()) }))
    .filter((item) => item.sections.length > 0);

  return <div className="work-results" id="uitkomst">
    <div className="results-heading"><div><span className="section-kicker">Jouw nettoplaatje</span><h2>Wat levert de nieuwe baan op?</h2></div><span className="live-badge"><span></span> Live berekend</span></div>

    <div className={`work-highlight total-highlight ${better ? "better" : "worse"}`}>
      <span className="section-kicker">Verschil per maand, na alle kosten</span>
      <strong>{signedMoney(comparison.netDifferenceMonthly)}</strong>
      <p>{better ? "De nieuwe baan houdt naar schatting meer over" : "De nieuwe baan houdt naar schatting minder over"}: {signedMoney(comparison.netDifferenceAnnual)} per jaar.</p>
    </div>

    <div className="work-metrics">
      <div><span>Netto per uur, incl. reistijd</span><strong>{moneyCents(current.netPerHourInclTravel)} → {moneyCents(next.netPerHourInclTravel)}</strong><small className={comparison.netPerHourDifference < 0 ? "negative" : "positive"}>{signedMoneyCents(comparison.netPerHourDifference)} per uur</small></div>
      <div><span>Reistijd per maand</span><strong>{decimal(current.commute.travelHoursPerMonth)} → {decimal(next.commute.travelHoursPerMonth)} uur</strong><small>{signedDecimal(comparison.travelHoursDifferenceMonthly)} uur</small></div>
      <div><span>Totale beloning per jaar</span><strong>{signedMoney(comparison.totalRewardDifferenceAnnual)}</strong><small>bruto, incl. pensioen werkgever</small></div>
      <div><span>Vakantiedagen</span><strong>{current.benefits.vacationDays} → {next.benefits.vacationDays}</strong><small>{signedDecimal(comparison.vacationDaysDifference)} dagen</small></div>
    </div>

    {comparison.netPerHourDifference < 0 && better && <div className="work-note warn-note"><span>!</span><p>Je houdt per maand meer over, maar per uur dat je aan je werk kwijt bent (inclusief reizen) verdien je minder.</p></div>}

    {unfilledByJob.length > 0 && <div className="unfilled-note">
      <strong>Nog voorbeeldwaarden in gebruik</strong>
      {unfilledByJob.map((item) => <span key={item.job}>{jobLabels[item.job]}: {item.sections.join(", ")}</span>)}
      <small>Pas deze onderdelen aan voor een persoonlijke uitkomst.</small>
    </div>}

    <div className="work-breakdown">
      <div className="section-heading compact-heading"><div><span className="section-kicker">Opbouw</span><h2>Per {period === "month" ? "maand" : "jaar"}</h2></div>
        <div className="period-toggle" role="group" aria-label="Periode">
          <button type="button" className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>Maand</button>
          <button type="button" className={period === "year" ? "active" : ""} onClick={() => setPeriod("year")}>Jaar</button>
        </div></div>
      <BreakdownTable current={current} next={next} period={period} />
      {current.allowances && next.allowances && <p className="choice-note">Toeslagen gerekend op een toetsingsinkomen van {money(current.allowances.toetsingsinkomen)} (huidig) en {money(next.allowances.toetsingsinkomen)} (nieuw), inclusief je partner.{state.personal.household.receivesRentAllowance && " Huurtoeslag rekenen we niet mee; die daalt meestal ook als je meer verdient."}</p>}
      {timeIncluded && <div className="work-table time-table">
        <div><span>Waarde reistijd</span><strong>{money(-current.commute.timeValueMonthly * (period === "year" ? 12 : 1))}</strong><strong>{money(-next.commute.timeValueMonthly * (period === "year" ? 12 : 1))}</strong><strong>{signedMoney(-(next.commute.timeValueMonthly - current.commute.timeValueMonthly) * (period === "year" ? 12 : 1))}</strong></div>
        <div className="work-total"><span>Netto over, incl. reistijd</span><strong>{money(current.netAfterCostsAndTimeMonthly * (period === "year" ? 12 : 1))}</strong><strong>{money(next.netAfterCostsAndTimeMonthly * (period === "year" ? 12 : 1))}</strong><strong>{signedMoney((next.netAfterCostsAndTimeMonthly - current.netAfterCostsAndTimeMonthly) * (period === "year" ? 12 : 1))}</strong></div>
      </div>}
    </div>

    <div className="work-breakdown">
      <div className="section-heading compact-heading"><div><span className="section-kicker">Niet in je netto, wel waarde</span><h2>Extra beloning</h2></div></div>
      <div className="work-table">
        <div className="work-table-head"><span></span><strong>Huidig</strong><strong>Nieuw</strong><strong>Verschil</strong></div>
        <div><span>Pensioen werkgever per jaar</span><strong>{money(current.benefits.employerPensionMonthly * 12)}</strong><strong>{money(next.benefits.employerPensionMonthly * 12)}</strong><strong>{signedMoney((next.benefits.employerPensionMonthly - current.benefits.employerPensionMonthly) * 12)}</strong></div>
        <div><span>Opleidings- en overige budgetten</span><strong>{money(current.benefits.trainingBudgetAnnual + current.benefits.otherAnnual)}</strong><strong>{money(next.benefits.trainingBudgetAnnual + next.benefits.otherAnnual)}</strong><strong>{signedMoney(next.benefits.trainingBudgetAnnual + next.benefits.otherAnnual - current.benefits.trainingBudgetAnnual - current.benefits.otherAnnual)}</strong></div>
        <div className="work-total"><span>Totale bruto beloning per jaar</span><strong>{money(current.totalRewardAnnual)}</strong><strong>{money(next.totalRewardAnnual)}</strong><strong>{signedMoney(comparison.totalRewardDifferenceAnnual)}</strong></div>
      </div>
    </div>

    <div className="total-actions">
      <button type="button" className="primary-button" onClick={share}>{copied ? "Link gekopieerd ✓" : "Deel deze vergelijking"}</button>
      <button type="button" className="ghost-button" onClick={reset}>Opnieuw beginnen</button>
    </div>
    <p className="privacy-line">Je gegevens blijven op dit apparaat. Een gedeelde link bevat alleen de ingevulde bedragen, geen naam of andere persoonsgegevens.</p>
  </div>;
}

/** Fixed bar on small screens so the outcome stays visible while filling in. */
function MobileResultBar({ difference }: { difference: number }) {
  const [hidden, setHidden] = useState(false);
  const observed = useRef(false);
  useEffect(() => {
    const target = document.getElementById("uitkomst");
    if (!target || observed.current || typeof IntersectionObserver === "undefined") return;
    observed.current = true;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return <a href="#uitkomst" className={`mobile-result-bar ${hidden ? "is-hidden" : ""}`} aria-hidden={hidden}>
    <span>Nieuwe baan per maand</span>
    <strong className={difference >= 0 ? "positive" : "negative"}>{signedMoney(difference)}</strong>
    <span className="mobile-result-link">Bekijk uitkomst ↓</span>
  </a>;
}

export default function TotalCalculator() {
  const [state, setJobModel] = useJobModel();
  const setState: SetState = (update) => setJobModel(update);
  useEffect(() => {
    applySharedStateFromLocation();
    // A shared link opened while this page is already open only changes the fragment.
    const onHashChange = () => { applySharedStateFromLocation(); };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const difference = useMemo(() => compareJobs(state).netDifferenceMonthly, [state]);

  return <>
    <section className="work-calculator total-calculator shell">
      <aside className="work-inputs">
        <div className="panel-heading"><div><span className="section-kicker">Jouw gegevens</span><h2>Huidige en nieuwe baan</h2></div></div>
        <p className="panel-intro">Vul per onderdeel beide banen in. Alles wordt alleen op dit apparaat bewaard, ook als je de pagina later opnieuw opent.</p>
        <TaxYearSelect />
        <Inputs state={state} setState={setState} />
      </aside>
      <Results state={state} setState={setState} />
    </section>
    <MobileResultBar difference={difference} />
  </>;
}
