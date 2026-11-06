import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import MyReportsView from "@/views/public/MyReportsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("myReportsTitle"),
    description: t("myReportsDescription"),
    // Personal page behind a sign-in
    robots: { index: false },
  };
}

export default function MyReportsPage() {
  return <MyReportsView />;
}
