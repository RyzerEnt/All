import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const LAYERS = [
  {
    id: "voyager",
    label: "Voyager",
    emoji: "✨",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
  {
    id: "light",
    label: "Clair",
    emoji: "☀️",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
  {
    id: "dark",
    label: "Sombre",
    emoji: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
    maxZoom: 19,
  },
  {
    id: "topo",
    label: "Topographique",
    emoji: "⛰️",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 17,
  },
  {
    id: "satellite",
    label: "Satellite",
    emoji: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    id: "natgeo",
    label: "NatGeo",
    emoji: "🌍",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>, National Geographic',
    maxZoom: 16,
  },
  {
    id: "cyclosm",
    label: "CyclOSM",
    emoji: "🚴",
    url: "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.cyclosm.org">CyclOSM</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    maxZoom: 20,
  },
  {
    id: "relief",
    label: "Relief",
    emoji: "🏔️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    maxZoom: 13,
  },
] as const;

type LayerId = (typeof LAYERS)[number]["id"];

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng, map]);
  return null;
}

function ChangeLayer({ url, attribution, maxZoom }: { url: string; attribution: string; maxZoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.eachLayer((l) => { if ((l as any)._url) map.removeLayer(l); });
    L.tileLayer(url, { attribution, maxZoom }).addTo(map);
  }, [url, attribution, maxZoom, map]);
  return null;
}

