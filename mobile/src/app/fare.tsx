import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { checkFare, getFareRoute, getFareRoutes } from "@/api/explore";
import { ChoiceChips, TextField } from "@/components/form";
import { AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import type { ServiceClass } from "../../../api/src/config/constants";

/** The official NTC fare between two stops, and whether the passenger paid too much. */
export default function FareScreen() {
  const { t } = useI18n();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [routeId, setRouteId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [serviceClass, setServiceClass] = useState<ServiceClass | "">("");
  const [paid, setPaid] = useState("");

  const routes = useQuery({ queryKey: ["fare-routes"], queryFn: getFareRoutes });
  const route = useQuery({
    queryKey: ["fare-route", routeId],
    queryFn: () => getFareRoute(routeId ?? ""),
    enabled: routeId !== null,
  });

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = routes.data ?? [];
    return term
      ? all.filter(
          (option) =>
            option.routeNumber.toLowerCase().includes(term) ||
            option.name.toLowerCase().includes(term),
        )
      : all;
  }, [routes.data, search]);

  const check = useMutation({
    mutationFn: () =>
      checkFare({
        routeId: routeId ?? "",
        from: Number(from),
        to: Number(to),
        serviceClass: serviceClass || "normal",
        charged: paid.trim() ? Number(paid) : undefined,
      }),
  });

  const pickRoute = (id: string) => {
    setRouteId(id);
    setFrom("");
    setTo("");
    setServiceClass("");
    check.reset();
  };

  const stops = route.data?.stops ?? [];
  const stopOptions = stops.map((stop, index) => ({ value: String(index), label: stop.name }));
  const result = check.data;

  return (
    <Screen>
      <Hero eyebrow={t("fare.eyebrow")} title={t("fare.title")} subtitle={t("fare.subtitle")} />

      <Card>
        <SectionTitle icon="git-network" color={accents.teal}>
          {t("fare.route")}
        </SectionTitle>
        {routes.isPending && <ActivityIndicator color={theme.primary} />}
        {routes.isError && (
          <AppText style={{ color: theme.error }}>{t("fare.unavailable")}</AppText>
        )}
        {routes.data?.length === 0 && <AppText variant="secondary">{t("fare.noRoutes")}</AppText>}
        {(routes.data?.length ?? 0) > 0 && (
          <>
            <TextField
              label={t("fare.route")}
              value={search}
              onChangeText={setSearch}
              placeholder={t("fare.routePlaceholder")}
            />
            {matches.length === 0 && (
              <AppText variant="secondary">{t("fare.routeMissing")}</AppText>
            )}
            <View style={{ gap: spacing.sm }}>
              {matches.slice(0, 8).map((option) => {
                const selected = option.id === routeId;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => pickRoute(option.id)}
                    style={[
                      styles.route,
                      {
                        borderColor: selected ? accents.teal : theme.divider,
                        backgroundColor: selected ? `${accents.teal}14` : theme.surface,
                      },
                    ]}
                  >
                    <View style={[styles.routeNumber, { backgroundColor: accents.teal }]}>
                      <Text style={styles.routeNumberText}>{option.routeNumber}</Text>
                    </View>
                    <AppText style={{ flex: 1 }}>{option.name}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </Card>

      {routeId && route.isPending && <ActivityIndicator color={theme.primary} />}
      {route.data && (
        <Card>
          <SectionTitle icon="pin" color={accents.orange}>
            {route.data.routeNumber} · {route.data.name}
          </SectionTitle>
          <ChoiceChips
            label={t("fare.from")}
            options={stopOptions}
            value={from}
            onChange={setFrom}
          />
          <ChoiceChips label={t("fare.to")} options={stopOptions} value={to} onChange={setTo} />
          <ChoiceChips
            label={t("fare.serviceClass")}
            options={route.data.serviceClasses.map((value) => ({
              value,
              label: t(`serviceClasses.${value}`),
              color: accents.violet,
            }))}
            value={serviceClass}
            onChange={setServiceClass}
          />
          <TextField
            label={t("fare.paid")}
            helper={t("fare.paidHelp")}
            value={paid}
            onChangeText={(value) => setPaid(value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="Rs."
          />
          {check.isError && <AppText style={{ color: theme.error }}>{t("fare.failed")}</AppText>}
          <Button
            icon="calculator"
            label={t("fare.check")}
            loading={check.isPending}
            disabled={from === "" || to === "" || from === to}
            onPress={() => check.mutate()}
          />
        </Card>
      )}

      {result && (
        <Card accent={result.overchargedBy > 0 ? accents.red : accents.green}>
          <AppText variant="label">{t("fare.officialFare")}</AppText>
          <Text style={[styles.fare, { color: theme.text }]}>Rs. {result.officialFare}</Text>
          <AppText variant="secondary">
            {t("fare.resultDetail", {
              from: result.from,
              to: result.to,
              stages: result.stages,
              serviceClass: t(`serviceClasses.${result.serviceClass}`),
            })}
          </AppText>
          {result.chargedFare !== null && (
            <View
              style={[
                styles.verdict,
                {
                  backgroundColor:
                    result.overchargedBy > 0 ? `${accents.red}14` : `${accents.green}14`,
                },
              ]}
            >
              <AppText
                style={{
                  color: result.overchargedBy > 0 ? accents.red : accents.green,
                  fontWeight: "700",
                }}
              >
                {result.overchargedBy > 0
                  ? t("fare.overcharged", { amount: result.overchargedBy })
                  : t("fare.fair")}
              </AppText>
            </View>
          )}
          {result.overchargedBy > 0 && (
            <Button
              variant="accent"
              icon="megaphone"
              label={t("fare.report")}
              onPress={() =>
                router.push({
                  pathname: "/report",
                  params: { route: result.routeNumber, category: "overcharging" },
                })
              }
            />
          )}
          <AppText variant="secondary" style={{ fontSize: 13 }}>
            {t("fare.disclaimer")}
          </AppText>
        </Card>
      )}

      <AppText variant="secondary" style={{ textAlign: "center", fontSize: 13 }}>
        {t("fare.howItWorks")}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    borderWidth: 2,
    borderRadius: radius,
    padding: spacing.sm + 2,
  },
  routeNumber: {
    minWidth: 44,
    height: 32,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  routeNumberText: { color: "#FFFFFF", fontWeight: "800" },
  fare: { fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  verdict: { borderRadius: radius, padding: spacing.sm + 4 },
});
