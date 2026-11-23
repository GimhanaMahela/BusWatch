import { useLocalSearchParams } from "expo-router";

import { ScorecardView } from "@/components/ScorecardView";
import { parseRoute } from "@/lib/qr";

export default function RouteScorecardScreen() {
  const { routeNumber } = useLocalSearchParams<{ routeNumber: string }>();
  return <ScorecardView kind="route" id={parseRoute(routeNumber)} />;
}
