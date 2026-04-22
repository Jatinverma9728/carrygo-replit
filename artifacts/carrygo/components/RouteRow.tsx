import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  from: string;
  to: string;
  size?: "sm" | "md" | "lg";
};

export function RouteRow({ from, to, size = "md" }: Props) {
  const c = useColors();
  const fontSize = { sm: 14, md: 17, lg: 22 }[size];
  return (
    <View style={styles.row}>
      <Text style={[styles.city, { color: c.foreground, fontSize }]} numberOfLines={1}>
        {from}
      </Text>
      <View style={[styles.line, { backgroundColor: c.border }]} />
      <Feather name="arrow-right" size={fontSize - 2} color={c.mutedForeground} />
      <View style={[styles.line, { backgroundColor: c.border }]} />
      <Text style={[styles.city, { color: c.foreground, fontSize }]} numberOfLines={1}>
        {to}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  city: { fontFamily: "Inter_700Bold", flexShrink: 1 },
  line: { flex: 1, height: 1, opacity: 0.6 },
});
