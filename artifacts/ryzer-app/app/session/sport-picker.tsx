import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";

const SPORTS: { id: number; icon: MCIcon; name: string; met: number; accent: "blue" | "orange" }[] = [
  { id: 1, icon: "run",              name: "Course à pied", met: 8,   accent: "blue"   },
  { id: 2, icon: "bike",             name: "Cyclisme",      met: 7.5, accent: "orange" },
  { id: 3, icon: "swim",             name: "Natation",      met: 8.3, accent: "blue"   },
  { id: 4, icon: "hiking",           name: "Randonnée",     met: 5.3, accent: "orange" },
  { id: 5, icon: "ski-cross-country",name: "Ski de fond",   met: 9,   accent: "blue"   },
  { id: 6, icon: "weight-lifter",    name: "Musculation",   met: 5,   accent: "orange" },
  { id: 7, icon: "rowing",           name: "Aviron",        met: 7,   accent: "blue"   },
  { id: 8, icon: "tennis",           name: "Tennis",        met: 7.3, accent: "orange" },
  { id: 9, icon: "soccer",           name: "Football",      met: 7,   accent: "blue"   },
  { id: 10,icon: "yoga",             name: "Yoga",          met: 3,   accent: "orange" },
  { id: 11,icon: "basketball",       name: "Basketball",    met: 8,   accent: "blue"   },
  { id: 12,icon: "volleyball",       name: "Volleyball",    met: 4,   accent: "orange" },
];

export default function SportPickerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 24, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.eyebrow, { color: BLUE }]}>NOUVELLE SESSION</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          CHOISIS{"\n"}<Text style={{ color: BLUE }}>TON </Text>
          <Text style={{ color: ORANGE }}>SPORT</Text>
        </Text>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SPORTS DISPONIBLES</Text>

        <View style={styles.grid}>
          {SPORTS.map((sport) => {
            const iconColor = sport.accent === "blue" ? BLUE : ORANGE;
            const iconBg = sport.accent === "blue" ? "rgba(37,99,235,0.10)" : "rgba(249,115,22,0.10)";
            const borderAccent = sport.accent === "blue" ? "rgba(37,99,235,0.2)" : "rgba(249,115,22,0.2)";

            return (
              <Pressable
                key={sport.id}
                style={({ pressed }) => [
                  styles.sportCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { transform: [{ scale: 0.96 }], borderColor: borderAccent },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/session/timer",
                    params: {
                      sportId: sport.id,
                      sportName: sport.name,
                      sportIcon: sport.icon,
                      met: sport.met,
                    },
                  })
                }
              >
                <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={sport.icon} size={28} color={iconColor} />
                </View>
                <Text style={[styles.sportName, { color: colors.foreground }]} numberOfLines={1}>
                  {sport.name}
                </Text>
                <View style={[styles.metBadge, { backgroundColor: iconBg }]}>
                  <Text style={[styles.metText, { color: iconColor }]}>MET {sport.met}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -1, lineHeight: 38, marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sportCard: {
    width: "47%", borderWidth: 1, borderRadius: 14, padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  iconBubble: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sportName: { fontSize: 13, fontWeight: "700" },
  metBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  metText: { fontSize: 10, fontWeight: "700" },
});
