import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";

import { WEB_URL } from "@/api/client";
import {
  getAssistantStatus,
  sendChat,
  type AssistantDraft,
  type AssistantLink,
  type ChatMessage,
} from "@/api/explore";
import { AppText, Button, Card } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { accents, gradients, radius, spacing } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const QUICK = ["helper.quickReport", "helper.quickCommend", "helper.quickTrack", "helper.quickHow"];

/** Where each suggestion the helper makes leads in the app (or on the website) */
const openLink = (link: AssistantLink) => {
  switch (link) {
    case "submit_report":
      return router.push("/report");
    case "commend_driver":
      return router.push({ pathname: "/report", params: { type: "commendation" } });
    case "track":
      return router.navigate("/track");
    case "my_reports":
      return router.navigate("/my-reports");
    case "impact":
      return router.push("/impact");
    case "about":
      return void Linking.openURL(`${WEB_URL}/about-us`);
    case "privacy":
      return void Linking.openURL(`${WEB_URL}/privacy-policy`);
  }
};

/** Opens the form with what the helper gathered; the passenger checks it and sends it. */
const openDraft = (draft: AssistantDraft) =>
  router.push({
    pathname: "/report",
    params: {
      type: draft.type === "commendation" ? "commendation" : "complaint",
      ...(draft.category ? { category: draft.category } : {}),
      bus: draft.busNumber,
      route: draft.routeNumber,
      location: draft.location,
      description: draft.description,
    },
  });

export default function ChatScreen() {
  const { t, locale } = useI18n();
  const theme = useTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: t("helper.greeting") },
  ]);
  const status = useQuery({ queryKey: ["assistant-status"], queryFn: getAssistantStatus });

  const ask = useMutation({
    mutationFn: (history: ChatMessage[]) =>
      sendChat(
        // The greeting is the app's own; the conversation starts with the passenger
        history.slice(1).map(({ role, text }) => ({ role, text })),
        locale,
      ),
    onSuccess: (reply) => {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: reply.reply, link: reply.link, draft: reply.draft },
      ]);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    },
  });

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || ask.isPending) return;
    const next = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(next);
    setInput("");
    ask.mutate(next);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  if (status.data && !status.data.enabled) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background, padding: spacing.md }]}>
        <Card>
          <AppText>{t("helper.error")}</AppText>
        </Card>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scroll} contentContainerStyle={styles.messages}>
        <AppText variant="secondary" style={styles.notice}>
          {t("helper.notice")}
        </AppText>
        {messages.map((message, index) => {
          const mine = message.role === "user";
          return (
            <View key={index} style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 6 }}>
              {mine ? (
                <LinearGradient
                  colors={gradients.brand}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.bubble, styles.mine]}
                >
                  <Text style={styles.mineText}>{message.text}</Text>
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.bubble,
                    styles.theirs,
                    { backgroundColor: theme.surface, borderColor: theme.divider },
                  ]}
                >
                  <AppText>{message.text}</AppText>
                </View>
              )}
              {message.link && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => message.link && openLink(message.link)}
                  style={[styles.link, { borderColor: accents.sky }]}
                >
                  <Ionicons name="arrow-forward-circle" size={18} color={accents.sky} />
                  <Text style={{ color: accents.sky, fontWeight: "700" }}>
                    {t(`helper.links.${message.link}`)}
                  </Text>
                </Pressable>
              )}
              {message.draft && (
                <Card accent={accents.orange} style={{ alignSelf: "stretch" }}>
                  <AppText style={{ fontWeight: "700" }}>
                    {t(
                      message.draft.type === "commendation"
                        ? "helper.draftCommendation"
                        : "helper.draftComplaint",
                    )}
                  </AppText>
                  {message.draft.busNumber ? (
                    <AppText variant="secondary">
                      {t("helper.draftBus")}: {message.draft.busNumber}
                    </AppText>
                  ) : null}
                  {message.draft.routeNumber ? (
                    <AppText variant="secondary">
                      {t("helper.draftRoute")}: {message.draft.routeNumber}
                    </AppText>
                  ) : null}
                  {message.draft.location ? (
                    <AppText variant="secondary">
                      {t("helper.draftPlace")}: {message.draft.location}
                    </AppText>
                  ) : null}
                  <Button
                    variant="accent"
                    icon="create"
                    label={t("helper.openForm")}
                    onPress={() => message.draft && openDraft(message.draft)}
                  />
                  <AppText variant="secondary" style={{ fontSize: 13 }}>
                    {t("helper.openFormHint")}
                  </AppText>
                </Card>
              )}
            </View>
          );
        })}
        {ask.isPending && <AppText variant="secondary">{t("helper.thinking")}</AppText>}
        {ask.isError && <AppText style={{ color: theme.error }}>{t("helper.error")}</AppText>}
        {messages.length === 1 && (
          <View style={styles.quick}>
            {QUICK.map((key) => (
              <Pressable
                key={key}
                onPress={() => send(t(key))}
                style={[
                  styles.quickChip,
                  { borderColor: `${accents.violet}55`, backgroundColor: `${accents.violet}12` },
                ]}
              >
                <Text style={{ color: accents.violet, fontWeight: "600" }}>{t(key)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[styles.composer, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t("helper.placeholder")}
          placeholderTextColor={theme.textSecondary}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          accessibilityLabel={t("helper.placeholder")}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceAlt }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("helper.send")}
          onPress={() => send(input)}
          disabled={!input.trim() || ask.isPending}
          style={{ opacity: !input.trim() || ask.isPending ? 0.5 : 1 }}
        >
          <LinearGradient colors={gradients.sunrise} style={styles.sendButton}>
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  messages: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  notice: { fontSize: 13, textAlign: "center" },
  bubble: { maxWidth: "85%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { borderBottomRightRadius: 6 },
  theirs: { borderWidth: 1, borderBottomLeftRadius: 6 },
  mineText: { color: "#FFFFFF", fontSize: 16, lineHeight: 22 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quick: { gap: spacing.sm },
  quickChip: { borderWidth: 1.5, borderRadius: radius, padding: spacing.sm + 4 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderTopWidth: 1,
  },
  input: { flex: 1, minHeight: 46, borderRadius: 23, paddingHorizontal: spacing.md, fontSize: 16 },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
