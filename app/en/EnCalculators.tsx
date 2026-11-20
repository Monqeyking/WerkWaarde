"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Field } from "../components/Field";
import { Highlight, Metrics, SpokeTable, type TableRow } from "../components/Spoke";
import type { ExpatOption } from "../../lib/expat";
import { moneyCentsEn, moneyEn, percentEn } from "../../lib/format";
import { updateJobSection, updatePersonal, type JobProfile, type NettoplaatjeState } from "../../lib/job-model";
import { grossToNet, type GrossToNet } from "../../lib/spokes";
import { taxYear } from "../../lib/tax-years";
import { applyPrefillFromLocation, useJobModel } from "../../lib/use-job-model";

type Salary = JobProfile["salary"];
type SetModel = (update: (state: NettoplaatjeState) => NettoplaatjeState) => void;

/** The English calculators fill in the "current job" of the shared model, like the Dutch bruto-netto calculator. */
const JOB = "current" as const;

function useSalaryModel() {
  const [model, setModel] = useJobModel();
  const salary = model.jobs[JOB].salary;
  const set = (patch: Partial<Salary>) => setModel((current) => updateJobSection(current, JOB, "salary", patch));
  // Opened from a salary page (/en#bruto=5000): fill in that salary and jump to the calculator.
  useEffect(() => {
    if (!applyPrefillFromLocation()) return;
    document.getElementById("calculator")?.scrollIntoView({ block: "start" });
  }, []);
  return { model, setModel, salary, set };
}

/** Two-column frame: inputs left, live results right (stacked on mobile). */
function Shell({ inputsTitle, children, results, year }: { inputsTitle: string; children: ReactNode; results: ReactNode; year: number }) {
  return <section className="calculator-wrap shell spoke-calculator" id="calculator">
    <div className="calculator-shell">
      <aside className="inputs-panel">
        <div className="panel-heading"><div><span className="section-kicker">Your situation</span><h2>{inputsTitle}</h2></div><span className="lock-icon">⌁</span></div>
        <p className="panel-intro">Example values are filled in. Change them for your own estimate. Tax year {year}.</p>
        <div className="input-section last-section">{children}</div>
      </aside>
      <div className="results-panel">
        <div className="results-heading"><div><span className="section-kicker">Your result</span><h2>Estimate</h2></div><span className="live-badge"><span></span> Live</span></div>
        {results}
      </div>
    </div>
  </section>;
}

type Period = "year" | "month";

/** Gross salary, entered per year (as in most offers to expats) or per month. */
function SalaryInputs({ salary, set, model, setModel, pensionMonthly }: {
  salary: Salary; set: (patch: Partial<Salary>) => void; model: NettoplaatjeState; setModel: SetModel; pensionMonthly: number;
}) {
  const [period, setPeriod] = useState<Period>("year");
  // A yearly amount includes holiday allowance and a 13th month, as in most Dutch offers.
  const yearFactor = 12 * (1 + salary.holidayAllowancePct / 100 + salary.yearEndBonusPct / 100);
  return <>
    <div className="tax-year-box">
      <span className="section-kicker">Salary in your offer</span>
      <div className="period-toggle" role="radiogroup" aria-label="Salary period">
        {(["year", "month"] as const).map((option) => <button key={option} type="button" role="radio" aria-checked={period === option}
          className={period === option ? "active" : ""} onClick={() => setPeriod(option)}>{option === "year" ? "Per year" : "Per month"}</button>)}
      </div>
    </div>
    {period === "year"
      ? <Field label="Gross salary per year" value={Math.round(salary.grossMonthly * yearFactor)} onChange={(annual) => set({ grossMonthly: annual / yearFactor })} suffix="€" step={500} infoLabel="Explanation"
        hint="Your annual gross salary including holiday allowance (and a 13th month, if you get one), as most Dutch offers state it. Leave out a bonus: enter that below." />
      : <Field label="Gross salary per month" value={Math.round(salary.grossMonthly)} onChange={(grossMonthly) => set({ grossMonthly })} suffix="€" step={50} infoLabel="Explanation"
        hint="Your fixed monthly gross salary for your hours, as on your payslip. Without holiday allowance." />}
    <Field label="Hours per week" value={salary.hoursPerWeek} onChange={(hoursPerWeek) => set({ hoursPerWeek })} suffix="hrs" max={60} infoLabel="Explanation" />
    <Field label="Holiday allowance" value={salary.holidayAllowancePct} onChange={(holidayAllowancePct) => set({ holidayAllowancePct })} suffix="%" step={0.1} max={20} infoLabel="Explanation"
      hint="Vakantiegeld: by law at least 8% of your gross salary, usually paid in May or June." />
    <Field label="13th month" value={salary.yearEndBonusPct} onChange={(yearEndBonusPct) => set({ yearEndBonusPct })} suffix="%" step={0.01} max={50} infoLabel="Explanation"
      hint="A full 13th month is 8.33% of your annual salary. Enter 0 if you don't get one." />
    <Field label="Bonus per year" value={salary.annualBonus} onChange={(annualBonus) => set({ annualBonus })} suffix="€" step={100} infoLabel="Explanation"
      hint="Expected gross bonus or profit share per year." />
    {salary.pensionMode === "monthly"
      ? <Field label="Your pension contribution" value={salary.pensionEmployeeMonthly} onChange={(pensionEmployeeMonthly) => set({ pensionEmployeeMonthly })} suffix="€/mo" infoLabel="Explanation"
        hint="The employee pension contribution on your payslip (pensioenpremie). It is deducted from your gross pay before tax. Not sure? Ask your employer, or leave it at 0." />
      : <p className="choice-note">Your pension contribution follows from your pension scheme: {moneyEn(pensionMonthly)} a month. <button type="button" className="link-button" onClick={() => set({ pensionMode: "monthly", pensionEmployeeMonthly: Math.round(pensionMonthly) })}>Enter it yourself</button></p>}
    <Field label="Age" value={model.personal.age} onChange={(age) => setModel((current) => updatePersonal(current, { age }))} suffix="yrs" min={16} max={100} infoLabel="Explanation"
      hint="From the Dutch state pension age (AOW), lower tax rates apply." />
  </>;
}

