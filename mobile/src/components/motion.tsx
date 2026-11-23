// Motion and touch feedback: springy presses with haptics, staggered entrances, shimmering
// skeletons and counting numbers. All of it respects the phone's "reduce motion" setting
// (Reanimated skips layout animations then).
import * as Haptics from "expo-haptics";
import { useEffect, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/useTheme";

type HapticKind = "light" | "medium" | "selection" | "success" | "warning" | "none";

/** A short buzz; silently does nothing where haptics aren't available */
export const haptic = (kind: Exclude<HapticKind, "none">) => {
  if (Platform.OS === "web") return;
  const run =
    kind === "selection"
      ? Haptics.selectionAsync()
      : kind === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : kind === "warning"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          : Haptics.impactAsync(
              kind === "medium"
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
            );
  run.catch(() => undefined);
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held */
  scaleTo?: number;
  haptics?: HapticKind;
};

/** A Pressable that springs down while held and gives a light tap of haptic feedback */
export function PressableScale({
  style,
  scaleTo = 0.96,
  haptics = "light",
  onPressIn,
  onPressOut,
  onPress,
  children,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        scale.set(withSpring(scaleTo, { damping: 18, stiffness: 400 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 300 }));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptics !== "none") haptic(haptics);
        onPress?.(event);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Slides up and fades in, `index` steps after the previous item (for lists and grids) */
export function Rise({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 70)
        .duration(480)
        .easing(Easing.out(Easing.cubic))}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/** A gently pulsing placeholder block while content loads */
export function Skeleton({
  height,
  width = "100%",
  radius = 12,
  style,
}: {
  height: number;
  width?: ViewStyle["width"];
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 800 }), -1, true));
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { height, width, borderRadius: radius, backgroundColor: theme.surfaceAlt },
        animated,
        style,
      ]}
    />
  );
}

/** Counts up from 0 to `value` once it arrives */
export function useCountUp(value: number | null | undefined, duration = 900): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (value === null || value === undefined || reduced) return;
    const started = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      // ease-out: fast at first, settling on the number
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);
  // With reduced motion the number simply appears
  return reduced ? (value ?? 0) : shown;
}

/** Bobs its child up and down forever (the floating logo on the home hero) */
export function Float({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    y.set(
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [reduced, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
