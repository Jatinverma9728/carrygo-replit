import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  minDate?: Date;
};

const DAY = 24 * 60 * 60 * 1000;

export function DateStepper({ value, onChange, minDate }: Props) {
  const c = useColors();

  const setDays = (days: number) => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    onChange(new Date(start.getTime() + days * DAY));
  };

  const shift = (days: number) => {
    const next = new Date(value.getTime() + days * DAY);
    if (minDate && next.getTime() < minDate.getTime()) return;
    onChange(next);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((value.getTime() - today.getTime()) / DAY);

  const presets: Array<{ label: string; days: number }> = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "+3d", days: 3 },
    { label: "+7d", days: 7 },
    { label: "+14d", days: 14 },
  ];

  return (
    <View style={{ gap: 10 }}>
      <View style={[styles.dateBox, { borderColor: c.border, backgroundColor: c.card }]}>
        <Pressable
          onPress={() => shift(-1)}
          hitSlop={10}
          style={[styles.dateBtn, { backgroundColor: c.background, borderColor: c.border }]}
        >
          <Feather name="chevron-left" size={18} color={c.foreground} />
        </Pressable>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={[styles.dateLarge, { color: c.foreground }]}>
            {value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </Text>
          <Text style={[styles.dateSmall, { color: c.mutedForeground }]}>
            {value.toLocaleDateString(undefined, { year: "numeric" })}
          </Text>
        </View>
        <Pressable
          onPress={() => shift(1)}
          hitSlop={10}
          style={[styles.dateBtn, { backgroundColor: c.background, borderColor: c.border }]}
        >
          <Feather name="chevron-right" size={18} color={c.foreground} />
        </Pressable>
      </View>
      <View style={styles.presets}>
        {presets.map((p) => {
          const active = diffDays === p.days;
          return (
            <Pressable
              key={p.label}
              onPress={() => setDays(p.days)}
              style={[
                styles.preset,
                {
                  backgroundColor: active ? c.foreground : c.secondary,
                  borderColor: active ? c.foreground : c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: active ? c.background : c.foreground },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1 },
  dateBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  dateLarge: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: -0.2 },
  dateSmall: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  presetText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
