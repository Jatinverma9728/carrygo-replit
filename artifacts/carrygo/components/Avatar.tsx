import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { avatarColor, initials } from "@/lib/format";

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export function Avatar({ name, size = 40, color }: Props) {
  const bg = color ?? avatarColor(name);
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  text: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
