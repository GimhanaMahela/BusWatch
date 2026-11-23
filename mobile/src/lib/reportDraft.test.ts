import {
  APP_COMPLAINT_CATEGORIES,
  emptyDraft,
  errorsForStep,
  firstStepWithErrors,
  toFormData,
  validateDraft,
  type ReportDraft,
} from "./reportDraft";

const complete = (): ReportDraft => ({
  ...emptyDraft(),
  busNumber: "NB-1234",
  routeNumber: "08",
  busService: "private",
  category: "reckless_driving",
  location: "Ambepussa Junction",
  description: "Overtook on a bend.",
});

describe("validateDraft", () => {
  it("passes a complete report", () => {
    expect(validateDraft(complete())).toEqual({});
  });

  it("flags every required field on an empty form", () => {
    expect(Object.keys(validateDraft(emptyDraft())).sort()).toEqual([
      "busNumber",
      "busService",
      "category",
      "description",
      "location",
      "routeNumber",
    ]);
  });

  it("treats blank-only text as missing", () => {
    expect(validateDraft({ ...complete(), description: "   " }).description).toBe("app.required");
  });

  it("checks optional contact details only when given", () => {
    expect(validateDraft({ ...complete(), email: "not-an-email" }).email).toBe("app.emailInvalid");
    expect(validateDraft({ ...complete(), phone: "12" }).phone).toBe("submit.phoneInvalid");
    expect(validateDraft({ ...complete(), email: "a@b.lk", phone: "077 123 4567" })).toEqual({});
  });
});

describe("validateDraft per report type", () => {
  it("asks a commendation who it thanks, but not where", () => {
    const commend = {
      ...complete(),
      type: "commendation" as const,
      category: "safe_driving" as const,
      location: "",
      busService: "" as const,
    };
    expect(validateDraft(commend)).toEqual({ commendee: "commend.chooseWho" });
    expect(validateDraft({ ...commend, commendee: "driver" })).toEqual({});
  });

  it("needs a way to reach the passenger about a lost item", () => {
    const lost = { ...complete(), type: "lost_item" as const, category: "bag" as const };
    expect(validateDraft(lost).email).toBe("lost.contactRequired");
    expect(validateDraft({ ...lost, phone: "0771234567" })).toEqual({});
  });
});

describe("safety mode's quick report", () => {
  it("needs only the bus and route; the ticked boxes say what happened", () => {
    const quick = {
      ...emptyDraft(),
      category: "harassment" as const,
      busNumber: "NB-1234",
      routeNumber: "08",
      safetyKinds: ["staring" as const],
    };
    expect(validateDraft(quick)).toEqual({});
    expect(toFormData(quick, "en", null).get("details")).toBe(
      JSON.stringify({ safety: { kinds: ["staring"] } }),
    );
  });
});

describe("toFormData", () => {
  it("sends the type, the QR source and who is thanked", () => {
    const form = toFormData(
      { ...complete(), type: "commendation", source: "qr", commendee: "conductor" },
      "si",
      null,
    );
    expect(form.get("type")).toBe("commendation");
    expect(form.get("source")).toBe("qr");
    expect(form.get("language")).toBe("si");
    expect(form.get("details")).toBe(JSON.stringify({ commendee: "conductor" }));
  });
});

describe("APP_COMPLAINT_CATEGORIES", () => {
  it("leaves out accessibility, which needs the website's checklist", () => {
    expect(APP_COMPLAINT_CATEGORIES).not.toContain("accessibility");
    expect(APP_COMPLAINT_CATEGORIES).toContain("other");
  });
});

describe("form steps", () => {
  it("checks only the current step's fields", () => {
    const busOnly = {
      ...emptyDraft(),
      busNumber: "NB-1234",
      routeNumber: "08",
      busService: "sltb" as const,
    };
    expect(errorsForStep(busOnly, 0)).toEqual({});
    expect(Object.keys(errorsForStep(busOnly, 1))).toEqual(["category"]);
    expect(Object.keys(errorsForStep(busOnly, 2)).sort()).toEqual(["description", "location"]);
  });

  it("points at the first step that still needs something", () => {
    expect(firstStepWithErrors(emptyDraft())).toBe(0);
    expect(firstStepWithErrors(complete())).toBe(-1);
    expect(firstStepWithErrors({ ...complete(), email: "nope" })).toBe(3);
  });
});
