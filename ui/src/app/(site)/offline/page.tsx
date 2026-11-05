import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import OfflineView from "@/views/public/OfflineView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("offlineTitle"), robots: { index: false } };
}

export default function OfflinePage() {
  return <OfflineView />;
}
