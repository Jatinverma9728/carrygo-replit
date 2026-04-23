import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBell?: boolean;
};

export function ScreenHeader({ title, subtitle, right, showBell = true }: Props) {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { counts } = useNotifications();
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
        <View style={styles.actions}>
          {showBell && user ? (
            <Pressable
              onPress={() => router.push("/notifications")}
              hitSlop={10}
              style={[styles.bell, { backgroundColor: c.accent, borderColor: c.border }]}
            >
              <Feather name="bell" size={18} color={c.foreground} />
              {counts.notifications > 0 ? (
                <View style={[styles.bellDot, { backgroundColor: c.primary, borderColor: c.background }]}>
                  <Text style={styles.bellDotText}>
                    {counts.notifications > 9 ? "9+" : String(counts.notifications)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          {right}
        </View>
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
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  bellDot: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  bellDotText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
});
