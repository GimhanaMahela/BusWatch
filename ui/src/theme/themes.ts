// Site themes. Pick one with NEXT_PUBLIC_THEME in the repo's .env file (sunset, aurora, emerald or
// classic); unset or unknown values use "sunset". The value is built into the site, so restart
// `npm run dev` or rebuild after changing it.
//
// No "use client": server code (layout, share images, the web app manifest) reads it too.

export const THEME_NAMES = ["sunset", "aurora", "emerald", "classic"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];
export const DEFAULT_THEME: ThemeName = "sunset";

interface PaletteColor {
  main: string;
  light: string;
  dark: string;
}

export interface SchemePalette {
  primary: PaletteColor;
  secondary: PaletteColor;
  /** Third brand colour for highlights and decorative touches */
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: { default: string; paper: string };
  text: { primary: string; secondary: string };
  divider: string;
  /** Headline text gradient (lighter in dark mode so it stays readable) */
  textGradient: string;
}

export interface ThemePreset {
  name: ThemeName;
  label: string;
  light: SchemePalette;
  dark: SchemePalette;
  /** Buttons, the logo and other calls to action */
  brandGradient: string;
  /** Deep bands: the closing call to action, the footer, share images */
  deepGradient: string;
  /** "r g b" of the colour used to tint shadows and glows */
  glow: string;
  /** Headings in the display font (Bricolage Grotesque) or the body font */
  headingFont: "display" | "sans";
  /** Button corner radius in px (999 makes pills) */
  buttonRadius: number;
}

/** Lanka Sunset: crimson to saffron, like the island's buses, on warm cream. */
const sunset: ThemePreset = {
  name: "sunset",
  label: "Lanka Sunset",
  light: {
    primary: { main: "#BE123C", light: "#E11D48", dark: "#881337" },
    secondary: { main: "#EA580C", light: "#F59E0B", dark: "#C2410C" },
    accent: "#0F9D8A",
    success: "#15803D",
    warning: "#D97706",
    error: "#DC2626",
    info: "#0E7490",
    background: { default: "#FFF8F1", paper: "#FFFFFF" },
    text: { primary: "#2A1410", secondary: "#6F5149" },
    divider: "#F1DFD2",
    textGradient: "linear-gradient(110deg, #BE123C 0%, #E8481C 55%, #F59E0B 100%)",
  },
  dark: {
    primary: { main: "#FB7185", light: "#FDA4AF", dark: "#E11D48" },
    secondary: { main: "#FB923C", light: "#FDBA74", dark: "#EA580C" },
    accent: "#2DD4BF",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#22D3EE",
    background: { default: "#140A09", paper: "#1E1211" },
    text: { primary: "#FBEFE9", secondary: "#C9ADA3" },
    divider: "#3A2422",
    textGradient: "linear-gradient(110deg, #FB7185 0%, #FB923C 55%, #FCD34D 100%)",
  },
  brandGradient: "linear-gradient(135deg, #E11D48 0%, #BE123C 38%, #EA580C 78%, #F59E0B 110%)",
  deepGradient: "linear-gradient(135deg, #3B0412 0%, #881337 42%, #C2410C 88%, #F59E0B 130%)",
  glow: "190 18 60",
  headingFont: "display",
  buttonRadius: 999,
};

/** Midnight Aurora: indigo, violet and pink glows on deep navy. */
const aurora: ThemePreset = {
  name: "aurora",
  label: "Midnight Aurora",
  light: {
    primary: { main: "#4F46E5", light: "#6366F1", dark: "#3730A3" },
    secondary: { main: "#9333EA", light: "#A855F7", dark: "#7E22CE" },
    accent: "#F59E0B",
    success: "#16A34A",
    warning: "#D97706",
    error: "#E11D48",
    info: "#0284C7",
    background: { default: "#F6F7FB", paper: "#FFFFFF" },
    text: { primary: "#0B1020", secondary: "#5A6178" },
    divider: "#E5E7F0",
    textGradient: "linear-gradient(110deg, #4F46E5 0%, #A855F7 55%, #EC4899 100%)",
  },
  dark: {
    primary: { main: "#818CF8", light: "#A5B4FC", dark: "#4F46E5" },
    secondary: { main: "#C084FC", light: "#D8B4FE", dark: "#9333EA" },
    accent: "#FBBF24",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#FB7185",
    info: "#38BDF8",
    background: { default: "#070B1F", paper: "#0F1530" },
    text: { primary: "#EEF0FF", secondary: "#A3A9C7" },
    divider: "#1E2547",
    textGradient: "linear-gradient(110deg, #A5B4FC 0%, #C084FC 55%, #F9A8D4 100%)",
  },
  brandGradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
  deepGradient: "linear-gradient(135deg, #070B1F 0%, #1E1B4B 45%, #4C1D95 80%, #831843 115%)",
  glow: "99 102 241",
  headingFont: "display",
  buttonRadius: 12,
};