async function fetchElevation(lat: number, lng: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lng}`
    );
    const data = await res.json();
    return data?.results?.[0]?.elevation ?? null;
  } catch {
    return null;
  }
}

const DEFAULT_FILTERS = { hue: 0, saturate: 100, brightness: 100, contrast: 100 };
const FLASHY_GREEN   = { hue: 95, saturate: 230, brightness: 82, contrast: 115 };
const LS_KEY = "ryzer-map-filters";

function loadFilters() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : FLASHY_GREEN;
  } catch { return FLASHY_GREEN; }
}

export default function MapPage() {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLayer, setActiveLayer] = useState<LayerId>("voyager");
  const [centered, setCentered] = useState(false);
  const [elevation, setElevation] = useState<number | null>(null);
  const [elevationLoading, setElevationLoading] = useState(false);
  const [filters, setFilters] = useState(loadFilters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(filters)); } catch {}
  }, [filters]);

  const layer = LAYERS.find((l) => l.id === activeLayer)!;
  const filterCSS = `hue-rotate(${filters.hue}deg) saturate(${filters.saturate}%) brightness(${filters.brightness}%) contrast(${filters.contrast}%)`;
  const isVoyager = activeLayer === "voyager";

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée — affichage des Alpes par défaut.");
      setLoading(false);
      const lat = 45.8326, lng = 6.8652;
      setPos({ lat, lng });
      setElevationLoading(true);
      fetchElevation(lat, lng).then((alt) => { setElevation(alt); setElevationLoading(false); });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setPos({ lat, lng });
        setLoading(false);
        if (p.coords.altitude !== null) {
          setElevation(Math.round(p.coords.altitude));
        } else {
          setElevationLoading(true);
          fetchElevation(lat, lng).then((alt) => { setElevation(alt); setElevationLoading(false); });
        }
      },
      () => {
        const lat = 45.8326, lng = 6.8652;
        setPos({ lat, lng });
        setError("Position non disponible — affichage des Alpes par défaut.");
        setLoading(false);
        setElevationLoading(true);
        fetchElevation(lat, lng).then((alt) => { setElevation(alt); setElevationLoading(false); });
      },
      { timeout: 8000 }
    );
  }, []);

  const defaultCenter: [number, number] = pos ? [pos.lat, pos.lng] : [45.8326, 6.8652];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 61px - 57px)" }}>
      {error && (
        <div style={{
          background: "rgba(249,115,22,0.08)", borderBottom: "1px solid rgba(249,115,22,0.2)",
          padding: "0.55rem 1.25rem", fontSize: "0.72rem", color: "#c2410c", fontWeight: 600,
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
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Localisation en cours…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <div style={{ flex: 1, position: "relative" }}>
          {isVoyager && (
            <style>{`.ryzer-voyager { filter: ${filterCSS}; }`}</style>
          )}
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              key={activeLayer}
              url={layer.url}
              attribution={layer.attribution}
              maxZoom={layer.maxZoom}
              className={isVoyager ? "ryzer-voyager" : undefined}
            />
            {pos && !centered && (
              <>
                <RecenterMap lat={pos.lat} lng={pos.lng} />
              </>
            )}
            {pos && (
              <Marker position={[pos.lat, pos.lng]}>
                <Popup>
                  <div style={{ fontFamily: "system-ui", minWidth: 150 }}>
                    <strong style={{ color: "#2563eb", fontSize: "0.85rem" }}>📍 Votre position</strong>
                    <br />
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Layer switcher */}
          <div style={{
            position: "absolute", top: 12, right: 12, zIndex: 1000,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {LAYERS.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.45rem 0.85rem", borderRadius: 10,
                  border: activeLayer === l.id ? "1.5px solid #2563eb" : "1.5px solid rgba(15,23,42,0.1)",
                  background: activeLayer === l.id ? "#2563eb" : "rgba(255,255,255,0.95)",
                  color: activeLayer === l.id ? "#fff" : "#334155",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  backdropFilter: "blur(12px)",
                  boxShadow: activeLayer === l.id ? "0 2px 12px rgba(37,99,235,0.3)" : "0 1px 6px rgba(0,0,0,0.1)",
                  letterSpacing: "0.02em", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>{l.emoji}</span>
                {l.label}
              </button>
            ))}

            {/* Couleurs button — Voyager only */}
            {isVoyager && (
              <button
                onClick={() => setShowFilters((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.45rem 0.85rem", borderRadius: 10, marginTop: 4,
                  border: showFilters ? "1.5px solid #f97316" : "1.5px solid rgba(249,115,22,0.3)",
                  background: showFilters ? "#f97316" : "rgba(255,255,255,0.95)",
                  color: showFilters ? "#fff" : "#ea580c",
                  fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                  backdropFilter: "blur(12px)",
                  boxShadow: showFilters ? "0 2px 12px rgba(249,115,22,0.35)" : "0 1px 6px rgba(0,0,0,0.1)",
                  letterSpacing: "0.02em", transition: "all 0.15s", whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "0.85rem" }}>🎨</span>
                Couleurs
              </button>
            )}
          </div>

          {/* Filter panel */}
          {isVoyager && showFilters && (
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 1000,
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
              borderRadius: 16, padding: "1rem 1.1rem", boxShadow: "0 4px 24px rgba(0,0,0,0.14)",
              border: "1.5px solid rgba(249,115,22,0.2)", minWidth: 220,
              display: "flex", flexDirection: "column", gap: "0.85rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ea580c", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  🎨 Couleurs Voyager
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => setFilters(FLASHY_GREEN)}
                    style={{ fontSize: "0.62rem", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 6, cursor: "pointer", padding: "0.15rem 0.45rem" }}
                  >
                    🟢 Vert
                  </button>
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Défaut
                  </button>
                </div>
              </div>

              {([
                { key: "hue",        label: "Teinte",      min: 0,   max: 360, unit: "°",  color: "#8b5cf6" },
                { key: "saturate",   label: "Saturation",  min: 0,   max: 300, unit: "%",  color: "#f97316" },
                { key: "brightness", label: "Luminosité",  min: 50,  max: 150, unit: "%",  color: "#eab308" },
                { key: "contrast",   label: "Contraste",   min: 50,  max: 150, unit: "%",  color: "#2563eb" },
              ] as const).map(({ key, label, min, max, unit, color }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569" }}>{label}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color }}>{filters[key]}{unit}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={filters[key]}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: color, height: 4, cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bottom info bar */}
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 1000, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
            borderRadius: 14, padding: "0.55rem 1.25rem", boxShadow: "0 2px 20px rgba(0,0,0,0.13)",
            border: "1px solid rgba(37,99,235,0.15)", display: "flex", alignItems: "center", gap: "1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.9rem" }}>{layer.emoji}</span>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", color: "#1e40af", textTransform: "uppercase" }}>
                {layer.label}
              </span>
            </div>

            <div style={{ width: 1, height: 16, background: "rgba(37,99,235,0.15)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.9rem" }}>📐</span>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Altitude</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: elevationLoading ? "#94a3b8" : "#2563eb" }}>
                  {elevationLoading
                    ? "…"
                    : elevation !== null
                    ? `${Math.round(elevation)} m`
                    : "N/A"}
                </span>
              </div>
            </div>

            {pos && (
              <>
                <div style={{ width: 1, height: 16, background: "rgba(37,99,235,0.15)" }} />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Position</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#334155" }}>
                    {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
