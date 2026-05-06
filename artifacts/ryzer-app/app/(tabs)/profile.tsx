import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const STORAGE_KEY_NAME   = "@ryzer_profile_name";
const STORAGE_KEY_POINTS = "@ryzer_total_points";

const BLUE   = "#2563eb";
const ORANGE = "#f97316";

const STATS = [
  { label: "SESSIONS",   value: "12",    icon: "lightning-bolt" as MCIcon,  color: BLUE   },
  { label: "DURÉE TOT.", value: "18h",   icon: "clock-outline" as MCIcon,   color: ORANGE },
  { label: "MEILLEURE",  value: "32",    icon: "trophy-outline" as MCIcon,  color: BLUE   },
];

type RecentItem = {
  sport: string;
  icon: MCIcon;
  accent: "blue" | "orange";
  points: number;
  date: string;
};

const RECENT: RecentItem[] = [
  { sport: "Course à pied", icon: "run",    accent: "blue",   points: 32, date: "Aujourd'hui" },
  { sport: "Cyclisme",      icon: "bike",   accent: "orange", points: 29, date: "Hier"        },
  { sport: "Natation",      icon: "swim",   accent: "blue",   points: 24, date: "Il y a 2 j." },
  { sport: "Randonnée",     icon: "hiking", accent: "orange", points: 20, date: "Il y a 3 j." },
];

export default function ProfileScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const isWeb      = Platform.OS === "web";
  const topPad     = isWeb ? 67 : insets.top;
  const bottomPad  = isWeb ? 34 : insets.bottom;

  const [name,        setName]        = useState("Athlète Ryzer");
  const [editingName, setEditingName] = useState(false);
  const [draftName,   setDraftName]   = useState("");
  const [totalPoints, setTotalPoints] = useState(105);

  useEffect(() => {
    (async () => {
      try {
        const [storedName, storedPoints] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_NAME),
          AsyncStorage.getItem(STORAGE_KEY_POINTS),
        ]);
        if (storedName)   setName(storedName);
        if (storedPoints) setTotalPoints(Number(storedPoints));
      } catch {}
    })();
  }, []);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const startEditing = () => {
    setDraftName(name);
    setEditingName(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveName = useCallback(async () => {
    const trimmed = draftName.trim();
    if (!trimmed) { setEditingName(false); return; }
    setName(trimmed);
    setEditingName(false);
    await AsyncStorage.setItem(STORAGE_KEY_NAME, trimmed);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [draftName]);

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
        <Text style={[styles.eyebrow, { color: BLUE }]}>MON PROFIL</Text>

        {/* PROFILE CARD */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: BLUE }]}>
              <Text style={styles.avatarText}>{initials || "R"}</Text>
            </View>
            <Pressable
              onPress={startEditing}
              style={[styles.editBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Feather name="edit-2" size={12} color={BLUE} />
            </Pressable>
          </View>

          {/* Name */}
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                autoFocus
                onBlur={saveName}
                onSubmitEditing={saveName}
                style={[styles.nameInput, { color: colors.foreground, borderColor: BLUE }]}
                placeholder="Ton nom"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
                maxLength={30}
              />
              <Pressable onPress={saveName} style={[styles.saveBtn, { backgroundColor: BLUE }]}>
                <Feather name="check" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={startEditing} style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginLeft: 6, marginTop: 2 }} />
            </Pressable>
          )}

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Athlète Ryzer</Text>

          {/* TOTAL POINTS */}
          <View style={[styles.pointsBanner, { backgroundColor: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.15)" }]}>
            <Text style={[styles.pointsValue, { color: colors.foreground }]}>
              {totalPoints.toLocaleString("fr-FR")}
            </Text>
            <View style={[styles.pointsBadge, { backgroundColor: "rgba(37,99,235,0.12)", borderColor: "rgba(37,99,235,0.2)" }]}>
              <View style={[styles.pointsDot, { backgroundColor: BLUE }]} />
              <Text style={[styles.pointsBadgeText, { color: BLUE }]}>RYZER POINTS TOTAUX</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STATISTIQUES</Text>
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIconBubble, { backgroundColor: s.color === BLUE ? "rgba(37,99,235,0.10)" : "rgba(249,115,22,0.10)" }]}>
                <MaterialCommunityIcons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* RECENT ACTIVITY */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACTIVITÉ RÉCENTE</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {RECENT.map((item, idx) => {
            const iconColor = item.accent === "blue" ? BLUE : ORANGE;
            const iconBg    = item.accent === "blue"
              ? "rgba(37,99,235,0.10)"
              : "rgba(249,115,22,0.10)";

            return (
              <View
                key={idx}
                style={[
                  styles.activityRow,
                  idx < RECENT.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                {/* Icon bubble */}
                <View style={[styles.activityIconBubble, { backgroundColor: iconBg }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={iconColor} />
                </View>

                <View style={styles.activityInfo}>
                  <Text style={[styles.activitySport, { color: colors.foreground }]}>{item.sport}</Text>
                  <Text style={[styles.activityDate,  { color: colors.mutedForeground }]}>{item.date}</Text>
                </View>

                <View style={styles.activityRight}>
                  <Text style={[styles.activityPoints, { color: BLUE }]}>
                    {item.points.toLocaleString("fr-FR")}
                  </Text>
                  <Text style={[styles.activityRp, { color: colors.mutedForeground }]}>RP</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 20,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  editBtn: {
    position: "absolute",
    bottom: 0,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  name:    { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    borderBottomWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 160,
    textAlign: "center",
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 13, fontWeight: "500", marginBottom: 20 },
  pointsBanner: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  pointsValue: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 56,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pointsDot:       { width: 6, height: 6, borderRadius: 3 },
  pointsBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 9,  fontWeight: "700", letterSpacing: 0.8 },
  activityCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  activityIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activityInfo:   { flex: 1 },
  activitySport:  { fontSize: 14, fontWeight: "600" },
  activityDate:   { fontSize: 12, marginTop: 2 },
  activityRight:  { alignItems: "flex-end" },
  activityPoints: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  activityRp:     { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
});
