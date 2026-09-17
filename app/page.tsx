"use client";

import { useMemo, useState } from "react";
import AdSenseSlot from "./components/AdSenseSlot";
import { ALL_SCENARIOS, calculateSalaryBreakdown, calculateScenarios, type CalculatorInputs, type ScenarioKey, type ScenarioResult } from "../lib/calculator";
import { calculateWorkPattern, type WorkPatternInputs } from "../lib/work-costs";

const defaults: CalculatorInputs = {
  salary: 4500, holidayAllowance: 8, pensionInputMode: "monthly", pensionEmployeeMonthly: 0, pensionEmployerMonthly: 0,
  pensionTotalRate: 20, pensionEmployeeShare: 33.33, pensionFranchise: 19172, pensionIncludesHoliday: true, age: 35, leaseBudget: 625, mobilityBudget: 850,
  carValue: 40000, benefitRate: 22, employeeContribution: 70, businessKm: 15000,
  privateKm: 10000, reimbursementRate: 0.23, leaseIsElectric: false, ownCarIsElectric: false, fuelConsumption: 7.5, fuelPrice: 2.00,
  electricConsumption: 18, electricityPrice: 0.30, otherCarCostRate: 0.15, includeDepreciation: false, depreciationMonthly: 0, taxYear: 2026,
};

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
function money(value: number) { return euro.format(value); }

function Info({ children }: { children: string }) {
  return <span className="info-dot" title={children} aria-label={children}>i</span>;
}

function AdSlot({ placement }: { placement: "home" | "work" | "result" }) {
  return <AdSenseSlot placement={placement} />;
}

function Field({ label, value, onChange, suffix, hint, step = 1, min = 0, max }: {
  label: string; value: number; onChange: (value: number) => void; suffix?: string; hint?: string;
  step?: number; min?: number; max?: number;
}) {
  return <label className="field">
    <span className="field-label">{label} {hint && <Info>{hint}</Info>}</span>
    <span className="input-wrap"><input type="number" value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))} min={min} max={max} step={step}
      inputMode={step < 1 ? "decimal" : "numeric"} />{suffix && <span className="input-suffix">{suffix}</span>}</span>
  </label>;
}

const labels = {
  lease: { title: "Leaseauto", eyebrow: "Auto van de zaak", accent: "teal" },
  mobility: { title: "Mobiliteitsbudget", eyebrow: "Uit laten betalen", accent: "blue" },
  ownCar: { title: "Eigen auto", eyebrow: "Met kilometervergoeding", accent: "orange" },
};

const scenarioOptions: Array<{ key: ScenarioKey; label: string; description: string }> = [
  { key: "lease", label: "Leaseauto", description: "Auto van de zaak" },
  { key: "mobility", label: "Mobiliteitsbudget", description: "Uit laten betalen" },
  { key: "ownCar", label: "Eigen auto", description: "Kilometervergoeding" },
];

function ScenarioCard({ result, scenario, ownCarIsElectric }: { result: ScenarioResult; scenario: keyof typeof labels; ownCarIsElectric: boolean }) {
  const meta = labels[scenario];
  const isWinner = result.winner === scenario;
  const headline = scenario === "lease" ? result.lease.netValue : scenario === "mobility" ? result.mobility.netAmount : result.ownCar.netResult;
  return <article className={`scenario-card ${meta.accent} ${isWinner ? "winner" : ""}`}>
    <div className="card-topline"><div><span className="card-eyebrow">{meta.eyebrow}</span><h3>{meta.title}</h3></div>
      {isWinner && <span className="winner-badge"><span className="spark">✦</span> Voordeligst</span>}</div>
    <div className="card-value">{money(headline)}<span>per maand</span></div>
    <div className="detail-list">
      {scenario === "lease" && <>
        <div><span>Bruto leasebudget</span><strong>{money(result.lease.netValue - result.lease.monthlyImpact)}</strong></div>
        <div><span>Belastbare bijtelling</span><strong>{money(result.lease.taxableBenefit)}</strong></div>
        <div><span>Netto impact salaris</span><strong className="negative">{money(result.lease.monthlyImpact)}</strong></div>
        <div><span>Kosten bijtelling</span><strong>{money(result.lease.taxCost)}</strong></div>
        <div><span>Eigen bijdrage</span><strong>{money(result.lease.employeeContribution)}</strong></div>
        <div><span>Geschatte netto waarde</span><strong>{money(result.lease.netValue)}</strong></div>
      </>}
      {scenario === "mobility" && <>
        <div><span>Bruto budget</span><strong>{money(result.mobility.grossBudget)}</strong></div>
        <div><span>Onbelaste km-vergoeding</span><strong className="positive">{money(result.mobility.taxFreeTravelReimbursement)}</strong></div>
        <div><span>Belastbaar budget</span><strong>{money(result.mobility.taxableBudget)}</strong></div>
        <div><span>Geschatte belasting</span><strong>{money(result.mobility.taxCost)}</strong></div>
        <div><span>Netto budget</span><strong>{money(result.mobility.netBudget)}</strong></div>
        <div><span>Autokosten bij dit gebruik</span><strong>{money(result.mobility.carCosts)}</strong></div>
        <div><span>Netto resultaat</span><strong className={result.mobility.netAmount >= 0 ? "positive" : "negative"}>{money(result.mobility.netAmount)}</strong></div>
      </>}
      {scenario === "ownCar" && <>
        <div><span>Kilometervergoeding</span><strong>{money(result.ownCar.reimbursement)}</strong></div>
        <div><span>{ownCarIsElectric ? "Laadkosten" : "Brandstofkosten"}</span><strong>{money(result.ownCar.energyCosts)}</strong></div>
        <div><span>Overige autokosten</span><strong>{money(result.ownCar.otherCarCosts)}</strong></div>
        {result.ownCar.depreciationCosts > 0 && <div><span>Afschrijving / reserve</span><strong>{money(result.ownCar.depreciationCosts)}</strong></div>}
        <div><span>Totale autokosten</span><strong>{money(result.ownCar.carCosts)}</strong></div>
        <div><span>Belasting bovenmatig deel</span><strong>{money(result.ownCar.taxableReimbursement)}</strong></div>
        <div><span>Netto resultaat</span><strong className={result.ownCar.netResult >= 0 ? "positive" : "negative"}>{money(result.ownCar.netResult)}</strong></div>
      </>}
    </div>
  </article>;
}

