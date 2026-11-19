import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_NAMES, THEMES, resolveThemeName } from "./themes";

// WCAG relative luminance and contrast ratio of two #RRGGBB colours
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe("theme selection (NEXT_PUBLIC_THEME)", () => {
  it("reads a theme name, ignoring case and spaces", () => {
    expect(resolveThemeName("aurora")).toBe("aurora");
    expect(resolveThemeName(" Emerald ")).toBe("emerald");
    expect(resolveThemeName("CLASSIC")).toBe("classic");
  });

  it("falls back to the default for unset or unknown values", () => {
    expect(DEFAULT_THEME).toBe("sunset");
    expect(resolveThemeName(undefined)).toBe("sunset");
    expect(resolveThemeName("")).toBe("sunset");
    expect(resolveThemeName("neon")).toBe("sunset");
  });
});

describe.each(THEME_NAMES)("the %s theme", (name) => {
  const preset = THEMES[name];

  it.each(["light", "dark"] as const)("keeps text readable in %s mode (WCAG AA)", (mode) => {
    const scheme = preset[mode];
    for (const surface of [scheme.background.default, scheme.background.paper]) {
      expect(contrast(scheme.text.primary, surface)).toBeGreaterThanOrEqual(7);
      expect(contrast(scheme.text.secondary, surface)).toBeGreaterThanOrEqual(4.5);
      // Links, active navigation and outlined buttons use the primary colour as text
      expect(contrast(scheme.primary.main, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("has the gradients the components use", () => {
    expect(preset.brandGradient).toMatch(/^linear-gradient\(/);
    expect(preset.deepGradient).toMatch(/^linear-gradient\(/);
    expect(preset.glow).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
  });
});
