import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
  Pressable, ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser, UserChallenge } from "@/contexts/UserContext";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";
const GREEN = "#22c55e";

function accentColor(accent: string) {
  if (accent === "orange") return ORANGE;
  if (accent === "green") return GREEN;
  return BLUE;
}
function accentBg(accent: string) {
  if (accent === "orange") return "rgba(249,115,22,0.10)";
  if (accent === "green") return "rgba(34,197,94,0.10)";
  return "rgba(37,99,235,0.10)";
}

function ChallengeCard({ item }: { item: UserChallenge }) {
  const colors = useColors();
  const pct = Math.min(item.progress / item.targetValue, 1);
  const color = accentColor(item.accent);
  const bg = accentBg(item.accent);

  return (
    <View style={[styles.card, {
      backgroundColor: item.done ? bg : colors.card,
      borderColor: item.done ? color : colors.border,
      borderWidth: item.done ? 1.5 : 1,
    }]}>
      <View style={[styles.cardIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={item.icon as MCIcon} size={22} color={color} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.xpBadge, { backgroundColor: bg }]}>
            <Text style={[styles.xpText, { color }]}>+{item.xpReward} XP</Text>
          </View>
        </View>

        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {item.metricType === "distance"
              ? `${item.progress.toFixed(1)}/${item.targetValue} ${item.targetUnit}`
              : `${Math.round(item.progress)}/${item.targetValue} ${item.targetUnit}`}
          </Text>
        </View>
      </View>

    </View>
  );
}

export default function DefiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const { getChallenges } = useUser();

  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getChallenges();
    setChallenges(data);
    setLoading(false);
  }, [getChallenges]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, []);

  const normalChallengesList = challenges.filter((c) => !c.isCalisthenics);
  const totalDone = normalChallengesList.filter((c) => c.done).length;
  const total = normalChallengesList.length;

  // Group by category (normal challenges only)
  const categories = Array.from(new Set(normalChallengesList.map((c) => c.category)));
  const grouped = categories.map((cat) => ({
    category: cat,
    items: normalChallengesList.filter((c) => c.category === cat),
  }));

  const calisthenicsCount = challenges.filter((c) => c.isCalisthenics && c.done).length;
  const calisthenicsTotal = challenges.filter((c) => c.isCalisthenics).length;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad + 80,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE} />}
    >
      {/* Header */}
      <Text style={[styles.eyebrow, { color: BLUE }]}>PROGRESSION</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        TES <Text style={{ color: ORANGE }}>DÉFIS</Text>
      </Text>

      {/* Calisthenics banner — always visible */}
      <Pressable
        onPress={() => router.push("/calisthenics")}
        style={({ pressed }) => [
          styles.caliBanner,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.caliBannerLeft}>
          <View style={styles.caliIconWrap}>
            <MaterialCommunityIcons name="arm-flex" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.caliBannerTitle}>Défis Callisthénie 💪</Text>
            <Text style={styles.caliBannerSub}>
              {calisthenicsTotal > 0
                ? `${calisthenicsCount}/${calisthenicsTotal} complétés · Programme mensuel`
                : "Défis sans équipement · Programme mensuel"}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Global progress card */}
      {!loading && (
        <View style={[styles.globalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.globalRow}>
            <View style={[styles.trophyWrap, { backgroundColor: "rgba(249,115,22,0.1)" }]}>
              <MaterialCommunityIcons name="trophy" size={28} color={ORANGE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.globalTitle, { color: colors.foreground }]}>
                {totalDone} / {total} défis complétés
              </Text>
              <Text style={[styles.globalSub, { color: colors.mutedForeground }]}>
                Continue à t'entraîner pour débloquer des récompenses
              </Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: 12 }]}>
            <View style={[
              styles.progressFill,
              { width: `${total > 0 ? (totalDone / total) * 100 : 0}%` as any, backgroundColor: ORANGE },
            ]} />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      ) : (
        grouped.map((cat) => (
          <View key={cat.category} style={styles.category}>
            <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>
              {cat.category}
            </Text>
            {cat.items.map((item) => (
              <ChallengeCard key={item.id} item={item} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36, marginBottom: 18 },

  caliBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1d4ed8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  caliBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  caliIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  caliBannerTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  caliBannerSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "500", marginTop: 1 },

  globalCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24 },
  globalRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  trophyWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  globalTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  globalSub: { fontSize: 11, fontWeight: "500" },

  loader: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  category: { marginBottom: 20 },
  catLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10 },

  card: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, padding: 12, gap: 12, marginBottom: 8,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", flex: 1 },
  xpBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  xpText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  cardDesc: { fontSize: 11, fontWeight: "500" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  progressTrack: { flex: 1, height: 4, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabel: { fontSize: 9, fontWeight: "600", minWidth: 60, textAlign: "right" },
  doneCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
