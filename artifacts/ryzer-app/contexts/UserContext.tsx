import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/expo";

export type UserProfile = {
  clerkUserId: string;
  displayName: string;
  photoData: string | null;
  totalPoints: number;
  isSetupComplete: boolean;
};

export type UserSession = {
  id: number;
  sportName: string;
  sportIcon: string;
  durationSeconds: number;
  points: number;
  createdAt: string;
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
  }) => Promise<{ points: number }>;
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

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = await getToken();
      const base = getApiBase();
      return fetch(`${base}/api${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken]
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
    }) => {
      const res = await authFetch("/sessions", {
        method: "POST",
        body: JSON.stringify(session),
      });
      if (res.ok) {
        const saved: UserSession = await res.json();
        setProfile((p) =>
          p ? { ...p, totalPoints: p.totalPoints + session.points } : p
        );
        setSessions((prev) => [saved, ...prev]);
        return { points: session.points };
      }
      throw new Error("Failed to save session");
    },
    [authFetch]
  );

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
      value={{ profile, sessions, isLoading, refreshProfile, refreshSessions, updateProfile, uploadPhoto, addSession }}
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
