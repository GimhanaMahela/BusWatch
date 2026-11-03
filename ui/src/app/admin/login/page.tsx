import type { Metadata } from "next";
import { Suspense } from "react";
import AdminLoginView from "@/views/admin/AdminLoginView";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  // The view reads ?next= from the URL, which is only known in the browser
  return (
    <Suspense>
      <AdminLoginView />
    </Suspense>
  );
}
