import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { Alert, Box, Card, Container, Link as MuiLink, Typography } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import HeroBand from "./HeroBand";

export interface ContentSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface ContentPageTemplateProps {
  title: string;
  updated?: string;
  intro?: ReactNode;
  sections: ContentSection[];
}

/**
 * Long-form text page (policies, terms): hero, sticky table of contents and sections.
 * The legal text itself is English; other languages get a note saying so.
 */
function ContentPageTemplate({ title, updated, intro, sections }: ContentPageTemplateProps) {
  const t = useTranslations("legal");
  const locale = useLocale();
  return (
    <>
      <HeroBand
        eyebrow={t("eyebrow")}
        title={title}
        subtitle={updated && t("updated", { date: updated })}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Box
          sx={{ display: "grid", gridTemplateColumns: { md: "240px 1fr" }, gap: { xs: 4, md: 6 } }}
        >
          <Box
            component="nav"
            aria-label="On this page"
            sx={{ display: { xs: "none", md: "block" } }}
          >
            <Box sx={{ position: "sticky", top: 100 }}>
              <Typography variant="overline" color="text.secondary">
                {t("onThisPage")}
              </Typography>
              <Box
                component="ol"
                sx={{ listStyle: "none", p: 0, m: 0, mt: 1, borderLeft: 2, borderColor: "divider" }}
              >
                {sections.map((s) => (
                  <Box component="li" key={s.id}>
                    <MuiLink
                      href={`#${s.id}`}
                      underline="none"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        py: 0.75,
                        pl: 2,
                        ml: "-2px",
                        fontSize: "0.9rem",
                        borderLeft: 2,
                        borderColor: "transparent",
                        "&:hover": { color: "primary.main", borderColor: "primary.main" },
                      }}
                    >
                      {s.title}
                    </MuiLink>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Card
            component="article"
            sx={{
              p: { xs: 3, md: 6 },
              "& p": { mt: 0, mb: 2, lineHeight: 1.75, color: "text.secondary" },
              "& ul": { pl: 3, mb: 2, color: "text.secondary", lineHeight: 1.75 },
              "& h3": { fontSize: "1.05rem", fontWeight: 700, mt: 3, mb: 1 },
              "& strong": { color: "text.primary" },
            }}
          >
            {locale !== "en" && (
              <Alert severity="info" icon={<TranslateRoundedIcon />} sx={{ mb: 4 }}>
                {t("englishOnly")}
              </Alert>
            )}
            {intro && (
              <Box sx={{ mb: 5 }} lang="en">
                {intro}
              </Box>
            )}
            {sections.map((s) => (
              <Box
                component="section"
                key={s.id}
                id={s.id}
                lang="en"
                sx={{ scrollMarginTop: 96, "&:not(:first-of-type)": { mt: 5 } }}
              >
                <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                  {s.title}
                </Typography>
                {s.body}
              </Box>
            ))}
          </Card>
        </Box>
      </Container>
    </>
  );
}

export default ContentPageTemplate;
