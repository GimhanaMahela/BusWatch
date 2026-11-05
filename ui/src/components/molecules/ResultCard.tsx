import { Box, Card, Container } from "@mui/material";
import type { ReactNode } from "react";

/** Centred confirmation card with a round icon badge (report sent, saved offline, ...). */
function ResultCard({
  icon,
  color,
  children,
}: {
  icon: ReactNode;
  color: "success" | "info";
  children: ReactNode;
}) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Card sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            mx: "auto",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: `${color}.main`,
            bgcolor: `rgba(var(--mui-palette-${color}-mainChannel) / 0.12)`,
            "& svg": { fontSize: 40 },
          }}
        >
          {icon}
        </Box>
        {children}
      </Card>
    </Container>
  );
}

export default ResultCard;
