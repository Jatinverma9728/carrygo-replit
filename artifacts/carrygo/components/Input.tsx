import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
};

export function Input({
  label,
  hint,
  error,
  containerStyle,
  leftAdornment,
  rightAdornment,
  style,
  ...rest
}: Props) {
  const c = useColors();
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: c.foreground }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: c.background,
            borderColor: error ? c.destructive : c.border,
          },
        ]}
      >
        {leftAdornment}
        <TextInput
          placeholderTextColor={c.mutedForeground}
          style={[styles.input, { color: c.foreground }, style]}
          {...rest}
        />
        {rightAdornment}
      </View>
      {error ? (
        <Text style={[styles.helper, { color: c.destructive }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: c.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    paddingVertical: 12,
  },
  helper: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
