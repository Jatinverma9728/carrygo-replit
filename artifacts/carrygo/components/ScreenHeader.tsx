import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad =
    Platform.OS === "web" ? Math.max(insets.top, 16) + 4 : insets.top + 8;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topPad,
          backgroundColor: c.background,
          borderBottomColor: c.border,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: c.mutedForeground }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center" },
  text: { flex: 1 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
});
