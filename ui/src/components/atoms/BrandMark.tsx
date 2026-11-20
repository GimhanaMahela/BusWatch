import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import { Box, Typography } from "@mui/material";

interface BrandMarkProps {
  /** Hide the "TransitX" word, e.g. in a collapsed sidebar */
  iconOnly?: boolean;
  size?: number;
  /** "light" for dark backgrounds such as the footer */
  tone?: "default" | "light";
}

// The "X" keeps the logo's blue-to-orange split whatever the site theme; a lighter blue on dark
// backgrounds so it stays readable
const X_GRADIENT = "linear-gradient(120deg, #0082DB 0%, #0082DB 42%, #FE6E01 58%, #FE6E01 100%)";
const X_GRADIENT_LIGHT =
  "linear-gradient(120deg, #4DB3FF 0%, #4DB3FF 42%, #FF8A3D 58%, #FF8A3D 100%)";

/** TransitX logo: bus glyph with the logo's warning badge on the brand gradient, plus the wordmark. */
function BrandMark({ iconOnly = false, size = 36, tone = "default" }: BrandMarkProps) {
  const badge = Math.round(size * 0.44);
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          position: "relative",
          flexShrink: 0,
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
        <Box
          sx={{
            position: "absolute",
            right: -size * 0.12,
            bottom: -size * 0.12,
            width: badge,
            height: badge,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "common.white",
            bgcolor: "#FE6E01",
            border: `${Math.max(1.5, size * 0.05)}px solid`,
            borderColor: tone === "light" ? "#00295C" : "background.paper",
          }}
        >
          <PriorityHighRoundedIcon sx={{ fontSize: badge * 0.72 }} />
        </Box>
      </Box>
      {!iconOnly && (
        <Typography
          component="span"
          sx={{
            fontFamily: "var(--font-sans), sans-serif",
            fontWeight: 800,
            fontSize: size * 0.56,
            letterSpacing: "-0.035em",
            color: tone === "light" ? "common.white" : "#00295C",
            // Plain selectors rather than an sx function: server components render this too
            ".dark &": { color: "common.white" },
          }}
        >
          Transit
          <Box
            component="span"
            sx={{
              backgroundImage: tone === "light" ? X_GRADIENT_LIGHT : X_GRADIENT,
              ".dark &": { backgroundImage: X_GRADIENT_LIGHT },
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            X
          </Box>
        </Typography>
      )}
    </Box>
  );
}

export default BrandMark;
