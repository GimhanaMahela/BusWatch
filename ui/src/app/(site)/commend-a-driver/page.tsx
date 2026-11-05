import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import CommendDriverView from "@/views/public/CommendDriverView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("commendTitle"), description: t("commendDescription") };
}

export default function CommendDriverPage() {
  // The form reads ?bus=&route=&src=qr from the QR sticker link
  return (
    <Suspense>
      <CommendDriverView />
    </Suspense>
  );
}
