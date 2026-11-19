import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { parseRoute } from "@/lib/busNumber";
import { fetchPublic, PublicDataError } from "@/lib/serverApi";
import type { RouteScorecard } from "@/types/public";
import ScorecardView from "@/views/public/ScorecardView";

interface RoutePageProps {
  params: Promise<{ routeNumber: string }>;
}

const routeFrom = async (params: RoutePageProps["params"]) => {
  const raw = (await params).routeNumber;
  try {
    return parseRoute(decodeURIComponent(raw));
  } catch {
    return "";
  }
};

const load = async (route: string) => {
  try {
    return await fetchPublic<RouteScorecard>(`/public/routes/${encodeURIComponent(route)}`);
  } catch (error) {
    if (error instanceof PublicDataError) return null;
    throw error;
  }
};

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  const route = await routeFrom(params);
  const t = await getTranslations("meta");
  const card = route ? await load(route) : null;
  return {
    title: t("routeTitle", { route }),
    description: t("routeDescription", { route }),
    robots: card?.published ? undefined : { index: false },
  };
}

export default async function RouteScorecardPage({ params }: RoutePageProps) {
  const route = await routeFrom(params);
  if (!route) notFound();
  return <ScorecardView kind="route" card={await load(route)} />;
}
