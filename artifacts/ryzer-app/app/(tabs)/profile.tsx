import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  Pressable, Platform, Image, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";
import { FlameIcon } from "@/components/FlameIcon";

type MCIcon = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const BLUE = "#2563eb";
const ORANGE = "#f97316";

const STAT_ICONS: { icon: MCIcon; color: string }[] = [
  { icon: "lightning-bolt", color: BLUE },
  { icon: "clock-outline",  color: ORANGE },
  { icon: "trophy-outline", color: BLUE },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { signOut } = useAuth();
  const { profile, sessions, isLoading, updateProfile, uploadPhoto, refreshProfile, refreshSessions } = useUser();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshSessions();
    }, [refreshProfile, refreshSessions])
  );

  const initials = (profile?.displayName ?? "R")
    .split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  const startEditing = () => {
    setDraftName(profile?.displayName ?? "");
    setEditingName(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveName = useCallback(async () => {
    const trimmed = draftName.trim();
    if (!trimmed) { setEditingName(false); return; }
    setEditingName(false);
    await updateProfile({ displayName: trimmed });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [draftName, updateProfile]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setUploadingPhoto(true);
      await uploadPhoto(result.assets[0].base64);
      setUploadingPhoto(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  if (isLoading && !profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  const totalPts = profile?.totalPoints ?? 0;
  const sessionCount = sessions.length;
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  function formatTotalDuration(seconds: number): string {
    if (seconds === 0) return "–";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
    return `${m}min`;
  }

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
        <View style={styles.headerRow}>
          <Text style={[styles.eyebrow, { color: BLUE }]}>MON PROFIL</Text>
          <Pressable onPress={handleSignOut} style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="log-out" size={15} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* PROFILE CARD */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar */}
          <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
            {uploadingPhoto ? (
              <View style={[styles.avatar, { backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                <ActivityIndicator color={BLUE} />
              </View>
            ) : profile?.photoData ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${profile.photoData}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: BLUE }]}>
                <Text style={styles.avatarText}>{initials || "R"}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: ORANGE, borderColor: colors.card }]}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </Pressable>

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
              <Text style={[styles.name, { color: colors.foreground }]}>{profile?.displayName || "Athlète Ryzer"}</Text>
              <Feather name="edit-2" size={13} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
            </Pressable>
          )}

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Athlète Ryzer</Text>

          {/* STREAK */}
          {(profile?.currentStreak ?? 0) > 0 && (
            <View style={[
              styles.streakRow,
              {
                backgroundColor: (profile?.currentStreak ?? 0) >= 3
                  ? "rgba(249,115,22,0.08)"
                  : "rgba(37,99,235,0.06)",
                borderColor: (profile?.currentStreak ?? 0) >= 3
                  ? "rgba(249,115,22,0.25)"
                  : "rgba(37,99,235,0.15)",
              },
            ]}>
            <FlameIcon size={22} color={(profile?.currentStreak ?? 0) >= 3 ? ORANGE : BLUE} />
              <Text style={[styles.streakLabel, {
                color: (profile?.currentStreak ?? 0) >= 3 ? ORANGE : BLUE,
              }]}>
                {profile?.currentStreak} JOUR{(profile?.currentStreak ?? 0) > 1 ? "S" : ""} D'AFFILÉE
              </Text>
              {(profile?.currentStreak ?? 0) >= 3 && (
                <View style={[styles.streakMultiplierBadge, { backgroundColor: ORANGE }]}>
                  <Text style={styles.streakMultiplierText}>✕1.5</Text>
                </View>
              )}
            </View>
          )}

          {/* TOTAL POINTS */}
          <View style={[styles.pointsBanner, { backgroundColor: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.15)" }]}>
            <Text style={[styles.pointsValue, { color: colors.foreground }]}>
              {totalPts.toLocaleString("fr-FR")}
            </Text>
            <View style={[styles.pointsBadge, { backgroundColor: "rgba(37,99,235,0.12)", borderColor: "rgba(37,99,235,0.2)" }]}>
              <View style={[styles.pointsDot, { backgroundColor: BLUE }]} />
              <Text style={[styles.pointsBadgeText, { color: BLUE }]}>RYZER POINTS TOTAUX</Text>
            </View>
          </View>
        </View>

        {/* START SESSION shortcut */}
        <Pressable
          style={({ pressed }) => [
            styles.sessionBtn,
            { backgroundColor: BLUE, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => router.push("/session/sport-picker")}
        >
          <Feather name="play" size={16} color="#fff" />
          <Text style={styles.sessionBtnText}>NOUVELLE SESSION</Text>
        </Pressable>

        {/* STATS */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STATISTIQUES</Text>
        <View style={styles.statsRow}>
          {[
            { label: "SESSIONS",   value: sessionCount > 0 ? String(sessionCount) : "–" },
            { label: "DURÉE TOT.", value: formatTotalDuration(totalDurationSeconds) },
            { label: "RYZER PTS",  value: totalPts > 0 ? totalPts.toLocaleString("fr-FR") : "–" },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIconBubble, { backgroundColor: i % 2 === 0 ? "rgba(37,99,235,0.10)" : "rgba(249,115,22,0.10)" }]}>
                <MaterialCommunityIcons name={STAT_ICONS[i].icon} size={18} color={STAT_ICONS[i].color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* DERNIÈRES SESSIONS */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DERNIÈRES SESSIONS</Text>
        {sessions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="lightning-bolt-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune session pour le moment</Text>
          </View>
        ) : (
          <View style={[styles.sessionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {sessions.slice(0, 5).map((s, i) => {
              const date = new Date(s.createdAt);
              const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              const h = Math.floor(s.durationSeconds / 3600);
              const m = Math.floor((s.durationSeconds % 3600) / 60);
              const sec = s.durationSeconds % 60;
              const durStr = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : m > 0 ? `${m}min ${sec}s` : `${sec}s`;
              return (
                <View key={s.id}>
                  {i > 0 && <View style={[styles.sessionDivider, { backgroundColor: colors.border }]} />}
                  <View style={styles.sessionRow}>
                    <View style={[styles.sessionIconWrap, { backgroundColor: "rgba(37,99,235,0.10)" }]}>
                      <MaterialCommunityIcons name={(s.sportIcon ?? "run") as MCIcon} size={18} color={BLUE} />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={[styles.sessionSport, { color: colors.foreground }]}>{s.sportName}</Text>
                      <Text style={[styles.sessionMeta, { color: colors.mutedForeground }]}>{durStr} · {dateStr}</Text>
                    </View>
                    <View style={[styles.sessionPtsBadge, { backgroundColor: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.18)" }]}>
                      <Text style={[styles.sessionPts, { color: BLUE }]}>+{s.points}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* PROFILE SETUP LINK */}
        <Pressable
          style={[styles.setupLink, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push("/(setup)/profile-setup")}
        >
          <Feather name="settings" size={16} color={colors.mutedForeground} />
          <Text style={[styles.setupLinkText, { color: colors.foreground }]}>Modifier mon profil</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.4 },
  logoutBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  profileCard: {
    borderWidth: 1, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "900" },
  cameraOverlay: {
    position: "absolute", bottom: 1, right: 1,
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  name: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  nameInput: {
    fontSize: 20, fontWeight: "700", borderBottomWidth: 2,
    paddingVertical: 4, paddingHorizontal: 2, minWidth: 160, textAlign: "center",
  },
  saveBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 13, fontWeight: "500", marginBottom: 20 },
  pointsBanner: {
    width: "100%", borderWidth: 1, borderRadius: 14,
    padding: 16, alignItems: "center", gap: 8,
  },
  pointsValue: { fontSize: 52, fontWeight: "900", letterSpacing: -2, lineHeight: 56 },
  pointsBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  pointsDot: { width: 6, height: 6, borderRadius: 3 },
  pointsBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  sessionBtn: {
    height: 50, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28,
  },
  sessionBtnText: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.8 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.1, marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statIconBubble: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  streakRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 16, alignSelf: "stretch",
  },

  streakLabel: { flex: 1, fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  streakMultiplierBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  streakMultiplierText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  setupLink: {
    borderWidth: 1, borderRadius: 12, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  setupLinkText: { flex: 1, fontSize: 14, fontWeight: "600" },
  emptyCard: {
    borderWidth: 1, borderRadius: 14, padding: 24,
    alignItems: "center", gap: 8, marginBottom: 20,
  },
  emptyText: { fontSize: 13, fontWeight: "500" },
  sessionsCard: {
    borderWidth: 1, borderRadius: 16, overflow: "hidden", marginBottom: 20,
  },
  sessionRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
  },
  sessionDivider: { height: 1, marginHorizontal: 16 },
  sessionIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sessionInfo: { flex: 1, gap: 2 },
  sessionSport: { fontSize: 14, fontWeight: "700" },
  sessionMeta: { fontSize: 11, fontWeight: "500" },
  sessionPtsBadge: {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sessionPts: { fontSize: 12, fontWeight: "800" },
});
