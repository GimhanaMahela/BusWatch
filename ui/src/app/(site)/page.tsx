import { fetchPublic, PublicDataError } from "@/lib/serverApi";
import type { PublicImpact } from "@/types/public";
import HomeView from "@/views/public/HomeView";

/** The home page's figures tile uses the Impact page's cached totals (refreshed every 5 minutes). */
export default async function HomePage() {
  let impact: PublicImpact | null = null;
  try {
    impact = await fetchPublic<PublicImpact>("/public/stats");
  } catch (error) {
    if (!(error instanceof PublicDataError)) throw error;
  }
  return <HomeView impact={impact} />;
}
