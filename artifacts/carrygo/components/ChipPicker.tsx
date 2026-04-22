import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  scrollable?: boolean;
};

export function ChipPicker<T extends string>({ value, options, onChange, scrollable }: Props<T>) {
  const c = useColors();
  const Wrapper: React.ComponentType<{ children: React.ReactNode }> = scrollable
    ? ({ children }) => (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {children}
        </ScrollView>
      )
    : ({ children }) => <View style={styles.row}>{children}</View>;

  return (
    <Wrapper>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? c.foreground : c.secondary,
                borderColor: active ? c.foreground : c.border,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: active ? c.background : c.foreground },
              ]}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
