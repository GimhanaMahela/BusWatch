import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import {
  Alert,
  Box,
  Card,
  Container,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { PageViewEvent } from "@/components/atoms";
import {
  BusLookupForm,
  EmptyState,
  HorizontalBarList,
  ImpactTrendChart,
  IncidentHeatmap,
  SectionPanel,
  StatTile,
  StoryCard,
} from "@/components/molecules";
import { HeroBand } from "@/components/templates";
import type { Language } from "@/constants/reportConstants";
import type { PublicImpact, PublicStory } from "@/types/public";

/** A story in the reader's language when the team translated it, otherwise in English. */
export const localiseStory = (story: PublicStory, locale: Language) => {
  const translated = locale === "en" ? undefined : story.translations[locale];
  return translated ?? { title: story.title, body: story.body };
};

/**
 * Public impact page: shows that reporting works. Every figure is an aggregate of admin-checked
 * reports; nothing identifies a passenger, and maps show areas rather than reports.
 */
function ImpactView({ impact }: { impact: PublicImpact | null }) {
  const t = useTranslations("impact");
  const tCategory = useTranslations("categories");
  const format = useFormatter();
  const locale = useLocale() as Language;

  const hero = <HeroBand eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />;
  if (!impact) {
    return (
      <>
        {hero}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Alert severity="warning">{t("unavailable")}</Alert>
        </Container>
      </>
    );
  }

  const { totals, heatmap, minPublicReports: min } = impact;
  const duration = (hours: number | null) =>
    hours === null
      ? "–"
      : hours >= 48
        ? t("days", { value: Math.round(hours / 24) })
        : t("hours", { value: hours < 1 ? "< 1" : Math.round(hours) });
  const monthName = (month: string) => {
    const [year = 1970, m = 1] = month.split("-").map(Number);
    return format.dateTime(new Date(year, m - 1, 1), { month: "long", year: "numeric" });
  };

  return (
    <>
      <PageViewEvent event="impact_view" />
      {hero}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("updated", {
            time: format.dateTime(new Date(impact.updatedAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label={t("received")}
              value={format.number(totals.received)}
              hint={t("receivedHint", { count: totals.receivedThisMonth })}
              icon={<InboxRoundedIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label={t("resolved")}
              value={format.number(totals.resolved)}
              hint={t("resolvedHint", { count: totals.resolvedThisMonth })}
              icon={<TaskAltRoundedIcon />}
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label={t("resolutionRate")}
              value={totals.resolutionRate === null ? "–" : `${totals.resolutionRate}%`}
              hint={t("resolutionRateHint", { checked: totals.checked })}
              icon={<TimelineRoundedIcon />}
              tone="info"
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <StatTile
              label={t("medianTime")}
              value={duration(totals.medianHoursToResolve)}
              hint={totals.medianHoursToResolve === null ? t("noData") : t("medianTimeHint")}
              icon={<TimerRoundedIcon />}
              tone="secondary"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <StatTile
              label={t("commendations")}
              value={format.number(totals.commendations)}
              icon={<ThumbUpAltRoundedIcon />}
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <StatTile
              label={t("rating")}
              value={totals.averageRating === null ? "–" : `${totals.averageRating} / 5`}
              hint={totals.ratings ? t("ratingHint", { count: totals.ratings }) : t("noData")}
              icon={<StarRoundedIcon />}
              tone="warning"
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <SectionPanel
              title={t("trendTitle")}
              subtitle={t("trendSubtitle")}
              icon={<TimelineRoundedIcon fontSize="small" />}
            >
              <ImpactTrendChart
                data={impact.byMonth}
                series={[
                  {
                    key: "received",
                    label: t("seriesReceived"),
                    color: "var(--mui-palette-primary-main)",
                  },
                  {
                    key: "resolved",
                    label: t("seriesResolved"),
                    color: "var(--mui-palette-success-main)",
                  },
                ]}
              />
            </SectionPanel>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <SectionPanel
              title={t("categoriesTitle")}
              subtitle={t("categoriesSubtitle")}
              icon={<CategoryRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                unit=""
                emptyText={t("noData")}
                rows={impact.byCategory.map((c) => ({
                  key: c.category,
                  label: tCategory(c.category),
                  value: c.count,
                }))}
              />
            </SectionPanel>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <SectionPanel
              title={t("mapTitle")}
              subtitle={t("mapSubtitle", { min: heatmap.minReports })}
              icon={<MapRoundedIcon fontSize="small" />}
            >
              {heatmap.cells.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t("mapEmpty")}
                </Typography>
              )}
              <IncidentHeatmap
                cells={heatmap.cells}
                label={t("mapTitle")}
                describeCell={(cell) =>
                  t("mapCell", {
                    count: cell.count,
                    lat: cell.lat.toFixed(2),
                    lng: cell.lng.toFixed(2),
                  })
                }
              />
            </SectionPanel>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: "grid", gap: 2.5, alignContent: "start" }}>
            <SectionPanel
              title={t("routesTitle")}
              subtitle={t("routesSubtitle", { min })}
              icon={<AltRouteRoundedIcon fontSize="small" />}
            >
              {impact.topRoutes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("routesEmpty")}
                </Typography>
              ) : (
                <List dense disablePadding>
                  {impact.topRoutes.map((r) => (
                    <ListItemButton
                      key={r.routeNumber}
                      href={`/route/${encodeURIComponent(r.routeNumber)}`}
                      sx={{ borderRadius: 2 }}
                    >
                      <ListItemText
                        primary={r.routeNumber}
                        slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                        {r.count}
                      </Typography>
                      <ChevronRightRoundedIcon fontSize="small" color="action" />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </SectionPanel>
            <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Typography variant="h6" component="h2" sx={{ fontSize: "1.05rem" }}>
                {t("lookupTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {t("lookupText", { min })}
              </Typography>
              <BusLookupForm label={t("lookupLabel")} button={t("lookupButton")} />
            </Card>
          </Grid>
        </Grid>

        <Box component="section" sx={{ mt: { xs: 6, md: 9 } }}>
          <Typography variant="h4" component="h2">
            {t("storiesTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            {t("storiesSubtitle")}
          </Typography>
          {impact.stories.length === 0 ? (
            <Card>
              <EmptyState icon={<TaskAltRoundedIcon />} title={t("storiesEmpty")} />
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {impact.stories.map((story) => {
                const { title, body } = localiseStory(story, locale);
                return (
                  <Grid key={story.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <StoryCard
                      title={title}
                      body={body}
                      tags={[
                        ...(story.category ? [tCategory(story.category)] : []),
                        ...(story.routeNumber ? [story.routeNumber] : []),
                        monthName(story.month),
                      ]}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        <Card
          sx={{
            mt: { xs: 6, md: 9 },
            p: { xs: 3, md: 4 },
            display: "grid",
            gridTemplateColumns: { md: "auto 1fr" },
            gap: 3,
            bgcolor: "rgba(var(--mui-palette-info-mainChannel) / 0.05)",
          }}
        >
          <BalanceRoundedIcon sx={{ fontSize: 40, color: "info.main" }} />
          <Box>
            <Typography variant="h6" component="h2">
              {t("fairnessTitle")}
            </Typography>
            <Box
              component="ul"
              sx={{ pl: 2.5, mb: 0, mt: 1, color: "text.secondary", "& li": { mb: 0.75 } }}
            >
              <li>{t("fairness1")}</li>
              <li>{t("fairness2", { min })}</li>
              <li>{t("fairness3")}</li>
            </Box>
          </Box>
        </Card>
      </Container>
    </>
  );
}

export default ImpactView;
