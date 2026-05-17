import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, Platform, ActivityIndicator,
  ScrollView, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useColors } from "@/hooks/useColors";
import { useUser } from "@/contexts/UserContext";
import { FlameIcon } from "@/components/FlameIcon";
import { runSession, RunCoord } from "@/store/runSession";
import RouteMapView from "@/components/RouteMapView";

const BLUE = "#2563eb";
const ORANGE = "#f97316";
const GREEN = "#22c55e";
const RED = "#ef4444";

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${sec}s`;
  return `${sec}s`;
}
function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}
function formatPace(elapsed: number, distM: number): string {
  if (distM < 10) return "--:-- /km";
  const secPerKm = elapsed / (distM / 1000);
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

function generateSVG(coords: RunCoord[], distanceM: number, durationS: number): string {
  const W = 500;
  const H = 700;
  const PAD = 60;

  if (coords.length < 2) {
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="white"/><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748b">Pas assez de données GPS</text></svg>`;
  }

  const lats = coords.map((c) => c.latitude);
  const lons = coords.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;
  const usableW = W - PAD * 2;
  const usableH = H - PAD * 2 - 120;

  const scaleX = usableW / lonRange;
  const scaleY = usableH / latRange;
  const scale = Math.min(scaleX, scaleY);
  const scaledW = lonRange * scale;
  const scaledH = latRange * scale;
  const offsetX = PAD + (usableW - scaledW) / 2;
  const offsetY = PAD + (usableH - scaledH) / 2;

  const toXY = (c: RunCoord) => ({
    x: offsetX + ((c.longitude - minLon) / lonRange) * scaledW,
    y: offsetY + (1 - (c.latitude - minLat) / latRange) * scaledH,
  });

  const points = coords.map(toXY);
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const start = points[0];
  const end = points[points.length - 1];
  const distKm = (distanceM / 1000).toFixed(2);
  const pace = formatPace(durationS, distanceM);
  const duration = formatDuration(durationS);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${start.x.toFixed(1)}" cy="${start.y.toFixed(1)}" r="10" fill="${GREEN}" stroke="white" stroke-width="3"/>
  <circle cx="${end.x.toFixed(1)}" cy="${end.y.toFixed(1)}" r="10" fill="${RED}" stroke="white" stroke-width="3"/>
  <line x1="${PAD}" y1="${H - 105}" x2="${W - PAD}" y2="${H - 105}" stroke="#e2e8f0" stroke-width="1"/>
  <text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#0f172a">${distKm} km</text>
  <text x="${PAD}" y="${H - 40}" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${duration}</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#64748b">${pace}</text>
  <text x="${W - PAD}" y="${H - 40}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#2563eb">RYZER</text>
  <circle cx="${PAD + 7}" cy="${H - 18}" r="5" fill="${GREEN}"/>
  <text x="${PAD + 17}" y="${H - 14}" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Départ</text>
  <circle cx="${PAD + 75}" cy="${H - 18}" r="5" fill="${RED}"/>
  <text x="${PAD + 85}" y="${H - 14}" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Arrivée</text>
