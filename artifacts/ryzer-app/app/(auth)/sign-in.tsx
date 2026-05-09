import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Platform, ActivityIndicator, Image,
} from "react-native";
import { useSignIn, useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const BLUE = "#2563eb";
const ORANGE = "#f97316";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");

  const isFetching = fetchStatus === "fetching";

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/" : (url as any));
        },
      });
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code: verifyCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/" : (url as any));
        },
      });
    }
  };

  if (isSignedIn) {
    router.replace("/");
    return null;
  }

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: topPad + 24, paddingBottom: bottomPad + 24 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Vérification</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Un code a été envoyé à {email}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={verifyCode}
              onChangeText={setVerifyCode}
              placeholder="Code de vérification"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          {errors?.fields?.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
          <Pressable
            style={[styles.btn, { backgroundColor: BLUE, opacity: isFetching ? 0.7 : 1 }]}
            onPress={handleVerify}
            disabled={isFetching}
          >
            {isFetching ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>VÉRIFIER</Text>}
          </Pressable>
          <Pressable onPress={() => signIn.mfa.sendEmailCode()} style={styles.link}>
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
        {/* Close button */}
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>

        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, { color: colors.foreground }]}>
          BIENVENUE{"\n"}
          <Text style={{ color: BLUE }}>SUR </Text>
          <Text style={{ color: ORANGE }}>RYZER</Text>
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Connecte-toi pour accéder à tes Ryzer Points
        </Text>

        {/* Email */}
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
        {errors?.fields?.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}

        {/* Password */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>MOT DE PASSE</Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
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
          onPress={handleSignIn}
          disabled={!email || !password || isFetching}
        >
          {isFetching
            ? <ActivityIndicator color="#fff" />
            : <><Feather name="zap" size={16} color="#fff" /><Text style={styles.btnText}>SE CONNECTER</Text></>
          }
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Pas encore de compte ?</Text>
          <Pressable onPress={() => router.replace("/(auth)/sign-up")}>
            <Text style={[styles.linkText, { color: BLUE }]}> S'inscrire</Text>
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