function SalarySummary({ result }: { result: ScenarioResult }) {
  return <section className="salary-summary">
    <div className="salary-summary-heading"><div><span className="section-kicker">Bruto → netto</span><h3>Je loon vóór mobiliteitskeuze</h3></div><span className="salary-period">gemiddeld per maand</span></div>
    <div className="salary-metrics">
      <div><span>Bruto maandsalaris</span><strong>{money(result.salary.grossMonthly)}</strong><small>+ {money(result.salary.holidayMonthly)} vakantiegeld apart</small></div>
      <div><span>Pensioenbijdrage</span><strong className="negative">− {money(result.salary.pensionMonthly)}</strong><small>eigen inleg</small></div>
      <div><span>Loonheffing</span><strong className="negative">− {money(result.salary.taxMonthly)}</strong><small>indicatie 2026</small></div>
      <div className="salary-net"><span>Geschat netto loon</span><strong>{money(result.salary.netMonthlyRegular)}</strong><small>excl. vakantiegeld</small></div>
    </div>
    <div className="salary-note"><span>i</span> De pensioenbijdrage verlaagt in deze indicatie het belastbare loon. Daardoor is het geschatte belastingvoordeel {money(result.salary.taxBenefitMonthly)} per maand; de pensioeninleg zelf blijft wel een inhouding. Gemiddeld inclusief vakantiegeld komt het netto loon uit op {money(result.salary.netMonthlyAverage)} per maand.</div>
    <div className="pension-value-line"><span>Werkgeversbijdrage pensioen</span><strong>{result.salary.employerPensionMonthly > 0 ? money(result.salary.employerPensionMonthly) : "Niet ingevuld"}</strong><small>waarde naast je netto loon</small></div>
  </section>;
}

const scenarioTitles = { lease: "leaseauto", mobility: "mobiliteitsbudget", ownCar: "eigen auto" } as const;

function BreakEven({ result }: { result: ScenarioResult }) {
  return <div className="breakeven-panel">
    <div className="breakeven-heading"><div><span className="section-kicker">Gelijkwaardig inkomen</span><h3>Wanneer zijn de andere keuzes even aantrekkelijk?</h3></div><span className="break-even-icon">≈</span></div>
    <p>Bij jouw huidige bruto salaris komt <strong>{labels[result.winner].title}</strong> uit op ongeveer <strong>{money(result.breakEven.targetTotalNet)} netto gemiddeld per maand</strong>, inclusief vakantiegeld en de waarde van je mobiliteitskeuze.</p>
    <div className="breakeven-rows">{result.breakEven.alternatives.map((alternative) => <div className="breakeven-row" key={alternative.scenario}>
      <div><span>{alternative.scenario === "mobility" ? "Vast bruto salaris excl. mobiliteitsbudget" : `Bruto salaris met een ${scenarioTitles[alternative.scenario]}`}</span>
        {alternative.scenario === "mobility" && alternative.grossPackage !== null && <small>+ {money(alternative.grossPackage - alternative.grossSalary!)} mobiliteitsbudget = {money(alternative.grossPackage)} bruto totaal</small>}</div>
      <strong>{alternative.grossSalary === null ? "Niet bereikbaar" : `${money(alternative.grossSalary)} bruto p/m`}</strong>
    </div>)}</div>
    <small>Het salarisbedrag is altijd het vaste bruto maandsalaris. Alle overige gegevens blijven gelijk; bij mobiliteit staat het budget daarom apart en wordt het niet dubbel in het salarisbedrag verwerkt.</small>
  </div>;
}

function Comparison({ result, selectedScenarios }: { result: ScenarioResult; selectedScenarios: ScenarioKey[] }) {
  const items = scenarioOptions.filter((option) => selectedScenarios.includes(option.key)).map((option) => ({
    key: option.key,
    label: option.label,
    value: option.key === "lease" ? result.lease.netValue : option.key === "mobility" ? result.mobility.netAmount : result.ownCar.netResult,
    tone: option.key === "lease" ? "teal" : option.key === "mobility" ? "blue" : "orange",
  }));
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return <section className="comparison-panel">
    <div className="section-heading compact-heading"><div><span className="section-kicker">In één oogopslag</span><h2>Netto waarde per maand</h2></div><span className="year-chip">2026 indicatie</span></div>
    <div className="bars" aria-label="Vergelijking van netto waarde per maand">{items.map((item) => <div className="bar-row" key={item.key}>
      <div className="bar-label"><span><span className={`bar-icon ${item.tone}`}></span>{item.label}</span><strong>{money(item.value)}</strong></div>
      <div className="bar-track"><div className={`bar-fill ${item.tone}`} style={{ width: `${Math.max(8, Math.abs(item.value) / max * 100)}%` }} /></div>
    </div>)}</div>
    <div className="difference-note"><span className="check">✓</span><span><strong>{labels[result.winner].title}</strong> lijkt op basis van deze invoer {money(result.difference)} per maand voordeliger dan de nummer twee ({money(result.differenceAnnual)} per jaar).</span></div>
    <BreakEven result={result} />
  </section>;
}

type AppView = "home" | "mobility" | "work";

function Navigation({ active, onNavigate }: { active: AppView; onNavigate: (view: AppView) => void }) {
  return <nav className="topbar shell"><button className="brand brand-button" type="button" onClick={() => onNavigate("home")}><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></button>
    <div className="site-nav" role="navigation" aria-label="Hoofdnavigatie">
      <button type="button" className={active === "home" ? "active" : ""} onClick={() => onNavigate("home")}>Start</button>
      <button type="button" className={active === "mobility" ? "active" : ""} onClick={() => onNavigate("mobility")}>Lease & mobiliteit</button>
      <button type="button" className={active === "work" ? "active" : ""} onClick={() => onNavigate("work")}>Wat kost werken?</button>
    </div>
    <div className="nav-note"><span className="status-dot"></span> Indicatie voor 2026</div></nav>;
}

function ScenarioSelector({ selectedScenarios, onChange }: { selectedScenarios: ScenarioKey[]; onChange: (scenario: ScenarioKey) => void }) {
  return <section className="scenario-selector" aria-labelledby="scenario-selector-heading">
    <div className="scenario-selector-heading"><div><span className="section-kicker">Jouw vergelijking</span><h3 id="scenario-selector-heading">Wat wil je vergelijken?</h3></div><span className="scenario-selector-hint">Kies minimaal twee opties</span></div>
    <div className="scenario-options">{scenarioOptions.map((option) => {
      const checked = selectedScenarios.includes(option.key);
      const cannotUncheck = checked && selectedScenarios.length <= 2;
      return <label className={`scenario-option ${checked ? "selected" : ""}`} key={option.key}>
        <input type="checkbox" checked={checked} disabled={cannotUncheck} onChange={() => onChange(option.key)} />
        <span className="scenario-option-box">✓</span>
        <span><strong>{option.label}</strong><small>{option.description}</small></span>
      </label>;
    })}</div>
  </section>;
}

