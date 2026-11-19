import type { Metadata } from "next";
import { Suspense } from "react";
import QrStickersView from "@/views/admin/QrStickersView";

export const metadata: Metadata = { title: "QR stickers" };

export default function QrStickersPage() {
  // ?bus=NB-1234 pre-fills the sheet (from a report's "Print QR sticker" button)
  return (
    <Suspense>
      <QrStickersView />
    </Suspense>
  );
}
