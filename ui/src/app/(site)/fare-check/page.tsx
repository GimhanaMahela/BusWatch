import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FareCheckView from "@/views/public/FareCheckView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("fareTitle"), description: t("fareDescription") };
}

export default function FareCheckPage() {
  return <FareCheckView />;
}
