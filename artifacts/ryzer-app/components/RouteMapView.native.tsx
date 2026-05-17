import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
  pointCount?: number;
}

const BLUE = "#2563eb";
const GREEN = "#22c55e";
const RED = "#ef4444";

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;
let UrlTile: any = null;
let mapsAvailable = false;

try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Polyline = maps.Polyline;
  Marker = maps.Marker;
  UrlTile = maps.UrlTile;
  mapsAvailable = true;
} catch {}

export default function RouteMapView({ coords, height, pointCount = 0 }: Props) {
  const region = useMemo(() => {
    if (coords.length === 0) {
      return {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    const lats = coords.map((c) => c.latitude);
    const lons = coords.map((c) => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.003) * 1.6,
      longitudeDelta: Math.max(maxLon - minLon, 0.003) * 1.6,
    };
  }, [coords]);

  if (!mapsAvailable || !MapView) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Feather name="map" size={28} color="#64748b" />
        <Text style={styles.text}>
          {pointCount >= 2
            ? `${pointCount} points GPS enregistrés`
            : "Carte non disponible dans Expo Go"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        mapType="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {coords.length >= 2 && (
          <Polyline
            coordinates={coords}
            strokeColor={BLUE}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {coords.length > 0 && (
          <>
            <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={[styles.dot, { backgroundColor: GREEN }]} />
            </Marker>
            <Marker
              coordinate={coords[coords.length - 1]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.dot, { backgroundColor: RED }]} />
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f1f5f9",
  },
  text: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
