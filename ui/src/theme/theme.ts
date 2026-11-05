"use client";

import { alpha, createTheme } from "@mui/material/styles";
import NextLink from "next/link";

// Brand colours shared by both colour schemes
const brand = {
  blue: "#2457F5",
  blueLight: "#5B83FF",
  blueDark: "#1638B8",
  violet: "#7A4DF0",
  ink: "#0B1220",
};

const theme = createTheme({
  // CSS variables let the light/dark switch happen without a re-render or a flash on load
  cssVariables: { colorSchemeSelector: "class" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand.blue, light: brand.blueLight, dark: brand.blueDark },
        secondary: { main: brand.violet },
        success: { main: "#12A150" },
        warning: { main: "#E8A10C" },
        error: { main: "#E5484D" },
        info: { main: "#0EA5E9" },
        background: { default: "#F5F7FB", paper: "#FFFFFF" },
        text: { primary: brand.ink, secondary: "#5B6478" },
        divider: "#E6E9F0",
      },
    },
    dark: {
      palette: {
        primary: { main: "#6E8CFF", light: "#9AB0FF", dark: brand.blue },
        secondary: { main: "#A68BFF" },
        success: { main: "#3DD68C" },
        warning: { main: "#F5B83D" },
        error: { main: "#FF6369" },
        info: { main: "#38BDF8" },
        background: { default: "#090D18", paper: "#111727" },
        text: { primary: "#EDF0F7", secondary: "#9AA3B8" },
        divider: "#1F2638",
      },
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      "var(--font-sans), var(--font-sinhala), var(--font-tamil), system-ui, -apple-system, 'Segoe UI', Roboto, 'Iskoola Pota', 'Latha', sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 },
    h2: { fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 },
    h3: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 750, letterSpacing: "-0.015em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 650, textTransform: "none", letterSpacing: 0 },
    overline: { fontWeight: 700, letterSpacing: "0.12em" },
  },
  components: {
    // Buttons and links with an href navigate client-side through next/link
    MuiButtonBase: { defaultProps: { LinkComponent: NextLink } },
    MuiLink: { defaultProps: { component: NextLink } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        // Sinhala and Tamil vowel signs sit above and below the line: tight headings clip them
        "html:is(:lang(si), :lang(ta)) :is(h1, h2, h3, h4, h5, h6, .MuiTypography-h1, .MuiTypography-h2, .MuiTypography-h3, .MuiTypography-h4)":
          { letterSpacing: 0, lineHeight: 1.35 },
        "::selection": { background: alpha(brand.blue, 0.2) },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 18 },
        sizeLarge: { paddingBlock: 12, paddingInline: 26, fontSize: "1rem" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({ backgroundImage: "none", borderColor: theme.vars.palette.divider }),
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: theme.vars.palette.background.paper,
          transition: "box-shadow 0.2s",
          "&.Mui-focused": {
            boxShadow: `0 0 0 4px rgba(${theme.vars.palette.primary.mainChannel} / 0.15)`,
          },
        }),
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: { tooltip: { fontSize: "0.8rem", borderRadius: 8 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
    },
  },
});

export default theme;
