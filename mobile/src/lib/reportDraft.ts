// The in-app complaint form: its fields, client-side checks and the multipart body the API takes
// (POST /api/reports, the same endpoint as the website). The server re-validates everything.
import {
  BUS_SERVICES,
  COMPLAINT_CATEGORIES,
  UPLOAD_LIMITS,
  type BusService,
  type ReportCategory,
} from "../../../api/src/config/constants";
import { normalisePhone } from "../../../api/src/utils/phone";

export interface Photo {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface ReportDraft {
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

export const emptyDraft = (): ReportDraft => ({
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

export { BUS_SERVICES };

/** Accessibility complaints need a checklist the app doesn't have yet; they stay on the website. */
export const APP_COMPLAINT_CATEGORIES: readonly ReportCategory[] = COMPLAINT_CATEGORIES.filter(
  (category) => category !== "accessibility",
);

export const MAX_DESCRIPTION = 5000;
export const MAX_PHOTOS = UPLOAD_LIMITS.maxImages;
export const MAX_PHOTO_BYTES = UPLOAD_LIMITS.maxFileBytes;

/** Field → message key, for the fields that need fixing */
export type DraftErrors = Partial<Record<keyof ReportDraft, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateDraft = (draft: ReportDraft): DraftErrors => {
  const errors: DraftErrors = {};
  if (!draft.busNumber.trim()) errors.busNumber = "app.required";
  if (!draft.routeNumber.trim()) errors.routeNumber = "app.required";
  if (!draft.busService) errors.busService = "submit.chooseBusService";
  if (!draft.category) errors.category = "submit.chooseCategory";
  if (!draft.location.trim()) errors.location = "app.required";
  if (!draft.description.trim()) errors.description = "app.required";
  if (draft.email.trim() && !EMAIL.test(draft.email.trim())) errors.email = "app.emailInvalid";
  if (draft.phone.trim() && !normalisePhone(draft.phone)) errors.phone = "submit.phoneInvalid";
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
    type: "complaint",
    source: "app",
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
