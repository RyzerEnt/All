import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
  pointCount?: number;
}

function buildRouteMapHTML(coords: { latitude: number; longitude: number }[]): string {
  const center =
    coords.length > 0
      ? [
          coords.reduce((s, c) => s + c.latitude, 0) / coords.length,
          coords.reduce((s, c) => s + c.longitude, 0) / coords.length,
        ]
      : [48.8566, 2.3522];

  const coordsJson = JSON.stringify(coords);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f1f5f9; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var coords = ${coordsJson};
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      tap: false
    }).setView([${center[0]}, ${center[1]}], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      detectRetina: true
    }).addTo(map);

    if (coords.length >= 2) {
      var latlngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
      var polyline = L.polyline(latlngs, {
        color: '#2563eb', weight: 5, lineCap: 'round', lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [28, 28], animate: false });

      L.circleMarker([coords[0].latitude, coords[0].longitude], {
        radius: 7, color: '#fff', fillColor: '#22c55e', fillOpacity: 1, weight: 2
      }).addTo(map);

      L.circleMarker([coords[coords.length-1].latitude, coords[coords.length-1].longitude], {
        radius: 7, color: '#fff', fillColor: '#ef4444', fillOpacity: 1, weight: 2
      }).addTo(map);
    }
  </script>
</body>
</html>`;
}

export default function RouteMapView({ coords, height }: Props) {
  const html = useMemo(() => buildRouteMapHTML(coords), [coords]);

  return (
    <View style={{ height }}>
      <WebView
        source={{ html }}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
