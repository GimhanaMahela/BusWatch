import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/atoms";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <Box
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", p: 3 }}
    >
      <Box>
        <BrandMark />
        <Typography
          sx={{
            fontSize: { xs: "5rem", md: "7rem" },
            fontWeight: 800,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            mt: 4,
            color: "primary.main",
          }}
        >
          404
        </Typography>
        <Typography variant="h5" component="h1" sx={{ mt: 1 }}>
          {t("title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t("text")}
        </Typography>
        <Button href="/" variant="contained" startIcon={<ArrowBackRoundedIcon />} sx={{ mt: 4 }}>
          {t("back")}
        </Button>
      </Box>
    </Box>
  );
}
