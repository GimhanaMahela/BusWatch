import React from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import { styled } from "@mui/system";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

// Styled component for the main container to add padding and margin
const AboutUsContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(5),
  },
}));

// Styled component for the section titles
const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

// Styled component for the contact details section
const ContactDetailsBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.common.white,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(4),
  },
}));

function AboutUs() {
  return (
    <>
      {/* Contact Details Section - Placed above the main About Us component */}
      <ContactDetailsBox>
        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Get in Touch
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          We'd love to hear from you! Reach out to us through any of the
          following channels:
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: { xs: 2, md: 4 },
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <EmailIcon sx={{ mr: 1 }} />
            <MuiLink
              href="mailto:info@buswatch.com"
              color="inherit"
              underline="hover"
            >
              info@buswatch.com
            </MuiLink>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PhoneIcon sx={{ mr: 1 }} />
            <MuiLink href="tel:+1234567890" color="inherit" underline="hover">
              +94 768389990
            </MuiLink>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocationOnIcon sx={{ mr: 1 }} />
            <Typography variant="body1">Matale, Sri Lanka</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="Facebook"
            href="https://www.facebook.com/gimhana.mahela.premawardana/"
            target="_blank"
          >
            <FacebookIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="LinkedIn"
            href="https://www.linkedin.com/in/gimhanamahela/"
            target="_blank"
          >
            <LinkedInIcon />
          </IconButton>
        </Box>
      </ContactDetailsBox>

      {/* Main About Us Component */}
      <AboutUsContainer maxWidth="md">
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            align="center"
            sx={{ fontWeight: 700, color: "primary.dark" }}
          >
            About BusWatch: Driving Better Commutes Together
          </Typography>
          <Typography
            variant="body1"
            paragraph
            align="center"
            sx={{ mb: 4, color: "text.secondary" }}
          >
            Welcome to BusWatch, your dedicated partner in transforming public
            bus services. We believe that every voice matters in shaping a more
            efficient, safer, and user-friendly public transportation system.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <SectionTitle variant="h5">
              Our Mission: Empowering Commuters
            </SectionTitle>
            <Typography variant="body1" paragraph>
              Our core mission is to empower daily commuters with a powerful
              tool to report, track, and influence the quality of public bus
              services. We are committed to fostering a transparent and
              responsive ecosystem where feedback directly translates into
              tangible improvements. By bridging the communication gap between
              passengers and transport authorities, we aim to cultivate a public
              transport network that truly serves its community.
            </Typography>
            <Typography variant="body1" paragraph>
              We strive to make your voice heard, ensuring that every journey is
              not just a ride, but a step towards a better urban experience.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <SectionTitle variant="h5">
              What We Do: Your Feedback, Our Action
            </SectionTitle>
            <Typography variant="body1" paragraph>
              BusWatch provides an intuitive and accessible platform for you to
              report a wide array of issues, ensuring that no concern goes
              unnoticed. Our comprehensive reporting categories include:
            </Typography>
            <ul>
              <li>
                <Typography variant="body1">
                  <strong>Overcrowding:</strong> Help us identify routes and
                  times needing more capacity.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Delays & Missed Schedules:</strong> Pinpoint
                  inconsistencies for improved punctuality.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Driver Behavior:</strong> Report instances of unsafe
                  driving or unprofessional conduct.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Vehicle Condition:</strong> Highlight maintenance
                  issues, cleanliness, or safety hazards.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Safety Concerns:</strong> Any incident that
                  compromises passenger safety.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Accessibility Issues:</strong> Report challenges faced
                  by passengers with disabilities.
                </Typography>
              </li>
            </ul>
            <Typography variant="body1" paragraph>
              Each report you submit is meticulously categorized and routed to
              the appropriate transport authorities for review and action. Our
              system is designed to facilitate quicker resolution and enhance
              accountability across the public transport network.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <SectionTitle variant="h5">
              Why BusWatch Matters: Community-Driven Improvement
            </SectionTitle>
            <Typography variant="body1" paragraph>
              In today's fast-paced world, efficient and reliable public
              transport is crucial. BusWatch stands as a testament to the power
              of collective action. By participating, you contribute to:
            </Typography>
            <ul>
              <li>
                <Typography variant="body1">
                  <strong>Enhanced Safety:</strong> Helping identify and rectify
                  potential hazards.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Improved Punctuality:</strong> Contributing to more
                  reliable schedules.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Better Service Quality:</strong> Encouraging higher
                  standards of vehicle maintenance and driver professionalism.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  <strong>Community Empowerment:</strong> Giving a voice to
                  every commuter.
                </Typography>
              </li>
            </ul>
            <Typography variant="body1" paragraph>
              Join us in our endeavor to build a public transportation system
              that is truly world-class, responsive, and serves the needs of
              every passenger.
            </Typography>
          </Box>

          <Box>
            <SectionTitle variant="h5">
              Our Vision: A Future of Seamless Commutes
            </SectionTitle>
            <Typography variant="body1" paragraph>
              We envision a future where public transportation is not just a
              means to an end, but a consistently excellent, comfortable, and
              reliable experience. BusWatch aspires to be the leading platform
              for public transport advocacy, innovation, and continuous
              improvement, driven by the invaluable insights of the community it
              serves.
            </Typography>
          </Box>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 5, color: "text.disabled" }}
          >
            Thank you for being an active and valued member of the BusWatch
            community! Together, we can make a difference.
          </Typography>
        </Paper>
      </AboutUsContainer>
    </>
  );
}

export default AboutUs;
