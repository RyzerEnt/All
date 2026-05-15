import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
}

const BLUE = "#2563eb";
const GREEN = "#22c55e";

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;
let mapsAvailable = false;

try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Polyline = maps.Polyline;
  Marker = maps.Marker;
  mapsAvailable = true;
} catch {}

const DEFAULT_REGION = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function LiveMapView({ coords, height }: Props) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapsAvailable) return;
    if (coords.length > 0 && mapRef.current) {
      const latest = coords[coords.length - 1];
      mapRef.current.animateToRegion(
        {
          latitude: latest.latitude,
          longitude: latest.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        600
      );
    }
  }, [coords]);

  if (!mapsAvailable || !MapView) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Feather name="map" size={36} color="#64748b" />
        <Text style={styles.text}>Carte non disponible dans Expo Go</Text>
        <Text style={styles.sub}>Utilise un build de développement pour la carte GPS</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
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
          <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.startDot} />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#f1f5f9",
  },
  text: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  sub: { fontSize: 11, color: "#94a3b8", textAlign: "center", paddingHorizontal: 24 },
  startDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#fff",
  },
});
