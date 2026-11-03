import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps {
  message?: string;
  hint?: string;
  minHeight?: string;
}

/** Centred spinner with a message, for whole-page or whole-section loading. */
function LoadingState({ message = "Loading...", hint, minHeight = "60vh" }: LoadingStateProps) {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1.5,
        minHeight,
      }}
    >
      <CircularProgress size={40} thickness={4.5} />
      <Typography variant="subtitle1" color="text.secondary">
        {message}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.disabled">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingState;
