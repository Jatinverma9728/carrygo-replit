import React, { createContext, useContext, useEffect, useState } from "react";

import { apiFetch, loadToken, setToken } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<string>;
  verifyOtp: (phone: string, code: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

type ApiUser = {
  id: string;
  phone: string;
  name: string;
  avatarColor: string;
  rating: number;
  ratingsCount: number;
  joinedAt: string;
};

function fromApi(u: ApiUser): User {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatarColor: u.avatarColor,
    rating: u.rating,
    ratingsCount: u.ratingsCount,
    joinedAt: Date.parse(u.joinedAt),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (!token) return;
        const me = await apiFetch<ApiUser>("GET", "/api/auth/me");
        setUser(fromApi(me));
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendOtp = async (phone: string): Promise<string> => {
    const res = await apiFetch<{ sent: boolean; demoCode?: string }>(
      "POST",
      "/api/auth/otp/request",
      { phone },
    );
    return res.demoCode ?? "1234";
  };

  const verifyOtp = async (phone: string, code: string, name: string): Promise<User> => {
    const res = await apiFetch<{ token: string; user: ApiUser }>(
      "POST",
      "/api/auth/otp/verify",
      { phone, code, name },
    );
    await setToken(res.token);
    const u = fromApi(res.user);
    setUser(u);
    return u;
  };

  const signOut = async () => {
    try {
      await apiFetch("POST", "/api/auth/signout");
    } catch {
      /* ignore */
    }
    await setToken(null);
    setUser(null);
  };

  const updateUser = async (patch: Partial<User>) => {
    const res = await apiFetch<ApiUser>("PATCH", "/api/auth/me", {
      name: patch.name,
      avatarColor: patch.avatarColor,
    });
    setUser(fromApi(res));
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
