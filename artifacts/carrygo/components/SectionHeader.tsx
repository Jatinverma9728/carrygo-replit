import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[styles.action, { color: c.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  text: { flex: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.3 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  action: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
