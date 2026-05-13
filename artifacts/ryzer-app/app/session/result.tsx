import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { sportName, sportIcon, durationSeconds, points } = useLocalSearchParams<{
    sportName: string; sportIcon: string; durationSeconds: string; points: string;
  }>();

  const { addSession } = useUser();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalPoints, setFinalPoints] = useState<number | null>(null);
  const [multiplierApplied, setMultiplierApplied] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  const ptNum = parseInt(points ?? "0");
  const durNum = parseInt(durationSeconds ?? "0");

  useEffect(() => {
    (async () => {
      setSaving(true);
      try {
        const result = await addSession({
          sportName: sportName ?? "",
          sportIcon: sportIcon ?? "run",
          durationSeconds: durNum,
          points: ptNum,
        });
        setFinalPoints(result.points);
        setMultiplierApplied(result.multiplierApplied);
        setCurrentStreak(result.currentStreak);
        setSaved(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setSaving(false);
    })();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }]}>
        {/* Trophy */}
        <View style={[styles.trophyWrap, { backgroundColor: "rgba(249,115,22,0.1)" }]}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </View>

        <Text style={[styles.congrats, { color: colors.mutedForeground }]}>SESSION TERMINÉE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          BRAVO !{"\n"}
          <Text style={{ color: BLUE }}>+{finalPoints ?? ptNum} </Text>
          <Text style={{ color: ORANGE }}>RYZER PTS</Text>
        </Text>

        {/* Streak / multiplier banner */}
        {saved && currentStreak > 0 && (
          <View style={[
            styles.streakBanner,
            {
              backgroundColor: multiplierApplied ? "rgba(249,115,22,0.08)" : "rgba(37,99,235,0.06)",
              borderColor: multiplierApplied ? "rgba(249,115,22,0.3)" : "rgba(37,99,235,0.2)",
            },
          ]}>
            <View style={[styles.streakIconWrap, { backgroundColor: multiplierApplied ? "rgba(249,115,22,0.15)" : "rgba(37,99,235,0.12)" }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={multiplierApplied ? ORANGE : BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakText, { color: multiplierApplied ? ORANGE : BLUE }]}>
                {currentStreak} JOUR{currentStreak > 1 ? "S" : ""} D'AFFILÉE
              </Text>
              {multiplierApplied ? (
                <Text style={[styles.streakSub, { color: ORANGE }]}>
                  Bonus ✕1.5 appliqué — +{(finalPoints ?? ptNum) - ptNum} pts bonus !
                </Text>
              ) : (
                <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                  Encore {3 - currentStreak} jour{3 - currentStreak > 1 ? "s" : ""} pour le bonus ✕1.5
                </Text>
              )}
            </View>
            {multiplierApplied && (
              <View style={[styles.multiplierBadge, { backgroundColor: ORANGE }]}>
                <Text style={styles.multiplierText}>✕1.5</Text>
              </View>
            )}
          </View>
        )}

        {/* Stats card */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Sport */}
          <View style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
              <MaterialCommunityIcons name={(sportIcon ?? "run") as MCIcon} size={20} color={BLUE} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Sport</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{sportName}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Duration */}
          <View style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(249,115,22,0.1)" }]}>
              <Feather name="clock" size={18} color={ORANGE} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Durée</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatDuration(durNum)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Points */}
          <View style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
              <Feather name="zap" size={18} color={BLUE} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ryzer Points</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.statValue, { color: BLUE, fontWeight: "900" }]}>
                +{finalPoints ?? ptNum}
              </Text>
              {multiplierApplied && (
                <Text style={{ fontSize: 10, color: ORANGE, fontWeight: "700" }}>
                  ({ptNum} ✕1.5)
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Save status */}
        <View style={styles.saveStatus}>
          {saving && <ActivityIndicator size="small" color={BLUE} />}
          {saved && (
            <View style={styles.savedRow}>
              <Feather name="check-circle" size={14} color="#22c55e" />
              <Text style={[styles.savedText, { color: "#22c55e" }]}>Session sauvegardée</Text>
            </View>
          )}
        </View>

        <View style={styles.ctaGroup}>
          <Pressable
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Feather name="home" size={18} color="#fff" />
            <Text style={styles.mainBtnText}>RETOUR À L'ACCUEIL</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondBtn, { backgroundColor: colors.card, borderColor: colors.border, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => router.replace("/session/sport-picker")}
          >
            <Feather name="plus" size={16} color={colors.foreground} />
            <Text style={[styles.secondBtnText, { color: colors.foreground }]}>NOUVELLE SESSION</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  trophyWrap: {
    width: 90, height: 90, borderRadius: 24,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  trophyEmoji: { fontSize: 44 },
  congrats: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: -1.5, textAlign: "center", lineHeight: 42, marginBottom: 28 },
  statsCard: {
    width: "100%", borderWidth: 1, borderRadius: 18,
    overflow: "hidden", marginBottom: 16,
  },
  statRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { flex: 1, fontSize: 13 },
  statValue: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 16 },
  saveStatus: { height: 24, justifyContent: "center", marginBottom: 8 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedText: { fontSize: 12, fontWeight: "600" },
  streakBanner: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, width: "100%",
  },
  streakIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  streakText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  streakSub: { fontSize: 10, fontWeight: "500", marginTop: 1 },
  multiplierBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  multiplierText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  ctaGroup: { width: "100%", gap: 12 },
  mainBtn: {
    height: 58, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    width: "100%",
  },
  mainBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.8 },
  secondBtn: {
    height: 50, borderRadius: 999, flexDirection: "row", borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%",
  },
  secondBtnText: { fontSize: 13, fontWeight: "700" },
});