/** What the ruling does for this salary, in one or two sentences. */
function RulingNote({ option, result, year }: { option: ExpatOption; result: GrossToNet; year: number }) {
  const rules = taxYear(year).expatRuling;
  const pct = `${Math.round(rules.rate * 100)}%`;
  const norm = option === "youngMaster" ? rules.salaryNormYoungMaster : rules.salaryNorm;
  if (option === "none") return <p className="choice-note">For employees recruited from abroad whose employer has the ruling approved by the Dutch Tax Administration.</p>;
  return <p className="choice-note">
    {result.expatLimit === "belowNorm" && <>Your taxable salary is not above the salary norm of {moneyEn(norm)} a year, so the ruling gives you nothing.</>}
    {result.expatLimit === "norm" && <>Your employer can pay {moneyEn(result.expatAllowanceAnnual)} a year tax-free: only the part above the salary norm of {moneyEn(norm)}, because your taxable salary must stay above it.</>}
    {result.expatLimit === "cap" && <>Your employer can pay the maximum of {moneyEn(result.expatAllowanceAnnual)} a year tax-free ({pct} of {moneyEn(rules.wntNorm)}).</>}
    {result.expatLimit === "full" && <>Your employer can pay {pct} of your salary tax-free: {moneyEn(result.expatAllowanceAnnual)} a year. You pay wage tax on the rest.</>}
    {" "}Calculated for a full year with the {year} rules. <a href={rules.sourceUrl} target="_blank" rel="noreferrer" hrefLang="nl">Belastingdienst</a>
  </p>;
}

function RulingSelect({ value, onChange, withNone, year, result }: { value: ExpatOption; onChange: (option: ExpatOption) => void; withNone: boolean; year: number; result: GrossToNet }) {
  const id = useId();
  const pct = `${Math.round(taxYear(year).expatRuling.rate * 100)}%`;
  return <div className="field">
    <span className="field-label"><label htmlFor={id}>{withNone ? `${pct} ruling (expatregeling)` : "Which norm applies to you?"}</label></span>
    <span className="input-wrap">
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as ExpatOption)}>
        {withNone && <option value="none">No</option>}
        <option value="standard">{withNone ? "Yes" : "Standard salary norm"}</option>
        <option value="youngMaster">{withNone ? "Yes, under 30 with a master's degree" : "Under 30 with a master's degree"}</option>
      </select>
    </span>
    <RulingNote option={value} result={result} year={year} />
  </div>;
}

