import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import LostItemView from "@/views/public/LostItemView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("lostTitle"), description: t("lostDescription") };
}

export default function LostSomethingPage() {
  // ?bus=&route= pre-fill the bus
  return (
    <Suspense>
      <LostItemView />
    </Suspense>
  );
}
