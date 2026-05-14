import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";
function computePoints(_met: number, seconds: number): number {
  return Math.round((seconds / 300) * 10) / 10;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { sportName, sportIcon, met } = useLocalSearchParams<{
    sportId: string; sportName: string; sportIcon: string; met: string;
  }>();

  const metNum = parseFloat(met ?? "5");

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const points = computePoints(metNum, elapsed);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const start = () => {
    setRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const finish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFinished(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goToResult = () => {
    router.replace({
      pathname: "/session/result",
      params: {
        sportName,
        sportIcon,
        met,
        durationSeconds: elapsed,
        points: Math.round(points),
      },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => { if (intervalRef.current) clearInterval(intervalRef.current); router.back(); }}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.eyebrow, { color: BLUE }]}>SESSION EN COURS</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Sport icon + name */}
        <View style={styles.sportInfo}>
          <View style={[styles.sportIconBig, { backgroundColor: running ? "rgba(37,99,235,0.12)" : "rgba(15,23,42,0.06)" }]}>
            <MaterialCommunityIcons
              name={(sportIcon ?? "run") as MCIcon}
              size={56}
              color={running ? BLUE : colors.mutedForeground}
            />
          </View>
          <Text style={[styles.sportNameText, { color: colors.foreground }]}>{sportName}</Text>
          <View style={[styles.metChip, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
            <Text style={[styles.metChipText, { color: BLUE }]}>MET {metNum}</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={[styles.timer, { color: running ? colors.foreground : colors.mutedForeground }]}>
            {formatTime(elapsed)}
          </Text>
          {elapsed > 0 && (
            <View style={styles.livePoints}>
              <Text style={[styles.livePointsValue, { color: BLUE }]}>{points}</Text>
              <View style={[styles.livePointsBadge, { backgroundColor: "rgba(37,99,235,0.1)", borderColor: "rgba(37,99,235,0.2)" }]}>
                <View style={[styles.livePointsDot, { backgroundColor: BLUE }]} />
                <Text style={[styles.livePointsLabel, { color: BLUE }]}>RYZER POINTS</Text>
              </View>
            </View>
          )}
        </View>

        {/* Controls */}
        {!finished ? (
          <View style={styles.controls}>
            {!running ? (
              <Pressable
                style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={elapsed === 0 ? start : start}
              >
                <Feather name="play" size={24} color="#fff" />
                <Text style={styles.mainBtnText}>{elapsed === 0 ? "DÉMARRER" : "REPRENDRE"}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.mainBtn, { backgroundColor: "#0f172a", transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={pause}
              >
                <Feather name="pause" size={24} color="#fff" />
                <Text style={styles.mainBtnText}>PAUSE</Text>
              </Pressable>
            )}

            {elapsed > 0 && (
              <Pressable
                style={({ pressed }) => [styles.finishBtn, { backgroundColor: ORANGE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={finish}
              >
                <Feather name="flag" size={18} color="#fff" />
                <Text style={styles.finishBtnText}>TERMINER</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            onPress={goToResult}
          >
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.mainBtnText}>VOIR MES POINTS</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  sportInfo: { alignItems: "center", gap: 12, marginBottom: 40 },
  sportIconBig: { width: 100, height: 100, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  sportNameText: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  metChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  metChipText: { fontSize: 11, fontWeight: "700" },
  timerSection: { alignItems: "center", flex: 1, justifyContent: "center", gap: 16 },
  timer: { fontSize: 64, fontWeight: "900", letterSpacing: -3, fontVariant: ["tabular-nums"] as any },
  livePoints: { alignItems: "center", gap: 6 },
  livePointsValue: { fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  livePointsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  livePointsDot: { width: 5, height: 5, borderRadius: 3 },
  livePointsLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  controls: { gap: 12, paddingBottom: 8 },
  mainBtn: {
    height: 64, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 12,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  mainBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.8 },
  finishBtn: {
    height: 52, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  finishBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
