// The TransitX brand palette, matching the website's "transitx" theme (ui/src/theme/themes.ts).

export interface Palette {
  primary: string;
  primaryDark: string;
  onPrimary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  divider: string;
}

export const palettes: Record<"light" | "dark", Palette> = {
  light: {
    primary: "#0068C2",
    primaryDark: "#00295C",
    onPrimary: "#FFFFFF",
    secondary: "#E85D00",
    success: "#15803D",
    warning: "#D97706",
    error: "#DC2626",
    background: "#F4F7FC",
    surface: "#FFFFFF",
    text: "#0A1B33",
    textSecondary: "#4A5B75",
    divider: "#DFE6F1",
  },
  dark: {
    primary: "#4DB3FF",
    primaryDark: "#0082DB",
    onPrimary: "#06101F",
    secondary: "#FF8A3D",
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#F87171",
    background: "#06101F",
    surface: "#0D1B30",
    text: "#EAF2FC",
    textSecondary: "#A0B3CC",
    divider: "#1C2D47",
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = 10;
