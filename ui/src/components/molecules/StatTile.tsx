import { Box, Card, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Tone = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
  /** The headline tile of a bento row: the brand gradient with white text and a bigger number */
  featured?: boolean;
}

/** Headline number with a label, a tinted icon and an optional hint. */
function StatTile({ label, value, hint, icon, tone = "primary", featured = false }: StatTileProps) {
  const muted = featured ? { color: "rgba(255 255 255 / 0.85)" } : { color: "text.secondary" };
  return (
    <Card
      sx={[
        {
          p: 2.5,
          height: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "22px",
        },
        featured
          ? {
              color: "common.white",
              border: 0,
              background: "var(--bw-gradient-brand)",
              boxShadow: "0 24px 48px -28px rgba(var(--bw-glow) / 0.9)",
            }
          : {
              // A soft wash of the tile's colour in the corner
              backgroundImage: `radial-gradient(120% 90% at 100% 0%, rgba(var(--mui-palette-${tone}-mainChannel) / 0.09), transparent 55%)`,
              "&::before": {
                content: '""',
                position: "absolute",
                inset: "0 0 auto 0",
                height: 3,
                background: `linear-gradient(90deg, rgba(var(--mui-palette-${tone}-mainChannel) / 0.9), rgba(var(--mui-palette-${tone}-mainChannel) / 0.1))`,
              },
            },
      ]}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant="body2" sx={{ ...muted, fontWeight: 600 }}>
          {label}
        </Typography>
        {icon && (
          <Box
            sx={
              featured
                ? {
                    width: 40,
                    height: 40,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: "common.white",
                    bgcolor: "rgba(255 255 255 / 0.18)",
                  }
                : {
                    width: 40,
                    height: 40,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: `${tone}.main`,
                    bgcolor: `rgba(var(--mui-palette-${tone}-mainChannel) / 0.12)`,
                    boxShadow: `inset 0 0 0 1px rgba(var(--mui-palette-${tone}-mainChannel) / 0.18)`,
                  }
            }
          >
            {icon}
          </Box>
        )}
      </Box>
      <Typography
        sx={{
          fontFamily: "var(--font-display), var(--font-sans), sans-serif",
          fontSize: featured ? { xs: "2.2rem", md: "3rem" } : { xs: "1.9rem", md: "2.3rem" },
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          mt: featured ? 1.5 : 0.5,
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" component="p" sx={{ ...muted, mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}

export default StatTile;
