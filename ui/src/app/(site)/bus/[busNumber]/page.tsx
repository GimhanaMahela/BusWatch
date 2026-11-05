import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { parseBusNumber } from "@/lib/busNumber";
import { fetchPublic, PublicDataError } from "@/lib/serverApi";
import type { BusScorecard } from "@/types/public";
import ScorecardView from "@/views/public/ScorecardView";

interface BusPageProps {
  params: Promise<{ busNumber: string }>;
}

const busFrom = async (params: BusPageProps["params"]) => {
  const raw = (await params).busNumber;
  try {
    return parseBusNumber(decodeURIComponent(raw));
  } catch {
    return "";
  }
};

const load = async (bus: string) => {
  try {
    return await fetchPublic<BusScorecard>(`/public/buses/${encodeURIComponent(bus)}`);
  } catch (error) {
    if (error instanceof PublicDataError) return null;
    throw error;
  }
};

export async function generateMetadata({ params }: BusPageProps): Promise<Metadata> {
  const bus = await busFrom(params);
  const t = await getTranslations("meta");
  const card = bus ? await load(bus) : null;
  return {
    title: t("busTitle", { bus }),
    description: t("busDescription", { bus }),
    // Empty scorecards add nothing to search results
    robots: card?.published ? undefined : { index: false },
  };
}

export default async function BusScorecardPage({ params }: BusPageProps) {
  const bus = await busFrom(params);
  if (!bus) notFound();
  return <ScorecardView kind="bus" card={await load(bus)} />;
}
