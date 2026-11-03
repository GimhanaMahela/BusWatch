import type { ReactNode } from "react";
import { AdminLayout } from "@/components/templates";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
