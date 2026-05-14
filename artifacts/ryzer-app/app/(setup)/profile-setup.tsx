import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Platform, ActivityIndicator, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

const BLUE = "#2563eb";
const ORANGE = "#f97316";

export default function ProfileSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { profile, updateProfile, uploadPhoto } = useUser();
  const isEditMode = profile?.isSetupComplete === true;

  const [name, setName] = useState(profile?.displayName ?? "");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoBase64(result.assets[0].base64 ?? null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") { pickPhoto(); return; }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoBase64(result.assets[0].base64 ?? null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (photoBase64) await uploadPhoto(photoBase64);
      await updateProfile({ displayName: name.trim(), isSetupComplete: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isEditMode) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setIsSaving(false);
    }
  };

  const currentPhoto = photoBase64
    ? `data:image/jpeg;base64,${photoBase64}`
    : profile?.photoData
      ? `data:image/jpeg;base64,${profile.photoData}`
      : null;

  const initials = name.trim().split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button (edit mode only) */}
        {isEditMode && (
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
        )}

        {/* Badge */}
        {!isEditMode && (
          <View style={[styles.badge, { backgroundColor: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.3)" }]}>
            <View style={[styles.dot, { backgroundColor: ORANGE }]} />
            <Text style={[styles.badgeText, { color: ORANGE }]}>BIENVENUE SUR RYZER</Text>
          </View>
        )}

        <Text style={[styles.title, { color: colors.foreground }]}>
          {isEditMode ? (
            <>MODIFIER{"\n"}<Text style={{ color: BLUE }}>MON </Text><Text style={{ color: ORANGE }}>PROFIL</Text></>
          ) : (
            <>CONFIGURE{"\n"}<Text style={{ color: BLUE }}>TON </Text><Text style={{ color: ORANGE }}>PROFIL</Text></>
          )}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {isEditMode
            ? "Modifie ta photo et ton nom d'affichage"
            : "Quelques infos pour personnaliser ton expérience"}
        </Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable onPress={pickPhoto} style={styles.avatarPressable}>
            {currentPhoto ? (
              <Image source={{ uri: currentPhoto }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: BLUE }]}>
                {initials ? (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                ) : (
                  <Feather name="user" size={36} color="rgba(255,255,255,0.7)" />
                )}
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: ORANGE }]}>
              <Feather name="camera" size={13} color="#fff" />
            </View>
          </Pressable>

          {Platform.OS !== "web" && (
            <Pressable onPress={takePhoto} style={styles.cameraBtn}>
              <Feather name="camera" size={15} color={BLUE} />
              <Text style={[styles.cameraBtnText, { color: BLUE }]}>Prendre une photo</Text>
            </Pressable>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>TON PRÉNOM / PSEUDO</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: name.trim() ? BLUE : colors.border }]}>
          <Feather name="user" size={16} color={name.trim() ? BLUE : colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Alex, Sarah, MrRyzer…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
            maxLength={30}
          />
          {name.trim().length > 0 && (
            <Feather name="check-circle" size={16} color={BLUE} />
          )}
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.btn, { backgroundColor: BLUE, opacity: (!name.trim() || isSaving) ? 0.5 : 1 }]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : isEditMode ? (
            <><Feather name="check" size={17} color="#fff" /><Text style={styles.btnText}>SAUVEGARDER</Text></>
          ) : (
            <><Feather name="zap" size={17} color="#fff" /><Text style={styles.btnText}>C'EST PARTI !</Text></>
          )}
        </Pressable>

        {!isEditMode && (
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Passer cette étape</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  badge: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
    gap: 7, marginBottom: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.9 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32, lineHeight: 20 },
  avatarSection: { alignItems: "center", marginBottom: 32, gap: 12 },
  avatarPressable: { position: "relative" },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { color: "#fff", fontSize: 36, fontWeight: "900" },
  avatarEditBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  cameraBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  cameraBtnText: { fontSize: 13, fontWeight: "600" },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 14, height: 54, marginBottom: 24,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: "500" },
  btn: {
    height: 58, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.8 },
  skip: { alignItems: "center", marginTop: 20 },
  skipText: { fontSize: 13 },
});
