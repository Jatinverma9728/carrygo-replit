import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "success";
type Size = "sm" | "md" | "lg";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  style,
  fullWidth,
}: Props) {
  const c = useColors();

  const palette = {
    primary: { bg: c.primary, fg: c.primaryForeground, border: c.primary },
    secondary: { bg: c.secondary, fg: c.foreground, border: c.border },
    ghost: { bg: "transparent", fg: c.foreground, border: "transparent" },
    destructive: { bg: c.destructive, fg: c.destructiveForeground, border: c.destructive },
    success: { bg: c.success, fg: c.successForeground, border: c.success },
  }[variant];

  const heights = { sm: 38, md: 48, lg: 56 }[size];
  const fontSize = { sm: 14, md: 16, lg: 17 }[size];

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          height: heights,
          width: fullWidth ? "100%" : undefined,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.text, { color: palette.fg, fontSize }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: "row", alignItems: "center" },
  text: { fontFamily: "Inter_600SemiBold", letterSpacing: 0.1 },
  icon: { marginRight: 8 },
});
