import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/Pill";
import { RouteRow } from "@/components/RouteRow";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/format";

export default function TripDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { trips, parcels, requests, cancelTrip } = useData();

  const trip = useMemo(() => trips.find((t) => t.id === id), [trips, id]);

  if (!trip) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyState icon="alert-circle" title="Trip not found" />
      </View>
    );
  }

  const isOwner = user?.id === trip.travellerId;
  const incoming = requests.filter((r) => r.tripId === trip.id);
  const myParcels = parcels.filter(
    (p) =>
      p.senderId === user?.id &&
      p.fromCity.toLowerCase() === trip.fromCity.toLowerCase() &&
      p.toCity.toLowerCase() === trip.toCity.toLowerCase() &&
      p.status === "OPEN",
  );

  const onCancel = () => {
    Alert.alert("Cancel trip?", "Pending requests will remain.", [
      { text: "Keep", style: "cancel" },
      { text: "Cancel trip", style: "destructive", onPress: () => cancelTrip(trip.id) },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.header}>
          <RouteRow from={trip.fromCity} to={trip.toCity} size="lg" />
          <Pill label={trip.vehicle} tone="info" />
        </View>
        <View style={[styles.info, { borderTopColor: c.border }]}>
          <InfoRow icon="calendar" label="Date" value={formatDate(trip.date)} />
          <InfoRow icon="package" label="Capacity" value={`${trip.capacityKg} kg`} />
          <InfoRow icon="activity" label="Status" value={trip.status} />
        </View>
        {trip.notes ? (
          <View style={[styles.notes, { backgroundColor: c.background, borderColor: c.border }]}>
            <Text style={[styles.notesText, { color: c.foreground }]}>{trip.notes}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <View style={styles.travellerRow}>
          <Avatar name={trip.travellerName} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.travellerName, { color: c.foreground }]}>{trip.travellerName}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color={c.warning} />
              <Text style={[styles.ratingText, { color: c.foreground }]}>{trip.travellerRating.toFixed(1)}</Text>
              <Text style={[styles.ratingDivider, { color: c.mutedForeground }]}>·</Text>
              <Text style={[styles.ratingText, { color: c.mutedForeground }]}>Verified traveller</Text>
            </View>
          </View>
        </View>
      </Card>

      {isOwner ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Incoming requests</Text>
          {incoming.length === 0 ? (
            <Text style={[styles.empty, { color: c.mutedForeground }]}>No requests yet on this trip.</Text>
          ) : (
            <Button title="Open requests" onPress={() => router.push("/(tabs)/requests")} variant="secondary" fullWidth />
          )}
          <View style={{ height: 12 }} />
          <Button title="Cancel trip" onPress={onCancel} variant="ghost" fullWidth />
        </Card>
      ) : (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Send a parcel on this trip</Text>
          {!user ? (
            <Button title="Sign in to send" onPress={() => router.push("/auth")} fullWidth />
          ) : myParcels.length > 0 ? (
            <View style={{ gap: 8 }}>
              {myParcels.map((p) => (
                <Button
                  key={p.id}
                  title={`Request for: ${p.description.slice(0, 40)}`}
                  variant="secondary"
                  onPress={() => router.push(`/matching/${p.id}`)}
                  fullWidth
                />
              ))}
              <Button title="Create new parcel" onPress={() => router.push("/create-parcel")} fullWidth />
            </View>
          ) : (
            <Button title="Create a parcel" onPress={() => router.push("/create-parcel")} fullWidth />
          )}
        </Card>
      )}
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
  notes: { marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  notesText: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  travellerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  travellerName: { fontFamily: "Inter_700Bold", fontSize: 17 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  ratingText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  ratingDivider: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 12 },
  empty: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
