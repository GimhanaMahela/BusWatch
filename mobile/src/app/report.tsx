import { useMutation } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useColorScheme,
  type ScrollViewInstance,
} from "react-native";

import { TURNSTILE_SITE_KEY } from "@/api/client";
import { ChoiceChips, TextField } from "@/components/form";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Turnstile } from "@/components/Turnstile";
import { AppText, Button, Card, SectionTitle, type IconName } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import { parseBusNumber, parseRoute } from "@/lib/qr";
import {
  BUS_SERVICES,
  CATEGORIES_FOR,
  COMMENDEES,
  emptyDraft,
  isAppReportType,
  type AppReportType,
  MAX_DESCRIPTION,
  validateDraft,
  type DraftErrors,
  type ReportDraft,
} from "@/lib/reportDraft";
import { submitOrQueue } from "@/lib/submitOrQueue";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { accents, categoryStyle, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

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

  // Offline, the report is saved without a token; it gets a fresh one when it is sent
  const needsCaptcha = TURNSTILE_SITE_KEY !== "" && !captcha && outbox.online;

  const submit = () => {
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scroll.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!needsCaptcha) send.mutate();
  };

  const fillMyLocation = async () => {
    const pin = await locate();
    if (!pin) return;
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
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: t(text.title) }} />
        <AppText variant="secondary">{t(text.subtitle)}</AppText>
        {draft.source === "qr" && draft.busNumber ? (
          <Card accent={accents.violet}>
            <AppText>{t("submit.qrBanner", { bus: draft.busNumber })}</AppText>
          </Card>
        ) : null}
        {!outbox.online && (
          <AppText style={{ color: theme.warning, fontWeight: "600" }}>
            {t("submit.offlineBanner")}
          </AppText>
        )}
        {hasErrors && (
          <AppText style={{ color: theme.error, fontWeight: "600" }}>{t("app.fixErrors")}</AppText>
        )}

        <Card>
          <SectionTitle icon="bus" color={accents.blue}>
            {t("submit.stepBus")}
          </SectionTitle>
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
              options={BUS_SERVICES.map((value) => ({ value, label: t(`busServices.${value}`) }))}
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
                color: accents.green,
              }))}
              value={draft.commendee}
              onChange={(value) => update("commendee", value)}
              error={error("commendee")}
            />
          )}
          <ChoiceChips
            label={t(text.category)}
            options={CATEGORIES_FOR[draft.type].map((value) => ({
              value,
              label: t(`categories.${value}`),
              icon: categoryStyle[value]?.icon as IconName | undefined,
              color: categoryStyle[value]?.color ?? look.color,
            }))}
            value={draft.category}
            onChange={(value) => update("category", value)}
            error={error("category")}
          />
        </Card>

        <Card>
          <SectionTitle icon={look.icon} color={look.color}>
            {t("submit.stepIncident")}
          </SectionTitle>
          <TextField
            label={t(text.where)}
            value={draft.location}
            onChangeText={(value) => update("location", value)}
            placeholder={t(text.wherePlaceholder)}
            error={error("location")}
          />
          {draft.latitude !== undefined && draft.longitude !== undefined ? (
            <View style={{ gap: spacing.xs }}>
              <AppText variant="secondary">
                {t("location.pinned", {
                  lat: draft.latitude.toFixed(5),
                  lng: draft.longitude.toFixed(5),
                })}
              </AppText>
              <Button
                variant="outline"
                icon="close-circle-outline"
                label={t("location.removePin")}
                onPress={removePin}
              />
            </View>
          ) : (
            <Button
              variant="outline"
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
          <PhotoPicker photos={draft.photos} onChange={(photos) => update("photos", photos)} />
          <TextField
            label={t("submit.email")}
            value={draft.email}
            onChangeText={(value) => update("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            helper={t("submit.emailHelp")}
            error={error("email")}
          />
          <TextField
            label={t("submit.phone")}
            value={draft.phone}
            onChangeText={(value) => update("phone", value)}
            keyboardType="phone-pad"
            autoComplete="tel"
            helper={t("submit.phoneHelp")}
            error={error("phone")}
          />
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
          <AppText style={{ color: theme.error }}>
            {send.error.message || t("submit.failed")}
          </AppText>
        )}
        <AppText variant="secondary">
          {t("submit.consent", { terms: plain, privacy: plain })}
        </AppText>
        <Button
          variant="accent"
          icon={look.sendIcon}
          label={t(text.send)}
          onPress={submit}
          loading={send.isPending}
          disabled={needsCaptcha}
        />
        {needsCaptcha && <AppText variant="secondary">{t("app.securityCheckNeeded")}</AppText>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
