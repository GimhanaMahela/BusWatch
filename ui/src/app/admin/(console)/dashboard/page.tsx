import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboardView from "@/views/admin/AdminDashboardView";

export const metadata: Metadata = { title: "Reports" };

export default function AdminDashboardPage() {
  // Filters live in the query string, which is only known in the browser
  return (
    <Suspense>
      <AdminDashboardView />
    </Suspense>
  );
}
