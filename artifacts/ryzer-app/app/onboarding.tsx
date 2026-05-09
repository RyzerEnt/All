import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const BLUE = "#2563eb";
const ORANGE = "#f97316";

type Slide = {
  key: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    title: "BIENVENUE SUR\n",
    titleAccent: "RYZER",
    subtitle:
      "La première app qui transforme chaque séance sportive en Ryzer Points. Chaque effort compte.",
    icon: (
      <Image
        source={require("@/assets/images/icon.png")}
        style={{ width: 96, height: 96, borderRadius: 24 }}
        resizeMode="contain"
      />
    ),
    gradientColors: ["#0f172a", "#1e3a8a"],
  },
  {
    key: "track",
    title: "SUIS TES\n",
    titleAccent: "PERFORMANCES",
    subtitle:
      "Chrono intégré et calcul automatique basé sur le MET de chaque sport. Course, vélo, natation et bien plus.",
    icon: (
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: "rgba(37,99,235,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="zap" size={48} color={BLUE} />
      </View>
    ),
    gradientColors: ["#0f172a", "#1e3a5f"],
  },
  {
    key: "ready",
    title: "PRÊT À\n",
    titleAccent: "RYZER ?",
    subtitle:
      "Rejoins des milliers d'athlètes, cumule tes Ryzer Points et dépasse tes limites chaque jour.",
    icon: (
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          backgroundColor: "rgba(249,115,22,0.2)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons name="trophy-outline" size={48} color={ORANGE} />
      </View>
    ),
    gradientColors: ["#0f172a", "#431407"],
  },
];

async function markOnboardingSeen() {
  await AsyncStorage.setItem("hasSeenOnboarding", "true");
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const isLast = activeIndex === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    await markOnboardingSeen();
    router.replace("/(auth)/sign-in");
  };

  const handleFinish = async () => {
    await markOnboardingSeen();
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <LinearGradient
            colors={item.gradientColors}
            style={[styles.slide, { width: SCREEN_W }]}
          >
            <View style={[styles.slideInner, { paddingTop: topPad + 20, paddingBottom: bottomPad + 100 }]}>
              {item.icon}
              <Text style={styles.title}>
                {item.title}
                <Text style={{ color: item.key === "ready" ? ORANGE : BLUE }}>
                  {item.titleAccent}
                </Text>
              </Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </LinearGradient>
        )}
      />

      {/* Skip button */}
      {!isLast && (
        <Pressable
          style={[styles.skipBtn, { top: topPad + 16 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      )}

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: bottomPad + 24 }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Start button */}
        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: isLast ? ORANGE : BLUE, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={goNext}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "COMMENCER" : "SUIVANT"}
          </Text>
          <Feather
            name={isLast ? "zap" : "arrow-right"}
            size={18}
            color="#fff"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  slide: { flex: 1 },
  slideInner: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 24,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    color: "#fff",
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 26,
    fontWeight: "400",
  },
  skipBtn: {
    position: "absolute",
    right: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 20,
    gap: 20,
    alignItems: "center",
  },
  dots: { flexDirection: "row", gap: 8 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 28, backgroundColor: "#fff" },
  dotInactive: { width: 8, backgroundColor: "rgba(255,255,255,0.3)" },
  nextBtn: {
    width: "100%",
    height: 56,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