/** Gross to net with all the usual inputs and an optional 30% ruling: the main English calculator on /en. */
export function GrossNetCalculatorEn() {
  const { model, setModel, salary, set } = useSalaryModel();
  const result = useMemo(() => grossToNet(model, JOB), [model]);
  const year = model.personal.taxYear;

  const monthRows: TableRow[] = [
    { label: "Gross salary", value: moneyEn(result.grossMonthly) },
    ...(result.pensionMonthly > 0 ? [{ label: "Your pension contribution", value: moneyEn(-result.pensionMonthly) }] : []),
    ...(result.expatAllowanceAnnual > 0 ? [{ label: "Of which tax-free (30% ruling)", value: moneyEn(result.expatAllowanceRegularMonthly), muted: true }] : []),
    { label: "Wage tax (after tax credits)", value: moneyEn(-result.regularTaxMonthly) },
    { label: "Net in a regular month", value: moneyEn(result.regularNetMonthly), total: true },
  ];
  const extraRows: TableRow[] = [
    ...(result.holidayGrossAnnual > 0 ? [{ label: `Holiday allowance (gross ${moneyEn(result.holidayGrossAnnual)})`, value: moneyEn(result.holidayNetAnnual) }] : []),
    ...(result.yearEndGrossAnnual > 0 ? [{ label: `13th month (gross ${moneyEn(result.yearEndGrossAnnual)})`, value: moneyEn(result.yearEndNetAnnual) }] : []),
    ...(result.bonusGrossAnnual > 0 ? [{ label: `Bonus (gross ${moneyEn(result.bonusGrossAnnual)})`, value: moneyEn(result.bonusNetAnnual) }] : []),
  ];

  return <Shell inputsTitle="Your salary" year={year} results={<>
    <Highlight label="Net per month" value={moneyEn(result.regularNetMonthly)}>
      In a regular month, without holiday allowance or bonus. Averaged over the year, everything included: {moneyEn(result.netMonthlyAverage)} a month.
    </Highlight>
    <Metrics items={[
      { label: "Net per year", value: moneyEn(result.netAnnual), note: "incl. holiday allowance, 13th month and bonus" },
      { label: "Net per hour", value: moneyCentsEn(result.netPerHour), note: `at ${salary.hoursPerWeek} hours a week` },
      { label: "Tax on extras", value: percentEn(result.extraTaxRate), note: "holiday allowance, 13th month, bonus" },
      { label: "Gross needed for €100 net", value: moneyEn(result.grossFor100Net), note: `your marginal rate is ${percentEn(result.marginalRate)}` },
    ]} />
    <SpokeTable head={["Per month", "Amount"]} rows={monthRows} />
    {extraRows.length > 0 && <SpokeTable head={["Extras per year", "Net"]} rows={[
      ...extraRows,
      { label: "Average tax rate on your total income", value: percentEn(result.effectiveRate), muted: true },
    ]} />}
  </>}>
    <SalaryInputs salary={salary} set={set} model={model} setModel={setModel} pensionMonthly={result.pensionMonthly} />
    <RulingSelect value={salary.expatRuling} onChange={(expatRuling) => set({ expatRuling })} withNone year={year} result={result} />
  </Shell>;
}

/** Net salary with and without the 30% ruling, side by side: the calculator on /en/30-percent-ruling. */
export function RulingCalculatorEn() {
  const { model, setModel, salary, set } = useSalaryModel();
  // The comparison always shows the ruling; this page does not switch it on for the other calculators.
  const [option, setOption] = useState<Exclude<ExpatOption, "none">>("standard");
  const chosen = salary.expatRuling === "none" ? option : salary.expatRuling;
  const pick = (next: ExpatOption) => {
    if (next === "none") return;
    setOption(next);
    if (salary.expatRuling !== "none") set({ expatRuling: next });
  };
  const without = useMemo(() => grossToNet(updateJobSection(model, JOB, "salary", { expatRuling: "none" }), JOB), [model]);
  const ruling = useMemo(() => grossToNet(updateJobSection(model, JOB, "salary", { expatRuling: chosen }), JOB), [model, chosen]);
  const year = model.personal.taxYear;
  const extraMonthly = ruling.regularNetMonthly - without.regularNetMonthly;

  const rows = (pick: (result: GrossToNet) => number, format = moneyEn) => [format(pick(without)), format(pick(ruling))] as const;
  const table: Array<[string, readonly [string, string]]> = [
    ["Net in a regular month", rows((r) => r.regularNetMonthly)],
    ["Net per year", rows((r) => r.netAnnual)],
    ["Tax-free allowance per year", rows((r) => r.expatAllowanceAnnual)],
    ["Wage tax per year", rows((r) => r.effectiveRate * r.grossAnnual)],
    ["Average tax rate", rows((r) => r.effectiveRate, percentEn)],
    ["Marginal tax rate", rows((r) => r.marginalRate, percentEn)],
  ];

  return <Shell inputsTitle="Your salary" year={year} results={<>
    <Highlight label="Extra net per month with the ruling" value={moneyEn(extraMonthly)}>
      {extraMonthly > 0.5
        ? <>{moneyEn(ruling.regularNetMonthly)} instead of {moneyEn(without.regularNetMonthly)} in a regular month. Over the whole year: {moneyEn(ruling.netAnnual - without.netAnnual)} more net.</>
        : <>At this salary the ruling makes no difference: your taxable salary has to stay above the salary norm.</>}
    </Highlight>
    <div className="spoke-table ruling-compare">
      <div className="spoke-table-head"><span>Per year unless stated</span><strong>Without</strong><strong>With ruling</strong></div>
      {table.map(([label, [a, b]], index) => <div key={label} className={index === 0 ? "spoke-total" : undefined}><span>{label}</span><strong>{a}</strong><strong>{b}</strong></div>)}
    </div>
  </>}>
    <SalaryInputs salary={salary} set={set} model={model} setModel={setModel} pensionMonthly={without.pensionMonthly} />
    <RulingSelect value={chosen} onChange={pick} withNone={false} year={year} result={ruling} />
  </Shell>;
}
