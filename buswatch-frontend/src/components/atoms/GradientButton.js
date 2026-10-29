import React from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";

// Per-size overrides on top of MUI's own size handling
const SIZES = {
  small: { fontSize: "0.9rem", padding: [1, 2.5], lift: 1 },
  medium: { fontSize: "1rem", padding: [1.5, 4], lift: 3 },
  large: { fontSize: "1.1rem", padding: [1.5, 4], lift: 2 },
};

const StyledButton = styled(Button)(({ theme, size = "medium" }) => {
  const { fontSize, padding, lift } = SIZES[size] || SIZES.medium;
  return {
    fontSize,
    padding: theme.spacing(...padding),
    borderRadius: 50,
    fontWeight: 700,
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: `translateY(-${lift}px)`,
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    },
    "&.Mui-disabled": {
      background: theme.palette.grey[300],
      color: theme.palette.grey[500],
      boxShadow: "none",
    },
  };
});

/** Primary call-to-action: pill-shaped button with the brand gradient. */
const GradientButton = React.forwardRef((props, ref) => (
  <StyledButton ref={ref} variant="contained" {...props} />
));
GradientButton.displayName = "GradientButton";

export default GradientButton;
