import type { Metadata } from "next";
import SpokePage from "../components/SpokePage";
import AmountLinks from "./AmountLinks";
import BrutoNettoCalculator from "./BrutoNettoCalculator";

export const metadata: Metadata = {
  title: "Bruto netto berekenen 2026: wat houd je over?",
  description: "Reken je bruto salaris om naar netto per maand en per jaar, inclusief vakantiegeld, 13e maand, bonus en pensioeninleg. Met de tarieven van 2026.",
  alternates: { canonical: "/bruto-netto" },
};

const how = [
  ["Pensioen eerst", "Je eigen pensioeninleg gaat van je bruto salaris af voordat er belasting wordt berekend. Over dat deel betaal je dus geen loonheffing."],
  ["Belasting per jaar", "Over je jaarinkomen rekenen we de schijven van box 1 voor 2026. Daarna gaan de algemene heffingskorting en de arbeidskorting eraf. Die worden lager naarmate je meer verdient."],
  ["Extra's apart", "Vakantiegeld, een 13e maand en een bonus komen bovenop je salaris. Daarover betaal je je hoogste tarief, inclusief de afbouw van de heffingskortingen."],
  ["Netto per uur", "Je netto maandloon gedeeld door je contracturen. In het totaaloverzicht rekenen we ook je reistijd mee."],
] as const;

const faqs = [
  ["Waarom is mijn netto loon op mijn loonstrook anders?", "Je werkgever houdt loonheffing in met tabellen per maand, en er kunnen andere inhoudingen op je loonstrook staan. Deze calculator rekent met de jaartarieven en geeft daarom een indicatie."],
  ["Hoeveel belasting betaal ik over mijn vakantiegeld?", "Vakantiegeld wordt belast tegen je hoogste tarief. Bij een middeninkomen is dat inclusief de afbouw van de heffingskortingen vaak rond de 50%. De calculator laat zien welk percentage voor jou geldt."],
  ["Wat is het marginale tarief?", "Het deel van een extra euro dat naar de belasting gaat. Het is vaak hoger dan het schijftarief, omdat de heffingskortingen afnemen als je meer verdient."],
  ["Telt een leaseauto mee in deze berekening?", "Nee, hier zie je alleen je salaris. Bereken de kosten van een leaseauto met de bijtellingscalculator, of zet alles samen in het totaaloverzicht."],
] as const;

export default function BrutoNettoPage() {
  return <SpokePage kicker="Bruto naar netto" title="Wat houd je netto over van je salaris?"
    intro="Reken je bruto maandsalaris om naar netto, met vakantiegeld, 13e maand, bonus en pensioeninleg. Je ziet ook hoeveel bruto er nodig is voor € 100 netto meer."
    calculator={<BrutoNettoCalculator />} how={how} faqs={faqs} adPlacement="bruto-netto" extra={<AmountLinks />}
    articles={["bruto-naar-netto", "minder-over-van-vakantiegeld-en-bonus", "bruto-voor-100-euro-netto-meer"]} />;
}
