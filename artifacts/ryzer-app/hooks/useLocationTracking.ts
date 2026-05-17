import { useState, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import { RunCoord } from "@/store/runSession";

function haversine(a: RunCoord, b: RunCoord): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

async function fetchElevation(lat: number, lon: number): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`
    );
    const data = await res.json();
    return data?.results?.[0]?.elevation ?? null;
  } catch {
    return null;
  }
}

export function useLocationTracking() {
  const [coords, setCoords] = useState<RunCoord[]>([]);
  const [distance, setDistance] = useState(0);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "unknown" | "requesting" | "granted" | "denied"
  >("unknown");

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const webWatchRef = useRef<number | null>(null);
  const lastElevationFetchRef = useRef<number>(0);

  const startTracking = useCallback(async () => {
    if (Platform.OS === "web") {
      if (!navigator.geolocation) {
        setPermissionStatus("denied");
        return;
      }

      setPermissionStatus("requesting");

      webWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setPermissionStatus("granted");

          const newCoord: RunCoord = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
          };

          // Use GPS altitude if available, else fetch from opentopodata (max once per 30s)
          if (pos.coords.altitude !== null && pos.coords.altitude !== undefined) {
            setAltitude(Math.round(pos.coords.altitude));
          } else {
            const now = Date.now();
            if (now - lastElevationFetchRef.current > 30_000) {
              lastElevationFetchRef.current = now;
              fetchElevation(pos.coords.latitude, pos.coords.longitude).then(
                (alt) => {
                  if (alt !== null) setAltitude(Math.round(alt));
                }
              );
            }
          }

          setCoords((prev) => {
            if (prev.length > 0) {
              const d = haversine(prev[prev.length - 1], newCoord);
              setDistance((dist) => dist + d);
            }
            return [...prev, newCoord];
          });
        },
        (err) => {
          if (err.code === 1) {
            setPermissionStatus("denied");
          }
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 2000 }
      );
      return;
    }

    // Native
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPermissionStatus("denied");
      return;
    }
    setPermissionStatus("granted");

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3,
      },
      (loc) => {
        const newCoord: RunCoord = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          timestamp: loc.timestamp,
        };

        if (loc.coords.altitude !== null && loc.coords.altitude !== undefined) {
          setAltitude(Math.round(loc.coords.altitude));
        } else {
          const now = Date.now();
          if (now - lastElevationFetchRef.current > 30_000) {
            lastElevationFetchRef.current = now;
            fetchElevation(loc.coords.latitude, loc.coords.longitude).then(
              (alt) => {
                if (alt !== null) setAltitude(Math.round(alt));
              }
            );
          }
        }

        setCoords((prev) => {
          if (prev.length > 0) {
            const d = haversine(prev[prev.length - 1], newCoord);
            setDistance((dist) => dist + d);
          }
          return [...prev, newCoord];
        });
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (webWatchRef.current !== null) {
      navigator.geolocation.clearWatch(webWatchRef.current);
      webWatchRef.current = null;
    }
  }, []);

  return { coords, distance, altitude, permissionStatus, startTracking, stopTracking };
}
