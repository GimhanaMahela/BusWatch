import type { ReactNode } from "react";
import { PublicLayout } from "@/components/templates";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
