import type { Metadata } from "next";
import CalculatorApp from "../CalculatorApp";

export const metadata: Metadata = {
  title: "Kosten van vaker naar kantoor berekenen",
  description: "Vergelijk salaris, reistijd, woon-werkkilometers, autokosten, opvang en dagelijkse werkkosten tussen twee werkpatronen.",
  alternates: { canonical: "/werkpatroon" },
};

export default function WorkPatternPage() {
  return <CalculatorApp initialView="work" />;
}
