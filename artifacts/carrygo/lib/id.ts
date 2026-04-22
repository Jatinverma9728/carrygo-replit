export function makeId(prefix: string = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function makeOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
