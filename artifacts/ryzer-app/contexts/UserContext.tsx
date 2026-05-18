import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/expo";

export type UserProfile = {
  clerkUserId: string;
  displayName: string;
  photoData: string | null;
  totalPoints: number;
  isSetupComplete: boolean;
  currentStreak: number;
};

export type UserSession = {
  id: number;
  sportName: string;
  sportIcon: string;
  durationSeconds: number;
  points: number;
  createdAt: string;
};

export type UserChallenge = {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  metricType: string;
  targetValue: number;
  targetUnit: string;
  xpReward: number;
  accent: "blue" | "orange" | "green";
  isCalisthenics: boolean;
  sortOrder: number;
  progress: number;
  done: boolean;
  completedAt: string | null;
};

type UserContextType = {
  profile: UserProfile | null;
  sessions: UserSession[];
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  updateProfile: (data: Partial<Pick<UserProfile, "displayName" | "isSetupComplete">>) => Promise<void>;
  uploadPhoto: (base64: string) => Promise<void>;
  addSession: (session: {
    sportName: string;
    sportIcon: string;
    durationSeconds: number;
    points: number;
    distanceM?: number;
  }) => Promise<{ points: number; basePoints: number; multiplierApplied: boolean; currentStreak: number }>;
  getChallenges: () => Promise<UserChallenge[]>;
};

const UserContext = createContext<UserContextType | null>(null);

function getApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; });

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getTokenRef.current();
      const base = getApiBase();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        return await fetch(`${base}/api${path}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
          },
        });
      } finally {
        clearTimeout(timer);
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const res = await authFetch("/me");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {}
    setIsLoading(false);
  }, [isSignedIn, authFetch]);

  const refreshSessions = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await authFetch("/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {}
  }, [isSignedIn, authFetch]);

  const updateProfile = useCallback(
    async (data: Partial<Pick<UserProfile, "displayName" | "isSetupComplete">>) => {
      const res = await authFetch("/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    },
    [authFetch]
  );

  const uploadPhoto = useCallback(
    async (base64: string) => {
      const res = await authFetch("/me/photo", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (res.ok) {
        setProfile((p) => (p ? { ...p, photoData: base64 } : p));
      }
    },
    [authFetch]
  );

  const addSession = useCallback(
    async (session: {
      sportName: string;
      sportIcon: string;
      durationSeconds: number;
      points: number;
      distanceM?: number;
    }) => {
      const res = await authFetch("/sessions", {
        method: "POST",
        body: JSON.stringify(session),
      });
      if (res.ok) {
        const saved = await res.json();
        setProfile((p) =>
          p
            ? {
                ...p,
                totalPoints: p.totalPoints + saved.points,
                currentStreak: saved.currentStreak ?? p.currentStreak,
              }
            : p
        );
        setSessions((prev) => [saved, ...prev]);
        return {
          points: saved.points,
          basePoints: saved.basePoints ?? session.points,
          multiplierApplied: saved.multiplierApplied ?? false,
          currentStreak: saved.currentStreak ?? 0,
        };
      }
      throw new Error("Failed to save session");
    },
    [authFetch]
  );

  const getChallenges = useCallback(async (): Promise<UserChallenge[]> => {
    try {
      const res = await authFetch("/me/challenges");
      if (res.ok) return res.json();
    } catch {}
    return [];
  }, [authFetch]);

  useEffect(() => {
    if (isSignedIn) {
      refreshProfile();
      refreshSessions();
    } else {
      setProfile(null);
      setSessions([]);
    }
  }, [isSignedIn]);

  return (
    <UserContext.Provider
      value={{ profile, sessions, isLoading, refreshProfile, refreshSessions, updateProfile, uploadPhoto, addSession, getChallenges }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
