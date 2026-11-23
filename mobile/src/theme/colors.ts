// The TransitX brand palette, matching the website's "transitx" theme (ui/src/theme/themes.ts):
// navy and blue from the logo, with orange for highlights.
import type { ReportCategory, ReportStatus } from "../../../api/src/config/constants";

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
  /** A slightly raised surface: input fields, chips, image wells */
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  divider: string;
  shadow: string;
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
    surfaceAlt: "#EEF3FA",
    text: "#0A1B33",
    textSecondary: "#4A5B75",
    divider: "#DFE6F1",
    shadow: "#0A1B33",
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
    surfaceAlt: "#132540",
    text: "#EAF2FC",
    textSecondary: "#A0B3CC",
    divider: "#1C2D47",
    shadow: "#000000",
  },
};

/** The website's brand gradients (buttons, the logo, hero banners) */
export const gradients = {
  brand: ["#029EEE", "#0082DB", "#0060B8", "#00295C"],
  deep: ["#00152F", "#00295C", "#0060B8", "#0082DB"],
  sunrise: ["#FE6E01", "#E85D00", "#C2410C"],
  success: ["#22C55E", "#15803D"],
} as const satisfies Record<string, readonly [string, string, ...string[]]>;

/** One colour per report status, used for badges, the progress line and timeline dots */
export const statusColors: Record<ReportStatus, string> = {
  pending: "#F59E0B",
  reviewed: "#0284C7",
  escalated: "#8B5CF6",
  resolved: "#16A34A",
  rejected: "#64748B",
};

/** Colourful accents for tiles and category chips (each readable with white text) */
export const accents = {
  orange: "#EA580C",
  blue: "#0068C2",
  sky: "#0284C7",
  violet: "#7C3AED",
  pink: "#DB2777",
  green: "#16A34A",
  teal: "#0D9488",
  amber: "#D97706",
  red: "#DC2626",
  slate: "#475569",
} as const;

type IconName = string;

/** An icon (Ionicons) and accent per category, so the picker reads at a glance */
export const categoryStyle: Partial<Record<ReportCategory, { icon: IconName; color: string }>> = {
  reckless_driving: { icon: "speedometer-outline", color: accents.red },
  overcharging: { icon: "cash-outline", color: accents.amber },
  no_ticket: { icon: "receipt-outline", color: accents.orange },
  refused_to_stop: { icon: "hand-left-outline", color: accents.violet },
  harassment: { icon: "warning-outline", color: accents.pink },
  overcrowding: { icon: "people-outline", color: accents.sky },
  loud_music: { icon: "musical-notes-outline", color: accents.teal },
  vehicle_condition: { icon: "construct-outline", color: accents.slate },
  staff_behaviour: { icon: "person-outline", color: accents.blue },
  other: { icon: "ellipsis-horizontal-circle-outline", color: accents.slate },
  // Commendations
  safe_driving: { icon: "shield-checkmark-outline", color: accents.green },
  helpful_staff: { icon: "happy-outline", color: accents.teal },
  helped_passenger: { icon: "accessibility-outline", color: accents.sky },
  clean_vehicle: { icon: "sparkles-outline", color: accents.violet },
  on_time: { icon: "time-outline", color: accents.blue },
  fair_fare: { icon: "pricetag-outline", color: accents.amber },
  comfortable_service: { icon: "star-outline", color: accents.orange },
  // Lost items
  bag: { icon: "bag-handle-outline", color: accents.orange },
  phone: { icon: "phone-portrait-outline", color: accents.blue },
  wallet: { icon: "wallet-outline", color: accents.amber },
  documents: { icon: "document-outline", color: accents.sky },
  keys: { icon: "key-outline", color: accents.violet },
  clothing: { icon: "shirt-outline", color: accents.pink },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = 14;
export const radiusLarge = 22;
