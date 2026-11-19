import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Operator portal", template: "%s · BusWatch Operator portal" },
  robots: { index: false, follow: false },
};

export default function OperatorRootLayout({ children }: { children: ReactNode }) {
  return children;
}
