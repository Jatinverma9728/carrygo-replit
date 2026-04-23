import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Pill } from "@/components/Pill";
import { TripCard } from "@/components/TripCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { notify } from "@/lib/confirm";
import { formatPrice } from "@/lib/format";

export default function MatchingScreen() {
  const c = useColors();
  const router = useRouter();
  const { parcelId } = useLocalSearchParams<{ parcelId: string }>();
  const { user } = useAuth();
  const { parcels, requests, findMatchingTrips, createRequest } = useData();

  const parcel = useMemo(() => parcels.find((p) => p.id === parcelId), [parcels, parcelId]);
  const matches = useMemo(() => (parcel ? findMatchingTrips(parcel) : []), [parcel, findMatchingTrips]);

  if (!parcel) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyState icon="alert-circle" title="Parcel not found" description="It may have been removed." />
      </View>
    );
  }

  const requested = (tripId: string) =>
    requests.some(
      (r) =>
        r.parcelId === parcel.id &&
        r.tripId === tripId &&
        (r.status === "PENDING" || r.status === "ACCEPTED"),
    );

  const onRequest = async (tripId: string, travellerId: string) => {
    if (!user) return;
    await createRequest({
      parcelId: parcel.id,
      tripId,
      senderId: user.id,
      travellerId,
    });
    notify("Request sent", "The traveller will be notified.");
    router.push("/(tabs)/requests");
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <FlatList
        data={matches}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Card>
              <View style={styles.summaryHeader}>
                <Pill label={parcel.category} tone="info" />
                <Text style={[styles.price, { color: c.foreground }]}>{formatPrice(parcel.priceOffer)}</Text>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routeText}>
                  <Text style={[styles.city, { color: c.foreground }]} numberOfLines={1}>{parcel.fromCity}</Text>
                  <Text style={[styles.cityLabel, { color: c.mutedForeground }]}>From</Text>
                </View>
                <Feather name="arrow-right" size={20} color={c.mutedForeground} />
                <View style={styles.routeText}>
                  <Text style={[styles.city, { color: c.foreground }]} numberOfLines={1}>{parcel.toCity}</Text>
                  <Text style={[styles.cityLabel, { color: c.mutedForeground }]}>To</Text>
                </View>
              </View>
              <Text style={[styles.matchCount, { color: c.mutedForeground }]}>
                {matches.length} traveller{matches.length === 1 ? "" : "s"} matched on your route
              </Text>
            </Card>
          </View>
        }
        renderItem={({ item }) => {
          const already = requested(item.id);
          return (
            <View>
              <TripCard trip={item} onPress={() => router.push(`/trip/${item.id}`)} />
              <Button
                title={already ? "Request sent" : "Send delivery request"}
                onPress={() => onRequest(item.id, item.travellerId)}
                disabled={already}
                variant={already ? "secondary" : "primary"}
                fullWidth
                style={{ marginTop: 10 }}
                icon={
                  already ? (
                    <Feather name="check" size={16} color={c.foreground} />
                  ) : (
                    <Feather name="send" size={16} color={c.primaryForeground} />
                  )
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="No matching travellers yet"
            description="No one is travelling on this route around your date. Check back soon — we will notify you when someone posts a trip."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  summaryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.3 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  routeText: { flex: 1 },
  city: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.3 },
  cityLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2 },
  matchCount: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 14 },
});