/** Emerald Trust: calm civic greens with a gold accent. */
const emerald: ThemePreset = {
  name: "emerald",
  label: "Emerald Trust",
  light: {
    primary: { main: "#047857", light: "#10B981", dark: "#064E3B" },
    secondary: { main: "#B7791F", light: "#D4A017", dark: "#8A5A12" },
    accent: "#0E7490",
    success: "#15803D",
    warning: "#B45309",
    error: "#DC2626",
    info: "#0369A1",
    background: { default: "#F3FBF8", paper: "#FFFFFF" },
    text: { primary: "#0F1E1C", secondary: "#4B635E" },
    divider: "#DCEDE7",
    textGradient: "linear-gradient(110deg, #064E4B 0%, #059669 60%, #B7791F 100%)",
  },
  dark: {
    primary: { main: "#34D399", light: "#6EE7B7", dark: "#059669" },
    secondary: { main: "#FACC15", light: "#FDE047", dark: "#CA8A04" },
    accent: "#22D3EE",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#38BDF8",
    background: { default: "#06120F", paper: "#0D1F1A" },
    text: { primary: "#E8F5F1", secondary: "#9DBAB2" },
    divider: "#1B332C",
    textGradient: "linear-gradient(110deg, #6EE7B7 0%, #34D399 55%, #FACC15 100%)",
  },
  brandGradient: "linear-gradient(135deg, #10B981 0%, #047857 55%, #064E4B 100%)",
  deepGradient: "linear-gradient(135deg, #022C22 0%, #064E4B 50%, #047857 100%)",
  glow: "4 120 87",
  headingFont: "display",
  buttonRadius: 10,
};

/** The original BusWatch blue and violet. */
const classic: ThemePreset = {
  name: "classic",
  label: "Classic Blue",
  light: {
    primary: { main: "#2457F5", light: "#5B83FF", dark: "#1638B8" },
    secondary: { main: "#7A4DF0", light: "#A68BFF", dark: "#5B32C9" },
    accent: "#0EA5E9",
    success: "#12A150",
    warning: "#E8A10C",
    error: "#E5484D",
    info: "#0EA5E9",
    background: { default: "#F5F7FB", paper: "#FFFFFF" },
    text: { primary: "#0B1220", secondary: "#5B6478" },
    divider: "#E6E9F0",
    textGradient: "linear-gradient(120deg, #5B83FF 0%, #2457F5 45%, #7A4DF0 100%)",
  },
  dark: {
    primary: { main: "#6E8CFF", light: "#9AB0FF", dark: "#2457F5" },
    secondary: { main: "#A68BFF", light: "#C4B5FF", dark: "#7A4DF0" },
    accent: "#38BDF8",
    success: "#3DD68C",
    warning: "#F5B83D",
    error: "#FF6369",
    info: "#38BDF8",
    background: { default: "#090D18", paper: "#111727" },
    text: { primary: "#EDF0F7", secondary: "#9AA3B8" },
    divider: "#1F2638",
    textGradient: "linear-gradient(120deg, #9AB0FF 0%, #6E8CFF 45%, #A68BFF 100%)",
  },
  brandGradient: "linear-gradient(135deg, #5B83FF 0%, #2457F5 50%, #7A4DF0 100%)",
  deepGradient: "linear-gradient(130deg, #1638B8 0%, #2457F5 50%, #7A4DF0 100%)",
  glow: "36 87 245",
  headingFont: "sans",
  buttonRadius: 10,
};

export const THEMES: Record<ThemeName, ThemePreset> = { sunset, aurora, emerald, classic };

/** Reads a theme name, falling back to the default for unset or unknown values. */
export const resolveThemeName = (value: string | undefined): ThemeName => {
  const name = value?.trim().toLowerCase();
  return THEME_NAMES.find((theme) => theme === name) ?? DEFAULT_THEME;
};

// Written out in full so Next can build the value into the browser bundle
export const activeThemeName = resolveThemeName(process.env.NEXT_PUBLIC_THEME);
export const activeTheme = THEMES[activeThemeName];
