import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Polyline, Marker, Region } from "react-native-maps";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
}

const DEFAULT_REGION: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const GREEN = "#22c55e";
const BLUE = "#2563eb";

export default function LiveMapView({ coords, height }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
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
  startDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#fff",
  },
});
