import type { Metadata } from "next";
import AboutUsView from "@/views/public/AboutUsView";

export const metadata: Metadata = {
  title: "About us",
  description: "Why BusWatch exists and how passenger reports turn into better public transport.",
};

export default function AboutUsPage() {
  return <AboutUsView />;
}
