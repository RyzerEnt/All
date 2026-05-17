import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
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

export default function LiveMapView({ coords, height }: Props) {
  const colors = useColors();
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    injectLeafletCSS();

    let L: any;
    let map: any;

    const init = async () => {
      L = await import("leaflet");

      const container = document.getElementById("live-map-container");
      if (!container || initializedRef.current) return;
      initializedRef.current = true;

      const center: [number, number] =
        coords.length > 0
          ? [coords[coords.length - 1].latitude, coords[coords.length - 1].longitude]
          : [48.8566, 2.3522];

      map = L.map(container, { zoomControl: true, attributionControl: true }).setView(center, 16);
      mapRef.current = map;

      L.tileLayer(VOYAGER_URL, {
        attribution: VOYAGER_ATTR,
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      if (coords.length >= 2) {
        const latlngs = coords.map((c) => [c.latitude, c.longitude] as [number, number]);
        polylineRef.current = L.polyline(latlngs, {
          color: "#2563eb",
          weight: 5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      if (coords.length > 0) {
        markerRef.current = L.circleMarker(
          [coords[0].latitude, coords[0].longitude],
          { radius: 7, color: "#fff", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }
        ).addTo(map);
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      if (coords.length >= 2) {
        const latlngs = coords.map((c) => [c.latitude, c.longitude] as [number, number]);
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latlngs);
        } else {
          polylineRef.current = L.polyline(latlngs, {
            color: "#2563eb",
            weight: 5,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
        }
      }

      if (coords.length > 0) {
        const latest = coords[coords.length - 1];
        map.panTo([latest.latitude, latest.longitude], { animate: true, duration: 0.6 });

        if (!markerRef.current) {
          markerRef.current = L.circleMarker(
            [coords[0].latitude, coords[0].longitude],
            { radius: 7, color: "#fff", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }
          ).addTo(map);
        }
      }
    });
  }, [coords]);

  return (
    <View style={[styles.root, { height, backgroundColor: colors.card }]}>
      <div
        id="live-map-container"
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden" },
});
