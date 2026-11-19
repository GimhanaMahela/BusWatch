import { Box } from "@mui/material";
import type { ReactNode } from "react";

/** Text filled with the theme's headline gradient, e.g. the highlighted words of a title. */
function GradientText({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        background: "var(--bw-gradient-text)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        // Keep descenders and Sinhala/Tamil vowel signs inside the painted area
        pb: "0.08em",
      }}
    >
      {children}
    </Box>
  );
}

export default GradientText;
