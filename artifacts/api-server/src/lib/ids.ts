import { randomBytes } from "crypto";

export function makeId(prefix: string): string {
  const r = randomBytes(8).toString("hex");
  return `${prefix}_${r}`;
}

export function makeToken(): string {
  return randomBytes(24).toString("hex");
}

export function makeOtp(): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#10B981", "#06B6D4", "#F43F5E", "#A855F7"];
export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}
