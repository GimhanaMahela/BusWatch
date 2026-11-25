import type {
  AccidentInvolvement,
  InjuryLevel,
  RoadHazard,
  VehicleKind,
} from "@/constants/reportConstants";
import type { ReportDetailsInput } from "@/types/report";

/** What the report is about: a public transport bus, another vehicle, or the road itself. */
export type ReportSubject = "bus" | "vehicle" | "road";

export const REPORT_SUBJECTS: readonly ReportSubject[] = ["bus", "vehicle", "road"];

export const parseSubject = (value: string | null): ReportSubject | "" =>
  REPORT_SUBJECTS.includes(value as ReportSubject) ? (value as ReportSubject) : "";

/** The road incident fields of the report form */
export interface RoadFields {
  category: string;
  vehicleKind: VehicleKind | "";
  plate: string;
  colour: string;
  make: string;
  involvement: AccidentInvolvement | "";
  injuries: InjuryLevel | "";
  vehiclesInvolved: string;
  /** The main problem with the road: the first one ticked */
  hazard: RoadHazard | "";
  /** The other problems ticked, in order */
  extraHazards: RoadHazard[];
}

/**
 * What the API stores for a road incident: the vehicle (not for the road itself), the accident,
 * or what is wrong with the road.
 */
export const roadDetails = (subject: ReportSubject, form: RoadFields): ReportDetailsInput => ({
  road: {
    ...(subject === "vehicle" &&
      form.vehicleKind && {
        vehicle: {
          kind: form.vehicleKind,
          plate: form.plate,
          colour: form.colour,
          make: form.make,
        },
      }),
    ...(subject === "vehicle" &&
      form.category === "accident" &&
      form.involvement && {
        accident: {
          involvement: form.involvement,
          injuries: form.injuries || "unknown",
          vehiclesInvolved: form.vehiclesInvolved ? Number(form.vehiclesInvolved) : null,
        },
      }),
    ...(subject === "road" &&
      form.hazard && {
        hazard: form.hazard,
        ...(form.extraHazards.length > 0 && { extraHazards: form.extraHazards }),
      }),
  },
});
