// src/pages/HomePage.js
import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { styled } from "@mui/material/styles"; // Correct import for MUI's styled utility
import { Link } from "react-router-dom";

// Import the background image
import busHero from "../assets/bus-hero.jpg"; // Adjust this path if your image is located elsewhere

const HeroSection = styled(Box)(({ theme }) => ({
  // Use the imported image variable in the URL
  background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${busHero})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: theme.spacing(4),
}));

const HeroContent = styled(Box)(({ theme }) => ({
  maxWidth: 800,
  "& h1": {
    fontSize: "3.5rem",
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("md")]: {
      fontSize: "2.5rem",
    },
  },
  "& p": {
    fontSize: "1.25rem",
    marginBottom: theme.spacing(4),
    [theme.breakpoints.down("md")]: {
      fontSize: "1rem",
    },
  },
  "& button": {
    fontSize: "1.2rem",
    padding: theme.spacing(1.5, 4),
    borderRadius: 50,
    backgroundColor: theme.palette.primary.light,
    color: "white",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const InfoSection = styled(Container)(({ theme }) => ({
  padding: theme.spacing(8, 0),
  textAlign: "center",
  "& h2": {
    marginBottom: theme.spacing(4),
    color: theme.palette.primary.main,
  },
  "& p": {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
}));

function HomePage() {
  return (
    <>
      <HeroSection>
        <HeroContent>
          <Typography variant="h1" component="h1">
            BusWatch: Your Eye on Public Transport
          </Typography>
          <Typography variant="h5" component="p">
            Report issues quickly and help us improve public transport for
            everyone.
          </Typography>
          <Button variant="contained" component={Link} to="/submit-report">
            Submit a Report Now
          </Button>
        </HeroContent>
      </HeroSection>

      <InfoSection maxWidth="md">
        <Typography variant="h2" component="h2">
          How It Works
        </Typography>
        <Typography variant="body1">
          BusWatch allows ordinary citizens to report various issues related to
          public bus transport, such as over-speeding, reckless driving,
          unpunctuality, misconduct of staff, or unhygienic conditions. Your
          reports help authorities take necessary action to ensure a safer and
          more reliable transport system.
        </Typography>
        <Typography variant="body1">
          Simply fill out our easy-to-use form, optionally attach photos or
          videos as evidence, and receive a unique receipt ID for your report.
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          component={Link}
          to="/submit-report"
          sx={{ mt: 4 }}
        >
          Learn More & Submit
        </Button>
      </InfoSection>
    </>
  );
}

export default HomePage;
