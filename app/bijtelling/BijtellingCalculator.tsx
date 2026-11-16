"use client";

import { useMemo } from "react";
import { Field } from "../components/Field";
import { Checkbox, Highlight, Metrics, SpokeCalculator, SpokeTable, ToTotal, useSpokeModel } from "../components/Spoke";
import { updateJobSection, type JobProfile } from "../../lib/job-model";
import { leaseCost } from "../../lib/spokes";
import { electricBijtellingText, standardBijtellingText } from "../../lib/tax-years";
import { money, percent } from "../../lib/format";

export default function BijtellingCalculator() {
  const { model, setModel, job, setJob } = useSpokeModel();
  const { lease } = model.jobs[job].mobility;
  const salary = model.jobs[job].salary;
  const result = useMemo(() => leaseCost(model, job), [model, job]);
  const setLease = (patch: Partial<JobProfile["mobility"]["lease"]>) =>
    setModel((current) => updateJobSection(current, job, "mobility", { lease: { ...current.jobs[job].mobility.lease, ...patch } }));
  const setSalary = (grossMonthly: number) => setModel((current) => updateJobSection(current, job, "salary", { grossMonthly }));

  return <SpokeCalculator job={job} onJobChange={setJob} inputsTitle="Je leaseauto"
    results={<>
      <Highlight label="Wat de leaseauto je netto kost" value={`${money(result.netCostMonthly)} per maand`}>
        Belasting over de bijtelling plus je eigen bijdrage. Per jaar is dat {money(result.netCostAnnual)}.
      </Highlight>
      <Metrics items={[
        { label: "Bijtelling per jaar", value: money(result.annualBenefit), note: `${percent(result.benefitRate)} van de cataloguswaarde` },
        { label: "Je marginale tarief", value: percent(result.marginalRate), note: "zoveel belasting betaal je over de bijtelling" },
      ]} />
      <SpokeTable head={["Per maand", "Bedrag"]} rows={[
        { label: "Bijtelling", value: money(result.annualBenefit / 12) },
        ...(result.contributionMonthly > 0 ? [{ label: "Min eigen bijdrage", value: money(-result.contributionMonthly) }] : []),
        { label: "Belastbaar voordeel", value: money(result.taxableBenefitMonthly), muted: true },
        { label: "Extra belasting", value: money(result.taxMonthly) },
        ...(result.contributionMonthly > 0 ? [{ label: "Eigen bijdrage", value: money(result.contributionMonthly) }] : []),
        { label: "Netto kosten leaseauto", value: money(result.netCostMonthly), total: true },
      ]} />
      <ToTotal job={job} setModel={setModel} title="Neem deze leaseauto mee in je vergelijking" note="We zetten de mobiliteitskeuze voor deze baan op leaseauto." button="Leaseauto naar totaal"
        apply={(current) => updateJobSection(current, job, "mobility", { choice: "lease" })} />
    </>}>
    <Field label="Cataloguswaarde" value={lease.catalogValue} onChange={(catalogValue) => setLease({ catalogValue })} suffix="€" hint="De fiscale catalogusprijs inclusief btw en bpm. Die staat in de leaseofferte of op de site van de RDW." step={500} />
    <Checkbox checked={lease.isElectric} onChange={(isElectric) => setLease({ isElectric })} label="Volledig elektrisch" small={`${model.personal.taxYear}: ${electricBijtellingText(model.personal.taxYear)}`} />
    {!lease.isElectric && <Field label="Bijtelling" value={lease.benefitRatePct} onChange={(benefitRatePct) => setLease({ benefitRatePct })} suffix="%" hint={`Standaard ${standardBijtellingText(model.personal.taxYear)} in ${model.personal.taxYear}. Voor oudere auto's kan een ander percentage gelden; dat staat op je loonstrook of in de offerte.`} step={0.1} max={35} />}
    <Field label="Eigen bijdrage" value={lease.employeeContributionMonthly} onChange={(employeeContributionMonthly) => setLease({ employeeContributionMonthly })} suffix="€/mnd" hint="Wat je zelf per maand betaalt voor privégebruik. Dit gaat van de bijtelling af." />
    <Field label="Bruto salaris per maand" value={salary.grossMonthly} onChange={setSalary} suffix="€" hint="Nodig om je belastingtarief te bepalen. Vakantiegeld en bonus uit je profiel tellen ook mee." step={50} />
  </SpokeCalculator>;
}
