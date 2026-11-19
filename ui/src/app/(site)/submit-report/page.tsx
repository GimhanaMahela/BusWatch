import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import SubmitReportView from "@/views/public/SubmitReportView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("submitTitle"), description: t("submitDescription") };
}

export default function SubmitReportPage() {
  // The form reads ?bus=&route=&src=qr from the QR sticker link
  return (
    <Suspense>
      <SubmitReportView />
    </Suspense>
  );
}
