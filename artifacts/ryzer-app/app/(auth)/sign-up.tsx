import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Platform, ActivityIndicator, Image,
} from "react-native";
import { useSignUp, useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const BLUE = "#2563eb";
const ORANGE = "#f97316";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const isFetching = fetchStatus === "fetching";

  const handleSignUp = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code: verifyCode });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/(setup)/profile-setup");
          router.replace(url.startsWith("http") ? "/(setup)/profile-setup" : (url as any));
        },
      });
    }
  };

  if (isSignedIn) {
    router.replace("/");
    return null;
  }

  // OTP verification step
  if (
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields?.includes("email_address") &&
    signUp.missingFields?.length === 0
  ) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>

          <View style={[styles.otpIconWrap, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
            <Feather name="mail" size={32} color={BLUE} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            CHECK{"\n"}<Text style={{ color: BLUE }}>TON MAIL</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Un code à 6 chiffres a été envoyé à{"\n"}<Text style={{ color: colors.foreground, fontWeight: "700" }}>{email}</Text>
          </Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>CODE DE VÉRIFICATION</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: BLUE, borderWidth: 2 }]}>
            <Feather name="shield" size={16} color={BLUE} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontSize: 22, letterSpacing: 6, fontWeight: "700" }]}
              value={verifyCode}
              onChangeText={setVerifyCode}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>
          {errors?.fields?.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}

          <Pressable
            style={[styles.btn, { backgroundColor: BLUE, opacity: (verifyCode.length < 6 || isFetching) ? 0.6 : 1 }]}
            onPress={handleVerify}
            disabled={verifyCode.length < 6 || isFetching}
          >
            {isFetching
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="check" size={16} color="#fff" /><Text style={styles.btnText}>VÉRIFIER MON COMPTE</Text></>
            }
          </Pressable>

          <Pressable onPress={() => signUp.verifications.sendEmailCode()} style={styles.link}>
            <Text style={[styles.linkText, { color: BLUE }]}>Renvoyer le code</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>

        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.foreground }]}>
          REJOINS{"\n"}
          <Text style={{ color: BLUE }}>L'ÉQUIPE </Text>
          <Text style={{ color: ORANGE }}>RYZER</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Crée ton compte et commence à accumuler des Ryzer Points
        </Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>ADRESSE MAIL</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={email}
            onChangeText={setEmail}
            placeholder="ton@email.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors?.fields?.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>MOT DE PASSE</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="8 caractères minimum"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
        {errors?.fields?.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}

        <Pressable
          style={[styles.btn, { backgroundColor: BLUE, opacity: (!email || !password || isFetching) ? 0.6 : 1 }]}
          onPress={handleSignUp}
          disabled={!email || !password || isFetching}
        >
          {isFetching
            ? <ActivityIndicator color="#fff" />
            : <><Feather name="zap" size={16} color="#fff" /><Text style={styles.btnText}>CRÉER MON COMPTE</Text></>
          }
        </Pressable>

        {/* Required for Clerk bot protection */}
        <View nativeID="clerk-captcha" />

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Déjà un compte ?</Text>
          <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
            <Text style={[styles.linkText, { color: BLUE }]}> Se connecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 8 },
  logo: { width: 64, height: 64, alignSelf: "center", marginBottom: 20 },
  otpIconWrap: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1, lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
  error: { color: "#ef4444", fontSize: 12, marginTop: -10, marginBottom: 10 },
  btn: {
    height: 56, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.8 },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  switchText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: "700" },
  link: { alignItems: "center", marginTop: 16 },
});
