// The in-app report forms (complaint, commendation, lost item): their fields, client-side checks
// and the multipart body the API takes (POST /api/reports, the same endpoint as the website).
// The server re-validates everything.
import {
  BUS_SERVICES,
  COMMENDATION_CATEGORIES,
  COMMENDEES,
  COMPLAINT_CATEGORIES,
  LOST_ITEM_CATEGORIES,
  UPLOAD_LIMITS,
  type BusService,
  type Commendee,
  type ReportCategory,
} from "../../../api/src/config/constants";
import { normalisePhone } from "../../../api/src/utils/phone";

export interface Photo {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

/** The kinds of report the app can send (road incidents stay on the website for now) */
export const APP_REPORT_TYPES = ["complaint", "commendation", "lost_item"] as const;
export type AppReportType = (typeof APP_REPORT_TYPES)[number];

export const isAppReportType = (value: unknown): value is AppReportType =>
  typeof value === "string" && (APP_REPORT_TYPES as readonly string[]).includes(value);

export interface ReportDraft {
  type: AppReportType;
  /** "qr" when the form was opened by scanning the sticker inside the bus */
  source: "app" | "qr";
  /** Who a commendation thanks */
  commendee: Commendee | "";
  busNumber: string;
  routeNumber: string;
  busService: BusService | "";
  category: ReportCategory | "";
  location: string;
  latitude?: number;
  longitude?: number;
  description: string;
  email: string;
  phone: string;
  photos: Photo[];
}

export const emptyDraft = (type: AppReportType = "complaint"): ReportDraft => ({
  type,
  source: "app",
  commendee: "",
  busNumber: "",
  routeNumber: "",
  busService: "",
  category: "",
  location: "",
  description: "",
  email: "",
  phone: "",
  photos: [],
});

export { BUS_SERVICES, COMMENDEES };

/** Accessibility complaints need a checklist the app doesn't have yet; they stay on the website. */
export const APP_COMPLAINT_CATEGORIES: readonly ReportCategory[] = COMPLAINT_CATEGORIES.filter(
  (category) => category !== "accessibility",
);

export const CATEGORIES_FOR: Record<AppReportType, readonly ReportCategory[]> = {
  complaint: APP_COMPLAINT_CATEGORIES,
  commendation: COMMENDATION_CATEGORIES,
  lost_item: LOST_ITEM_CATEGORIES,
};

export const MAX_DESCRIPTION = 5000;
export const MAX_PHOTOS = UPLOAD_LIMITS.maxImages;
export const MAX_PHOTO_BYTES = UPLOAD_LIMITS.maxFileBytes;

/** Field → message key, for the fields that need fixing */
export type DraftErrors = Partial<Record<keyof ReportDraft, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The API's rules per type (api/src/validators/report.validator.ts), as message keys */
export const validateDraft = (draft: ReportDraft): DraftErrors => {
  const errors: DraftErrors = {};
  const complaint = draft.type === "complaint";
  if (!draft.busNumber.trim()) errors.busNumber = "app.required";
  if (!draft.routeNumber.trim()) errors.routeNumber = "app.required";
  if (complaint && !draft.busService) errors.busService = "submit.chooseBusService";
  if (!draft.category) {
    errors.category =
      draft.type === "commendation"
        ? "commend.chooseCategory"
        : draft.type === "lost_item"
          ? "lost.chooseCategory"
          : "submit.chooseCategory";
  }
  if (draft.type === "commendation" && !draft.commendee) errors.commendee = "commend.chooseWho";
  if (complaint && !draft.location.trim()) errors.location = "app.required";
  if (!draft.description.trim()) errors.description = "app.required";
  if (draft.email.trim() && !EMAIL.test(draft.email.trim())) errors.email = "app.emailInvalid";
  if (draft.phone.trim() && !normalisePhone(draft.phone)) errors.phone = "submit.phoneInvalid";
  // Someone has to be able to tell the passenger their bag was found
  if (draft.type === "lost_item" && !draft.email.trim() && !draft.phone.trim()) {
    errors.email = "lost.contactRequired";
  }
  return errors;
};

/**
 * The multipart body for POST /api/reports. React Native's FormData takes { uri, name, type }
 * objects for files and streams them from disk.
 */
export const toFormData = (
  draft: ReportDraft,
  language: string,
  turnstileToken: string | null,
): FormData => {
  const form = new FormData();
  const fields: Record<string, string | undefined> = {
    type: draft.type,
    source: draft.source,
    language,
    busNumber: draft.busNumber.trim().toUpperCase(),
    routeNumber: draft.routeNumber.trim(),
    busService: draft.busService,
    category: draft.category,
    location: draft.location.trim(),
    description: draft.description.trim(),
    passengerEmail: draft.email.trim(),
    passengerPhone: draft.phone.trim(),
    latitude: draft.latitude?.toString(),
    longitude: draft.longitude?.toString(),
    details:
      draft.type === "commendation" && draft.commendee
        ? JSON.stringify({ commendee: draft.commendee })
        : undefined,
    "cf-turnstile-response": turnstileToken ?? undefined,
  };
  for (const [name, value] of Object.entries(fields)) {
    if (value) form.append(name, value);
  }
  for (const photo of draft.photos) {
    // RN's FormData file shape; the DOM typings only know Blob
    form.append("images", {
      uri: photo.uri,
      name: photo.name,
      type: photo.mimeType,
    } as unknown as Blob);
  }
  return form;
};
