import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Polyline, Marker, Region } from "react-native-maps";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
  pointCount?: number;
}

const BLUE = "#2563eb";
const GREEN = "#22c55e";
const RED = "#ef4444";

export default function RouteMapView({ coords, height }: Props) {
  const region = useMemo<Region>(() => {
    if (coords.length === 0) {
      return { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.01, longitudeDelta: 0.01 };
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

  return (
    <View style={{ height }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
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
          <>
            <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={[styles.dot, { backgroundColor: GREEN }]} />
            </Marker>
            <Marker coordinate={coords[coords.length - 1]} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={[styles.dot, { backgroundColor: RED }]} />
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#fff" },
});
