import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserProvider } from "@/contexts/UserContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;
const tokenCache = Platform.OS === "web" ? undefined : nativeTokenCache;

// Configure how notifications are shown when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});

function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

// Registers the device's Expo push token with our API (once per sign-in)
function PushNotificationManager() {
  const { isSignedIn, getToken } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current || Platform.OS === "web") return;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
        const clerkToken = await getToken();
        if (!clerkToken || !expoPushToken) return;

        const base = getApiBase();
        await fetch(`${base}/api/push-tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clerkToken}`,
          },
          body: JSON.stringify({ token: expoPushToken }),
        });

        registered.current = true;
        console.log("[push] Token registered:", expoPushToken);
      } catch (err) {
        // Silently fail in simulator / web
        console.log("[push] Could not register push token:", err);
      }
    })();
  }, [isSignedIn]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="(setup)" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="session" />
      <Stack.Screen name="test" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const splashHidden = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!splashHidden.current) {
        splashHidden.current = true;
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <PushNotificationManager />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </UserProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