function Landing({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  return <main><Navigation active="home" onNavigate={onNavigate} />
    <section className="landing-hero shell"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-line"></span> Slim kiezen begint met vergelijken</div>
      <h1>Wat houd je écht over van je werk?</h1><p>Vergelijk je mobiliteitskeuze én ontdek wat vaker naar kantoor gaan je werkelijk kost.</p>
      <div className="hero-trust"><span className="trust-check">✓</span> Direct resultaat <span className="trust-divider"></span> Geen account nodig <span className="trust-divider"></span> Indicatief</div>
    </div></section>
    <section className="tool-grid shell"><button type="button" className="tool-card teal" onClick={() => onNavigate("mobility")}><span className="tool-number">01</span><span className="section-kicker">Leaseauto, budget of eigen auto</span><h2>Vergelijk je mobiliteitskeuze</h2><p>Zie wat je netto overhoudt met een leaseauto, mobiliteitsbudget of eigen auto met kilometervergoeding.</p><span className="tool-link">Naar mobiliteitsvergelijking →</span></button>
      <button type="button" className="tool-card blue" onClick={() => onNavigate("work")}><span className="tool-number">02</span><span className="section-kicker">Thuiswerken versus kantoor</span><h2>Wat kost vaker naar kantoor?</h2><p>Bereken extra reistijd, autokosten, parkeren, kinderopvang en andere kosten van een gewijzigd werkpatroon.</p><span className="tool-link">Naar werkpatroon-calculator →</span></button></section>
    <div className="shell"><AdSlot placement="home" /></div>
    <section className="landing-note shell"><span className="formula-mark">∑</span><div><strong>Van bruto loon naar werkelijke waarde</strong><p>De twee calculators gebruiken dezelfde heldere uitgangspunten, maar beantwoorden elk één concrete vraag. Zo blijft de invoer overzichtelijk en voorkom je dat kosten dubbel worden meegerekend.</p></div></section>
    <footer className="footer shell"><div className="brand"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></div><span>Een heldere indicatie voor jouw werk- en mobiliteitskeuze.</span><span className="footer-links"><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/contact">Contact</a></span></footer>
  </main>;
}

const workDefaults: WorkPatternInputs = {
  currentGrossSalary: 4500, newGrossSalary: 4500, currentPensionMonthly: 0, newPensionMonthly: 0, age: 35, holidayAllowance: 8,
  currentOfficeDays: 1, newOfficeDays: 4, currentChildcareDays: 0, newChildcareDays: 0,
  workWeeksPerYear: 46, currentOneWayKm: 25, newOneWayKm: 25, currentCommuteMinutesOneWay: 45, newCommuteMinutesOneWay: 45, currentReimbursementRate: 0.23, newReimbursementRate: 0.23,
  fuelConsumption: 7.5, fuelPrice: 2, ownCarIsElectric: false, electricConsumption: 18, electricityPrice: 0.30,
  otherVariableCostRate: 0.08, currentParkingPerOfficeDay: 0, newParkingPerOfficeDay: 0, currentLunchPerOfficeDay: 8, newLunchPerOfficeDay: 8, childcareCostPerDay: 0,
  currentOtherOfficeCostPerDay: 0, newOtherOfficeCostPerDay: 0, includeTimeValue: false, timeValuePerHour: 0,
};

function WorkPatternCalculator({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [inputs, setInputs] = useState<WorkPatternInputs>(workDefaults);
  const update = (key: keyof WorkPatternInputs) => (value: number) => setInputs((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }));
  const currentSalaryInputs: CalculatorInputs = { ...defaults, salary: inputs.currentGrossSalary, pensionEmployeeMonthly: inputs.currentPensionMonthly, age: inputs.age, holidayAllowance: inputs.holidayAllowance };
  const newSalaryInputs: CalculatorInputs = { ...defaults, salary: inputs.newGrossSalary, pensionEmployeeMonthly: inputs.newPensionMonthly, age: inputs.age, holidayAllowance: inputs.holidayAllowance };
  const currentSalary = calculateSalaryBreakdown(currentSalaryInputs);
  const newSalary = calculateSalaryBreakdown(newSalaryInputs);
  const result = useMemo(() => calculateWorkPattern(inputs, currentSalary.netMonthlyAverage, newSalary.netMonthlyAverage), [inputs, currentSalary.netMonthlyAverage, newSalary.netMonthlyAverage]);
  return <main><Navigation active="work" onNavigate={onNavigate} />
    <header className="sub-hero shell"><div><span className="hero-kicker"><span className="kicker-line"></span> Twee banen vergelijken</span><h1>Wat houd je écht over?</h1><p>Vergelijk je huidige en nieuwe baan op salaris, reistijd, kilometers, kinderopvang en andere werkgerelateerde kosten.</p></div></header>
    <section className="work-calculator shell"><aside className="work-inputs"><div className="panel-heading"><div><span className="section-kicker">Jouw werkpatroon</span><h2>Van thuis naar kantoor</h2></div><span className="lock-icon">⌁</span></div>
      <div className="pattern-grid"><div className="pattern-card current"><span className="pattern-label">Oude baan</span><Field label="Bruto salaris" value={inputs.currentGrossSalary} onChange={update("currentGrossSalary")} suffix="€" /><Field label="Pensioeninhouding" value={inputs.currentPensionMonthly} onChange={update("currentPensionMonthly")} suffix="€/mnd" /><Field label="Kantoordagen per week" value={inputs.currentOfficeDays} onChange={update("currentOfficeDays")} suffix="dagen" hint="Hoeveel dagen je nu gemiddeld per week naar kantoor gaat." step={0.5} max={7} /><Field label="Opvangdagen per week" value={inputs.currentChildcareDays} onChange={update("currentChildcareDays")} suffix="dagen" hint="Dagen kinderopvang die je nu nodig hebt." step={0.5} max={7} /><Field label="Afstand enkele reis" value={inputs.currentOneWayKm} onChange={update("currentOneWayKm")} suffix="km" step={1} /><Field label="Reistijd enkele reis" value={inputs.currentCommuteMinutesOneWay} onChange={update("currentCommuteMinutesOneWay")} suffix="min" step={5} /></div>
        <div className="pattern-card new"><span className="pattern-label">Nieuwe baan</span><Field label="Bruto salaris" value={inputs.newGrossSalary} onChange={update("newGrossSalary")} suffix="€" /><Field label="Pensioeninhouding" value={inputs.newPensionMonthly} onChange={update("newPensionMonthly")} suffix="€/mnd" /><Field label="Kantoordagen per week" value={inputs.newOfficeDays} onChange={update("newOfficeDays")} suffix="dagen" hint="Hoeveel dagen je in de nieuwe situatie per week naar kantoor gaat." step={0.5} max={7} /><Field label="Opvangdagen per week" value={inputs.newChildcareDays} onChange={update("newChildcareDays")} suffix="dagen" hint="Dagen kinderopvang die je in de nieuwe situatie nodig hebt." step={0.5} max={7} /><Field label="Afstand enkele reis" value={inputs.newOneWayKm} onChange={update("newOneWayKm")} suffix="km" step={1} /><Field label="Reistijd enkele reis" value={inputs.newCommuteMinutesOneWay} onChange={update("newCommuteMinutesOneWay")} suffix="min" step={5} /></div></div>
      <div className="input-section"><h3><span className="section-number">01</span> Vergoeding en periode</h3><div className="pattern-grid"><div className="pattern-card current"><span className="pattern-label">Oude baan</span><Field label="Kilometervergoeding" value={inputs.currentReimbursementRate} onChange={update("currentReimbursementRate")} suffix="€/km" step={0.01} /></div><div className="pattern-card new"><span className="pattern-label">Nieuwe baan</span><Field label="Kilometervergoeding" value={inputs.newReimbursementRate} onChange={update("newReimbursementRate")} suffix="€/km" step={0.01} /></div></div><Field label="Werkweken per jaar" value={inputs.workWeeksPerYear} onChange={update("workWeeksPerYear")} suffix="weken" hint="Vakantieweken en eventuele sluitingsweken worden hiermee buiten beschouwing gelaten." step={1} max={52} /></div>
      <div className="input-section"><h3><span className="section-number">02</span> Kosten per kantoordag</h3><label className="checkbox-row compact-checkbox"><input type="checkbox" checked={inputs.ownCarIsElectric} onChange={(event) => setInputs((current) => ({ ...current, ownCarIsElectric: event.target.checked }))} /><span className="checkbox-box">✓</span><span><strong>Ik rijd elektrisch</strong><small>Gebruik laadkosten in plaats van brandstofkosten.</small></span></label>{inputs.ownCarIsElectric ? <><Field label="Laadverbruik" value={inputs.electricConsumption} onChange={update("electricConsumption")} suffix="kWh/100 km" step={0.1} /><Field label="Stroomprijs" value={inputs.electricityPrice} onChange={update("electricityPrice")} suffix="€/kWh" step={0.01} /></> : <><Field label="Brandstofverbruik" value={inputs.fuelConsumption} onChange={update("fuelConsumption")} suffix="l/100 km" step={0.1} /><Field label="Benzineprijs" value={inputs.fuelPrice} onChange={update("fuelPrice")} suffix="€/l" step={0.01} /></>}<Field label="Variabele autokosten" value={inputs.otherVariableCostRate} onChange={update("otherVariableCostRate")} suffix="€/km" hint="Alleen extra gebruikskosten zoals onderhoud en banden; geen afschrijving, verzekering, parkeren of tol." step={0.01} /><div className="pattern-grid"><div className="pattern-card current"><span className="pattern-label">Oude baan</span><Field label="Parkeren per kantoordag" value={inputs.currentParkingPerOfficeDay} onChange={update("currentParkingPerOfficeDay")} suffix="€" step={1} /><Field label="Lunch en koffie" value={inputs.currentLunchPerOfficeDay} onChange={update("currentLunchPerOfficeDay")} suffix="€" step={1} /><Field label="Overige kosten" value={inputs.currentOtherOfficeCostPerDay} onChange={update("currentOtherOfficeCostPerDay")} suffix="€" step={1} /></div><div className="pattern-card new"><span className="pattern-label">Nieuwe baan</span><Field label="Parkeren per kantoordag" value={inputs.newParkingPerOfficeDay} onChange={update("newParkingPerOfficeDay")} suffix="€" step={1} /><Field label="Lunch en koffie" value={inputs.newLunchPerOfficeDay} onChange={update("newLunchPerOfficeDay")} suffix="€" step={1} /><Field label="Overige kosten" value={inputs.newOtherOfficeCostPerDay} onChange={update("newOtherOfficeCostPerDay")} suffix="€" step={1} /></div></div><Field label="Kinderopvang per opvangdag" value={inputs.childcareCostPerDay} onChange={update("childcareCostPerDay")} suffix="€" hint="De gemiddelde kosten per opvangdag; vul bovenaan bij beide banen ook de opvangdagen per week in." step={1} /><div className="childcare-help"><strong>Kinderopvang wordt apart berekend</strong><span>Het bedrag per opvangdag telt alleen mee als je bij de oude en/of nieuwe baan opvangdagen per week hebt ingevuld.</span></div></div>
      <div className="input-section last-section"><h3><span className="section-number">03</span> Tijd waarderen</h3><label className="checkbox-row compact-checkbox"><input type="checkbox" checked={inputs.includeTimeValue} onChange={(event) => setInputs((current) => ({ ...current, includeTimeValue: event.target.checked }))} /><span className="checkbox-box">✓</span><span><strong>Reistijd ook financieel waarderen</strong><small>De tijd blijft altijd apart zichtbaar; zet dit aan om er een bedrag aan te koppelen.</small></span></label>{inputs.includeTimeValue && <Field label="Waarde van een uur tijd" value={inputs.timeValuePerHour} onChange={update("timeValuePerHour")} suffix="€/uur" hint="Bijvoorbeeld je netto uurwaarde. Dit is geen loonverlies, maar een persoonlijke waardering van je vrije tijd." step={1} />}</div>
      <div className="panel-footnote"><span>i</span> De calculator vergelijkt alleen het verschil tussen beide situaties. Algemene autokosten zoals afschrijving en verzekering worden niet als extra kantoorkosten meegerekend.</div>
    </aside>
    <div className="work-results"><div className="results-heading"><div><span className="section-kicker">Jouw uitkomst</span><h2>Welke baan houdt meer over?</h2></div><span className="live-badge"><span></span> Live berekend</span></div>
      <div className="work-highlight"><span className="section-kicker">Verschil per maand na werkgerelateerde kosten</span><strong>{money(result.netDifference)}</strong><p>{result.netDifference >= 0 ? "De nieuwe baan houdt naar schatting meer over." : "De nieuwe baan houdt naar schatting minder over."}</p></div>
      <div className="work-metrics"><div><span>Netto oude baan na kosten</span><strong>{money(result.current.netAfterCosts)}</strong><small>gemiddeld incl. vakantiegeld</small></div><div><span>Netto nieuwe baan na kosten</span><strong>{money(result.next.netAfterCosts)}</strong><small>gemiddeld incl. vakantiegeld</small></div><div><span>Verschil in reistijd</span><strong>{result.travelHoursDifference.toFixed(1).replace(".", ",")} uur</strong><small>per maand</small></div><div><span>Verschil in kilometers</span><strong>{Math.round(result.kmDifference).toLocaleString("nl-NL")} km</strong><small>per maand</small></div></div>
      <div className="work-breakdown"><div className="section-heading compact-heading"><div><span className="section-kicker">Oude baan versus nieuwe baan</span><h2>Werkelijke maandwaarde</h2></div></div><div className="work-table"><div className="work-table-head"><span></span><strong>Oude baan</strong><strong>Nieuwe baan</strong><strong>Verschil</strong></div><div><span>Netto loon</span><strong>{money(currentSalary.netMonthlyAverage)}</strong><strong>{money(newSalary.netMonthlyAverage)}</strong><strong>{money(newSalary.netMonthlyAverage - currentSalary.netMonthlyAverage)}</strong></div><div><span>Brandstof / laden</span><strong>{money(result.current.energyCosts)}</strong><strong>{money(result.next.energyCosts)}</strong><strong>{money(result.next.energyCosts - result.current.energyCosts)}</strong></div><div><span>Overige variabele autokosten</span><strong>{money(result.current.otherVariableCosts)}</strong><strong>{money(result.next.otherVariableCosts)}</strong><strong>{money(result.next.otherVariableCosts - result.current.otherVariableCosts)}</strong></div><div><span>Bruto autokosten vóór vergoeding</span><strong>{money(result.current.vehicleCosts)}</strong><strong>{money(result.next.vehicleCosts)}</strong><strong>{money(result.next.vehicleCosts - result.current.vehicleCosts)}</strong></div><div><span>Kilometervergoeding</span><strong>{money(result.current.reimbursement)}</strong><strong>{money(result.next.reimbursement)}</strong><strong>{money(result.next.reimbursement - result.current.reimbursement)}</strong></div><div><span>Netto reis- en autokosten</span><strong>{money(result.current.netTravelCosts)}</strong><strong>{money(result.next.netTravelCosts)}</strong><strong>{money(result.next.netTravelCosts - result.current.netTravelCosts)}</strong></div><div><span>Parkeren</span><strong>{money(result.current.parkingCosts)}</strong><strong>{money(result.next.parkingCosts)}</strong><strong>{money(result.next.parkingCosts - result.current.parkingCosts)}</strong></div><div><span>Lunch en koffie</span><strong>{money(result.current.lunchCosts)}</strong><strong>{money(result.next.lunchCosts)}</strong><strong>{money(result.next.lunchCosts - result.current.lunchCosts)}</strong></div><div><span>Kinderopvang ({inputs.currentChildcareDays} / {inputs.newChildcareDays} dagen p/w)</span><strong>{money(result.current.childcareCosts)}</strong><strong>{money(result.next.childcareCosts)}</strong><strong>{money(result.next.childcareCosts - result.current.childcareCosts)}</strong></div><div><span>Overige werkgerelateerde kosten</span><strong>{money(result.current.otherOfficeCosts)}</strong><strong>{money(result.next.otherOfficeCosts)}</strong><strong>{money(result.next.otherOfficeCosts - result.current.otherOfficeCosts)}</strong></div>{inputs.includeTimeValue && <div><span>Tijdwaarde</span><strong>{money(result.current.timeValue)}</strong><strong>{money(result.next.timeValue)}</strong><strong>{money(result.timeValueDifference)}</strong></div>}<div><span>Reistijd per maand</span><strong>{result.current.travelHours.toFixed(1).replace(".", ",")} uur</strong><strong>{result.next.travelHours.toFixed(1).replace(".", ",")} uur</strong><strong>{result.travelHoursDifference.toFixed(1).replace(".", ",")} uur</strong></div><div className="work-total"><span>Totale kosten na vergoeding</span><strong>{money(result.current.totalCosts)}</strong><strong>{money(result.next.totalCosts)}</strong><strong>{money(result.next.totalCosts - result.current.totalCosts)}</strong></div><div className="work-total"><span>Netto over na kosten</span><strong>{money(result.current.netAfterCosts)}</strong><strong>{money(result.next.netAfterCosts)}</strong><strong>{money(result.netDifference)}</strong></div></div></div>
      <div className="work-breakdown work-annual"><div className="section-heading compact-heading"><div><span className="section-kicker">Hetzelfde beeld op jaarbasis</span><h2>Werkelijke jaarwaarde</h2></div><span className="year-chip">× 12 maanden</span></div><div className="work-table"><div className="work-table-head"><span></span><strong>Oude baan</strong><strong>Nieuwe baan</strong><strong>Verschil</strong></div><div><span>Netto loon per jaar</span><strong>{money(currentSalary.netMonthlyAverage * 12)}</strong><strong>{money(newSalary.netMonthlyAverage * 12)}</strong><strong>{money((newSalary.netMonthlyAverage - currentSalary.netMonthlyAverage) * 12)}</strong></div><div><span>Brandstof / laden</span><strong>{money(result.current.energyCosts * 12)}</strong><strong>{money(result.next.energyCosts * 12)}</strong><strong>{money((result.next.energyCosts - result.current.energyCosts) * 12)}</strong></div><div><span>Overige variabele autokosten</span><strong>{money(result.current.otherVariableCosts * 12)}</strong><strong>{money(result.next.otherVariableCosts * 12)}</strong><strong>{money((result.next.otherVariableCosts - result.current.otherVariableCosts) * 12)}</strong></div><div><span>Bruto autokosten vóór vergoeding</span><strong>{money(result.current.vehicleCosts * 12)}</strong><strong>{money(result.next.vehicleCosts * 12)}</strong><strong>{money((result.next.vehicleCosts - result.current.vehicleCosts) * 12)}</strong></div><div><span>Kilometervergoeding</span><strong>{money(result.current.reimbursement * 12)}</strong><strong>{money(result.next.reimbursement * 12)}</strong><strong>{money((result.next.reimbursement - result.current.reimbursement) * 12)}</strong></div><div><span>Netto reis- en autokosten</span><strong>{money(result.current.netTravelCosts * 12)}</strong><strong>{money(result.next.netTravelCosts * 12)}</strong><strong>{money((result.next.netTravelCosts - result.current.netTravelCosts) * 12)}</strong></div><div><span>Parkeren</span><strong>{money(result.current.parkingCosts * 12)}</strong><strong>{money(result.next.parkingCosts * 12)}</strong><strong>{money((result.next.parkingCosts - result.current.parkingCosts) * 12)}</strong></div><div><span>Lunch en koffie</span><strong>{money(result.current.lunchCosts * 12)}</strong><strong>{money(result.next.lunchCosts * 12)}</strong><strong>{money((result.next.lunchCosts - result.current.lunchCosts) * 12)}</strong></div><div><span>Kinderopvang ({inputs.currentChildcareDays} / {inputs.newChildcareDays} dagen p/w)</span><strong>{money(result.current.childcareCosts * 12)}</strong><strong>{money(result.next.childcareCosts * 12)}</strong><strong>{money((result.next.childcareCosts - result.current.childcareCosts) * 12)}</strong></div><div><span>Overige werkgerelateerde kosten</span><strong>{money(result.current.otherOfficeCosts * 12)}</strong><strong>{money(result.next.otherOfficeCosts * 12)}</strong><strong>{money((result.next.otherOfficeCosts - result.current.otherOfficeCosts) * 12)}</strong></div>{inputs.includeTimeValue && <div><span>Tijdwaarde</span><strong>{money(result.current.timeValue * 12)}</strong><strong>{money(result.next.timeValue * 12)}</strong><strong>{money(result.timeValueDifference * 12)}</strong></div>}<div><span>Reistijd per jaar</span><strong>{(result.current.travelHours * 12).toFixed(1).replace(".", ",")} uur</strong><strong>{(result.next.travelHours * 12).toFixed(1).replace(".", ",")} uur</strong><strong>{(result.travelHoursDifference * 12).toFixed(1).replace(".", ",")} uur</strong></div><div><span>Kilometers per jaar</span><strong>{Math.round(result.current.monthlyKm * 12).toLocaleString("nl-NL")} km</strong><strong>{Math.round(result.next.monthlyKm * 12).toLocaleString("nl-NL")} km</strong><strong>{Math.round(result.kmDifference * 12).toLocaleString("nl-NL")} km</strong></div><div className="work-total"><span>Totale kosten na vergoeding per jaar</span><strong>{money(result.current.totalCosts * 12)}</strong><strong>{money(result.next.totalCosts * 12)}</strong><strong>{money((result.next.totalCosts - result.current.totalCosts) * 12)}</strong></div><div className="work-total"><span>Netto over na kosten per jaar</span><strong>{money(result.current.netAfterCosts * 12)}</strong><strong>{money(result.next.netAfterCosts * 12)}</strong><strong>{money(result.annualNetDifference)}</strong></div></div></div>
      <div className="work-note"><span>i</span><p>De vergelijking rekent beide banen volledig door. Je ziet nu bruto brandstof-/laadkosten, variabele autokosten, kilometervergoeding en netto autokosten apart. Afschrijving, algemene verzekering en tol zijn niet als extra werk-kosten opgenomen.</p></div><AdSlot placement="work" />
    </div></section>
    <section className="how-section shell"><div className="section-heading"><div><span className="section-kicker">Transparant rekenen</span><h2>Zo werkt deze vergelijking</h2></div><span className="formula-mark">∑</span></div><div className="how-grid"><div className="how-card"><span className="how-icon blue">01</span><h3>Per baan apart</h3><p>We rekenen salaris, kantoordagen, afstand en reistijd voor de oude en nieuwe baan afzonderlijk uit.</p></div><div className="how-card"><span className="how-icon blue">02</span><h3>Werkelijke kosten</h3><p>Brandstof of laden, kilometervergoeding, parkeren, lunch en kinderopvang worden per baan meegenomen.</p></div><div className="how-card"><span className="how-icon orange">03</span><h3>Netto eindbeeld</h3><p>Je ziet wat er na alle werkgerelateerde kosten werkelijk overblijft en wat het verschil per maand en jaar is.</p></div></div></section>
    <footer className="footer shell"><div className="brand"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></div><span>Een heldere indicatie voor jouw werk- en mobiliteitskeuze.</span><span className="footer-links"><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/contact">Contact</a></span></footer>
  </main>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>("home");
  const [inputs, setInputs] = useState<CalculatorInputs>(defaults);
  const [selectedScenarios, setSelectedScenarios] = useState<ScenarioKey[]>(ALL_SCENARIOS);
  const result = useMemo(() => calculateScenarios(inputs, selectedScenarios), [inputs, selectedScenarios]);
  const update = (key: keyof CalculatorInputs) => (value: number) => setInputs((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }));
  const toggleScenario = (scenario: ScenarioKey) => setSelectedScenarios((current) => current.includes(scenario)
    ? current.length > 2 ? current.filter((item) => item !== scenario) : current
    : [...current, scenario]);
  if (activeView === "home") return <Landing onNavigate={setActiveView} />;
  if (activeView === "work") return <WorkPatternCalculator onNavigate={setActiveView} />;
  return <main>
    <Navigation active="mobility" onNavigate={setActiveView} />
    <header className="hero shell"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-line"></span> Slim kiezen begint met vergelijken</div>
      <h1>Leaseauto, mobiliteitsbudget of <em>kilometervergoeding?</em></h1><p>Vergelijk wat jij netto overhoudt en ontdek welke mobiliteitskeuze het beste past bij jouw situatie.</p>
      <div className="hero-trust"><span className="trust-check">✓</span> Direct resultaat <span className="trust-divider"></span> Geen account nodig <span className="trust-divider"></span> Indicatief</div>
    </div></header>

    <section className="calculator-wrap shell" id="calculator">
      <div className="input-callout"><span className="aside-number">01</span><div><strong>Vul je gegevens in</strong><span>Je ziet de uitkomst direct veranderen.</span></div><span className="arrow">↘</span></div>
      <div className="calculator-shell">
      <aside className="inputs-panel"><div className="panel-heading"><div><span className="section-kicker">Jouw situatie</span><h2>Vul je gegevens in</h2></div><span className="lock-icon">⌁</span></div>
        <p className="panel-intro">De voorbeeldwaarden zijn ingevuld. Pas ze aan voor een persoonlijke indicatie.</p>
        <div className="input-section"><h3><span className="section-number">01</span> Inkomen</h3>
          <Field label="Bruto maandsalaris" value={inputs.salary} onChange={update("salary")} suffix="€" hint="Je bruto loon vóór loonheffing en pensioenpremie." />
          <Field label="Vakantiegeldpercentage" value={inputs.holidayAllowance} onChange={update("holidayAllowance")} suffix="%" hint="Het gebruikelijke vakantiegeld is 8% van het bruto jaarsalaris." step={0.1} max={20} />
          <div className="pension-mode" role="group" aria-label="Pensioeninvoer">
            <button type="button" className={inputs.pensionInputMode === "monthly" ? "active" : ""} onClick={() => setInputs((current) => ({ ...current, pensionInputMode: "monthly" }))}>Van loonstrook</button>
            <button type="button" className={inputs.pensionInputMode === "scheme" ? "active" : ""} onClick={() => setInputs((current) => ({ ...current, pensionInputMode: "scheme" }))}>Bereken regeling</button>
          </div>
          {inputs.pensionInputMode === "monthly" ? <>
            <Field label="Eigen pensioeninhouding" value={inputs.pensionEmployeeMonthly} onChange={update("pensionEmployeeMonthly")} suffix="€/mnd" hint="Vul hier het bedrag in dat op je loonstrook als werknemersbijdrage pensioen staat." step={1} />
            <Field label="Werkgeversbijdrage pensioen" value={inputs.pensionEmployerMonthly} onChange={update("pensionEmployerMonthly")} suffix="€/mnd" hint="Optioneel: de maandelijkse bijdrage van je werkgever. Deze komt niet bij je netto loon, maar telt wel mee als arbeidsvoorwaarde." step={1} />
          </> : <>
            <Field label="Totale pensioenpremie" value={inputs.pensionTotalRate} onChange={update("pensionTotalRate")} suffix="%" hint="De totale premie van werkgever en werknemer samen, berekend over de pensioengrondslag." step={0.1} max={100} />
            <Field label="Werknemersdeel van premie" value={inputs.pensionEmployeeShare} onChange={update("pensionEmployeeShare")} suffix="%" hint="Welk percentage van de totale pensioenpremie je zelf betaalt. De rest is het werkgeversdeel." step={0.1} max={100} />
            <Field label="AOW-franchise per jaar" value={inputs.pensionFranchise} onChange={update("pensionFranchise")} suffix="€" hint="Het deel van het pensioengevende loon waarover je geen aanvullend pensioen opbouwt. Voor veel regelingen is de indicatie voor 2026 €19.172." step={1} />
            <label className="checkbox-row compact-checkbox">
              <input type="checkbox" checked={inputs.pensionIncludesHoliday} onChange={(event) => setInputs((current) => ({ ...current, pensionIncludesHoliday: event.target.checked }))} />
              <span className="checkbox-box">✓</span>
              <span><strong>Vakantiegeld telt mee</strong><small>Veel pensioenregelingen rekenen hierover pensioen op.</small></span>
            </label>
          </>}
          <div className="pension-help"><strong>Waarom twee manieren?</strong> Een pensioenregeling gebruikt meestal een premiepercentage over het loon minus de AOW-franchise. Voor de beste indicatie kun je daarom ook gewoon de bedragen van je loonstrook invullen.</div>
          <Field label="Leeftijd" value={inputs.age} onChange={update("age")} suffix="jaar" hint="Wordt gebruikt om de berekening voor AOW-gerechtigden indicatief aan te passen." min={16} max={100} /></div>
        <div className="input-section"><h3><span className="section-number">02</span> Werk & mobiliteit</h3>
          <Field label="Leasebudget per maand" value={inputs.leaseBudget} onChange={update("leaseBudget")} suffix="€" hint="Het maximale maandbedrag dat je werkgever voor een leaseauto beschikbaar stelt." />
          <Field label="Mobiliteitsbudget per maand" value={inputs.mobilityBudget} onChange={update("mobilityBudget")} suffix="€" hint="Het bruto bedrag dat je kunt laten uitbetalen in plaats van een leaseauto." />
          <Field label="Zakelijke kilometers per jaar" value={inputs.businessKm} onChange={update("businessKm")} suffix="km" hint="Kilometers voor woon-werk en zakelijke ritten die je werkgever vergoedt." />
          <Field label="Privé-kilometers per jaar" value={inputs.privateKm} onChange={update("privateKm")} suffix="km" hint="Je verwachte privégebruik van je eigen auto." />
          <Field label="Kilometervergoeding werkgever" value={inputs.reimbursementRate} onChange={update("reimbursementRate")} suffix="€/km" hint="Je feitelijke vergoeding. In 2026 mag maximaal €0,23 per zakelijke kilometer onbelast worden vergoed." step={0.01} />
          <label className="checkbox-row">
            <input type="checkbox" checked={inputs.ownCarIsElectric} onChange={(event) => setInputs((current) => ({ ...current, ownCarIsElectric: event.target.checked }))} />
            <span className="checkbox-box">✓</span>
            <span><strong>Mijn eigen auto is elektrisch</strong><small>Gebruik laadverbruik voor eigen auto en mobiliteitsbudget</small></span>
          </label>
          {inputs.ownCarIsElectric ? <>
            <Field label="Gemiddeld verbruik elektrische auto" value={inputs.electricConsumption} onChange={update("electricConsumption")} suffix="kWh/100 km" hint="Het gemiddelde stroomverbruik van je elektrische auto." step={0.1} />
            <Field label="Gemiddelde stroomprijs" value={inputs.electricityPrice} onChange={update("electricityPrice")} suffix="€/kWh" hint="Een gewogen gemiddelde van thuisladen, publiek laden en eventueel laden op het werk." step={0.01} />
            <div className="ev-rule-note">Bij een privé-EV rekenen we geen aparte laadvergoeding bovenop de kilometervergoeding. De laadkosten worden dus als onderdeel van je eigen autokosten meegenomen.</div>
          </> : <>
            <Field label="Gemiddeld verbruik eigen auto" value={inputs.fuelConsumption} onChange={update("fuelConsumption")} suffix="l/100 km" hint="Het gemiddelde brandstofverbruik van je auto." step={0.1} />
            <Field label="Benzineprijs" value={inputs.fuelPrice} onChange={update("fuelPrice")} suffix="€/l" hint="De gemiddelde prijs die je voor een liter benzine betaalt." step={0.01} />
          </>}
          <Field label="Overige autokosten" value={inputs.otherCarCostRate} onChange={update("otherCarCostRate")} suffix="€/km" hint="Onderhoud, verzekering en motorrijtuigenbelasting; exclusief brandstof, laadkosten, afschrijving, parkeren en tol." step={0.01} />
          <label className="checkbox-row compact-checkbox">
            <input type="checkbox" checked={inputs.includeDepreciation} onChange={(event) => setInputs((current) => ({ ...current, includeDepreciation: event.target.checked }))} />
            <span className="checkbox-box">✓</span>
            <span><strong>Afschrijving of vervangingsreserve meenemen</strong><small>Optioneel: alleen gebruiken als je hiervoor maandelijks wilt reserveren.</small></span>
          </label>
          {inputs.includeDepreciation && <Field label="Afschrijving / reserve per maand" value={inputs.depreciationMonthly} onChange={update("depreciationMonthly")} suffix="€/mnd" hint="Een eigen schatting van de maandelijkse waardedaling of het bedrag dat je reserveert voor een volgende auto." step={10} />}
          <div className="ev-rule-note">Parkeren en tol zijn niet meegenomen. Deze kosten verschillen sterk per werkgever, woonplaats en reispatroon en zouden de vergelijking anders kunnen vertekenen.</div></div>
        <div className="input-section last-section"><h3><span className="section-number">03</span> Leaseauto</h3>
          <label className="checkbox-row">
            <input type="checkbox" checked={inputs.leaseIsElectric} onChange={(event) => setInputs((current) => ({ ...current, leaseIsElectric: event.target.checked }))} />
            <span className="checkbox-box">✓</span>
            <span><strong>De leaseauto is volledig elektrisch</strong><small>Pas de indicatieve 2026-bijtelling toe op de leaseauto</small></span>
          </label>
          {inputs.leaseIsElectric && <div className="ev-rule-note">2026: 18% bijtelling tot €30.000 cataloguswaarde, 22% over het meerdere. Het verlaagde tarief geldt onder voorwaarden 60 maanden. Laadkosten van een auto van de zaak worden hier verondersteld door de werkgever vergoed en tellen niet als extra loon.</div>}
          <Field label="Cataloguswaarde leaseauto" value={inputs.carValue} onChange={update("carValue")} suffix="€" hint="De fiscale catalogusprijs inclusief btw en bpm." />
          {!inputs.leaseIsElectric && <Field label="Bijtellingspercentage" value={inputs.benefitRate} onChange={update("benefitRate")} suffix="%" hint="Het percentage van de cataloguswaarde dat als belastbaar loon wordt gezien." step={0.1} />}
          <Field label="Eigen bijdrage per maand" value={inputs.employeeContribution} onChange={update("employeeContribution")} suffix="€" hint="Je eventuele maandelijkse bijdrage voor privégebruik of de leaseauto." /></div>
        <div className="panel-footnote"><span>i</span> De leaseauto en je eigen auto hebben nu een eigen aandrijving-keuze. Zo kun je bijvoorbeeld een elektrische leaseauto vergelijken met een benzineauto privé, of andersom.</div>
      </aside>
      <div className="results-panel"><div className="results-heading"><div><span className="section-kicker">Jouw uitkomst</span><h2>Wat houd je netto over?</h2></div><span className="live-badge"><span></span> Live berekend</span></div>
        <SalarySummary result={result} />
        <ScenarioSelector selectedScenarios={selectedScenarios} onChange={toggleScenario} />
        <div className={`results-grid count-${selectedScenarios.length}`}>{selectedScenarios.map((scenario) => <ScenarioCard key={scenario} result={result} scenario={scenario} ownCarIsElectric={inputs.ownCarIsElectric} />)}</div>
        <Comparison result={result} selectedScenarios={selectedScenarios} />
        <div className="result-baseline"><span className="baseline-icon">↗</span><div><strong>Netto loon vóór mobiliteitskeuze: {money(result.salary.netMonthlyRegular)} per maand excl. vakantiegeld</strong><span>Pensioenbijdrage {money(result.salary.pensionMonthly)} per maand · gemiddeld incl. vakantiegeld {money(result.salary.netMonthlyAverage)} per maand</span></div></div><AdSlot placement="result" />
      </div>
      </div>
    </section>

    <section className="how-section shell"><div className="section-heading"><div><span className="section-kicker">Transparant rekenen</span><h2>Hoe wordt dit berekend?</h2></div><span className="formula-mark">∑</span></div>
        <div className="how-grid"><div className="how-card"><span className="how-icon teal">01</span><h3>Bruto naar netto</h3><p>De werknemersbijdrage voor pensioen wordt vóór de loonheffing verwerkt. In de uitgebreide modus berekenen we eerst de pensioengrondslag: pensioengevend loon minus AOW-franchise. Het werkgeversdeel wordt apart getoond als waarde van je arbeidsvoorwaarden.</p></div>
        <div className="how-card"><span className="how-icon teal">02</span><h3>Leaseauto</h3><p>De fiscale bijtelling wordt over de cataloguswaarde berekend. Voor een volledig elektrische auto uit 2026 gebruiken we 18% tot €30.000 en 22% over het meerdere. Werkelijke laadkosten van een auto van de zaak worden hier als werkgeverskosten gezien, niet als extra loon.</p></div>
        <div className="how-card"><span className="how-icon blue">03</span><h3>Mobiliteitsbudget</h3><p>We halen eerst de onbelaste kilometervergoeding voor zakelijke kilometers uit het budget. Alleen het resterende deel wordt als loon belast. Daarna trekken we de brandstof- of laadkosten van jouw eigen auto en overige autokosten voor alle kilometers af. Parkeren en tol blijven buiten beschouwing.</p></div>
        <div className="how-card"><span className="how-icon orange">04</span><h3>Eigen auto</h3><p>De kilometervergoeding wordt berekend over zakelijke kilometers. In 2026 is maximaal €0,23 per kilometer onbelast; die vergoeding is bedoeld als forfait voor het gebruik van je eigen vervoermiddel. Daarna trekken we brandstof- of laadkosten en overige autokosten af. Afschrijving of een vervangingsreserve is optioneel; parkeren en tol zijn niet meegenomen.</p></div></div>
      <div className="disclaimer"><span className="disclaimer-icon">!</span><div><strong>Let op: dit is een indicatie, geen financieel of fiscaal advies.</strong><p>Werkelijke bedragen kunnen afwijken door persoonlijke omstandigheden, pensioenregelingen, cao-afspraken, de precieze loonheffing en fiscale uitzonderingen. De berekening houdt geen rekening met toeslagen, eigenwoningbezit, lijfrenteaftrek of andere persoonlijke aftrekposten. Bij een privé-EV is geen aparte belastingvrije laadvergoeding bovenop de kilometervergoeding verondersteld. Bij een lease-EV veronderstellen we dat werkelijke laadkosten door de werkgever worden vergoed; de fiscale behandeling hangt af van de afspraken en de werkelijke kostprijs.</p><div className="sources">Gebaseerd op de 2026-tarieven van de <a href="https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen" target="_blank" rel="noreferrer">Belastingdienst</a> · <a href="https://centraalaanspreekpuntpensioenen.belastingdienst.nl/publicaties/overzicht-aow-inbouwbedragen-en-aow-franchises/" target="_blank" rel="noreferrer">AOW-franchise 2026</a> · <a href="https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/veranderingen-inkomstenbelasting-2026/bijtelling-privegebruik-auto-2026" target="_blank" rel="noreferrer">EV-bijtelling 2026</a> · maximale onbelaste km-vergoeding: €0,23 · standaard bijtelling: 22%</div></div></div>
    </section>
    <footer className="footer shell"><div className="brand"><span className="brand-mark">WW</span><span>Werk<span>Waarde</span></span></div><span>Een heldere indicatie voor jouw mobiliteitskeuze.</span><span className="footer-links"><a href="/privacy">Privacy</a><a href="/cookies">Cookies</a><a href="/contact">Contact</a></span></footer>
  </main>;
}
