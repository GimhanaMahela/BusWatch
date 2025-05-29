// src/pages/HomePage.js
import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
// --- CHANGE THIS LINE ---
// import { styled } from "styled-components"; // <--- This is the problem!
import { styled } from "@mui/material/styles"; // <--- Use this instead!
// -----------------------
import { Link } from "react-router-dom";

const HeroSection = styled(Box)`
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url("/assets/bus-hero.jpg"); /* Add a bus image to assets folder */
  background-size: cover;
  background-position: center;
  color: white;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  // FIX: theme.spacing is a number now, multiply it
  padding: ${({ theme }) => theme.spacing * 4}px;
`;

const HeroContent = styled(Box)`
  max-width: 800px;
  h1 {
    font-size: 3.5rem;
    // FIX: theme.spacing is a number now, multiply it
    margin-bottom: ${({ theme }) => theme.spacing * 2}px;
    ${({ theme }) => theme.breakpoints.down("md")} {
      /* This line needs the correct theme */
      font-size: 2.5rem;
    }
  }
  p {
    font-size: 1.25rem;
    // FIX: theme.spacing is a number now, multiply it
    margin-bottom: ${({ theme }) => theme.spacing * 4}px;
    ${({ theme }) => theme.breakpoints.down("md")} {
      /* This line needs the correct theme */
      font-size: 1rem;
    }
  }
  button {
    font-size: 1.2rem;
    // FIX: theme.spacing is a number now, multiply it. Use array for multiple values.
    padding: ${({ theme }) => theme.spacing * 1.5}px
      ${({ theme }) => theme.spacing * 4}px;
    border-radius: 50px;
    background-color: ${({ theme }) => theme.palette.primary.light};
    color: white;
    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.dark};
    }
  }
`;

const InfoSection = styled(Container)`
  // FIX: theme.spacing is a number now, multiply it. Use array for multiple values.
  padding: ${({ theme }) => theme.spacing * 8}px 0;
  text-align: center;
  h2 {
    // FIX: theme.spacing is a number now, multiply it
    margin-bottom: ${({ theme }) => theme.spacing * 4}px;
    color: ${({ theme }) => theme.palette.primary.main};
  }
  p {
    // FIX: theme.spacing is a number now, multiply it
    margin-bottom: ${({ theme }) => theme.spacing * 3}px;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;

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
