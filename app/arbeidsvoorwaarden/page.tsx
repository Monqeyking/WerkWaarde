import type { Metadata } from "next";
import SpokePage from "../components/SpokePage";
import ArbeidsvoorwaardenCalculator from "./ArbeidsvoorwaardenCalculator";

export const metadata: Metadata = {
  title: "Arbeidsvoorwaarden berekenen: wat zijn ze waard?",
  description: "Tel je salaris, vakantiegeld, 13e maand, bonus, werkgeverspensioen, opleidingsbudget en extra vakantiedagen op tot je totale beloning per jaar en per uur.",
  alternates: { canonical: "/arbeidsvoorwaarden" },
};

const how = [
  ["Alles bruto op een rij", "Salaris, vakantiegeld, 13e maand en bonus tellen we op zoals je werkgever ze betaalt: bruto, per jaar."],
  ["Pensioen van je werkgever", "Wat je werkgever aan je pensioen bijdraagt, krijg je niet nu uitbetaald. Het is wel geld dat je werkgever voor je uitgeeft, dus het telt mee."],
  ["Extra vakantiedagen", "Je hebt recht op vier keer het aantal werkdagen per week. Elke dag daarboven waarderen we tegen je bruto dagloon."],
  ["Per uur", "De totale beloning gedeeld door je contracturen per jaar. Zo vergelijk je ook banen met verschillende uren."],
] as const;

const faqs = [
  ["Wat hoort bij je totale beloning?", "Alles wat je werkgever voor je betaalt: salaris, vakantiegeld, een 13e maand of bonus, de werkgeversbijdrage aan je pensioen, budgetten voor opleiding of vitaliteit en extra vakantiedagen."],
  ["Hoeveel vakantiedagen heb ik wettelijk?", "Minimaal vier keer het aantal dagen dat je per week werkt. Bij een volledige werkweek van vijf dagen is dat 20 dagen. Alles daarboven is bovenwettelijk."],
  ["Waarom telt pensioen mee als het niet netto is?", "Omdat je werkgever het betaalt en jij er later van profiteert. Een baan met een hoger salaris maar een veel lagere pensioenbijdrage kan in totaal minder waard zijn."],
  ["Wat houd ik netto over van deze beloning?", "Dat zie je in de bruto-nettocalculator of in het totaaloverzicht. Daar rekenen we ook reiskosten en je auto mee."],
] as const;

export default function ArbeidsvoorwaardenPage() {
  return <SpokePage kicker="Arbeidsvoorwaarden" title="Wat zijn je arbeidsvoorwaarden waard?"
    intro="Een baan is meer dan het maandsalaris. Tel vakantiegeld, bonus, pensioen van je werkgever, opleidingsbudget en extra vakantiedagen op tot je totale beloning."
    calculator={<ArbeidsvoorwaardenCalculator />} how={how} faqs={faqs} adPlacement="arbeidsvoorwaarden"
    articles={["waarde-pensioen-en-arbeidsvoorwaarden", "banen-eerlijk-vergelijken", "minder-over-van-vakantiegeld-en-bonus"]} />;
}
