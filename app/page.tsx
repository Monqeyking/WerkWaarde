import type { Metadata } from "next";
import CalculatorApp from "./CalculatorApp";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <CalculatorApp initialView="home" />;
}
