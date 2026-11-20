import { useLocalSearchParams } from "expo-router";

import { ScorecardView } from "@/components/ScorecardView";
import { parseBusNumber } from "@/lib/qr";

export default function BusScorecardScreen() {
  const { busNumber } = useLocalSearchParams<{ busNumber: string }>();
  return <ScorecardView kind="bus" id={parseBusNumber(busNumber)} />;
}
