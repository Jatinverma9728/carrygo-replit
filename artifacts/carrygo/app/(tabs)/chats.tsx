import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatTimeAgo } from "@/lib/format";

export default function ChatsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests, parcels, trips, messages } = useData();

  const threads = useMemo(() => {
    if (!user) return [];
    const accepted = requests.filter(
      (r) =>
        r.status === "ACCEPTED" && (r.senderId === user.id || r.travellerId === user.id),
    );
    return accepted
      .map((r) => {
        const parcel = parcels.find((p) => p.id === r.parcelId);
        const trip = trips.find((t) => t.id === r.tripId);
        const counterpart =
          r.senderId === user.id ? trip?.travellerName : parcel?.senderName;
        const threadMsgs = messages.filter((m) => m.threadId === r.id);
        const last = threadMsgs[threadMsgs.length - 1];
        return {
          id: r.id,
          counterpart: counterpart ?? "Unknown",
          parcel,
          trip,
          last,
          updatedAt: last?.createdAt ?? r.updatedAt,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [requests, parcels, trips, messages, user]);

  const bottomPad = Platform.OS === "web" ? 110 : insets.bottom + 90;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader title="Chats" />
        <EmptyState icon="message-circle" title="Sign in to chat" description="Coordinate handoffs in real time." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Chats" subtitle="Coordinate the handoff" />
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: c.border }]} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Avatar name={item.counterpart} size={48} />
            <View style={{ flex: 1 }}>
              <View style={styles.head}>
                <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                  {item.counterpart}
                </Text>
                <Text style={[styles.time, { color: c.mutedForeground }]}>
                  {formatTimeAgo(item.updatedAt)}
                </Text>
              </View>
              <Text style={[styles.route, { color: c.mutedForeground }]} numberOfLines={1}>
                {item.parcel ? `${item.parcel.fromCity} → ${item.parcel.toCity}` : ""}
              </Text>
              <Text style={[styles.preview, { color: c.mutedForeground }]} numberOfLines={1}>
                {item.last ? item.last.text : "Say hello to coordinate the handoff."}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="message-circle"
            title="No chats yet"
            description="Once a request is accepted, you can chat here to plan the meet."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 80 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  time: { fontFamily: "Inter_400Regular", fontSize: 11 },
  route: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  preview: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 4 },
});
