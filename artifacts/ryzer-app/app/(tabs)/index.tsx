import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const SPORTS: { id: number; icon: MCIcon; name: string; met: number; accent: "blue" | "orange" }[] = [
  { id: 1, icon: "run",                   name: "Course à pied", met: 8,   accent: "blue"   },
  { id: 2, icon: "bike",                  name: "Cyclisme",      met: 7.5, accent: "orange" },
  { id: 3, icon: "swim",                  name: "Natation",      met: 8.3, accent: "blue"   },
  { id: 4, icon: "hiking",               name: "Randonnée",     met: 5.3, accent: "orange" },
  { id: 5, icon: "ski-cross-country",     name: "Ski de fond",   met: 9,   accent: "blue"   },
  { id: 6, icon: "weight-lifter",         name: "Musculation",   met: 5,   accent: "orange" },
];

const BLUE   = "#2563eb";
const ORANGE = "#f97316";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const topPad    = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 80,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>PERFORMANCE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            CALCULATEUR{"\n"}
            <Text style={{ color: BLUE }}>RYZER</Text>
            <Text style={{ color: ORANGE }}> POINTS</Text>
          </Text>
        </View>

        {/* BADGE */}
        <View style={[styles.badge, { borderColor: "rgba(249,115,22,0.3)", backgroundColor: "rgba(249,115,22,0.08)" }]}>
          <View style={[styles.dot, { backgroundColor: ORANGE }]} />
          <Text style={[styles.badgeText, { color: ORANGE }]}>CALCULATEUR SPORTIF</Text>
        </View>

        {/* SPORTS GRID */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SPORTS DISPONIBLES</Text>
        <View style={styles.grid}>
          {SPORTS.map((sport) => {
            const iconColor = sport.accent === "blue" ? BLUE : ORANGE;
            const iconBg    = sport.accent === "blue"
              ? "rgba(37,99,235,0.10)"
              : "rgba(249,115,22,0.10)";

            return (
              <Pressable
                key={sport.id}
                style={({ pressed }) => [
                  styles.sportCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                {/* Icon bubble */}
                <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={sport.icon} size={26} color={iconColor} />
                </View>

                <Text style={[styles.sportName, { color: colors.foreground }]} numberOfLines={1}>
                  {sport.name}
                </Text>

                <View style={[styles.metBadge, { backgroundColor: "rgba(37,99,235,0.08)" }]}>
                  <Text style={[styles.metText, { color: BLUE }]}>MET {sport.met}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: BLUE,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather name="zap" size={18} color="#fff" />
          <Text style={styles.ctaText}>CALCULER MES RYZER POINTS</Text>
        </Pressable>

        {/* INFO CARD */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Qu'est-ce qu'un Ryzer Point ?
          </Text>
          <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
            Les Ryzer Points mesurent ta dépense d'effort en combinant le sport, la durée, ta fréquence cardiaque et ton VO2 max — une métrique unique pour tous les sports.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: { marginBottom: 16 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 7,
    marginBottom: 28,
  },
  dot:      { width: 6, height: 6, borderRadius: 3 },
  badgeText:{ fontSize: 10, fontWeight: "700", letterSpacing: 0.9 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  sportCard: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sportName: { fontSize: 13, fontWeight: "600" },
  metBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metText: { fontSize: 10, fontWeight: "700" },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 999,
    marginBottom: 20,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: "700" },
  infoBody:  { fontSize: 13, lineHeight: 20 },
});
