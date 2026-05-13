import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";

const RECENT_SPORTS: { icon: MCIcon; name: string; accent: "blue" | "orange" }[] = [
  { icon: "run",    name: "Course",    accent: "blue"   },
  { icon: "bike",   name: "Vélo",      accent: "orange" },
  { icon: "swim",   name: "Natation",  accent: "blue"   },
  { icon: "hiking", name: "Randonnée", accent: "orange" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { profile } = useUser();
  const firstName = profile?.displayName?.split(" ")[0] ?? "Athlète";

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
        {/* GREETING */}
        <View style={styles.greetRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greet, { color: colors.mutedForeground }]}>BONJOUR,</Text>
            <Text style={[styles.greetName, { color: colors.foreground }]}>
              {firstName.toUpperCase()} 👋
            </Text>
          </View>
          {profile?.photoData ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${profile.photoData}` }}
              style={[styles.avatar, { borderColor: BLUE }]}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: BLUE }]}>
              <Text style={styles.avatarInitials}>
                {(profile?.displayName ?? "R").split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
              </Text>
            </View>
          )}
        </View>

        {/* STREAK BANNER */}
        {(profile?.currentStreak ?? 0) > 0 && (
          <View style={[
            styles.streakBanner,
            {
              backgroundColor: (profile?.currentStreak ?? 0) >= 3
                ? "rgba(249,115,22,0.08)"
                : "rgba(37,99,235,0.06)",
              borderColor: (profile?.currentStreak ?? 0) >= 3
                ? "rgba(249,115,22,0.3)"
                : "rgba(37,99,235,0.2)",
            },
          ]}>
            <View style={[styles.streakIconWrap, { backgroundColor: (profile?.currentStreak ?? 0) >= 3 ? "rgba(249,115,22,0.15)" : "rgba(37,99,235,0.12)" }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={(profile?.currentStreak ?? 0) >= 3 ? ORANGE : BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakCount, {
                color: (profile?.currentStreak ?? 0) >= 3 ? ORANGE : BLUE,
              }]}>
                {profile?.currentStreak} JOUR{(profile?.currentStreak ?? 0) > 1 ? "S" : ""} D'AFFILÉE
              </Text>
              {(profile?.currentStreak ?? 0) >= 3 ? (
                <Text style={[styles.streakSub, { color: ORANGE }]}>✕1.5 actif — continue comme ça !</Text>
              ) : (
                <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                  Encore {3 - (profile?.currentStreak ?? 0)} jour{3 - (profile?.currentStreak ?? 0) > 1 ? "s" : ""} pour le bonus ✕1.5
                </Text>
              )}
            </View>
            {(profile?.currentStreak ?? 0) >= 3 && (
              <View style={[styles.streakBadge, { backgroundColor: ORANGE }]}>
                <Text style={styles.streakBadgeText}>✕1.5</Text>
              </View>
            )}
          </View>
        )}

        {/* POINTS BANNER */}
        <View style={[styles.pointsBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointsLabel, { color: colors.mutedForeground }]}>
              TES RYZER POINTS
            </Text>
            <Text style={[styles.pointsValue, { color: colors.foreground }]}>
              {(profile?.totalPoints ?? 0).toLocaleString("fr-FR")}
            </Text>
          </View>
          <View style={[styles.pointsIconWrap, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
            <Feather name="zap" size={28} color={BLUE} />
          </View>
        </View>

        {/* START SESSION CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.startBtn,
            {
              backgroundColor: BLUE,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={() => router.push("/session/sport-picker")}
        >
          <View style={[styles.startBtnIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="play" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.startBtnTitle}>DÉMARRER UNE SESSION</Text>
            <Text style={styles.startBtnSub}>Choisis un sport et commence</Text>
          </View>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* QUICK ACCESS */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCÈS RAPIDE</Text>
        <View style={styles.quickGrid}>
          {RECENT_SPORTS.map((sport) => {
            const iconColor = sport.accent === "blue" ? BLUE : ORANGE;
            const iconBg = sport.accent === "blue" ? "rgba(37,99,235,0.10)" : "rgba(249,115,22,0.10)";
            return (
              <Pressable
                key={sport.name}
                style={({ pressed }) => [
                  styles.quickCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/session/timer",
                    params: { sportName: sport.name, sportIcon: sport.icon, met: "7" },
                  })
                }
              >
                <View style={[styles.quickIconWrap, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={sport.icon} size={22} color={iconColor} />
                </View>
                <Text style={[styles.quickName, { color: colors.foreground }]}>{sport.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* TIPS CARD */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: "rgba(37,99,235,0.2)", borderLeftColor: BLUE }]}>
          <Feather name="info" size={16} color={BLUE} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Comment calculer tes Ryzer Points</Text>
            <Text style={[styles.tipsBody, { color: colors.mutedForeground }]}>
              Lance une session, fais ton sport, et arrête le chrono. Tes points sont calculés automatiquement selon le MET du sport.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  greetRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  greet: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },
  greetName: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarInitials: { color: "#fff", fontSize: 18, fontWeight: "900" },
  pointsBanner: {
    borderWidth: 1, borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center", marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  pointsLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  pointsValue: { fontSize: 40, fontWeight: "900", letterSpacing: -1.5 },
  pointsIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  startBtn: {
    borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center",
    gap: 14, marginBottom: 28,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  startBtnIcon: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  startBtnTitle: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  startBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
  quickGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  quickCard: {
    flex: 1, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickName: { fontSize: 11, fontWeight: "700" },
  tipsCard: {
    borderWidth: 1, borderLeftWidth: 3, borderRadius: 12, padding: 14,
    flexDirection: "row", gap: 10,
  },
  tipsTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  tipsBody: { fontSize: 12, lineHeight: 18 },
  streakBanner: {
    borderWidth: 1, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16,
  },
  streakIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  streakCount: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  streakSub: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  streakBadge: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  streakBadgeText: { color: "#fff", fontSize: 13, fontWeight: "900" },
});
