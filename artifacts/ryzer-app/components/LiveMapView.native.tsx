import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";

interface Props {
  coords: { latitude: number; longitude: number }[];
  height: number;
}

const LIVE_MAP_HTML = `<!DOCTYPE html>
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
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      tap: true
    }).setView([48.8566, 2.3522], 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      detectRetina: true
    }).addTo(map);

    var polyline = null;
    var startMarker = null;

    window.updateCoords = function(coords) {
      if (coords.length >= 2) {
        var latlngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
        if (polyline) {
          polyline.setLatLngs(latlngs);
        } else {
          polyline = L.polyline(latlngs, {
            color: '#2563eb', weight: 5, lineCap: 'round', lineJoin: 'round'
          }).addTo(map);
        }
      }
      if (coords.length > 0) {
        var latest = coords[coords.length - 1];
        map.panTo([latest.latitude, latest.longitude], { animate: true, duration: 0.4 });
        if (!startMarker) {
          startMarker = L.circleMarker(
            [coords[0].latitude, coords[0].longitude],
            { radius: 7, color: '#fff', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }
          ).addTo(map);
        }
      }
    };
  </script>
</body>
</html>`;

export default function LiveMapView({ coords, height }: Props) {
  const webViewRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!webViewRef.current || coords.length === 0) return;
    webViewRef.current.injectJavaScript(
      `window.updateCoords(${JSON.stringify(coords)}); true;`
    );
  }, [coords]);

  return (
    <View style={{ height }}>
      <WebView
        ref={webViewRef}
        source={{ html: LIVE_MAP_HTML }}
        style={StyleSheet.absoluteFillObject}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadEnd={() => {
          initializedRef.current = true;
          if (coords.length > 0) {
            webViewRef.current?.injectJavaScript(
              `window.updateCoords(${JSON.stringify(coords)}); true;`
            );
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({});
