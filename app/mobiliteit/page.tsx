import type { Metadata } from "next";
import CalculatorApp from "../CalculatorApp";

export const metadata: Metadata = {
  title: "Leaseauto of mobiliteitsbudget vergelijken",
  description: "Vergelijk de indicatieve netto waarde van een leaseauto, mobiliteitsbudget of eigen auto met kilometervergoeding.",
  alternates: { canonical: "/mobiliteit" },
};

export default function MobilityPage() {
  return <CalculatorApp initialView="mobility" />;
}
