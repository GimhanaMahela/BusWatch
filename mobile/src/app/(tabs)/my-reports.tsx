import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ApiError } from "@/api/client";
import { getMyReports, requestSignInCode, verifySignInCode } from "@/api/passenger";
import { TextField } from "@/components/form";
import { AppText, Badge, Button, Card, Hero, Screen, SectionTitle } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDateTime } from "@/lib/format";
import { accents, spacing, statusColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

// The session token stays in the phone's secure storage (Keychain / Keystore)
const TOKEN_KEY = "passengerToken";

export default function MyReportsScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((saved) => setToken(saved))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const signOut = () => {
    setToken(null);
    setCode("");
    setSentTo(null);
    queryClient.removeQueries({ queryKey: ["my-reports"] });
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  };

  const reports = useQuery({
    queryKey: ["my-reports", token],
    queryFn: async () => {
      try {
        return await getMyReports(token ?? "");
      } catch (error) {
        // The session ran out: forget it, so the next visit starts at sign-in
        if (error instanceof ApiError && error.status === 401) {
          await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
        }
        throw error;
      }
    },
    enabled: Boolean(token),
    retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
  });

  // A session that ran out sends the passenger back to sign in
  const expired = reports.error instanceof ApiError && reports.error.status === 401;

  const sendCode = useMutation({
    mutationFn: () => requestSignInCode(contact.trim(), locale),
    onSuccess: (result) => setSentTo(result.sentTo),
  });

  const verify = useMutation({
    mutationFn: () => verifySignInCode(contact.trim(), code.trim()),
    onSuccess: async (result) => {
      await SecureStore.setItemAsync(TOKEN_KEY, result.token);
      setToken(result.token);
    },
  });

  if (!loaded) return <Screen>{null}</Screen>;

  if (!token || expired) {
    return (
      <Screen>
        <Hero
          eyebrow={t("myReports.eyebrow")}
          title={t("myReports.title")}
          subtitle={t("myReports.subtitle")}
        />
        {expired && (
          <Card accent={accents.amber}>
            <AppText>{t("myReports.expired")}</AppText>
          </Card>
        )}
        <Card>
          <SectionTitle icon="key" color={accents.violet}>
            {t("myReports.verify")}
          </SectionTitle>
          {sentTo === null ? (
            <>
              <TextField
                label={t("myReports.contactLabel")}
                value={contact}
                onChangeText={setContact}
                placeholder={t("myReports.contactPlaceholder")}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={sendCode.isError ? sendCode.error.message : undefined}
              />
              <Button
                icon="send"
                label={t("myReports.sendCode")}
                loading={sendCode.isPending}
                disabled={!contact.trim()}
                onPress={() => sendCode.mutate()}
              />
            </>
          ) : (
            <>
              <AppText variant="secondary">{t("myReports.codeSent", { sentTo })}</AppText>
              <TextField
                label={t("myReports.codeLabel")}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                error={verify.isError ? t("myReports.invalidCode") : undefined}
              />
              <Button
                icon="log-in"
                label={t("myReports.verify")}
                loading={verify.isPending}
                disabled={code.trim().length < 6}
                onPress={() => verify.mutate()}
              />
              <Button
                variant="outline"
                label={t("myReports.changeContact")}
                onPress={() => {
                  setSentTo(null);
                  setCode("");
                }}
              />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  const list = reports.data?.reports ?? [];

  return (
    <Screen>
      <Card accent={accents.violet}>
        <SectionTitle icon="person-circle" color={accents.violet}>
          {t("myReports.listTitle")}
        </SectionTitle>
        {reports.data && (
          <AppText variant="secondary">
            {t("myReports.signedInAs", { contact: reports.data.contact.display })}
          </AppText>
        )}
        <Button
          variant="outline"
          icon="log-out-outline"
          label={t("myReports.signOut")}
          onPress={signOut}
        />
      </Card>

      {reports.isPending && <AppText variant="secondary">…</AppText>}
      {reports.isError && <AppText style={{ color: theme.error }}>{t("myReports.error")}</AppText>}
      {reports.isSuccess && list.length === 0 && (
        <Card>
          <AppText>{t("myReports.empty")}</AppText>
          <AppText variant="secondary">{t("myReports.emptyHint")}</AppText>
        </Card>
      )}

      {list.map((report) => (
        <Pressable
          key={report.receiptId}
          accessibilityRole="link"
          onPress={() =>
            router.push({ pathname: "/track/[receiptId]", params: { receiptId: report.receiptId } })
          }
        >
          <Card accent={statusColors[report.status]}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText style={{ fontWeight: "800", letterSpacing: 0.5 }}>
                  {report.receiptId}
                </AppText>
                <AppText variant="secondary">
                  {t(`categories.${report.category}`)}
                  {report.busNumber ? ` · ${report.busNumber}` : ""}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
            <View style={styles.row}>
              <Badge label={t(`statuses.${report.status}`)} color={statusColors[report.status]} />
              {report.unreadMessages > 0 && (
                <Badge label={`✉ ${report.unreadMessages}`} color={accents.pink} />
              )}
            </View>
            <AppText variant="secondary">
              {t("myReports.lastUpdate", { time: formatDateTime(report.lastUpdateAt, locale) })}
            </AppText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
