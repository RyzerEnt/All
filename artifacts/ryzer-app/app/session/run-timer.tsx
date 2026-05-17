import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { runSession } from "@/store/runSession";
import LiveMapView from "@/components/LiveMapView";

// Sport 2 = Cyclisme → affiche vitesse en km/h au lieu de l'allure min/km
const CYCLING_ID = 2;

const BLUE = "#2563eb";
const ORANGE = "#f97316";

const SCREEN_H = Dimensions.get("window").height;
const MAP_HEIGHT = Math.round(SCREEN_H * 0.42);

function computePoints(seconds: number): number {
  return Math.round((seconds / 300) * 10) / 10;
}
function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}
function formatPace(elapsed: number, distM: number): string {
  if (distM < 10) return "--:--";
  const secPerKm = elapsed / (distM / 1000);
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}
function formatSpeed(elapsed: number, distM: number): string {
  if (distM < 10 || elapsed === 0) return "-- km/h";
  const kmh = (distM / 1000) / (elapsed / 3600);
  return `${kmh.toFixed(1)} km/h`;
}

export default function RunTimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { sportId, sportName, sportIcon, met } = useLocalSearchParams<{
    sportId: string; sportName: string; sportIcon: string; met: string;
  }>();
  const metNum = parseFloat(met ?? "8");
  const isCycling = parseInt(sportId ?? "1") === CYCLING_ID;

  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { coords, distance, altitude, permissionStatus, startTracking, stopTracking } =
    useLocationTracking();

  const points = computePoints(elapsed);
  const polylineCoords = useMemo(
    () => coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
    [coords]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopTracking();
    };
  }, []);

  const start = () => {
    setRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    startTracking();
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopTracking();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resume = () => {
    setRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    startTracking();
  };

  const finish = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopTracking();
    setRunning(false);
    setFinished(true);
    runSession.setCoords(coords);
    runSession.setDistance(distance);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goToResult = () => {
    router.replace({
      pathname: "/session/run-result",
      params: {
        sportId,
        sportName,
        sportIcon,
        met,
        durationSeconds: elapsed,
        points: Math.round(points * 10) / 10,
        distanceM: Math.round(distance),
      },
    });
  };

  const goBack = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopTracking();
    router.back();
  };

  const mapHeightWithPad = MAP_HEIGHT + topPad;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* MAP SECTION */}
      <View style={{ height: mapHeightWithPad, overflow: "hidden" }}>
        <LiveMapView coords={polylineCoords} height={mapHeightWithPad} />

        {/* Status chip overlay */}
        <View style={[styles.chipWrapper, { top: topPad + 12 }]}>
          <View style={[
            styles.statusChip,
            { backgroundColor: running ? BLUE : "rgba(15,23,42,0.75)" },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: running ? "#fff" : "#64748b" }]} />
            <Text style={styles.statusChipText}>
              {running ? "EN COURS" : elapsed === 0 ? "PRÊT" : "EN PAUSE"}
            </Text>
          </View>
        </View>

        {/* Back button overlay */}
        <Pressable onPress={goBack} style={[styles.backOverlay, { top: topPad + 12 }]}>
          <View style={[styles.backBtn, { backgroundColor: "rgba(15,23,42,0.7)" }]}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </View>
        </Pressable>
      </View>

      {/* BOTTOM SECTION */}
      <View style={[styles.bottom, { paddingBottom: bottomPad + 16 }]}>
        {/* Stats row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatDistance(distance)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>DISTANCE</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {formatTime(elapsed)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>DURÉE</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {isCycling ? formatSpeed(elapsed, distance) : formatPace(elapsed, distance)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {isCycling ? "VITESSE" : "ALLURE"}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: altitude !== null ? colors.foreground : colors.mutedForeground }]}>
              {altitude !== null ? `${altitude} m` : "-- m"}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ALT.</Text>
          </View>
        </View>

        {/* Points live */}
        <View style={styles.pointsRow}>
          <Text style={[styles.pointsValue, { color: BLUE }]}>{points}</Text>
          <View style={[styles.pointsBadge, { backgroundColor: "rgba(37,99,235,0.1)", borderColor: "rgba(37,99,235,0.2)" }]}>
            <View style={[styles.pointsDot, { backgroundColor: BLUE }]} />
            <Text style={[styles.pointsLabel, { color: BLUE }]}>RYZER POINTS</Text>
          </View>
        </View>

        {/* GPS permission banners */}
        {permissionStatus === "requesting" && (
          <View style={[styles.gpsWarning, { backgroundColor: "rgba(37,99,235,0.07)", borderColor: "rgba(37,99,235,0.25)" }]}>
            <Feather name="map-pin" size={14} color={BLUE} />
            <Text style={[styles.gpsWarningText, { color: BLUE }]}>
              Autorisation de localisation demandée…
            </Text>
          </View>
        )}
        {permissionStatus === "denied" && (
          <View style={[styles.gpsWarning, { backgroundColor: "rgba(249,115,22,0.1)", borderColor: "rgba(249,115,22,0.3)" }]}>
            <Feather name="alert-triangle" size={14} color={ORANGE} />
            <Text style={[styles.gpsWarningText, { color: ORANGE }]}>
              GPS refusé — distance et altitude non disponibles
            </Text>
          </View>
        )}

        {/* Controls */}
        {!finished ? (
          <View style={styles.controls}>
            {!running ? (
              <Pressable
                style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={elapsed === 0 ? start : resume}
              >
                <Feather name="play" size={22} color="#fff" />
                <Text style={styles.mainBtnText}>{elapsed === 0 ? "DÉMARRER" : "REPRENDRE"}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.mainBtn, { backgroundColor: "#0f172a", transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={pause}
              >
                <Feather name="pause" size={22} color="#fff" />
                <Text style={styles.mainBtnText}>PAUSE</Text>
              </Pressable>
            )}
            {elapsed > 0 && (
              <Pressable
                style={({ pressed }) => [styles.finishBtn, { backgroundColor: ORANGE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                onPress={finish}
              >
                <Feather name="flag" size={16} color="#fff" />
                <Text style={styles.finishBtnText}>TERMINER</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            onPress={goToResult}
          >
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.mainBtnText}>VOIR MON BILAN</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipWrapper: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusChipText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  backOverlay: { position: "absolute", left: 16 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  bottom: { flex: 1, paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  statsRow: {
    flexDirection: "row", borderRadius: 14,
    borderWidth: 1, overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  statValue: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 8 },
  pointsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  pointsValue: { fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  pointsBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  pointsDot: { width: 5, height: 5, borderRadius: 3 },
  pointsLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  gpsWarning: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  gpsWarningText: { fontSize: 11, fontWeight: "600" },
  controls: { gap: 10 },
  mainBtn: {
    height: 60, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  mainBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.8 },
  finishBtn: {
    height: 48, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  finishBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
