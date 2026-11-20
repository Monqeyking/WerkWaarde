import type { Metadata } from "next";
import EmbedCta from "../components/EmbedCta";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import SpokePage from "../components/SpokePage";
import AmountLinks from "./AmountLinks";
import BrutoNettoCalculator from "./BrutoNettoCalculator";

export const metadata: Metadata = pageMetadata({
  path: "/bruto-netto",
  title: "Bruto netto berekenen 2026: wat houd je over?",
  description: "Reken je bruto salaris om naar netto per maand en per jaar, met vakantiegeld, 13e maand, bonus en pensioen. Tarieven 2026.",
});

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
  ["Ik krijg ORT of ploegentoeslag. Hoe reken ik dat mee?", "Tel het gemiddelde dat je per maand krijgt op bij je bruto maandsalaris. Over een toeslag voor onregelmatige diensten betaal je gewoon loonheffing. In de zorg bouw je er bij PFZW ook pensioen over op. Wisselt het sterk per maand? Neem het gemiddelde van de laatste drie tot zes loonstroken."],
  ["Kan ik dit gebruiken als zzp'er of met een tweede baan?", "Nettoplaatje rekent voor werknemers in loondienst. Als zzp'er betaal je inkomstenbelasting via je aangifte, met andere aftrekposten. Bij een tweede baan past de tweede werkgever meestal geen loonheffingskorting toe: daar houd je per maand dus minder netto over dan deze calculator laat zien. Over het hele jaar telt de belasting over al je loon samen."],
  ["Hoe werkt de 30%-regeling (expatregeling)?", "Werknemers die uit het buitenland zijn aangenomen, kunnen van de Belastingdienst de expatregeling krijgen. Je werkgever mag dan in 2026 tot 30% van je loon onbelast uitbetalen; vanaf 2027 wordt dat 27%. Je belaste loon moet wel boven de salarisnorm blijven (€ 48.013 in 2026, € 36.497 als je jonger bent dan 30 en een master hebt), en de vrije vergoeding is maximaal € 78.600 per jaar. Kies de regeling in de calculator, dan zie je wat je netto overhoudt."],
  ["Telt een leaseauto mee in deze berekening?", "Nee, hier zie je alleen je salaris. Bereken de kosten van een leaseauto met de bijtellingscalculator, of zet alles samen in het totaaloverzicht."],
] as const;

export default function BrutoNettoPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Bruto naar netto", "/bruto-netto"]])} /><SpokePage kicker="Bruto naar netto" title="Wat houd je netto over van je salaris?"
    intro="Reken je bruto maandsalaris om naar netto, met vakantiegeld, 13e maand, bonus en pensioeninleg. Voor werknemers in loondienst. Je ziet ook hoeveel bruto er nodig is voor € 100 netto meer."
    calculator={<><BrutoNettoCalculator /><EmbedCta /></>} how={how} faqs={faqs} adPlacement="bruto-netto" extra={<AmountLinks />}
    articles={["bruto-naar-netto", "minder-over-van-vakantiegeld-en-bonus", "bruto-voor-100-euro-netto-meer"]} /></>;
}
