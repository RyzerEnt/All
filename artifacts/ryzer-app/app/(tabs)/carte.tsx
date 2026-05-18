import React, { useRef } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useColors } from "@/hooks/useColors";

const BLUE = "#2563eb";

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #f1f5f9; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([46.2276, 2.2137], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      detectRetina: true
    }).addTo(map);

    window.centerOnUser = function() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(function(pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
          radius: 9, color: '#fff', fillColor: '#2563eb', fillOpacity: 1, weight: 3
        }).addTo(map);
      });
    };

    setTimeout(function() {
      window.centerOnUser();
    }, 800);
  </script>
</body>
</html>`;

export default function CarteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const webViewRef = useRef<any>(null);

  const centerOnUser = () => {
    webViewRef.current?.injectJavaScript("window.centerOnUser(); true;");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {/* Top overlay */}
      <View style={[styles.topOverlay, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.eyebrow}>EXPLORER</Text>
            <Text style={styles.title}>CARTE</Text>
          </View>
          <Pressable
            onPress={centerOnUser}
            style={({ pressed }) => [
              styles.locateBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="navigation" size={18} color={BLUE} />
          </Pressable>
        </View>
      </View>

      {/* Bottom info pill */}
      <View style={[styles.bottomPill, { bottom: (isWeb ? 84 : 60 + insets.bottom) + 12 }]}>
        <Feather name="info" size={13} color="#64748b" />
        <Text style={styles.pillText}>
          Tes parcours apparaîtront ici après chaque session GPS
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    pointerEvents: "box-none",
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: "#2563eb", letterSpacing: 1.5, marginBottom: 2 },
  title: { fontSize: 20, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  locateBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomPill: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  pillText: { flex: 1, fontSize: 11, color: "#64748b", fontWeight: "500" },
});
