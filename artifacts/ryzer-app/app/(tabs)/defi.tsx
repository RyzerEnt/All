import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";
const GREEN = "#22c55e";

interface Challenge {
  id: string;
  icon: MCIcon;
  title: string;
  description: string;
  progress: number;
  total: number;
  unit: string;
  xp: number;
  accent: "blue" | "orange" | "green";
  done: boolean;
}

const CHALLENGES: { category: string; items: Challenge[] }[] = [
  {
    category: "DISTANCE",
    items: [
      { id: "d1", icon: "run", title: "Premier kilomètre", description: "Complète 1 km de course à pied", progress: 0, total: 1, unit: "km", xp: 50, accent: "blue", done: false },
      { id: "d2", icon: "bike", title: "5 km à vélo", description: "Cumule 5 km en cyclisme", progress: 0, total: 5, unit: "km", xp: 80, accent: "orange", done: false },
      { id: "d3", icon: "hiking", title: "Randonneur", description: "Randonne 10 km au total", progress: 0, total: 10, unit: "km", xp: 150, accent: "green", done: false },
      { id: "d4", icon: "run", title: "Semi-marathon", description: "Cours 21 km cumulés", progress: 0, total: 21, unit: "km", xp: 500, accent: "blue", done: false },
    ],
  },
  {
    category: "RÉGULARITÉ",
    items: [
      { id: "r1", icon: "fire", title: "3 jours d'affilée", description: "Fais une session 3 jours de suite", progress: 0, total: 3, unit: "jours", xp: 100, accent: "orange", done: false },
      { id: "r2", icon: "fire", title: "Semaine parfaite", description: "Fais une session 7 jours de suite", progress: 0, total: 7, unit: "jours", xp: 300, accent: "orange", done: false },
      { id: "r3", icon: "calendar-check", title: "Athlète du mois", description: "15 sessions dans le même mois", progress: 0, total: 15, unit: "sessions", xp: 400, accent: "blue", done: false },
    ],
  },
  {
    category: "MULTI-SPORTS",
    items: [
      { id: "m1", icon: "dumbbell", title: "Biathlon Ryzer", description: "Fais 2 sports différents dans la semaine", progress: 0, total: 2, unit: "sports", xp: 120, accent: "green", done: false },
      { id: "m2", icon: "trophy", title: "Triathlète", description: "Pratique 3 sports différents", progress: 0, total: 3, unit: "sports", xp: 250, accent: "orange", done: false },
      { id: "m3", icon: "star", title: "Polyvalent", description: "Utilise 5 sports différents", progress: 0, total: 5, unit: "sports", xp: 500, accent: "blue", done: false },
    ],
  },
  {
    category: "POINTS",
    items: [
      { id: "p1", icon: "lightning-bolt", title: "100 points", description: "Accumule 100 Ryzer Points", progress: 0, total: 100, unit: "pts", xp: 50, accent: "blue", done: false },
      { id: "p2", icon: "lightning-bolt", title: "500 points", description: "Accumule 500 Ryzer Points", progress: 0, total: 500, unit: "pts", xp: 150, accent: "orange", done: false },
      { id: "p3", icon: "crown", title: "Élite", description: "Accumule 2000 Ryzer Points", progress: 0, total: 2000, unit: "pts", xp: 500, accent: "green", done: false },
    ],
  },
];

function ChallengeCard({ item }: { item: Challenge }) {
  const colors = useColors();
  const pct = Math.min(item.progress / item.total, 1);
  const accentColor = item.accent === "blue" ? BLUE : item.accent === "orange" ? ORANGE : GREEN;
  const accentBg = item.accent === "blue"
    ? "rgba(37,99,235,0.10)"
    : item.accent === "orange"
    ? "rgba(249,115,22,0.10)"
    : "rgba(34,197,94,0.10)";

  return (
    <View style={[styles.card, {
      backgroundColor: item.done ? accentBg : colors.card,
      borderColor: item.done ? accentColor : colors.border,
      borderWidth: item.done ? 1.5 : 1,
    }]}>
      <View style={[styles.cardIcon, { backgroundColor: accentBg }]}>
        <MaterialCommunityIcons name={item.icon} size={22} color={accentColor} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.xpBadge, { backgroundColor: accentBg }]}>
            <Text style={[styles.xpText, { color: accentColor }]}>+{item.xp} XP</Text>
          </View>
        </View>

        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.progressRow}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: accentColor }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {item.progress}/{item.total} {item.unit}
          </Text>
        </View>
      </View>

      {item.done && (
        <View style={[styles.doneCheck, { backgroundColor: accentColor }]}>
          <Feather name="check" size={12} color="#fff" />
        </View>
      )}
    </View>
  );
}

export default function DefiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const { profile } = useUser();

  const totalDone = CHALLENGES.flatMap((c) => c.items).filter((i) => i.done).length;
  const total = CHALLENGES.flatMap((c) => c.items).length;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad + 80,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.eyebrow, { color: BLUE }]}>PROGRESSION</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>
        TES <Text style={{ color: ORANGE }}>DÉFIS</Text>
      </Text>

      {/* Global progress card */}
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
            {
              width: `${total > 0 ? (totalDone / total) * 100 : 0}%` as any,
              backgroundColor: ORANGE,
            },
          ]} />
        </View>
      </View>

      {/* Categories */}
      {CHALLENGES.map((cat) => (
        <View key={cat.category} style={styles.category}>
          <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>
            {cat.category}
          </Text>
          {cat.items.map((item) => (
            <ChallengeCard key={item.id} item={item} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36, marginBottom: 18 },

  globalCard: {
    borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24,
  },
  globalRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  trophyWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  globalTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  globalSub: { fontSize: 11, fontWeight: "500" },

  category: { marginBottom: 20 },
  catLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", flex: 1 },
  xpBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  xpText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  cardDesc: { fontSize: 11, fontWeight: "500" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  progressTrack: {
    flex: 1, height: 4, borderRadius: 999, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  progressLabel: { fontSize: 9, fontWeight: "600", minWidth: 60, textAlign: "right" },
  doneCheck: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
});
