import { BlurView } from "expo-blur";
import { Tabs, Redirect, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Text, useColorScheme, ActivityIndicator, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

// expo-glass-effect and expo-router/unstable-native-tabs are iOS-only
// Guard them so the web bundle doesn't crash
let isLiquidGlassAvailable: () => boolean = () => false;
let NativeTabs: any = null;
let Icon: any = null;
let Label: any = null;
let SymbolView: any = null;

if (Platform.OS === "ios") {
  try {
    const glassEffect = require("expo-glass-effect");
    isLiquidGlassAvailable = glassEffect.isLiquidGlassAvailable;
  } catch {}
  try {
    const nativeTabs = require("expo-router/unstable-native-tabs");
    NativeTabs = nativeTabs.NativeTabs;
    Icon = nativeTabs.Icon;
    Label = nativeTabs.Label;
  } catch {}
  try {
    const symbols = require("expo-symbols");
    SymbolView = symbols.SymbolView;
  } catch {}
}

// How long to wait for Clerk auth state before giving up and redirecting
const AUTH_TIMEOUT_MS = 6000;

function AuthAndSetupGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { profile, isLoading } = useUser();
  const colors = useColors();

  const [onboardingChecked, setOnboardingChecked] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);

  // Timeout fallback: if Clerk or AsyncStorage hangs, unblock after AUTH_TIMEOUT_MS
  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const getTokenRef = React.useRef(getToken);
  React.useEffect(() => { getTokenRef.current = getToken; });
  React.useEffect(() => {
    setAuthTokenGetter(() => getTokenRef.current());
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding")
      .then((val) => {
        setHasSeenOnboarding(val === "true");
        setOnboardingChecked(true);
      })
      .catch(() => {
        // AsyncStorage unavailable — treat as first launch
        setOnboardingChecked(true);
      });
  }, []);

  const isAuthReady = isLoaded && onboardingChecked;

  if (!isAuthReady && !timedOut) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // After timeout, if still not loaded treat user as signed out
  if (!isSignedIn) {
    if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!isLoading && profile && !profile.isSetupComplete) {
    return <Redirect href="/(setup)/profile-setup" />;
  }

  return <>{children}</>;
}

function NativeTabLayout() {
  if (!NativeTabs || !Icon || !Label) return <ClassicTabLayout />;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Accueil</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="carte">
        <Icon sf={{ default: "map", selected: "map.fill" }} />
        <Label>Carte</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="defi">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Défis</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function FABButton() {
  return (
    <Pressable
      onPress={() => router.push("/session/sport-picker")}
      style={({ pressed }) => [
        fabStyles.fab,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <Feather name="plus" size={28} color="#fff" />
    </Pressable>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabBarHeight = isWeb ? 84 : 60 + insets.bottom;
  const tabBarPaddingBottom = isWeb ? 34 : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#64748b",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolView ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="carte"
        options={{
          title: "Carte",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolView ? (
              <SymbolView name="map" tintColor={color} size={24} />
            ) : (
              <Feather name="map" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="start"
        options={{
          title: "Session",
          tabBarButton: () => (
            <View style={fabStyles.fabWrapper}>
              <FABButton />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="defi"
        options={{
          title: "Défis",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolView ? (
              <SymbolView name="trophy" tintColor={color} size={24} />
            ) : (
              <Feather name="award" size={24} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolView ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={24} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const useNative = Platform.OS === "ios" && isLiquidGlassAvailable();
  const tabContent = useNative ? <NativeTabLayout /> : <ClassicTabLayout />;
  return <AuthAndSetupGuard>{tabContent}</AuthAndSetupGuard>;
}

const styles = StyleSheet.create({});

const fabStyles = StyleSheet.create({
  fabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
});
