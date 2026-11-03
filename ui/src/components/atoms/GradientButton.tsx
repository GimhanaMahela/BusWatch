"use client";

import { Button, type ButtonProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.common.white,
  background: "linear-gradient(135deg, #5B83FF 0%, #2457F5 50%, #7A4DF0 100%)",
  backgroundSize: "200% 100%",
  backgroundPosition: "0% 0%",
  boxShadow: "0 10px 24px -10px rgba(36, 87, 245, 0.7)",
  transition: "background-position 0.4s ease, transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    backgroundPosition: "100% 0%",
    transform: "translateY(-1px)",
    boxShadow: "0 14px 28px -10px rgba(36, 87, 245, 0.8)",
  },
  "&.Mui-disabled": {
    background: "var(--mui-palette-action-disabledBackground)",
    color: "var(--mui-palette-action-disabled)",
    boxShadow: "none",
  },
})) as typeof Button;

/** Primary call-to-action with the brand gradient. */
const GradientButton: typeof Button = ((props: ButtonProps) => (
  <StyledButton variant="contained" {...props} />
)) as typeof Button;

export default GradientButton;
