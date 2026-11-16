"use client";

import { useMemo } from "react";
import { Field } from "../components/Field";
import { Highlight, Metrics, SpokeCalculator, SpokeTable, ToTotal, useSpokeModel } from "../components/Spoke";
import { updateJobSection, type JobProfile } from "../../lib/job-model";
import { totalReward } from "../../lib/spokes";
import { decimal, money, moneyCents, percent } from "../../lib/format";

export default function ArbeidsvoorwaardenCalculator() {
  const { model, setModel, job, setJob } = useSpokeModel();
  const { salary, benefits } = model.jobs[job];
  const result = useMemo(() => totalReward(model, job), [model, job]);
  const setSalary = (patch: Partial<JobProfile["salary"]>) => setModel((current) => updateJobSection(current, job, "salary", patch));
  const setBenefits = (patch: Partial<JobProfile["benefits"]>) => setModel((current) => updateJobSection(current, job, "benefits", patch));

  return <SpokeCalculator job={job} onJobChange={setJob} inputsTitle="Je arbeidsvoorwaarden"
    results={<>
      <Highlight label="Totale beloning per jaar" value={money(result.totalAnnual)}>
        Bruto, inclusief alles wat je werkgever voor je betaalt. {percent(result.extrasShare)} daarvan zit buiten je vaste maandsalaris.
      </Highlight>
      <Metrics items={[
        { label: "Per uur, alles meegeteld", value: moneyCents(result.totalPerHour), note: `vast salaris: ${moneyCents(result.grossPerHour)} per uur` },
        { label: "Extra vakantiedagen", value: decimal(result.extraVacationDays), note: `wettelijk minimum: ${decimal(result.legalMinimumVacationDays)} dagen` },
      ]} />
      <SpokeTable head={["Per jaar, bruto", "Bedrag"]} rows={[
        ...result.items.filter((item) => item.key === "salary" || item.annual > 0).map((item) => ({ label: item.label, value: money(item.annual) })),
        { label: "Totale beloning", value: money(result.totalAnnual), total: true },
      ]} />
      <p className="choice-note">Een extra vakantiedag waarderen we tegen je dagloon van {money(result.dayWage)}. Een leaseauto of mobiliteitsbudget telt hier niet mee; die vergelijk je in het totaaloverzicht.</p>
      <ToTotal job={job} setModel={setModel} title="Zet deze voorwaarden naast een andere baan" note="Salaris, pensioen en extra's staan al in je totaaloverzicht." button="Naar totaaloverzicht" />
    </>}>
    <div className="two-fields">
      <Field label="Bruto per maand" value={salary.grossMonthly} onChange={(grossMonthly) => setSalary({ grossMonthly })} suffix="€" step={50} />
      <Field label="Uren per week" value={salary.hoursPerWeek} onChange={(hoursPerWeek) => setSalary({ hoursPerWeek })} suffix="uur" max={60} />
    </div>
    <div className="two-fields">
      <Field label="Vakantiegeld" value={salary.holidayAllowancePct} onChange={(holidayAllowancePct) => setSalary({ holidayAllowancePct })} suffix="%" step={0.1} max={20} />
      <Field label="13e maand" value={salary.yearEndBonusPct} onChange={(yearEndBonusPct) => setSalary({ yearEndBonusPct })} suffix="%" hint="Een volledige 13e maand is 8,33%." step={0.01} max={50} />
    </div>
    <Field label="Bonus per jaar" value={salary.annualBonus} onChange={(annualBonus) => setSalary({ annualBonus })} suffix="€" step={100} />
    {salary.pensionMode === "monthly"
      ? <Field label="Pensioenbijdrage werkgever" value={salary.pensionEmployerMonthly} onChange={(pensionEmployerMonthly) => setSalary({ pensionEmployerMonthly })} suffix="€/mnd" hint="Wat je werkgever per maand aan je pensioen betaalt. Vraag ernaar of kijk in je pensioenoverzicht." />
      : <p className="choice-note">De werkgeversbijdrage wordt berekend uit je pensioenregeling. Dit pas je aan bij lease en mobiliteit.</p>}
    <Field label="Vakantiedagen per jaar" value={benefits.vacationDays} onChange={(vacationDays) => setBenefits({ vacationDays })} suffix="dagen" hint="Bovenwettelijke dagen tellen mee als beloning. Wettelijk krijg je vier keer het aantal werkdagen per week." max={60} />
    <Field label="Opleidingsbudget per jaar" value={benefits.trainingBudgetAnnual} onChange={(trainingBudgetAnnual) => setBenefits({ trainingBudgetAnnual })} suffix="€" step={100} />
    <Field label="Overige vergoedingen per jaar" value={benefits.otherAnnual} onChange={(otherAnnual) => setBenefits({ otherAnnual })} suffix="€" hint="Bijvoorbeeld een vitaliteitsbudget, telefoon of andere vaste vergoedingen." step={100} />
  </SpokeCalculator>;
}
