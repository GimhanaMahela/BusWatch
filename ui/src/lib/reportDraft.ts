import { busQuery } from "@/lib/busNumber";
import { loadDraft, saveDraft } from "@/lib/offlineStore";
import type { ReportDraft } from "@/types/assistant";

// The report forms keep unfinished work as drafts on the device (see useFormDraft). The BusWatch
// helper hands its draft over the same way: it saves a draft the form then restores on load.

/** Draft keys of the two forms; the views use these too. */
export const REPORT_DRAFT_KEY = "submit-report";
export const COMMEND_DRAFT_KEY = "commend-a-driver";
export const LOST_DRAFT_KEY = "lost-something";

export const REPORT_FORM_PATH = "/submit-report";
export const COMMEND_FORM_PATH = "/commend-a-driver";

type StoredForm = Record<string, unknown> & { form?: Record<string, unknown> };

// Every text field the forms expect, so their "is this draft empty?" checks always find strings
const EMPTY_FIELDS = {
  busNumber: "",
  routeNumber: "",
  category: "",
  incidentAt: "",
  location: "",
  description: "",
  passengerEmail: "",
  passengerPhone: "",
  website: "",
};

/**
 * Puts the helper's draft into the right form's saved draft, keeping anything the passenger
 * already entered there that the helper didn't fill in (photos, contact details...). Returns the
 * path to open: with bus and route in the query as a fallback when drafts can't be stored.
 */
export const putDraftIntoForm = async (draft: ReportDraft): Promise<string> => {
  const complaint = draft.type === "complaint";
  const key = complaint ? REPORT_DRAFT_KEY : COMMEND_DRAFT_KEY;
  const path = complaint ? REPORT_FORM_PATH : COMMEND_FORM_PATH;

  const fromHelper = Object.fromEntries(
    Object.entries({
      busNumber: draft.busNumber,
      routeNumber: draft.routeNumber,
      category: draft.category ?? "",
      incidentAt: draft.incidentAt,
      location: draft.location,
      description: draft.description,
    }).filter(([, value]) => value !== ""),
  );

  const saved = (await loadDraft<StoredForm>(key))?.data ?? {};
  const form = {
    ...EMPTY_FIELDS,
    ...(complaint && { busName: "" }),
    ...saved.form,
    ...fromHelper,
  };
  const data = complaint
    ? // Start at the first step so the passenger checks each one
      { coords: null, images: [], videos: [], source: "web", ...saved, form, step: 0 }
    : { source: "web", ...saved, form };

  const stored = await saveDraft(key, data);
  return stored ? path : `${path}${busQuery(draft.busNumber, draft.routeNumber)}`;
};
