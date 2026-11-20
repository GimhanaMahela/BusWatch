import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View, useColorScheme } from "react-native";

import { TURNSTILE_SITE_KEY } from "@/api/client";
import { MultiChips, TextField } from "@/components/form";
import { Turnstile } from "@/components/Turnstile";
import { AppText, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { emptyDraft, validateDraft, type DraftErrors } from "@/lib/reportDraft";
import { submitOrQueue } from "@/lib/submitOrQueue";
import { tripLink, useTripShare } from "@/lib/useTripShare";
import { accents, radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import { SAFETY_KINDS, TRIP_SHARE, type SafetyKind } from "../../../api/src/config/constants";

// Free from any phone in Sri Lanka (same list as ui/src/constants/emergency.ts)
const CALLS = [
  { key: "emergency.police", number: "119", color: accents.red, icon: "shield" },
  { key: "emergency.ambulance", number: "1990", color: accents.orange, icon: "medkit" },
  { key: "emergency.fire", number: "110", color: accents.amber, icon: "flame" },
  { key: "safety.helpline", number: "1938", color: accents.pink, icon: "woman" },
] as const;

export default function SafetyScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const outbox = useOutbox();
  const share = useTripShare();

  const [busNumber, setBusNumber] = useState("");
  const [routeNumber, setRouteNumber] = useState("");
  const [kinds, setKinds] = useState<SafetyKind[]>([]);
  const [details, setDetails] = useState("");
  const [where, setWhere] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<DraftErrors>({});
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Refresh "last sent N seconds ago" while sharing
  useEffect(() => {
    if (!share.trip) return;
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [share.trip]);

  const draft = {
    ...emptyDraft("complaint"),
    category: "harassment" as const,
    busNumber,
    routeNumber,
    location: where,
    description: details,
    phone,
    safetyKinds: kinds,
  };

  const send = useMutation({
    mutationFn: () => submitOrQueue(draft, locale, captcha, outbox),
    onSettled: () => {
      setCaptcha(null);
      setCaptchaKey((key) => key + 1);
    },
  });

  const needsCaptcha = TURNSTILE_SITE_KEY !== "" && !captcha && outbox.online;

  const submit = () => {
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length === 0 && !needsCaptcha) send.mutate();
  };

  const shareLink = () => {
    if (!share.trip) return;
    void Share.share({
      title: t("trip.shareTitle"),
      message: t("trip.shareMessage", {
        bus: busNumber.trim() || t("trip.aBus"),
        link: tripLink(share.trip),
      }),
    });
  };

  const sent = send.data && send.data !== "queued" ? send.data : null;

  return (
    <Screen>
      <Hero
        eyebrow={t("safety.eyebrow")}
        title={t("safety.title")}
        subtitle={t("safety.subtitle")}
      />

      <View style={styles.calls}>
        {CALLS.map((call) => (
          <Pressable
            key={call.number}
            accessibilityRole="button"
            accessibilityLabel={t(call.key, { number: call.number })}
            onPress={() => void Linking.openURL(`tel:${call.number}`)}
            style={({ pressed }) => [
              styles.call,
              { backgroundColor: call.color, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Ionicons name={call.icon} size={22} color="#FFFFFF" />
            <Text style={styles.callNumber}>{call.number}</Text>
            <Text style={styles.callLabel} numberOfLines={2}>
              {t(call.key, { number: "" }).replace(/\s+$/, "")}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card accent={accents.pink}>
        <SectionTitle icon="chatbubble-ellipses" color={accents.pink}>
          {t("safety.reportTitle")}
        </SectionTitle>
        <AppText variant="secondary">{t("safety.reportText")}</AppText>
        {sent ? (
          <>
            <AppText style={{ fontWeight: "700", color: accents.green }}>
              {t("safety.sent", { receiptId: sent.receiptId })}
            </AppText>
            <Button
              icon="pulse"
              label={t("safety.track")}
              onPress={() =>
                router.push({
                  pathname: "/track/[receiptId]",
                  params: { receiptId: sent.receiptId },
                })
              }
            />
          </>
        ) : send.data === "queued" ? (
          <AppText style={{ fontWeight: "700", color: accents.amber }}>
            {t("safety.queued")}
          </AppText>
        ) : (
          <>
            <TextField
              label={t("submit.busNumber")}
              value={busNumber}
              onChangeText={setBusNumber}
              placeholder="NB-1234"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              error={errors.busNumber ? t(errors.busNumber) : undefined}
            />
            <TextField
              label={t("submit.route")}
              value={routeNumber}
              onChangeText={setRouteNumber}
              placeholder={t("submit.routePlaceholder")}
              maxLength={60}
              error={errors.routeNumber ? t(errors.routeNumber) : undefined}
            />
            <MultiChips
              label={t("safety.whatHappened")}
              options={SAFETY_KINDS.map((value) => ({ value, label: t(`safetyKinds.${value}`) }))}
              values={kinds}
              onChange={setKinds}
              color={accents.pink}
            />
            <TextField
              label={t("safety.details")}
              value={details}
              onChangeText={setDetails}
              placeholder={t("safety.detailsPlaceholder")}
              multiline
            />
            <TextField label={t("safety.where")} value={where} onChangeText={setWhere} />
            <TextField
              label={t("submit.phone")}
              helper={t("safety.contactHelp")}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone ? t(errors.phone) : undefined}
            />
            {TURNSTILE_SITE_KEY !== "" && outbox.online && (
              <Turnstile
                key={captchaKey}
                siteKey={TURNSTILE_SITE_KEY}
                language={locale}
                theme={scheme}
                onToken={setCaptcha}
              />
            )}
            {send.isError && <AppText style={{ color: theme.error }}>{t("safety.failed")}</AppText>}
            <Button
              icon="send"
              label={t("safety.send")}
              loading={send.isPending}
              disabled={needsCaptcha}
              onPress={submit}
            />
          </>
        )}
      </Card>

      <Card accent={accents.violet}>
        <SectionTitle icon="navigate-circle" color={accents.violet}>
          {t("safety.tripTitle")}
        </SectionTitle>
        <AppText variant="secondary">{t("trip.intro")}</AppText>
        {share.problem && <AppText style={{ color: accents.amber }}>{t(share.problem)}</AppText>}
        {share.trip ? (
          <>
            <View style={[styles.live, { backgroundColor: `${accents.green}14` }]}>
              <View style={[styles.liveDot, { backgroundColor: accents.green }]} />
              <AppText style={{ flex: 1, color: accents.green, fontWeight: "700" }}>
                {share.lastSent
                  ? t("trip.sharing", {
                      seconds: Math.max(0, Math.round((now - share.lastSent) / 1000)),
                    })
                  : t("trip.waiting")}
              </AppText>
            </View>
            <Button icon="share-social" label={t("trip.share")} onPress={shareLink} />
            <Button
              variant="outline"
              icon="stop-circle-outline"
              label={t("trip.stop")}
              onPress={() => void share.stop()}
            />
          </>
        ) : (
          <Button
            icon="navigate"
            label={t("trip.start")}
            loading={share.starting}
            onPress={() => void share.start(busNumber, routeNumber)}
          />
        )}
        <AppText variant="secondary" style={{ fontSize: 13 }}>
          {t("trip.privacy", { hours: TRIP_SHARE.maxHours })}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calls: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  call: {
    width: "48.5%",
    borderRadius: radius + 4,
    padding: spacing.md,
    gap: 2,
  },
  callNumber: { color: "#FFFFFF", fontSize: 26, fontWeight: "900" },
  callLabel: { color: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: "600" },
  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius,
    padding: spacing.sm + 4,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
});
