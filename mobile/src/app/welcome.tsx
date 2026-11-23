import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Float, PressableScale, haptic } from "@/components/motion";
import { Text } from "@/components/Text";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALE_NAMES, LOCALES } from "@/i18n/translate";
import { markOnboarded } from "@/lib/onboarding";
import { gradients, statusColors } from "@/theme/colors";

const SLIDES = 3;

function Dot({
  index,
  scroll,
  width,
}: {
  index: number;
  scroll: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const position = scroll.value / width;
    const near = interpolate(Math.abs(position - index), [0, 1], [1, 0], Extrapolation.CLAMP);
    return { width: 8 + near * 22, opacity: 0.4 + near * 0.6 };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/** Slide 2's picture: a report moving through its statuses */
function StatusDemo() {
  const { t } = useI18n();
  const steps = [
    { label: t("home.stepReceived"), color: statusColors.pending, icon: "mail" as const },
    { label: t("home.stepReviewed"), color: statusColors.reviewed, icon: "eye" as const },
    { label: t("home.stepEscalated"), color: statusColors.escalated, icon: "arrow-up" as const },
    { label: t("home.stepResolved"), color: statusColors.resolved, icon: "checkmark" as const },
  ];
  return (
    <View style={styles.demo}>
      <Text style={styles.demoId}>BW-2026-7Q4K2M</Text>
      {steps.map((step, index) => (
        <View key={step.label} style={styles.demoRow}>
          <View style={[styles.demoDot, { backgroundColor: step.color }]}>
            <Ionicons name={step.icon} size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.demoLabel}>{step.label}</Text>
          {index === steps.length - 1 && <Ionicons name="sparkles" size={16} color="#FFAD73" />}
        </View>
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const { t, locale, setLocale } = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroll = useSharedValue(0);
  const scroller = useRef<Animated.ScrollView>(null);
  const [page, setPage] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scroll.value = event.contentOffset.x;
  });

  const finish = () => {
    haptic("success");
    void markOnboarded();
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const next = () => {
    if (page >= SLIDES - 1) return finish();
    scroller.current?.scrollTo({ x: width * (page + 1), animated: true });
    setPage(page + 1);
  };

  const slides = [
    {
      title: t("app.onboard1Title"),
      text: t("app.onboard1Text"),
      art: (
        <Float style={styles.logoGlow}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Float>
      ),
    },
    { title: t("app.onboard2Title"), text: t("app.onboard2Text"), art: <StatusDemo /> },
    {
      title: t("app.onboard3Title"),
      text: t("app.onboard3Text"),
      art: (
        <View style={{ gap: 12, alignSelf: "stretch" }}>
          {LOCALES.map((option) => {
            const selected = option === locale;
            return (
              <PressableScale
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                haptics="selection"
                onPress={() => setLocale(option)}
                style={[styles.language, selected && styles.languageSelected]}
              >
                <Text style={[styles.languageText, selected && { color: "#00295C" }]}>
                  {LOCALE_NAMES[option]}
                </Text>
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={selected ? "#E85D00" : "rgba(255,255,255,0.6)"}
                />
              </PressableScale>
            );
          })}
        </View>
      ),
    },
  ];

  return (
    <LinearGradient
      colors={gradients.deep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <View style={[styles.glow, { top: -120, right: -100, backgroundColor: "#029EEE" }]} />
      <View style={[styles.glow, { bottom: -140, left: -120, backgroundColor: "#FE6E01" }]} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.brand}>
          Transit<Text style={[styles.brand, { color: "#FF8A3D" }]}>X</Text>
        </Text>
        {page < SLIDES - 1 && (
          <PressableScale accessibilityRole="button" onPress={finish} haptics="selection">
            <Text style={styles.skip}>{t("app.skip")}</Text>
          </PressableScale>
        )}
      </View>

      <Animated.ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {slides.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.art}>{slide.art}</View>
            <Text style={[styles.title, { width: width - 56 }]}>{slide.title}</Text>
            <Text style={[styles.text, { width: width - 56 }]}>{slide.text}</Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <Dot key={slide.title} index={index} scroll={scroll} width={width} />
          ))}
        </View>
        <Button
          variant="accent"
          label={page >= SLIDES - 1 ? t("app.getStarted") : t("common.continue")}
          iconRight={page >= SLIDES - 1 ? "rocket" : "arrow-forward"}
          onPress={next}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glow: { position: "absolute", width: 320, height: 320, borderRadius: 160, opacity: 0.28 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  brand: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: -0.6 },
  skip: { color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "600", padding: 8 },
  slide: { paddingHorizontal: 28, justifyContent: "center", gap: 14 },
  art: { minHeight: 300, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoGlow: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#029EEE",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 16,
  },
  logo: { width: 210, height: 150 },
  title: { color: "#FFFFFF", fontSize: 30, lineHeight: 38, fontWeight: "800", letterSpacing: -0.6 },
  text: { color: "rgba(255,255,255,0.82)", fontSize: 16, lineHeight: 24 },
  demo: {
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  demoId: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: 1.5 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  demoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  demoLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", flex: 1 },
  language: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60,
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  languageSelected: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" },
  languageText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  bottom: { paddingHorizontal: 24, gap: 22 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
});
