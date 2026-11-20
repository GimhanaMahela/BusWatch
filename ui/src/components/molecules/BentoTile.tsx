import { Box, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "info";

export type BentoVariant = "plain" | "brand" | "deep" | "tint" | "glass";

interface BentoTileProps extends Omit<BoxProps, "children"> {
  children: ReactNode;
  /**
   * plain: paper card; brand: the theme's brand gradient with white text; deep: the dark gradient
   * band; tint: a wash of `tone`; glass: frosted, for tiles over a busy background.
   */
  variant?: BentoVariant;
  tone?: Tone;
  /** Lift slightly on hover (for tiles that are links or hold the main action) */
  interactive?: boolean;
}

const VARIANT_SX = (variant: BentoVariant, tone: Tone) => {
  switch (variant) {
    case "brand":
      return {
        color: "common.white",
        background: "var(--bw-gradient-brand)",
        border: 0,
        boxShadow: "0 24px 48px -28px rgba(var(--bw-glow) / 0.9)",
      };
    case "deep":
      return {
        color: "common.white",
        background: "var(--bw-gradient-deep)",
        border: 0,
        boxShadow: "var(--bw-shadow-raised)",
      };
    case "tint":
      return {
        bgcolor: "background.paper",
        backgroundImage: `radial-gradient(120% 100% at 100% 0%, rgba(var(--mui-palette-${tone}-mainChannel) / 0.14), transparent 60%)`,
        borderColor: `rgba(var(--mui-palette-${tone}-mainChannel) / 0.28)`,
      };
    case "glass":
      return {
        bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.82)",
        backdropFilter: "blur(16px) saturate(160%)",
        boxShadow: "var(--bw-shadow-raised)",
      };
    default:
      return { bgcolor: "background.paper" };
  }
};

/**
 * One tile of a bento grid: rounded, bordered, with an optional colour treatment. Place tiles in a
 * CSS grid and size them with `gridColumn` / `gridRow` in `sx`.
 */
function BentoTile({
  children,
  variant = "plain",
  tone = "primary",
  interactive = false,
  sx,
  ...props
}: BentoTileProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          borderRadius: { xs: "22px", md: "28px" },
          border: 1,
          borderColor: "divider",
          boxShadow: "var(--bw-shadow-card)",
          p: { xs: 2.5, sm: 3, md: 3.5 },
          transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        },
        VARIANT_SX(variant, tone),
        interactive && {
          "&:hover": { transform: "translateY(-3px)", boxShadow: "var(--bw-shadow-raised)" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}

export default BentoTile;
