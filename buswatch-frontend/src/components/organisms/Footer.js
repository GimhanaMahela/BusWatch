// src/components/Footer.js
import React from "react";
import { Box, Typography, Container, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from "@mui/system"; // Using MUI's styled utility

const StyledFooter = styled(Box)(({ theme }) => ({
  // Consistent background with a subtle gradient
  background: `linear-gradient(145deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.common.white,
  py: theme.spacing(6), // Increased vertical padding
  mt: "auto", // Pushes footer to the bottom
  borderTop: `1px solid ${theme.palette.primary.light}40`, // Subtle border with primary light color
  boxShadow: `0 -4px 8px rgba(0, 0, 0, 0.2)`, // Shadow for a lifted effect
  textAlign: "center", // Center align content
}));

const StyledFooterLink = styled(MuiLink)(({ theme }) => ({
  color: theme.palette.common.white,
  textDecoration: "none",
  fontWeight: 500,
  transition: "color 0.3s ease-in-out, transform 0.3s ease-in-out", // Smooth transition
  "&:hover": {
    color: theme.palette.secondary.light, // Highlight on hover
    textDecoration: "underline",
    transform: "translateY(-2px)", // Subtle lift effect
  },
}));

function Footer() {
  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 1.5 }}
        >
          BusWatch
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 1, opacity: 0.9 }}>
          Your reliable partner for improving public transport in Sri Lanka.
        </Typography>
        <Typography variant="body2" align="center" sx={{ opacity: 0.7, mb: 3 }}>
          &copy; {new Date().getFullYear()} BusWatch. All rights reserved.
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: { xs: 2, md: 4 },
          }}
        >
          <StyledFooterLink component={Link} to="/privacy-policy">
            Privacy Policy
          </StyledFooterLink>
          <StyledFooterLink component={Link} to="/terms-of-service">
            Terms of Service
          </StyledFooterLink>
        </Box>
      </Container>
    </StyledFooter>
  );
}

export default Footer;
