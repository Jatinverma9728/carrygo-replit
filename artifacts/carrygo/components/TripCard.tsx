import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { RouteRow } from "@/components/RouteRow";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/format";
import type { Trip } from "@/types";

type Props = {
  trip: Trip;
  onPress?: () => void;
  showTraveller?: boolean;
};

export function TripCard({ trip, onPress, showTraveller = true }: Props) {
  const c = useColors();
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <RouteRow from={trip.fromCity} to={trip.toCity} />
        <Pill label={trip.vehicle} tone="info" />
      </View>

      <View style={[styles.meta, { borderTopColor: c.border }]}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={14} color={c.mutedForeground} />
          <Text style={[styles.metaText, { color: c.mutedForeground }]}>
            {formatDate(trip.date)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="package" size={14} color={c.mutedForeground} />
          <Text style={[styles.metaText, { color: c.mutedForeground }]}>
            {trip.capacityKg} kg
          </Text>
        </View>
        {showTraveller ? (
          <View style={[styles.metaItem, styles.travellerWrap]}>
            <Avatar name={trip.travellerName} size={22} />
            <Text style={[styles.metaText, { color: c.foreground }]} numberOfLines={1}>
              {trip.travellerName}
            </Text>
            <Feather name="star" size={12} color={c.warning} />
            <Text style={[styles.metaText, { color: c.foreground }]}>
              {trip.travellerRating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  travellerWrap: { marginLeft: "auto" },
});
