// The moment a report is received: a check mark that pops in, a burst of confetti in the brand
// colours and a success buzz. Skipped (just the check) when the phone asks for reduced motion.
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { haptic } from "@/components/motion";

const COLORS = ["#FE6E01", "#029EEE", "#22C55E", "#FBBF24", "#DB2777", "#7C3AED", "#FFFFFF"];
const PIECES = 40;

interface Piece {
  angle: number;
  distance: number;
  lift: number;
  spin: number;
  size: number;
  color: string;
  delay: number;
  round: boolean;
}

// Scattered once when the app loads (randomness has no place in a render)
const PIECE_LIST: Piece[] = Array.from({ length: PIECES }, (_, index) => ({
  angle: Math.random() * Math.PI * 2,
  distance: 90 + Math.random() * 130,
  lift: 160 + Math.random() * 220,
  spin: (Math.random() - 0.5) * 900,
  size: 7 + Math.random() * 7,
  color: COLORS[index % COLORS.length],
  delay: Math.random() * 120,
  round: index % 3 === 0,
}));

function ConfettiPiece({ piece }: { piece: Piece }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(piece.delay, withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) })),
    );
  }, [piece.delay, progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    // Thrown outwards and up, then gravity pulls it down
    const x = Math.cos(piece.angle) * piece.distance * p;
    const y = -piece.lift * p + 420 * p * p;
    return {
      opacity: p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${piece.spin * p}deg` }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

export function Celebration({ colors }: { colors: readonly [string, string, ...string[]] }) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    haptic("success");
    if (!reduced) {
      pop.set(
        withSequence(
          withTiming(0, { duration: 80 }),
          withSpring(1, { damping: 9, stiffness: 160 }),
        ),
      );
    }
  }, [pop, reduced]);

  const badge = useAnimatedStyle(() => ({
    transform: [{ scale: pop.get() }, { rotate: `${(1 - pop.get()) * -45}deg` }],
  }));

  return (
    <View style={styles.stage} pointerEvents="none">
      {!reduced && (
        <View style={styles.origin}>
          {PIECE_LIST.map((piece, index) => (
            <ConfettiPiece key={index} piece={piece} />
          ))}
        </View>
      )}
      <View style={[styles.halo, { backgroundColor: `${colors[0]}26` }]} />
      <Animated.View style={badge}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <Ionicons name="checkmark" size={52} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { height: 170, alignItems: "center", justifyContent: "center" },
  origin: { position: "absolute", top: 85, left: "50%" },
  piece: { position: "absolute" },
  halo: { position: "absolute", width: 150, height: 150, borderRadius: 75 },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15803D",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
});
