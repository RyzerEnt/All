import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
  pointCount?: number;
}

const VOYAGER_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const VOYAGER_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>';

function injectLeafletCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("leaflet-css")) return;
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);
}

let routeMapCounter = 0;

export default function RouteMapView({ coords, height }: Props) {
  const colors = useColors();
  const mapIdRef = useRef(`route-map-${++routeMapCounter}`);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    injectLeafletCSS();

    const mapId = mapIdRef.current;

    const init = async () => {
      const L = await import("leaflet");
      const container = document.getElementById(mapId);
      if (!container) return;

      let center: [number, number] = [48.8566, 2.3522];
      let zoom = 14;

      if (coords.length > 0) {
        const lats = coords.map((c) => c.latitude);
        const lons = coords.map((c) => c.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
      }

      const map = L.map(mapId, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      }).setView(center, zoom);

      mapRef.current = map;

      L.tileLayer(VOYAGER_URL, {
        attribution: VOYAGER_ATTR,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      if (coords.length >= 2) {
        const latlngs = coords.map((c) => [c.latitude, c.longitude] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: "#2563eb",
          weight: 5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [24, 24] });

        L.circleMarker([coords[0].latitude, coords[0].longitude], {
          radius: 7,
          color: "#fff",
          fillColor: "#22c55e",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);

        L.circleMarker(
          [coords[coords.length - 1].latitude, coords[coords.length - 1].longitude],
          { radius: 7, color: "#fff", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }
        ).addTo(map);
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[styles.root, { height, backgroundColor: colors.card }]}>
      <div
        id={mapIdRef.current}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden" },
});
