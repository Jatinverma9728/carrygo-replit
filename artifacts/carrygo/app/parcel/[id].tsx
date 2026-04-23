import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/Pill";
import { RouteRow } from "@/components/RouteRow";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { confirm, notify } from "@/lib/confirm";
import { formatDate, formatPrice } from "@/lib/format";

const STATUS_TONE = {
  OPEN: "info",
  MATCHED: "warning",
  DELIVERED: "success",
  CANCELLED: "neutral",
  FAILED: "danger",
} as const;

export default function ParcelDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { parcels, requests, deliveries, cancelParcel } = useData();

  const parcel = useMemo(() => parcels.find((p) => p.id === id), [parcels, id]);

  if (!parcel) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyState icon="alert-circle" title="Parcel not found" />
      </View>
    );
  }

  const isOwner = user?.id === parcel.senderId;
  const myRequest = requests.find((r) => r.parcelId === parcel.id && r.status === "ACCEPTED");
  const delivery = myRequest ? deliveries.find((d) => d.requestId === myRequest.id) : undefined;

  const onCancel = async () => {
    const ok = await confirm({
      title: "Cancel parcel?",
      message: "Active requests will remain visible.",
      confirmText: "Cancel parcel",
      cancelText: "Keep",
      destructive: true,
    });
    if (!ok) return;
    try { await cancelParcel(parcel.id); router.back(); }
    catch (e) { notify("Could not cancel", e instanceof Error ? e.message : ""); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.header}>
          <RouteRow from={parcel.fromCity} to={parcel.toCity} size="lg" />
          <Pill label={parcel.status} tone={STATUS_TONE[parcel.status]} />
        </View>
        <View style={[styles.info, { borderTopColor: c.border }]}>
          <InfoRow icon="tag" label="Category" value={parcel.category} />
          <InfoRow icon="package" label="Weight" value={`${parcel.weightKg} kg`} />
          <InfoRow icon="dollar-sign" label="Offer" value={formatPrice(parcel.priceOffer)} />
          <InfoRow icon="calendar" label="Pickup" value={formatDate(parcel.date)} />
        </View>
        <Text style={[styles.desc, { color: c.foreground }]}>{parcel.description}</Text>
        {parcel.imageUri ? (
          <Image source={{ uri: parcel.imageUri }} style={styles.image} resizeMode="cover" />
        ) : null}
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Receiver</Text>
        <Text style={[styles.receiverName, { color: c.foreground }]}>{parcel.receiverName}</Text>
        <Text style={[styles.receiverPhone, { color: c.mutedForeground }]}>{parcel.receiverPhone}</Text>
      </Card>

      {delivery ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Active delivery</Text>
          <Button
            title="Open delivery"
            onPress={() => router.push(`/delivery/${delivery.id}`)}
            fullWidth
            icon={<Feather name="truck" size={16} color={c.primaryForeground} />}
          />
        </Card>
      ) : null}

      {isOwner && parcel.status === "OPEN" ? (
        <Card>
          <Button
            title="Find travellers"
            onPress={() => router.push(`/matching/${parcel.id}`)}
            fullWidth
            icon={<Feather name="search" size={16} color={c.primaryForeground} />}
          />
          <View style={{ height: 12 }} />
          <Button title="Cancel parcel" onPress={onCancel} variant="ghost" fullWidth />
        </Card>
      ) : null}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: string }) {
  const c = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={16} color={c.mutedForeground} />
      <Text style={[styles.infoLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 14, flex: 1 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  desc: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20, marginTop: 14 },
  image: { width: "100%", height: 180, borderRadius: 12, marginTop: 14 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 8 },
  receiverName: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  receiverPhone: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 2 },
});
