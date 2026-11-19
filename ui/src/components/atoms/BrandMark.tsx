import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import { Box, Typography } from "@mui/material";

interface BrandMarkProps {
  /** Hide the "BusWatch" word, e.g. in a collapsed sidebar */
  iconOnly?: boolean;
  size?: number;
  /** "light" for dark backgrounds such as the footer */
  tone?: "default" | "light";
}

/** BusWatch logo: bus glyph on the theme's brand gradient, plus the wordmark. */
function BrandMark({ iconOnly = false, size = 36, tone = "default" }: BrandMarkProps) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: size,
          height: size,
          borderRadius: size / 3.5 + "px",
          display: "grid",
          placeItems: "center",
          color: "common.white",
          background: "var(--bw-gradient-brand)",
          boxShadow: "0 8px 18px -8px rgba(var(--bw-glow) / 0.75)",
        }}
      >
        <DirectionsBusRoundedIcon sx={{ fontSize: size * 0.6 }} />
      </Box>
      {!iconOnly && (
        <Typography
          component="span"
          sx={{
            fontFamily: "var(--font-display), var(--font-sans), sans-serif",
            fontWeight: 800,
            fontSize: size * 0.54,
            letterSpacing: "-0.03em",
            color: tone === "light" ? "common.white" : "text.primary",
          }}
        >
          Bus
          <Box
            component="span"
            sx={{
              background:
                tone === "light"
                  ? "linear-gradient(110deg, #FFFFFF 0%, rgba(255 255 255 / 0.7) 100%)"
                  : "var(--bw-gradient-text)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Watch
          </Box>
        </Typography>
      )}
    </Box>
  );
}

export default BrandMark;
