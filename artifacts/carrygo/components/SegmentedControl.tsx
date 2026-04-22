import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Option<T extends string> = { value: T; label: string; badge?: number };

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
};

export function SegmentedControl<T extends string>({ value, options, onChange }: Props<T>) {
  const c = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: c.secondary }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.item,
              active && { backgroundColor: c.background, shadowOpacity: 0.06 },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? c.foreground : c.mutedForeground },
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge && opt.badge > 0 ? (
              <View style={[styles.badge, { backgroundColor: c.primary }]}>
                <Text style={styles.badgeText}>{opt.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  item: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 0,
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  badge: {
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
});
