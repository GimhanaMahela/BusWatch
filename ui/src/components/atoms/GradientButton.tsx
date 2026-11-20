"use client";

import { Button, type ButtonProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  isolation: "isolate",
  fontWeight: 700,
  color: theme.palette.common.white,
  background: "var(--bw-gradient-brand)",
  backgroundSize: "160% 100%",
  backgroundPosition: "0% 0%",
  boxShadow: "0 12px 26px -12px rgba(var(--bw-glow) / 0.8), inset 0 1px 0 rgba(255 255 255 / 0.25)",
  transition: "background-position 0.5s ease, transform 0.2s ease, box-shadow 0.2s ease",
  // A soft shine sweeps across on hover
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    background:
      "linear-gradient(110deg, transparent 30%, rgba(255 255 255 / 0.28) 50%, transparent 70%)",
    transform: "translateX(-120%)",
    transition: "transform 0.7s ease",
  },
  "&:hover": {
    backgroundPosition: "100% 0%",
    transform: "translateY(-1px)",
    boxShadow:
      "0 16px 32px -12px rgba(var(--bw-glow) / 0.9), inset 0 1px 0 rgba(255 255 255 / 0.25)",
  },
  "&:hover::after": { transform: "translateX(120%)" },
  "&.Mui-disabled": {
    background: "var(--mui-palette-action-disabledBackground)",
    color: "var(--mui-palette-action-disabled)",
    boxShadow: "none",
  },
})) as typeof Button;

/** Primary call-to-action with the theme's brand gradient. */
const GradientButton: typeof Button = ((props: ButtonProps) => (
  <StyledButton variant="contained" {...props} />
)) as typeof Button;

export default GradientButton;
