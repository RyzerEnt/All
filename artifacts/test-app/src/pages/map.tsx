import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng, map]);
  return null;
}

export default function MapPage() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée par ce navigateur.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLoading(false);
      },
      () => {
        setPos({ lat: 48.8566, lng: 2.3522 });
        setError("Position non disponible — affichage de Paris par défaut.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const defaultCenter: [number, number] = pos ? [pos.lat, pos.lng] : [48.8566, 2.3522];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 61px - 57px)" }}>
      {error && (
        <div style={{
          background: "rgba(249,115,22,0.08)", borderBottom: "1px solid rgba(249,115,22,0.2)",
          padding: "0.6rem 1.25rem", fontSize: "0.75rem", color: "#c2410c", fontWeight: 600,
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <span>⚠</span> {error}
        </div>
      )}

      {loading && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#f1f5f9", flexDirection: "column", gap: "1rem",
        }}>
          <div style={{
            width: 36, height: 36, border: "3px solid #e2e8f0",
            borderTop: "3px solid #2563eb", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
            Localisation en cours…
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pos && (
              <>
                <RecenterMap lat={pos.lat} lng={pos.lng} />
                <Marker position={[pos.lat, pos.lng]}>
                  <Popup>
                    <div style={{ fontFamily: "system-ui", minWidth: 140 }}>
                      <strong style={{ color: "#2563eb", fontSize: "0.85rem" }}>📍 Votre position</strong>
                      <br />
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>

          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
            borderRadius: 12, padding: "0.5rem 1.25rem", boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
            border: "1px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block", boxShadow: "0 0 6px #2563eb" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", color: "#1e40af", textTransform: "uppercase" }}>
              OpenStreetMap · Ryzer Map
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
