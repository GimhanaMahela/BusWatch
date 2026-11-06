import { describe, expect, it } from "vitest";
import { CATEGORIES, COMMENDATION_CATEGORIES, STATUSES } from "@/constants/reportConstants";
import en from "../../messages/en.json";
import si from "../../messages/si.json";
import ta from "../../messages/ta.json";
import { negotiateLocale } from "./config";

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): Record<string, string> =>
  Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) =>
      typeof value === "string"
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`)),
    ),
  );

// Simple {name} arguments plus the rich-text tags (<link>, <terms>) a translation must keep
const placeholders = (message: string) =>
  [
    ...new Set([
      ...[...message.matchAll(/\{(\w+)[,}]/g)].map((m) => `{${m[1]}}`),
      ...[...message.matchAll(/<(\w+)>/g)].map((m) => `<${m[1]}>`),
    ]),
  ].sort();

const english = flatten(en);

describe.each([
  ["Sinhala", si],
  ["Tamil", ta],
])("%s translations", (_, messages) => {
  const translated = flatten(messages);

  it("cover every English message and nothing else", () => {
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
  });

  it("keep the same placeholders and tags", () => {
    for (const [key, message] of Object.entries(english)) {
      // Sinhala and Tamil don't inflect for plurals, so plural/select wrappers may be dropped,
      // but every value the sentence shows must still be there
      const expected = placeholders(message).filter((p) => p !== "{count}" && p !== "{kind}");
      for (const placeholder of expected) {
        expect(translated[key], `${key} is missing ${placeholder}`).toContain(
          placeholder.startsWith("<") ? placeholder : placeholder.slice(0, -1),
        );
      }
    }
  });

  it("translate rather than copy English", () => {
    const copied = Object.entries(english).filter(
      ([key, value]) => translated[key] === value && /[a-z]{4,}/.test(value),
    );
    // Brand names, the language list and the example email are the same in every language
    expect(copied.map(([key]) => key)).toEqual([
      "footer.buswatch",
      "home.promiseLanguages",
      "myReports.contactPlaceholderEmail",
    ]);
  });
});

describe("message coverage", () => {
  it("names every category and status", () => {
    for (const { value } of [...CATEGORIES, ...COMMENDATION_CATEGORIES]) {
      expect(english[`categories.${value}`]).toBeTruthy();
    }
    for (const { value } of STATUSES) expect(english[`statuses.${value}`]).toBeTruthy();
  });
});

describe("negotiateLocale", () => {
  it.each([
    ["si-LK,si;q=0.9,en;q=0.8", "si"],
    ["ta-IN,ta;q=0.9", "ta"],
    ["fr-FR,fr;q=0.9,ta;q=0.5", "ta"],
    ["en-GB,si;q=0.9", "en"],
    ["en;q=0.2,si;q=0.8", "si"],
    ["de-DE", "en"],
    ["", "en"],
    [null, "en"],
  ])("%s → %s", (header, locale) => {
    expect(negotiateLocale(header)).toBe(locale);
  });
});
