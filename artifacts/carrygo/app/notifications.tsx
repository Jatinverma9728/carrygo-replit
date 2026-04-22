import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useNotifications, type AppNotification } from "@/contexts/NotificationsContext";
import { useColors } from "@/hooks/useColors";
import { formatTimeAgo } from "@/lib/format";

const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  REQUEST_NEW: "inbox",
  REQUEST_ACCEPTED: "check-circle",
  REQUEST_REJECTED: "x-circle",
  PICKUP_CONFIRMED: "package",
  DELIVERED: "check-square",
  PAYOUT: "credit-card",
  FAILED: "alert-triangle",
  MESSAGE: "message-circle",
  RATED: "star",
};

const TYPE_TONE: Record<string, string> = {
  REQUEST_NEW: "#3B82F6",
  REQUEST_ACCEPTED: "#22C55E",
  REQUEST_REJECTED: "#EF4444",
  PICKUP_CONFIRMED: "#F59E0B",
  DELIVERED: "#22C55E",
  PAYOUT: "#10B981",
  FAILED: "#EF4444",
  MESSAGE: "#8B5CF6",
  RATED: "#F59E0B",
};

export default function NotificationsScreen() {
  const c = useColors();
  const router = useRouter();
  const { notifications, markAllRead, refresh } = useNotifications();

  useEffect(() => {
    refresh();
    const t = setTimeout(() => {
      markAllRead().catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [markAllRead, refresh]);

  const onPress = (n: AppNotification) => {
    if (!n.data) return;
    try {
      const data = JSON.parse(n.data) as { deliveryId?: string; requestId?: string; threadId?: string; parcelId?: string };
      if (data.deliveryId) router.push(`/delivery/${data.deliveryId}`);
      else if (data.threadId) router.push(`/chat/${data.threadId}`);
      else if (data.requestId) router.push(`/(tabs)/requests`);
      else if (data.parcelId) router.push(`/parcel/${data.parcelId}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: "Notifications" }} />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === "web" ? 32 : 60 }}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.border }]} />}
        renderItem={({ item }) => {
          const tone = TYPE_TONE[item.type] ?? c.primary;
          const icon = TYPE_ICON[item.type] ?? "bell";
          return (
            <Pressable
              onPress={() => onPress(item)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: item.read ? "transparent" : c.accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: tone + "1A" }]}>
                <Feather name={icon} size={18} color={tone} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.head}>
                  <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.time, { color: c.mutedForeground }]}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
                <Text style={[styles.body, { color: c.mutedForeground }]} numberOfLines={2}>{item.body}</Text>
              </View>
              {!item.read ? <View style={[styles.dot, { backgroundColor: c.primary }]} /> : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="bell"
            title="No notifications yet"
            description="Updates about your deliveries, requests and messages will show up here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 18, paddingVertical: 14, alignItems: "center" },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  body: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
