import {
  APP_COMPLAINT_CATEGORIES,
  emptyDraft,
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

describe("APP_COMPLAINT_CATEGORIES", () => {
  it("leaves out accessibility, which needs the website's checklist", () => {
    expect(APP_COMPLAINT_CATEGORIES).not.toContain("accessibility");
    expect(APP_COMPLAINT_CATEGORIES).toContain("other");
  });
});
