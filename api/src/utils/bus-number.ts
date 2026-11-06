import { sql } from "drizzle-orm";
import { reports } from "../db/schema.js";

/** "NB-1234", "nb 1234" and "NB1234" are the same bus. */
export const normaliseBusNumber = (busNumber: string) =>
  busNumber.toUpperCase().replace(/[^\p{L}\p{N}]/gu, "");

/** The same normalisation in SQL, for reports.bus_number. */
export const normalisedReportBus = sql`regexp_replace(upper(${reports.busNumber}), '[^[:alnum:]]', '', 'g')`;
