"use client";

import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Button, Card, Container, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { GradientButton } from "@/components/atoms";

/** Served by the service worker when a page is not cached and there is no connection. */
function OfflineView() {
  const t = useTranslations("offline");
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
            color: "text.secondary",
            bgcolor: "action.hover",
          }}
        >
          <CloudOffRoundedIcon sx={{ fontSize: 38 }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ mt: 3 }}>
          {t("pageTitle")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {t("pageText")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mt: 4, justifyContent: "center", flexWrap: "wrap" }}>
          <GradientButton href="/submit-report" size="large" startIcon={<EditNoteRoundedIcon />}>
            {t("pageReport")}
          </GradientButton>
          <Button
            variant="outlined"
            size="large"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => window.location.reload()}
          >
            {t("pageRetry")}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}

export default OfflineView;
