import type { Metadata } from "next";
import { Suspense } from "react";
import StoriesView from "@/views/admin/StoriesView";

export const metadata: Metadata = { title: "Stories" };

export default function StoriesPage() {
  // ?report=<id> starts a story about that report
  return (
    <Suspense>
      <StoriesView />
    </Suspense>
  );
}
