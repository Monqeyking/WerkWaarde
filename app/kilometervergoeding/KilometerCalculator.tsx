"use client";

import { useMemo } from "react";
import { Field } from "../components/Field";
import { Checkbox, Highlight, Metrics, SpokeCalculator, SpokeTable, ToTotal, useSpokeModel } from "../components/Spoke";
import { updateJobSection, updatePersonal, type JobProfile, type PersonalSettings } from "../../lib/job-model";
import { kmAllowance } from "../../lib/spokes";
import { money, moneyCents, signedMoney } from "../../lib/format";

const km = (value: number) => `${Math.round(value).toLocaleString("nl-NL")} km`;

export default function KilometerCalculator() {
  const { model, setModel, job, setJob } = useSpokeModel();
  const { commute, mobility } = model.jobs[job];
  const { car } = model.personal;
  const result = useMemo(() => kmAllowance(model, job), [model, job]);
  const setCommute = (patch: Partial<JobProfile["commute"]>) => setModel((current) => updateJobSection(current, job, "commute", patch));
  const setMobility = (patch: Partial<JobProfile["mobility"]>) => setModel((current) => updateJobSection(current, job, "mobility", patch));
  const setCar = (patch: Partial<PersonalSettings["car"]>) => setModel((current) => updatePersonal(current, { car: { ...current.personal.car, ...patch } }));
  const covers = result.netAnnual >= 0;

  return <SpokeCalculator job={job} onJobChange={setJob} inputsTitle="Je ritten en auto"
    results={<>
      <Highlight label={covers ? "Je houdt over aan je vergoeding" : "Je legt toe op je vergoeding"} value={`${signedMoney(result.netMonthly)} per maand`}>
        Vergoeding na belasting, min de brandstof- en andere kosten van deze kilometers. Per jaar: {signedMoney(result.netAnnual)}.
      </Highlight>
      <Metrics items={[
        { label: "Zakelijke km per jaar", value: km(result.kmAnnual), note: `${km(result.commuteKmAnnual)} woon-werk` },
        { label: "Je auto kost per km", value: moneyCents(result.costPerKm), note: "brandstof of laden plus overige kosten" },
        { label: "Kostendekkende vergoeding", value: `${moneyCents(result.breakEvenRate)} per km`, note: "hierbij speel je precies quitte" },
        { label: "Belast deel", value: result.taxableAnnual > 0 ? money(result.taxableAnnual) : "€ 0", note: "boven € 0,25 per km" },
      ]} />
      <SpokeTable head={["Per jaar", "Bedrag"]} rows={[
        { label: `Vergoeding (${km(result.kmAnnual)} × ${moneyCents(result.ratePerKm)})`, value: money(result.reimbursementAnnual) },
        { label: "Waarvan onbelast", value: money(result.taxFreeAnnual), muted: true },
        ...(result.taxAnnual > 0 ? [{ label: "Belasting over het deel boven € 0,25", value: money(-result.taxAnnual) }] : []),
        { label: "Kosten van deze kilometers", value: money(-result.costAnnual) },
        { label: "Saldo", value: signedMoney(result.netAnnual), total: true },
      ]} />
      <p className="choice-note">Afschrijving, parkeren en tol tellen hier niet mee. Een auto die je speciaal voor werk aanhoudt, kost dus meer dan dit bedrag.</p>
      <ToTotal job={job} setModel={setModel} title="Reken met je eigen auto in je vergelijking" note="We zetten de mobiliteitskeuze voor deze baan op eigen auto met kilometervergoeding." button="Eigen auto naar totaal"
        apply={(current) => updateJobSection(current, job, "mobility", { choice: "ownCar" })} />
    </>}>
    <div className="two-fields">
      <Field label="Kantoordagen per week" value={commute.officeDaysPerWeek} onChange={(officeDaysPerWeek) => setCommute({ officeDaysPerWeek })} suffix="dagen" step={0.5} max={7} />
      <Field label="Woon-werk enkele reis" value={commute.oneWayKm} onChange={(oneWayKm) => setCommute({ oneWayKm })} suffix="km" />
    </div>
    <Field label="Overige zakelijke km per jaar" value={mobility.extraBusinessKmPerYear} onChange={(extraBusinessKmPerYear) => setMobility({ extraBusinessKmPerYear })} suffix="km" hint="Ritten naar klanten of andere vestigingen, bovenop woon-werk." step={500} />
    <Field label="Kilometervergoeding" value={mobility.reimbursementPerKm} onChange={(reimbursementPerKm) => setMobility({ reimbursementPerKm })} suffix="€/km" hint="Wat je werkgever per km betaalt. In 2026 is maximaal € 0,25 per km onbelast." step={0.01} />
    <Checkbox checked={car.isElectric} onChange={(isElectric) => setCar({ isElectric })} label="Mijn auto is elektrisch" />
    {car.isElectric ? <div className="two-fields">
      <Field label="Verbruik" value={car.electricConsumption} onChange={(electricConsumption) => setCar({ electricConsumption })} suffix="kWh/100" step={0.5} />
      <Field label="Stroomprijs" value={car.electricityPrice} onChange={(electricityPrice) => setCar({ electricityPrice })} suffix="€/kWh" step={0.01} />
    </div> : <div className="two-fields">
      <Field label="Verbruik" value={car.fuelConsumption} onChange={(fuelConsumption) => setCar({ fuelConsumption })} suffix="l/100" step={0.1} />
      <Field label="Brandstofprijs" value={car.fuelPrice} onChange={(fuelPrice) => setCar({ fuelPrice })} suffix="€/l" step={0.01} />
    </div>}
    <Field label="Overige autokosten" value={car.otherCostPerKm} onChange={(otherCostPerKm) => setCar({ otherCostPerKm })} suffix="€/km" hint="Onderhoud, banden, verzekering en wegenbelasting per km. Zonder brandstof en afschrijving." step={0.01} />
    <small className="km-total">Werkweken per jaar: {model.personal.workWeeksPerYear}. Dit pas je aan in het totaaloverzicht.</small>
  </SpokeCalculator>;
}