</svg>`;
}

export default function RunResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const { sportName, sportIcon, durationSeconds, points, distanceM } =
    useLocalSearchParams<{
      sportName: string; sportIcon: string; durationSeconds: string;
      points: string; distanceM: string;
    }>();

  const durNum = parseInt(durationSeconds ?? "0");
  const ptNum = parseFloat(points ?? "0");

  const { addSession } = useUser();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalPoints, setFinalPoints] = useState<number | null>(null);
  const [multiplierApplied, setMultiplierApplied] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Capture coords and distance once at mount — runSession.clear() is called
  // after saving, so we must not re-read from runSession on subsequent re-renders.
  const [coords] = useState(() => runSession.getCoords());
  const [distance] = useState(
    () => runSession.getDistance() || parseInt(distanceM ?? "0")
  );

  const polylineCoords = useMemo(
    () => coords.map((c) => ({ latitude: c.latitude, longitude: c.longitude })),
    []
  );

  useEffect(() => {
    (async () => {
      setSaving(true);
      try {
        const result = await addSession({
          sportName: sportName ?? "Course à pied",
          sportIcon: sportIcon ?? "run",
          durationSeconds: durNum,
          points: ptNum,
        });
        setFinalPoints(result.points);
        setMultiplierApplied(result.multiplierApplied);
        setCurrentStreak(result.currentStreak);
        setSaved(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setSaving(false);
      runSession.clear();
    })();
  }, []);

  const downloadSVG = async () => {
    setDownloading(true);
    try {
      const svgContent = generateSVG(coords, distance, durNum);

      if (Platform.OS === "web") {
        // Data URI is more reliable than blob URL inside iframes / sandboxed contexts
        const dataUri =
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
        try {
          const a = document.createElement("a");
          a.setAttribute("href", dataUri);
          a.setAttribute("download", "parcours-ryzer.svg");
          a.style.display = "none";
          const root = document.body ?? document.documentElement;
          root.appendChild(a);
          a.click();
          setTimeout(() => a.remove(), 200);
        } catch {
          // Fallback: open in new tab so the user can save manually
          window.open(dataUri, "_blank");
        }
      } else {
        const cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
          Alert.alert("Erreur", "Stockage temporaire indisponible sur cet appareil.");
          setDownloading(false);
          return;
        }
        const path = cacheDir + "parcours-ryzer.svg";
        await FileSystem.writeAsStringAsync(path, svgContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(path, {
            mimeType: "image/svg+xml",
            dialogTitle: "Partager mon parcours",
            UTI: "public.svg-image",
          });
        } else {
          Alert.alert(
            "Partage indisponible",
            "Le partage de fichiers n'est pas supporté sur cet appareil."
          );
        }
      }
    } catch (err) {
      console.error("[downloadSVG]", err);
      Alert.alert("Erreur", "Impossible d'exporter le parcours.");
    }
    setDownloading(false);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad + 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={[styles.trophyWrap, { backgroundColor: "rgba(37,99,235,0.1)" }]}>
          <Text style={styles.trophyEmoji}>🏃</Text>
        </View>
        <Text style={[styles.congrats, { color: colors.mutedForeground }]}>SESSION TERMINÉE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          BRAVO !{"\n"}
          <Text style={{ color: BLUE }}>+{finalPoints ?? ptNum} </Text>
          <Text style={{ color: ORANGE }}>RYZER PTS</Text>
        </Text>
      </View>

      {/* MAP with route */}
      <View style={[styles.mapCard, { borderColor: colors.border }]}>
        <RouteMapView coords={polylineCoords} height={200} pointCount={coords.length} />
        <View style={[styles.mapLegend, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Départ</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: RED }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Arrivée</Text>
          </View>
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            {coords.length} pts GPS
          </Text>
        </View>
      </View>

      {/* Streak banner */}
      {saved && currentStreak > 0 && (
        <View style={[
          styles.streakBanner,
          {
            backgroundColor: multiplierApplied ? "rgba(249,115,22,0.08)" : "rgba(37,99,235,0.06)",
            borderColor: multiplierApplied ? "rgba(249,115,22,0.3)" : "rgba(37,99,235,0.2)",
          },
        ]}>
          <FlameIcon size={26} color={multiplierApplied ? ORANGE : BLUE} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakText, { color: multiplierApplied ? ORANGE : BLUE }]}>
              {currentStreak} JOUR{currentStreak > 1 ? "S" : ""} D'AFFILÉE
            </Text>
            {multiplierApplied ? (
              <Text style={[styles.streakSub, { color: ORANGE }]}>
                Bonus ✕1.5 appliqué !
              </Text>
            ) : (
              <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                Encore {3 - currentStreak} jour{3 - currentStreak > 1 ? "s" : ""} pour le bonus ✕1.5
              </Text>
            )}
          </View>
          {multiplierApplied && (
            <View style={[styles.multiplierBadge, { backgroundColor: ORANGE }]}>
              <Text style={styles.multiplierText}>✕1.5</Text>
            </View>
          )}
        </View>
      )}

      {/* Stats card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "map-pin" as const, label: "Distance", value: formatDistance(distance), accent: false },
          { icon: "clock" as const, label: "Durée", value: formatDuration(durNum), accent: false, orange: true },
          { icon: "activity" as const, label: "Allure", value: formatPace(durNum, distance), accent: false },
          { icon: "zap" as const, label: "Ryzer Points", value: `+${finalPoints ?? ptNum}`, accent: true },
        ].map((row, i, arr) => (
          <React.Fragment key={row.label}>
            <View style={styles.statRow}>
              <View style={[styles.statIcon, {
                backgroundColor: row.orange ? "rgba(249,115,22,0.1)" : "rgba(37,99,235,0.1)",
              }]}>
                <Feather name={row.icon} size={18} color={row.orange ? ORANGE : BLUE} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text style={[styles.statValue, {
                color: row.accent ? BLUE : colors.foreground,
                fontWeight: row.accent ? "900" : "700",
              }]}>
                {row.value}
              </Text>
            </View>
            {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Save status */}
      <View style={styles.saveStatus}>
        {saving && <ActivityIndicator size="small" color={BLUE} />}
        {saved && (
          <View style={styles.savedRow}>
            <Feather name="check-circle" size={14} color="#22c55e" />
            <Text style={[styles.savedText, { color: "#22c55e" }]}>Session sauvegardée</Text>
          </View>
        )}
      </View>

      {/* CTA buttons */}
      <View style={styles.ctaGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.downloadBtn,
            {
              backgroundColor: "rgba(37,99,235,0.08)",
              borderColor: "rgba(37,99,235,0.25)",
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={downloadSVG}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={BLUE} />
          ) : (
            <Feather name="download" size={18} color={BLUE} />
          )}
          <Text style={[styles.downloadBtnText, { color: BLUE }]}>
            {downloading ? "EXPORT EN COURS..." : "TÉLÉCHARGER LE PARCOURS"}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.mainBtn, { backgroundColor: BLUE, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          onPress={() => router.replace("/(tabs)")}
        >
          <Feather name="home" size={18} color="#fff" />
          <Text style={styles.mainBtnText}>RETOUR À L'ACCUEIL</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondBtn, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }]}
          onPress={() => router.replace("/session/sport-picker")}
        >
          <Feather name="plus" size={16} color={colors.foreground} />
          <Text style={[styles.secondBtnText, { color: colors.foreground }]}>NOUVELLE SESSION</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { alignItems: "center", marginBottom: 18 },
  trophyWrap: {
    width: 76, height: 76, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  trophyEmoji: { fontSize: 38 },
  congrats: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: -1.2, textAlign: "center", lineHeight: 36 },

  mapCard: {
    borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 12,
  },
  mapLegend: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 10, fontWeight: "600" },

  streakBanner: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12,
  },
  streakText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  streakSub: { fontSize: 10, fontWeight: "500", marginTop: 1 },
  multiplierBadge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  multiplierText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  statsCard: { borderWidth: 1, borderRadius: 18, overflow: "hidden", marginBottom: 10 },
  statRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { flex: 1, fontSize: 13 },
  statValue: { fontSize: 14 },
  divider: { height: 1, marginHorizontal: 14 },

  saveStatus: { height: 24, justifyContent: "center", marginBottom: 6, alignItems: "center" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  savedText: { fontSize: 12, fontWeight: "600" },

  ctaGroup: { gap: 10 },
  downloadBtn: {
    height: 52, borderRadius: 999, flexDirection: "row", borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  downloadBtnText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  mainBtn: {
    height: 56, borderRadius: 999, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  mainBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.8 },
  secondBtn: {
    height: 48, borderRadius: 999, flexDirection: "row", borderWidth: 1,
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  secondBtnText: { fontSize: 13, fontWeight: "700" },
});
