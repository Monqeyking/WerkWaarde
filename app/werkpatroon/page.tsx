import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import CalculatorApp from "../CalculatorApp";

export const metadata: Metadata = pageMetadata({
  path: "/werkpatroon",
  title: "Kosten van vaker naar kantoor berekenen",
  description: "Vergelijk salaris, reistijd, woon-werkkilometers, autokosten, opvang en dagelijkse werkkosten tussen twee werkpatronen.",
});

export default function WorkPatternPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Wat kost vaker naar kantoor?", "/werkpatroon"]])} /><CalculatorApp initialView="work" /></>;
}
