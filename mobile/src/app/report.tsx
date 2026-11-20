import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useColorScheme,
  type ScrollViewInstance,
} from "react-native";

import NetInfo from "@react-native-community/netinfo";

import { ApiError, TURNSTILE_SITE_KEY } from "@/api/client";
import { submitReport, type SubmitResult } from "@/api/reports";
import { ChoiceChips, TextField } from "@/components/form";
import { PhotoPicker } from "@/components/PhotoPicker";
import { Turnstile } from "@/components/Turnstile";
import { AppText, Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useOutbox } from "@/lib/OutboxProvider";
import {
  APP_COMPLAINT_CATEGORIES,
  BUS_SERVICES,
  emptyDraft,
  MAX_DESCRIPTION,
  toFormData,
  validateDraft,
  type DraftErrors,
  type ReportDraft,
} from "@/lib/reportDraft";
import { useCurrentLocation } from "@/lib/useCurrentLocation";
import { spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const plain = (chunks: string[]) => chunks.join("");

export default function ReportScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const scroll = useRef<ScrollViewInstance>(null);

  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
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
    mutationFn: async (): Promise<SubmitResult | "queued"> => {
      if ((await NetInfo.fetch()).isConnected === false) {
        await outbox.enqueue(draft, locale);
        return "queued";
      }
      try {
        const result = await submitReport(toFormData(draft, locale, captcha));
        await outbox.recordSent(result.receiptId);
        return result;
      } catch (error) {
        // No HTTP status: the request never reached the server (signal dropped mid-send)
        if (error instanceof ApiError && error.status === undefined) {
          await outbox.enqueue(draft, locale);
          return "queued";
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      router.replace({
        pathname: "/report-sent",
        params:
          result === "queued"
            ? { queued: "1" }
            : {
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
        <AppText variant="secondary">{t("submit.subtitle")}</AppText>
        {!outbox.online && (
          <AppText style={{ color: theme.warning, fontWeight: "600" }}>
            {t("submit.offlineBanner")}
          </AppText>
        )}
        {hasErrors && (
          <AppText style={{ color: theme.error, fontWeight: "600" }}>{t("app.fixErrors")}</AppText>
        )}

        <Card>
          <AppText variant="heading">{t("submit.stepBus")}</AppText>
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
          <ChoiceChips
            label={t("submit.busServiceQuestion")}
            options={BUS_SERVICES.map((value) => ({ value, label: t(`busServices.${value}`) }))}
            value={draft.busService}
            onChange={(value) => update("busService", value)}
            error={error("busService")}
          />
          <ChoiceChips
            label={t("submit.categoryQuestion")}
            options={APP_COMPLAINT_CATEGORIES.map((value) => ({
              value,
              label: t(`categories.${value}`),
            }))}
            value={draft.category}
            onChange={(value) => update("category", value)}
            error={error("category")}
          />
        </Card>

        <Card>
          <AppText variant="heading">{t("submit.stepIncident")}</AppText>
          <TextField
            label={t("submit.where")}
            value={draft.location}
            onChangeText={(value) => update("location", value)}
            placeholder={t("submit.wherePlaceholder")}
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
              <Button variant="outline" label={t("location.removePin")} onPress={removePin} />
            </View>
          ) : (
            <Button
              variant="outline"
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
            label={t("submit.description")}
            value={draft.description}
            onChangeText={(value) => update("description", value)}
            placeholder={t("submit.descriptionPlaceholder")}
            multiline
            maxLength={MAX_DESCRIPTION}
            helper={`${draft.description.length} / ${MAX_DESCRIPTION}`}
            error={error("description")}
          />
        </Card>

        <Card>
          <AppText variant="heading">{t("submit.stepEvidence")}</AppText>
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
          label={t("submit.send")}
          onPress={submit}
          loading={send.isPending}
          disabled={needsCaptcha}
        />
        {needsCaptcha && <AppText variant="secondary">{t("app.securityCheckNeeded")}</AppText>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
