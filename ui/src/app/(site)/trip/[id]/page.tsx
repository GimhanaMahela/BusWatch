import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TripView from "@/views/public/TripView";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  // A private link: never in search results
  return { title: t("tripTitle"), robots: { index: false, follow: false } };
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  return <TripView id={id} />;
}
