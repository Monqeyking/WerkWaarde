import type { Metadata } from "next";
import JsonLd from "../components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import CalculatorApp from "../CalculatorApp";

export const metadata: Metadata = pageMetadata({
  path: "/mobiliteit",
  title: "Leaseauto of mobiliteitsbudget vergelijken",
  description: "Vergelijk de indicatieve netto waarde van een leaseauto, mobiliteitsbudget of eigen auto met kilometervergoeding.",
});

export default function MobilityPage() {
  return <><JsonLd data={breadcrumbJsonLd([["Leaseauto of mobiliteitsbudget", "/mobiliteit"]])} /><CalculatorApp initialView="mobility" /></>;
}
