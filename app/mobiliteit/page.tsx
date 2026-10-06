import type { Metadata } from "next";
import CalculatorApp from "../CalculatorApp";

export const metadata: Metadata = {
  title: "Leaseauto of mobiliteitsbudget vergelijken | WerkWaarde",
  description: "Vergelijk de indicatieve netto waarde van een leaseauto, mobiliteitsbudget of eigen auto met kilometervergoeding.",
};

export default function MobilityPage() {
  return <CalculatorApp initialView="mobility" />;
}
