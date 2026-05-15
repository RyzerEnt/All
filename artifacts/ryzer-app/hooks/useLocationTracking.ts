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

export function useLocationTracking() {
  const [coords, setCoords] = useState<RunCoord[]>([]);
  const [distance, setDistance] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown");
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (Platform.OS === "web") return;
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
  }, []);

  return { coords, distance, permissionStatus, startTracking, stopTracking };
}
