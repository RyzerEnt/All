import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, Redirect } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme, ActivityIndicator } from "react-native";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";

function AuthAndSetupGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { profile, isLoading } = useUser();
  const colors = useColors();
  const [onboardingChecked, setOnboardingChecked] = React.useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(false);

  React.useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  React.useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding").then((val) => {
      setHasSeenOnboarding(val === "true");
      setOnboardingChecked(true);
    });
  }, []);

  if (!isLoaded || !onboardingChecked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

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
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Accueil</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 64,
          paddingBottom: isWeb ? 34 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={95} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const tabContent = isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
  return <AuthAndSetupGuard>{tabContent}</AuthAndSetupGuard>;
}
