import type { ReactNode } from "react";
import { OperatorLayout } from "@/components/templates";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <OperatorLayout>{children}</OperatorLayout>;
}
