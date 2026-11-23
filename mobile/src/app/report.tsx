import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  type ScrollViewInstance,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import type { ReportCategory } from "../../../api/src/config/constants";
import { TURNSTILE_SITE_KEY } from "@/api/client";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ChoiceChips, TextField } from "@/components/form";
import { haptic, PressableScale } from "@/components/motion";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Turnstile } from "@/components/Turnstile";
import { AppText, Button, Card, IconBubble, SectionTitle, type IconName } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { parseBusNumber, parseRoute } from "@/lib/qr";
import {
  BUS_SERVICES,
  CATEGORIES_FOR,
  COMMENDEES,
  emptyDraft,
  errorsForStep,
  firstStepWithErrors,
  isAppReportType,
  type AppReportType,
  MAX_DESCRIPTION,
  validateDraft,
  type DraftErrors,
  type ReportDraft,
} from "@/lib/reportDraft";
import { submitOrQueue } from "@/lib/submitOrQueue";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { accents, gradients, radius, radiusLarge, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const STEPS = 4;

const plain = (chunks: string[]) => chunks.join("");

/** The website's text for each form: complaint (submit.*), commendation (commend.*), lost (lost.*) */
const TEXT: Record<
  AppReportType,
  {
    title: string;
    subtitle: string;
    category: string;
    where: string;
    wherePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    send: string;
  }
> = {
  complaint: {
    title: "submit.title",
    subtitle: "submit.subtitle",
    category: "submit.categoryQuestion",
    where: "submit.where",
    wherePlaceholder: "submit.wherePlaceholder",
    description: "submit.description",
    descriptionPlaceholder: "submit.descriptionPlaceholder",
    send: "submit.send",
  },
  commendation: {
    title: "commend.title",
    subtitle: "commend.subtitle",
    category: "commend.whatWasGood",
    where: "commend.where",
    wherePlaceholder: "commend.wherePlaceholder",
    description: "commend.description",
    descriptionPlaceholder: "commend.descriptionPlaceholder",
    send: "commend.send",
  },
  lost_item: {
    title: "lost.title",
    subtitle: "lost.subtitle",
    category: "lost.whatLost",
    where: "lost.where",
    wherePlaceholder: "lost.wherePlaceholder",
    description: "lost.description",
    descriptionPlaceholder: "lost.descriptionPlaceholder",
    send: "lost.send",
  },
};

const TYPE_LOOK: Record<AppReportType, { color: string; icon: IconName; sendIcon: IconName }> = {
  complaint: { color: accents.orange, icon: "location", sendIcon: "paper-plane" },
  commendation: { color: accents.green, icon: "heart", sendIcon: "heart" },
  lost_item: { color: accents.amber, icon: "briefcase", sendIcon: "paper-plane" },
};

export default function ReportScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const scroll = useRef<ScrollViewInstance>(null);

  // ?type=commendation|lost_item picks the form; ?bus=…&route=…&src=qr comes from a sticker scan;
  // category, location and description come from the helper chat's draft. All are untrusted.
  const params = useLocalSearchParams<{
    type?: string;
    bus?: string;
    route?: string;
    src?: string;
    category?: string;
    location?: string;
    description?: string;
  }>();
  const [draft, setDraft] = useState<ReportDraft>(() => {
    const type = isAppReportType(params.type) ? params.type : "complaint";
    const category = CATEGORIES_FOR[type].find((option) => option === params.category) ?? "";
    return {
      ...emptyDraft(type),
      busNumber: parseBusNumber(params.bus),
      routeNumber: parseRoute(params.route),
      source: params.src === "qr" ? "qr" : "app",
      category,
      location: (params.location ?? "").slice(0, 200),
      description: (params.description ?? "").slice(0, MAX_DESCRIPTION),
    };
  });
  const text = TEXT[draft.type];
  const look = TYPE_LOOK[draft.type];
  const [errors, setErrors] = useState<DraftErrors>({});
  const [captcha, setCaptcha] = useState<string | null>(null);
  // A Turnstile token works once: a failed send needs a fresh widget
  const [captchaKey, setCaptchaKey] = useState(0);
  const { locate, locating, error: locationError } = useCurrentLocation();
  const outbox = useOutbox();

  const update = <K extends keyof ReportDraft>(field: K, value: ReportDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  // Sends the report, or keeps it on the phone when there is no connection (like the website)
  const send = useMutation({
    mutationFn: () => submitOrQueue(draft, locale, captcha, outbox),
    onSuccess: (result) => {
      router.replace({
        pathname: "/report-sent",
        params:
          result === "queued"
            ? { queued: "1" }
            : {
                type: draft.type,
                receiptId: result.receiptId,
                emailed: result.emailSent ? "1" : "",
                texted: result.smsSent ? "1" : "",
              },
      });
    },
    onError: () => {
      setCaptcha(null);
      setCaptchaKey((key) => key + 1);
    },
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const progress = useSharedValue(1 / STEPS);
  useEffect(() => {
    progress.set(withSpring((step + 1) / STEPS, { damping: 18, stiffness: 140 }));
  }, [step, progress]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Offline, the report is saved without a token; it gets a fresh one when it is sent
  const needsCaptcha = TURNSTILE_SITE_KEY !== "" && !captcha && outbox.online;

  const goTo = (next: number) => {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const next = () => {
    const found = errorsForStep(draft, step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      haptic("warning");
      return;
    }
    goTo(step + 1);
  };

  const back = () => (step === 0 ? router.back() : goTo(step - 1));

  const submit = () => {
    const first = firstStepWithErrors(draft);
    if (first !== -1) {
      setErrors(validateDraft(draft));
      haptic("warning");
      goTo(first);
      return;
    }
    if (!needsCaptcha) send.mutate();
  };

  const pickCategory = (category: ReportCategory) => {
    update("category", category);
    // Choosing is the whole step: move on after a beat, so the selection is seen
    setTimeout(() => goTo(2), 280);
  };

  const fillMyLocation = async () => {
    const pin = await locate();
    if (!pin) return;
    haptic("success");
    setDraft((current) => ({
      ...current,
      latitude: pin.latitude,
      longitude: pin.longitude,
      location: current.location.trim() || pin.label || current.location,
    }));
    if (pin.label) setErrors((current) => ({ ...current, location: undefined }));
  };

  const removePin = () =>
    setDraft((current) => ({ ...current, latitude: undefined, longitude: undefined }));

  const error = (field: keyof ReportDraft) => (errors[field] ? t(errors[field]) : undefined);

  const stepTitles = [
    t("submit.stepBus"),
    t(text.category),
    t("submit.stepIncident"),
    t("submit.stepReview"),
  ];
  const stepIcons: IconName[] = ["bus", "apps", look.icon, "checkmark-done"];
  const enter = (direction === "forward" ? FadeInRight : FadeInLeft).duration(320);
  const last = step === STEPS - 1;

  const summary: { icon: IconName; label: string; value: string; step: number }[] = [
    { icon: "bus-outline", label: t("submit.reviewBus"), value: draft.busNumber || "–", step: 0 },
    {
      icon: "git-commit-outline",
      label: t("submit.reviewRoute"),
      value: draft.routeNumber || "–",
      step: 0,
    },
    {
      icon: "pricetag-outline",
      label: t("submit.reviewCategory"),
      value: draft.category ? t(`categories.${draft.category}`) : "–",
      step: 1,
    },
    {
      icon: "location-outline",
      label: t("submit.reviewWhere"),
      value:
        (draft.location.trim() || "–") +
        (draft.latitude !== undefined ? ` ${t("submit.mapPinAttached")}` : ""),
      step: 2,
    },
    {
      icon: "images-outline",
      label: t("submit.reviewEvidence"),
      value:
        draft.photos.length > 0
          ? t("submit.evidenceCount", { photos: draft.photos.length, videos: 0 })
          : t("submit.none"),
      step: 2,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen options={{ title: t(text.title) }} />

      {/* Progress: which step, and how far along */}
      <View style={styles.progressWrap}>
        <View style={styles.progressRow}>
          <IconBubble icon={stepIcons[step]} color={look.color} size={36} solid />
          <View style={{ flex: 1 }}>
            <AppText variant="label">
              {t("submit.stepOf", { current: step + 1, total: STEPS })}
            </AppText>
            <AppText variant="heading" numberOfLines={1}>
              {stepTitles[step]}
            </AppText>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
          <Animated.View style={[styles.trackFill, progressStyle]}>
            <LinearGradient
              colors={
                draft.type === "complaint" ? gradients.sunrise : [look.color, `${look.color}B3`]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={step} entering={enter} style={{ gap: spacing.md }}>
          {step === 0 && (
            <>
              <AppText variant="secondary">{t(text.subtitle)}</AppText>
              {!outbox.online && (
                <Card accent={theme.warning}>
                  <AppText style={{ color: theme.warning, fontWeight: "600" }}>
                    {t("submit.offlineBanner")}
                  </AppText>
                </Card>
              )}
              {draft.source === "qr" && draft.busNumber ? (
                <Card accent={accents.violet}>
                  <AppText>{t("submit.qrBanner", { bus: draft.busNumber })}</AppText>
                </Card>
              ) : null}
              <Card>
                <TextField
                  label={t("submit.busNumber")}
                  value={draft.busNumber}
                  onChangeText={(value) => update("busNumber", value)}
                  placeholder="NB-1234"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={20}
                  error={error("busNumber")}
                />
                <TextField
                  label={t("submit.route")}
                  value={draft.routeNumber}
                  onChangeText={(value) => update("routeNumber", value)}
                  placeholder={t("submit.routePlaceholder")}
                  maxLength={60}
                  error={error("routeNumber")}
                />
                {draft.type === "complaint" && (
                  <ChoiceChips
                    label={t("submit.busServiceQuestion")}
                    options={BUS_SERVICES.map((value) => ({
                      value,
                      label: t(`busServices.${value}`),
                      icon: "bus-outline" as IconName,
                      color: accents.blue,
                    }))}
                    value={draft.busService}
                    onChange={(value) => update("busService", value)}
                    error={error("busService")}
                  />
                )}
                {draft.type === "commendation" && (
                  <ChoiceChips
                    label={t("commend.whoQuestion")}
                    options={COMMENDEES.map((value) => ({
                      value,
                      label: t(`commendees.${value}`),
                      icon: "person-outline" as IconName,
                      color: accents.green,
                    }))}
                    value={draft.commendee}
                    onChange={(value) => update("commendee", value)}
                    error={error("commendee")}
                  />
                )}
              </Card>
              {draft.type === "complaint" && (
                <PressableScale
                  accessibilityRole="button"
                  onPress={() => router.push("/scan")}
                  haptics="selection"
                  style={[
                    styles.scanHint,
                    { borderColor: `${accents.violet}55`, backgroundColor: `${accents.violet}10` },
                  ]}
                >
                  <Ionicons name="qr-code" size={22} color={accents.violet} />
                  <AppText style={{ flex: 1, color: accents.violet, fontWeight: "700" }}>
                    {t("app.scanTile")}
                  </AppText>
                  <Ionicons name="chevron-forward" size={18} color={accents.violet} />
                </PressableScale>
              )}
            </>
          )}

          {step === 1 && (
            <>
              {error("category") && (
                <AppText style={{ color: theme.error, fontWeight: "600" }}>
                  {error("category")}
                </AppText>
              )}
              <CategoryGrid
                categories={CATEGORIES_FOR[draft.type]}
                value={draft.category}
                onChange={pickCategory}
                fallbackColor={look.color}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Card>
                <TextField
                  label={t(text.where)}
                  value={draft.location}
                  onChangeText={(value) => update("location", value)}
                  placeholder={t(text.wherePlaceholder)}
                  error={error("location")}
                />
                {draft.latitude !== undefined && draft.longitude !== undefined ? (
                  <View style={[styles.pin, { backgroundColor: `${accents.green}14` }]}>
                    <Ionicons name="location" size={20} color={accents.green} />
                    <AppText
                      style={{ flex: 1, color: accents.green, fontWeight: "600", fontSize: 14 }}
                    >
                      {t("location.pinned", {
                        lat: draft.latitude.toFixed(5),
                        lng: draft.longitude.toFixed(5),
                      })}
                    </AppText>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={t("location.removePin")}
                      onPress={removePin}
                    >
                      <Ionicons name="close-circle" size={22} color={theme.textSecondary} />
                    </PressableScale>
                  </View>
                ) : (
                  <Button
                    variant="ghost"
                    compact
                    icon="navigate"
                    label={locating ? t("app.locating") : t("location.useMine")}
                    loading={locating}
                    onPress={() => void fillMyLocation()}
                  />
                )}
                {locationError && (
                  <AppText variant="secondary" style={{ color: theme.warning }}>
                    {t(locationError)}
                  </AppText>
                )}
              </Card>
              <Card>
                <TextField
                  label={t(text.description)}
                  value={draft.description}
                  onChangeText={(value) => update("description", value)}
                  placeholder={t(text.descriptionPlaceholder)}
                  multiline
                  maxLength={MAX_DESCRIPTION}
                  helper={`${draft.description.length} / ${MAX_DESCRIPTION}`}
                  error={error("description")}
                />
              </Card>
              <Card>
                <SectionTitle icon="camera" color={accents.violet}>
                  {t("submit.stepEvidence")}
                </SectionTitle>
                <PhotoPicker
                  photos={draft.photos}
                  onChange={(photos) => update("photos", photos)}
                />
              </Card>
            </>
          )}

          {step === 3 && (
            <>
              <Card>
                <TextField
                  label={t("submit.email")}
                  value={draft.email}
                  onChangeText={(value) => update("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="you@example.com"
                  helper={t(draft.type === "lost_item" ? "lost.contactTitle" : "submit.emailHelp")}
                  error={error("email")}
                />
                <TextField
                  label={t("submit.phone")}
                  value={draft.phone}
                  onChangeText={(value) => update("phone", value)}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  placeholder="077 123 4567"
                  helper={t("submit.phoneHelp")}
                  error={error("phone")}
                />
              </Card>

              <Card>
                <SectionTitle icon="document-text" color={accents.sky}>
                  {t("submit.stepReview")}
                </SectionTitle>
                {summary.map((row) => (
                  <PressableScale
                    key={row.label}
                    accessibilityRole="button"
                    onPress={() => goTo(row.step)}
                    haptics="selection"
                    scaleTo={0.98}
                    style={[styles.summaryRow, { borderTopColor: theme.divider }]}
                  >
                    <Ionicons name={row.icon} size={18} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="label">{row.label}</AppText>
                      <AppText numberOfLines={2}>{row.value}</AppText>
                    </View>
                    <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
                  </PressableScale>
                ))}
                {draft.description.trim() ? (
                  <View style={[styles.quote, { backgroundColor: theme.surfaceAlt }]}>
                    <AppText variant="secondary" numberOfLines={4}>
                      “{draft.description.trim()}”
                    </AppText>
                  </View>
                ) : null}
              </Card>

              {TURNSTILE_SITE_KEY !== "" && outbox.online && (
                <View style={{ gap: spacing.xs }}>
                  <AppText variant="label">{t("app.securityCheck")}</AppText>
                  <Turnstile
                    key={captchaKey}
                    siteKey={TURNSTILE_SITE_KEY}
                    language={locale}
                    theme={scheme}
                    onToken={setCaptcha}
                  />
                </View>
              )}
              {send.isError && (
                <Card accent={theme.error}>
                  <AppText style={{ color: theme.error }}>
                    {send.error.message || t("submit.failed")}
                  </AppText>
                </Card>
              )}
              <AppText variant="secondary" style={{ fontSize: 13, textAlign: "center" }}>
                {t("submit.consent", { terms: plain, privacy: plain })}
              </AppText>
            </>
          )}
        </Animated.View>
      </ScrollView>

      <View
        style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}
      >
        <View style={{ flex: 1 }}>
          <Button
            variant="outline"
            icon="arrow-back"
            label={t("common.back")}
            onPress={back}
            disabled={send.isPending}
          />
        </View>
        <View style={{ flex: 2 }}>
          {last ? (
            <Button
              variant="accent"
              icon={look.sendIcon}
              label={t(text.send)}
              onPress={submit}
              loading={send.isPending}
              disabled={needsCaptcha}
            />
          ) : (
            <Button iconRight="arrow-forward" label={t("common.continue")} onPress={next} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  progressWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm + 4,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  trackFill: { height: 8, borderRadius: 4, overflow: "hidden" },
  content: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  scanHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radiusLarge,
    padding: spacing.md,
  },
  pin: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius,
    padding: spacing.sm + 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    borderTopWidth: 1,
    paddingTop: spacing.sm + 2,
  },
  quote: { borderRadius: radius, padding: spacing.sm + 4 },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
});
