import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
};

export function Card({ children, onPress, style, padded = true }: Props) {
  const c = useColors();
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
