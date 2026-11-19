"use client";

import { createTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { activeTheme, type SchemePalette, type ThemePreset } from "./themes";

// The MUI theme, built from the theme chosen with NEXT_PUBLIC_THEME (see themes.ts).
//
// Besides MUI's own palette variables, the theme defines a few CSS variables that components use
// for brand touches, so they follow the chosen theme and the light/dark switch:
//   --bw-gradient-brand   buttons, logo, highlights
//   --bw-gradient-deep    deep bands (closing call to action, footer)
//   --bw-gradient-text    gradient headline text (lighter in dark mode)
//   --bw-glow             "r g b" for tinted shadows: rgba(var(--bw-glow) / 0.3)
//   --bw-accent           third brand colour
//   --bw-shadow-card, --bw-shadow-raised   layered shadows

const BODY_FONT =
  "var(--font-sans), var(--font-sinhala), var(--font-tamil), system-ui, -apple-system, 'Segoe UI', Roboto, 'Iskoola Pota', 'Latha', sans-serif";
const DISPLAY_FONT = `var(--font-display), ${BODY_FONT}`;

const schemePalette = (scheme: SchemePalette) => ({
  primary: scheme.primary,
  secondary: scheme.secondary,
  success: { main: scheme.success },
  warning: { main: scheme.warning },
  error: { main: scheme.error },
  info: { main: scheme.info },
  background: scheme.background,
  text: scheme.text,
  divider: scheme.divider,
});

const brandVariables = (preset: ThemePreset, scheme: SchemePalette, dark: boolean) => ({
  "--bw-gradient-brand": preset.brandGradient,
  "--bw-gradient-deep": preset.deepGradient,
  "--bw-gradient-text": scheme.textGradient,
  "--bw-glow": preset.glow,
  "--bw-accent": scheme.accent,
  "--bw-shadow-card": dark
    ? "0 1px 0 rgba(255 255 255 / 0.04) inset, 0 12px 32px -18px rgba(0 0 0 / 0.7)"
    : `0 1px 2px rgba(${preset.glow} / 0.05), 0 12px 32px -20px rgba(${preset.glow} / 0.28)`,
  "--bw-shadow-raised": dark
    ? `0 24px 60px -28px rgba(0 0 0 / 0.85), 0 0 0 1px rgba(${preset.glow} / 0.18)`
    : `0 28px 64px -30px rgba(${preset.glow} / 0.45), 0 2px 6px rgba(${preset.glow} / 0.06)`,
});

const buildTheme = (preset: ThemePreset) => {
  const headings = { fontFamily: preset.headingFont === "display" ? DISPLAY_FONT : BODY_FONT };
  return createTheme({
    // CSS variables let the light/dark switch happen without a re-render or a flash on load
    cssVariables: { colorSchemeSelector: "class" },
    colorSchemes: {
      light: { palette: schemePalette(preset.light) },
      dark: { palette: schemePalette(preset.dark) },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: BODY_FONT,
      h1: { ...headings, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02 },
      h2: { ...headings, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08 },
      h3: { ...headings, fontWeight: 800, letterSpacing: "-0.02em" },
      h4: { ...headings, fontWeight: 750, letterSpacing: "-0.015em" },
      h5: { ...headings, fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 650, textTransform: "none", letterSpacing: 0 },
      overline: { fontWeight: 800, letterSpacing: "0.14em" },
    },
    components: {
      // Buttons and links with an href navigate client-side through next/link
      MuiButtonBase: { defaultProps: { LinkComponent: NextLink } },
      MuiLink: { defaultProps: { component: NextLink } },
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          ":root": brandVariables(preset, preset.light, false),
          ":root.dark": brandVariables(preset, preset.dark, true),
          body: {
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            // A faint warm glow at the top of every page
            backgroundImage:
              "radial-gradient(1100px 520px at 100% -8%, rgba(var(--mui-palette-secondary-mainChannel) / 0.07), transparent 60%), radial-gradient(900px 480px at -10% -10%, rgba(var(--mui-palette-primary-mainChannel) / 0.06), transparent 60%)",
            backgroundRepeat: "no-repeat",
          },
          // Sinhala and Tamil vowel signs sit above and below the line: tight headings clip them
          "html:is(:lang(si), :lang(ta)) :is(h1, h2, h3, h4, h5, h6, .MuiTypography-h1, .MuiTypography-h2, .MuiTypography-h3, .MuiTypography-h4)":
            { letterSpacing: 0, lineHeight: 1.35 },
          "::selection": { background: "rgba(var(--mui-palette-primary-mainChannel) / 0.2)" },
          ":focus-visible": {
            outline: `2px solid ${theme.vars.palette.primary.main}`,
            outlineOffset: 2,
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              transitionDuration: "0.01ms !important",
            },
          },
        }),
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: preset.buttonRadius,
            paddingInline: 18,
            transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
            variants: [
              {
                props: { variant: "contained", color: "primary" },
                style: {
                  boxShadow: "0 10px 24px -12px rgba(var(--bw-glow) / 0.75)",
                  "&:hover": { boxShadow: "0 14px 28px -12px rgba(var(--bw-glow) / 0.85)" },
                },
              },
              {
                props: { variant: "outlined" },
                style: {
                  borderWidth: 1.5,
                  "&:hover": {
                    borderWidth: 1.5,
                    backgroundColor: "var(--mui-palette-action-hover)",
                  },
                },
              },
            ],
          },
          sizeLarge: { paddingBlock: 12, paddingInline: 26, fontSize: "1rem" },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { transition: "background-color 0.2s, transform 0.2s" } },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderColor: theme.vars.palette.divider,
          }),
        },
      },
      MuiCard: {
        defaultProps: { variant: "outlined" },
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: "var(--bw-shadow-card)",
            transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 650, borderRadius: 999 } },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            backgroundColor: theme.vars.palette.background.paper,
            transition: "box-shadow 0.2s",
            "&.Mui-focused": {
              boxShadow: `0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.15)`,
            },
          }),
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { height: 3, borderRadius: 3, background: "var(--bw-gradient-brand)" },
        },
      },
      MuiTab: {
        styleOverrides: { root: { fontWeight: 650, textTransform: "none" } },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 99, height: 6 },
          bar: { borderRadius: 99, background: "var(--bw-gradient-brand)" },
        },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: { tooltip: { fontSize: "0.8rem", borderRadius: 8 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 24, boxShadow: "var(--bw-shadow-raised)" },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({ borderColor: theme.vars.palette.divider }),
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 14 } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "transparent" },
      },
    },
  });
};

const theme = buildTheme(activeTheme);

export default theme;
