import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { avatarColor } from "@/lib/format";
import { makeId } from "@/lib/id";
import type { User } from "@/types";

const STORAGE_KEY = "carrygo:user";

type AuthState = {
  user: User | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, code: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw) as User);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendOtp = async (_phone: string): Promise<string> => {
    // Demo mode: OTP is always 1234
    return "1234";
  };

  const verifyOtp = async (
    phone: string,
    code: string,
    name: string,
  ): Promise<User> => {
    if (code !== "1234") throw new Error("Invalid OTP. Use 1234 in demo mode.");
    const trimmed = name.trim() || "Guest";
    const next: User = {
      id: makeId("user"),
      phone,
      name: trimmed,
      rating: 5,
      ratingsCount: 0,
      joinedAt: Date.now(),
      avatarColor: avatarColor(trimmed + phone),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = async (patch: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, sendOtp, verifyOtp, signOut, updateUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
