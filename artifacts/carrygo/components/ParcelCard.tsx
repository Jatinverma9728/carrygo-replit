import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { RouteRow } from "@/components/RouteRow";
import { useColors } from "@/hooks/useColors";
import { formatDate, formatPrice } from "@/lib/format";
import type { Parcel } from "@/types";

type Props = {
  parcel: Parcel;
  onPress?: () => void;
};

const STATUS_TONE = {
  OPEN: "info",
  MATCHED: "warning",
  DELIVERED: "success",
  CANCELLED: "neutral",
  FAILED: "danger",
} as const;

export function ParcelCard({ parcel, onPress }: Props) {
  const c = useColors();
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <RouteRow from={parcel.fromCity} to={parcel.toCity} />
        <Pill label={parcel.status} tone={STATUS_TONE[parcel.status]} />
      </View>
      <Text style={[styles.desc, { color: c.mutedForeground }]} numberOfLines={2}>
        {parcel.category} · {parcel.description}
      </Text>
      <View style={[styles.meta, { borderTopColor: c.border }]}>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={14} color={c.mutedForeground} />
          <Text style={[styles.metaText, { color: c.mutedForeground }]}>
            {formatDate(parcel.date)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="package" size={14} color={c.mutedForeground} />
          <Text style={[styles.metaText, { color: c.mutedForeground }]}>
            {parcel.weightKg} kg
          </Text>
        </View>
        <View style={[styles.metaItem, { marginLeft: "auto" }]}>
          <Text style={[styles.price, { color: c.foreground }]}>
            {formatPrice(parcel.priceOffer)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  desc: { fontFamily: "Inter_500Medium", fontSize: 13, marginTop: 8 },
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
  price: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
