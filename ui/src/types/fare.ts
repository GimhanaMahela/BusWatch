import type { ServiceClass } from "@/constants/reportConstants";
import type { FareEvidence } from "@/types/report";

// Fare checker. Keep in sync with api/src/controllers/fare.controller.ts.

export interface FareStop {
  name: string;
  /** The NTC fare stage this halt is in */
  stage: number;
}

/** A route in the fare checker's list (no stops yet) */
export interface FareRouteSummary {
  id: string;
  routeNumber: string;
  name: string;
  serviceClasses: ServiceClass[];
  stopCount: number;
}

export interface FareRoute extends Omit<FareRouteSummary, "stopCount"> {
  stops: FareStop[];
}

export interface FareCheckResult extends FareEvidence {
  /** Rupees above the official fare (0 when the passenger paid the right fare or less) */
  overchargedBy: number;
}

/** What the passenger chose, sent with an overcharging complaint */
export interface FareSelection {
  routeId: string;
  from: number;
  to: number;
  serviceClass: ServiceClass;
  charged?: number;
}

export interface FareTable {
  serviceClass: ServiceClass;
  /** fares[0] is one stage (the minimum fare), fares[1] two stages, … */
  fares: number[];
  effectiveFrom: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export interface FareAdminOverview {
  tables: FareTable[];
  routes: (FareRouteSummary & { updatedAt: string })[];
}

export interface FareRouteInput {
  routeNumber: string;
  name: string;
  serviceClasses: ServiceClass[];
  stops: FareStop[];
}
