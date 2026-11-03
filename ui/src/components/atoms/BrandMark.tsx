import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import { Box, Typography } from "@mui/material";

interface BrandMarkProps {
  /** Hide the "BusWatch" word, e.g. in a collapsed sidebar */
  iconOnly?: boolean;
  size?: number;
}

/** BusWatch logo: bus glyph on the brand gradient, plus the wordmark. */
function BrandMark({ iconOnly = false, size = 36 }: BrandMarkProps) {
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
          background: "linear-gradient(135deg, #5B83FF 0%, #2457F5 55%, #7A4DF0 100%)",
          boxShadow: "0 6px 16px -6px rgba(36, 87, 245, 0.6)",
        }}
      >
        <DirectionsBusRoundedIcon sx={{ fontSize: size * 0.6 }} />
      </Box>
      {!iconOnly && (
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: size * 0.52,
            letterSpacing: "-0.02em",
            color: "text.primary",
          }}
        >
          Bus
          <Box component="span" sx={{ color: "primary.main" }}>
            Watch
          </Box>
        </Typography>
      )}
    </Box>
  );
}

export default BrandMark;
