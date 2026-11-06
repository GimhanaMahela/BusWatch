"use client";

import { useEffect } from "react";
import { trackEvent, type MetricEvent } from "@/api/metricsApi";

/** Counts one anonymous page view for the success metrics (lets server pages report views). */
function PageViewEvent({ event }: { event: MetricEvent }) {
  useEffect(() => trackEvent(event), [event]);
  return null;
}

export default PageViewEvent;
