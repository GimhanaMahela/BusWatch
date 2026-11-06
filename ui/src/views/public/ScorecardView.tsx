import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useFormatter, useTranslations } from "next-intl";
import { GradientButton, PageViewEvent } from "@/components/atoms";
import {
  EmptyState,
  HorizontalBarList,
  ImpactTrendChart,
  SectionPanel,
  StatTile,
} from "@/components/molecules";
import { HeroBand } from "@/components/templates";
import { busQuery } from "@/lib/busNumber";
import type { BusScorecard, RouteScorecard } from "@/types/public";

type ScorecardViewProps =
  { kind: "bus"; card: BusScorecard | null } | { kind: "route"; card: RouteScorecard | null };

/**
 * Public scorecard for a bus or route. Published only when enough reports have been checked by
 * admins (the fairness rule enforced by the API); complaint figures need that minimum on their own.
 */
function ScorecardView(props: ScorecardViewProps) {
  const t = useTranslations("scorecard");
  const tImpact = useTranslations("impact");
  const tCategory = useTranslations("categories");
  const format = useFormatter();
  const { card } = props;

  const name = props.kind === "bus" ? props.card?.busNumber : props.card?.routeNumber;
  const monthName = (month: string) => {
    const [year = 1970, m = 1] = month.split("-").map(Number);
    return format.dateTime(new Date(year, m - 1, 1), { month: "long", year: "numeric" });
  };
  const subtitle =
    props.kind === "bus" && props.card?.busName
      ? `${props.card.busName}${props.card.routes?.length ? ` · ${t("routes", { routes: props.card.routes.join(", ") })}` : ""}`
      : card?.since
        ? t("since", { month: monthName(card.since) })
        : undefined;

  const back = (
    <Button
      href="/impact"
      startIcon={<ArrowBackRoundedIcon />}
      color="inherit"
      sx={{ mb: 2, ml: -1 }}
    >
      {t("back")}
    </Button>
  );

  if (!card) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        {back}
        <Alert severity="warning">{tImpact("unavailable")}</Alert>
      </Container>
    );
  }

  const busCtas =
    props.kind === "bus" ? (
      <Box sx={{ display: "flex", gap: 1.5, mt: 4, flexWrap: "wrap" }}>
        <GradientButton
          href={`/submit-report${busQuery(props.card?.busNumber ?? "")}`}
          startIcon={<EditNoteRoundedIcon />}
        >
          {t("reportCta")}
        </GradientButton>
        <Button
          href={`/commend-a-driver${busQuery(props.card?.busNumber ?? "")}`}
          variant="outlined"
          color="success"
          startIcon={<ThumbUpAltRoundedIcon />}
        >
          {t("commendCta")}
        </Button>
      </Box>
    ) : null;

  const hero = (
    <HeroBand
      eyebrow={props.kind === "bus" ? t("busEyebrow") : t("routeEyebrow")}
      title={name}
      subtitle={card.published ? subtitle : undefined}
    >
      {busCtas}
    </HeroBand>
  );

  if (!card.published) {
    return (
      <>
        {hero}
        <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
          {back}
          <Card>
            <EmptyState
              icon={<BalanceRoundedIcon />}
              title={t("notPublishedTitle")}
              description={t("notPublishedText", { min: card.minPublicReports })}
            />
          </Card>
        </Container>
      </>
    );
  }

  const { complaints, commendations } = card;
  return (
    <>
      <PageViewEvent event="scorecard_view" />
      {hero}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        {back}
        <Grid container spacing={2.5}>
          {complaints ? (
            <>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatTile
                  label={t("checked")}
                  value={complaints.checked}
                  icon={<FactCheckRoundedIcon />}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatTile
                  label={t("resolved")}
                  value={complaints.resolved}
                  hint={`${t("resolutionRate")}: ${complaints.resolutionRate}%`}
                  icon={<TaskAltRoundedIcon />}
                  tone="success"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatTile
                  label={t("inProgress")}
                  value={complaints.inProgress}
                  icon={<HourglassTopRoundedIcon />}
                  tone="warning"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatTile
                  label={t("rating")}
                  value={
                    complaints.averageRating === null ? "–" : `${complaints.averageRating} / 5`
                  }
                  hint={complaints.averageRating === null ? tImpact("noData") : undefined}
                  icon={<StarRoundedIcon />}
                  tone="secondary"
                />
              </Grid>
            </>
          ) : (
            <Grid size={12}>
              <Alert severity="info" icon={<BalanceRoundedIcon />}>
                {t("complaintsHidden", { min: card.minPublicReports })}
              </Alert>
            </Grid>
          )}

          {complaints && (
            <>
              <Grid size={{ xs: 12, lg: 7 }}>
                <SectionPanel
                  title={t("trendTitle")}
                  icon={<TimelineRoundedIcon fontSize="small" />}
                >
                  <ImpactTrendChart
                    data={complaints.byMonth}
                    series={[
                      {
                        key: "count",
                        label: t("checked"),
                        color: "var(--mui-palette-primary-main)",
                      },
                    ]}
                  />
                </SectionPanel>
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <SectionPanel
                  title={t("complaintsTitle")}
                  icon={<CategoryRoundedIcon fontSize="small" />}
                >
                  <HorizontalBarList
                    unit=""
                    rows={complaints.byCategory.map((c) => ({
                      key: c.category,
                      label: tCategory(c.category),
                      value: c.count,
                    }))}
                  />
                </SectionPanel>
              </Grid>
            </>
          )}

          <Grid size={{ xs: 12, md: props.kind === "route" ? 6 : 12 }}>
            <SectionPanel
              title={t("praiseTitle")}
              subtitle={`${t("commendations")}: ${commendations?.count ?? 0}`}
              icon={<ThumbUpAltRoundedIcon fontSize="small" />}
            >
              <HorizontalBarList
                unit=""
                emptyText={tImpact("noData")}
                rows={(commendations?.byCategory ?? []).map((c) => ({
                  key: c.category,
                  label: tCategory(c.category),
                  value: c.count,
                }))}
              />
            </SectionPanel>
          </Grid>

          {props.kind === "route" && (
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionPanel
                title={t("busesTitle")}
                subtitle={t("busesSubtitle")}
                icon={<DirectionsBusRoundedIcon fontSize="small" />}
              >
                {props.card?.buses?.length ? (
                  <List dense disablePadding>
                    {props.card.buses.map((b) => (
                      <ListItemButton
                        key={b.busNumber}
                        href={`/bus/${encodeURIComponent(b.busNumber)}`}
                        sx={{ borderRadius: 2 }}
                      >
                        <ListItemText
                          primary={b.busNumber}
                          slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                          {t("reportsCount", { count: b.count })}
                        </Typography>
                        <ChevronRightRoundedIcon fontSize="small" color="action" />
                      </ListItemButton>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {tImpact("noData")}
                  </Typography>
                )}
              </SectionPanel>
            </Grid>
          )}
        </Grid>
      </Container>
    </>
  );
}

export default ScorecardView;
