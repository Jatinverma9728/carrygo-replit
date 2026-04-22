import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const TOKEN_KEY = "carrygo:token";

let cachedToken: string | null = null;

function resolveBaseUrl(): string {
  if (typeof window !== "undefined" && Platform.OS === "web") {
    // Use same origin (proxied via the workspace).
    return "";
  }
  // For native, use the public Replit domain that hosts the API artifact.
  const domain = process.env.EXPO_PUBLIC_DOMAIN || (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.["domain"];
  if (typeof domain === "string" && domain.length > 0) {
    return `https://${domain}`;
  }
  return "";
}

const BASE_URL = resolveBaseUrl();

export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${p}`;
}

export async function loadToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiFetch<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in (data as Record<string, unknown>) &&
        typeof (data as Record<string, unknown>).error === "string")
        ? ((data as Record<string, string>).error)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}
