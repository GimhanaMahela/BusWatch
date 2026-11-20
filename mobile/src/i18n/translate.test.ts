import { createTranslator, isLocale } from "./translate";

describe("createTranslator", () => {
  it("reads the website's shared messages", () => {
    expect(createTranslator("en")("statuses.resolved")).toBe("Resolved");
  });

  it("formats ICU arguments and plurals like next-intl", () => {
    const t = createTranslator("en");
    expect(t("track.progress", { status: "Pending" })).toBe("Progress: Pending");
    expect(t("track.confirmedByOthers", { count: 1 })).toMatch(/^1 other passenger confirmed/);
    expect(t("track.confirmedByOthers", { count: 3 })).toMatch(/^3 other passengers confirmed/);
  });

  it("translates the app's own strings in every language", () => {
    expect(createTranslator("en")("app.settings")).toBe("Settings");
    expect(createTranslator("si")("app.settings")).not.toBe("Settings");
    expect(createTranslator("ta")("app.settings")).not.toBe("Settings");
  });

  it("returns the key when a message is missing everywhere", () => {
    expect(createTranslator("si")("nothing.here")).toBe("nothing.here");
  });
});

describe("isLocale", () => {
  it("accepts only supported languages", () => {
    expect(isLocale("si")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
