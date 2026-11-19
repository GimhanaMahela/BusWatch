import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import SafetyView from "@/views/public/SafetyView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("safetyTitle"), description: t("safetyDescription") };
}

export default function SafetyPage() {
  // ?bus=&route= pre-fill the bus (e.g. from the QR sticker)
  return (
    <Suspense>
      <SafetyView />
    </Suspense>
  );
}
