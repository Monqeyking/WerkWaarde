"use client";

import { useEffect, useMemo } from "react";
import { CaoSelect } from "../components/CaoSelect";
import { Field } from "../components/Field";
import { Highlight, Metrics, SpokeCalculator, SpokeTable, ToTotal, useSpokeModel, type TableRow } from "../components/Spoke";
import { updateJobSection, updatePersonal, type JobProfile } from "../../lib/job-model";
import { grossToNet } from "../../lib/spokes";
import { applyGrossPrefillFromLocation } from "../../lib/use-job-model";
import { money, moneyCents, percent } from "../../lib/format";

export default function BrutoNettoCalculator() {
  const { model, setModel, job, setJob } = useSpokeModel();
  const salary = model.jobs[job].salary;
  const result = useMemo(() => grossToNet(model, job), [model, job]);
  const set = (patch: Partial<JobProfile["salary"]>) => setModel((current) => updateJobSection(current, job, "salary", patch));

  // Opened from an amount page: fill in that salary and jump to the calculator.
  useEffect(() => {
    if (!applyGrossPrefillFromLocation()) return;
    setJob("current");
    document.getElementById("calculator")?.scrollIntoView({ block: "start" });
  }, [setJob]);

  const monthRows: TableRow[] = [
    { label: "Bruto salaris", value: money(result.grossMonthly) },
    ...(result.pensionMonthly > 0 ? [{ label: "Eigen pensioeninleg", value: money(-result.pensionMonthly) }] : []),
    { label: "Loonheffing (na heffingskortingen)", value: money(-result.regularTaxMonthly) },
    { label: "Netto in een gewone maand", value: money(result.regularNetMonthly), total: true },
  ];
  const extraRows: TableRow[] = [
    ...(result.holidayGrossAnnual > 0 ? [{ label: `Vakantiegeld (bruto ${money(result.holidayGrossAnnual)})`, value: money(result.holidayNetAnnual) }] : []),
    ...(result.yearEndGrossAnnual > 0 ? [{ label: `13e maand (bruto ${money(result.yearEndGrossAnnual)})`, value: money(result.yearEndNetAnnual) }] : []),
    ...(result.bonusGrossAnnual > 0 ? [{ label: `Bonus (bruto ${money(result.bonusGrossAnnual)})`, value: money(result.bonusNetAnnual) }] : []),
  ];

  return <SpokeCalculator job={job} onJobChange={setJob} inputsTitle="Je salaris"
    results={<>
      <Highlight label="Netto per maand" value={money(result.regularNetMonthly)}>
        In een gewone maand, zonder vakantiegeld of bonus. Gemiddeld over het jaar, alles meegeteld: {money(result.netMonthlyAverage)} per maand.
      </Highlight>
      <Metrics items={[
        { label: "Netto per jaar", value: money(result.netAnnual), note: "incl. vakantiegeld, 13e maand en bonus" },
        { label: "Netto per uur", value: moneyCents(result.netPerHour), note: `bij ${salary.hoursPerWeek} uur per week` },
        { label: "Belasting over extra's", value: percent(result.extraTaxRate), note: "vakantiegeld, 13e maand, bonus" },
        { label: "Bruto nodig voor € 100 netto", value: money(result.grossFor100Net), note: `je marginale tarief is ${percent(result.marginalRate)}` },
      ]} />
      <SpokeTable head={["Per maand", "Bedrag"]} rows={monthRows} />
      {extraRows.length > 0 && <SpokeTable head={["Extra's per jaar", "Netto"]} rows={[
        ...extraRows,
        { label: "Gemiddelde belastingdruk over je hele inkomen", value: percent(result.effectiveRate), muted: true },
      ]} />}
      <ToTotal job={job} setModel={setModel} title="Vergelijk dit salaris met een andere baan" note="Je salaris staat al in je totaaloverzicht. Vul daar ook auto, reizen en extra's in." button="Naar totaaloverzicht" />
    </>}>
    <Field label="Bruto per maand" value={salary.grossMonthly} onChange={(grossMonthly) => set({ grossMonthly })} suffix="€" hint="Je vaste bruto maandsalaris voor jouw uren, zoals op je loonstrook: niet het voltijdbedrag uit de salarisschaal. Zonder vakantiegeld. Krijg je elke maand een vaste toeslag, zoals ORT of ploegentoeslag? Tel het gemiddelde erbij op." step={50} />
    <Field label="Uren per week" value={salary.hoursPerWeek} onChange={(hoursPerWeek) => set({ hoursPerWeek })} suffix="uur" max={60} />
    <CaoSelect salary={salary} onChange={set} />
    <Field label="Vakantiegeld" value={salary.holidayAllowancePct} onChange={(holidayAllowancePct) => set({ holidayAllowancePct })} suffix="%" hint="Wettelijk minimaal 8% van je bruto salaris." step={0.1} max={20} />
    <Field label="13e maand / eindejaarsuitkering" value={salary.yearEndBonusPct} onChange={(yearEndBonusPct) => set({ yearEndBonusPct })} suffix="%" hint="Een volledige 13e maand is 8,33% van het jaarsalaris. Vul 0 in als je die niet krijgt." step={0.01} max={50} />
    <Field label="Bonus per jaar" value={salary.annualBonus} onChange={(annualBonus) => set({ annualBonus })} suffix="€" hint="Verwachte bruto bonus of winstdeling per jaar." step={100} />
    {salary.pensionMode === "monthly"
      ? <Field label="Eigen pensioeninleg" value={salary.pensionEmployeeMonthly} onChange={(pensionEmployeeMonthly) => set({ pensionEmployeeMonthly })} suffix="€/mnd" hint="De werknemersbijdrage pensioen op je loonstrook. Die gaat van je bruto af vóór de belasting. Weet je het niet? Kies hierboven je cao." />
      : <p className="choice-note">Je eigen pensioeninleg volgt uit de pensioenregeling: {money(result.pensionMonthly)} per maand. <button type="button" className="link-button" onClick={() => set({ pensionMode: "monthly", pensionEmployeeMonthly: Math.round(result.pensionMonthly) })}>Zelf invullen</button></p>}
    <Field label="Leeftijd" value={model.personal.age} onChange={(age) => setModel((current) => updatePersonal(current, { age }))} suffix="jaar" hint="Vanaf de AOW-leeftijd gelden lagere tarieven." min={16} max={100} />
  </SpokeCalculator>;
}
