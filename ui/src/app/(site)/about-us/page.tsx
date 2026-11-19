import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutUsView from "@/views/public/AboutUsView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("aboutTitle"), description: t("aboutDescription") };
}

export default function AboutUsPage() {
  return <AboutUsView />;
}
