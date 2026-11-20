import { OG_SIZE, renderOgCard } from "@/lib/ogImage";

export const alt = "TransitX: report and track bus and road incidents in Sri Lanka";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Default share preview for every page without its own. */
export default function OpengraphImage() {
  return renderOgCard({
    eyebrow: "Passenger reporting for Sri Lanka",
    title: "Every journey deserves a safe ride.",
    subtitle: "Report incidents, commend good service and track what happens next.",
  });
}
