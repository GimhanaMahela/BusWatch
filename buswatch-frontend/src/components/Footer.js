import React from "react";
import { Box, Typography, Container } from "@mui/material";

function Footer() {
  return (
    <Box sx={{ bgcolor: "primary.main", color: "white", py: 3, mt: "auto" }}>
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          &copy; {new Date().getFullYear()} BusWatch. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;
