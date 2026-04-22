import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Tone = "default" | "info" | "success" | "warning" | "danger" | "neutral";

type Props = {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
};

export function Pill({ label, tone = "default", icon }: Props) {
  const c = useColors();
  const palette: Record<Tone, { bg: string; fg: string }> = {
    default: { bg: c.accent, fg: c.accentForeground },
    info: { bg: "#EFF6FF", fg: "#1D4ED8" },
    success: { bg: "#DCFCE7", fg: "#166534" },
    warning: { bg: "#FEF3C7", fg: "#92400E" },
    danger: { bg: "#FEE2E2", fg: "#991B1B" },
    neutral: { bg: c.secondary, fg: c.foreground },
  };
  const { bg, fg } = palette[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  icon: { marginRight: 4 },
});
