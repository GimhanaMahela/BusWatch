import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/** Centred spinner with a message, for whole-page or whole-section loading. */
function LoadingState({ message = "Loading...", hint, minHeight = "70vh" }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
      role="status"
    >
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography variant="h6" color="primary">
        {message}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingState;
