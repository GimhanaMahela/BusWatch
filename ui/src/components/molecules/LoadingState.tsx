import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps {
  message?: string;
  hint?: string;
  minHeight?: string;
}

/** Centred spinner with a message, for whole-page or whole-section loading. */
function LoadingState({ message = "Loading...", hint, minHeight = "70vh" }: LoadingStateProps) {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight,
      }}
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
