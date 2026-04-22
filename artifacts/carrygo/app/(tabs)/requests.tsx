import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/Pill";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatDate, formatPrice, formatTimeAgo } from "@/lib/format";
import type { DeliveryRequest } from "@/types";

type Tab = "incoming" | "outgoing";

const STATUS_TONE = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
} as const;

export default function RequestsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests, parcels, trips, acceptRequest, rejectRequest, cancelRequest } = useData();
  const [tab, setTab] = useState<Tab>("incoming");

  const incoming = useMemo(
    () => (user ? requests.filter((r) => r.travellerId === user.id) : []),
    [requests, user],
  );
  const outgoing = useMemo(
    () => (user ? requests.filter((r) => r.senderId === user.id) : []),
    [requests, user],
  );
  const incomingPending = incoming.filter((r) => r.status === "PENDING").length;
  const list = tab === "incoming" ? incoming : outgoing;

  const onAccept = async (req: DeliveryRequest) => {
    try {
      const dlv = await acceptRequest(req.id);
      router.push(`/delivery/${dlv.id}`);
    } catch (e) {
      Alert.alert("Could not accept", e instanceof Error ? e.message : "Unknown error");
    }
  };

  const onReject = (req: DeliveryRequest) => {
    Alert.alert("Reject request?", "The sender will be notified.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          rejectRequest(req.id);
        },
      },
    ]);
  };

  const onCancel = (req: DeliveryRequest) => {
    Alert.alert("Cancel request?", "You can send it again later.", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel request", style: "destructive", onPress: () => cancelRequest(req.id) },
    ]);
  };

  const bottomPad = Platform.OS === "web" ? 110 : insets.bottom + 90;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader title="Requests" />
        <EmptyState icon="user" title="Sign in to see requests" description="Match with travellers and senders." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScreenHeader title="Requests" subtitle="Match. Accept. Deliver." />
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "incoming", label: "Incoming", badge: incomingPending },
            { value: "outgoing", label: "Outgoing" },
          ]}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: bottomPad }}
        renderItem={({ item }) => {
          const parcel = parcels.find((p) => p.id === item.parcelId);
          const trip = trips.find((t) => t.id === item.tripId);
          if (!parcel || !trip) return null;
          const counterpart = tab === "incoming" ? parcel.senderName : trip.travellerName;
          return (
            <Card>
              <View style={styles.row}>
                <Avatar name={counterpart} size={44} />
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.name, { color: c.foreground }]} numberOfLines={1}>
                      {counterpart}
                    </Text>
                    <Pill label={item.status} tone={STATUS_TONE[item.status]} />
                  </View>
                  <Text style={[styles.route, { color: c.foreground }]} numberOfLines={1}>
                    {parcel.fromCity} → {parcel.toCity}
                  </Text>
                  <Text style={[styles.meta, { color: c.mutedForeground }]} numberOfLines={1}>
                    {parcel.category} · {parcel.weightKg}kg · {formatPrice(parcel.priceOffer)} · {formatDate(parcel.date)}
                  </Text>
                  <Text style={[styles.ago, { color: c.mutedForeground }]}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
              </View>

              {item.status === "PENDING" && tab === "incoming" ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onReject(item)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: c.secondary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Feather name="x" size={16} color={c.foreground} />
                    <Text style={[styles.actionText, { color: c.foreground }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onAccept(item)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Feather name="check" size={16} color={c.primaryForeground} />
                    <Text style={[styles.actionText, { color: c.primaryForeground }]}>Accept</Text>
                  </Pressable>
                </View>
              ) : null}

              {item.status === "PENDING" && tab === "outgoing" ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => onCancel(item)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: c.secondary, opacity: pressed ? 0.85 : 1, flex: 1 },
                    ]}
                  >
                    <Feather name="x" size={16} color={c.foreground} />
                    <Text style={[styles.actionText, { color: c.foreground }]}>Cancel request</Text>
                  </Pressable>
                </View>
              ) : null}

              {item.status === "ACCEPTED" ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => router.push(`/chat/${item.id}`)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: c.secondary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Feather name="message-circle" size={16} color={c.foreground} />
                    <Text style={[styles.actionText, { color: c.foreground }]}>Chat</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const dlv = list.length > 0 ? null : null;
                      // Find delivery via context
                      router.push(`/parcel/${parcel.id}`);
                    }}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: c.primary, opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Feather name="truck" size={16} color={c.primaryForeground} />
                    <Text style={[styles.actionText, { color: c.primaryForeground }]}>View delivery</Text>
                  </Pressable>
                </View>
              ) : null}
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title={tab === "incoming" ? "No incoming requests" : "No outgoing requests"}
            description={
              tab === "incoming"
                ? "Post a trip and senders will reach out to you."
                : "Send a parcel and request a traveller to carry it."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  route: { fontFamily: "Inter_700Bold", fontSize: 16, marginTop: 4 },
  meta: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 4 },
  ago: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 12,
  },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
