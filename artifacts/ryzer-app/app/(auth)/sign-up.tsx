import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, ActivityIndicator, Image,
  KeyboardAvoidingView,
} from "react-native";
import { useSignUp } from "@clerk/expo";
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

  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isBusy = !isLoaded || isLoading;

  const handleSignUp = async () => {
    if (isBusy) return;
    if (!email.trim() || !password.trim()) {
      setError("Saisis ton adresse mail et ton mot de passe.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signUp!.create({ emailAddress: email.trim(), password });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      setError(clerkError?.longMessage ?? clerkError?.message ?? "Erreur lors de la création du compte.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded || verifyCode.length < 6) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code: verifyCode });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        router.replace("/(setup)/profile-setup");
      }
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      setError(clerkError?.longMessage ?? clerkError?.message ?? "Code invalide.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try { await signUp!.prepareEmailAddressVerification({ strategy: "email_code" }); } catch {}
  };

  const handleClose = () => {
    if (pendingVerification) { setPendingVerification(false); return; }
    if (router.canGoBack()) router.back();
    else router.replace("/onboarding");
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View style={[styles.otpIconWrap, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
            <Feather name="mail" size={32} color={BLUE} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            CHECK{"\n"}<Text style={{ color: BLUE }}>TON MAIL</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Un code à 6 chiffres a été envoyé à{"\n"}
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>{email}</Text>
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
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: BLUE, opacity: (verifyCode.length < 6 || isLoading) ? 0.6 : 1 }]}
            onPress={handleVerify}
            disabled={verifyCode.length < 6 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="check" size={16} color="#fff" /><Text style={styles.btnText}>VÉRIFIER MON COMPTE</Text></>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} style={styles.link}>
            <Text style={[styles.linkText, { color: BLUE }]}>Renvoyer le code</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

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
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

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
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View nativeID="clerk-captcha" />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: BLUE, opacity: isBusy ? 0.6 : 1 }]}
          onPress={handleSignUp}
          disabled={isBusy}
          activeOpacity={0.8}
        >
          {isBusy
            ? <ActivityIndicator color="#fff" />
            : <><Feather name="zap" size={16} color="#fff" /><Text style={styles.btnText}>CRÉER MON COMPTE</Text></>
          }
        </TouchableOpacity>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
            <Text style={[styles.linkText, { color: BLUE }]}> Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: { alignSelf: "flex-end", padding: 8, marginBottom: 8 },
  logo: { width: 64, height: 64, alignSelf: "center", marginBottom: 20, borderRadius: 16 },
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
  error: { color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" },
  btn: {
    height: 56, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 8, marginBottom: 20,
  },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.8 },
  switchRow: { flexDirection: "row", justifyContent: "center" },
  switchText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: "700" },
  link: { alignItems: "center", marginTop: 16 },
});
