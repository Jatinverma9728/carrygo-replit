import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Pill } from "@/components/Pill";
import { RouteRow } from "@/components/RouteRow";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/lib/format";

const STAGE_TONE = {
  AWAITING_PICKUP: "warning",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  FAILED: "danger",
} as const;

const STAGE_LABEL = {
  AWAITING_PICKUP: "Awaiting pickup",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
} as const;

const STAGES = ["AWAITING_PICKUP", "IN_TRANSIT", "DELIVERED"] as const;

export default function DeliveryScreen() {
  const c = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { deliveries, parcels, trips, requests, confirmPickup, confirmDelivery, markDeliveryFailed } = useData();

  const delivery = useMemo(() => deliveries.find((d) => d.id === id), [deliveries, id]);
  const parcel = delivery ? parcels.find((p) => p.id === delivery.parcelId) : undefined;
  const trip = delivery ? trips.find((t) => t.id === delivery.tripId) : undefined;
  const req = delivery ? requests.find((r) => r.id === delivery.requestId) : undefined;
  const [otpInput, setOtpInput] = useState<string>("");

  if (!delivery || !parcel || !trip) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyState icon="alert-circle" title="Delivery not found" />
      </View>
    );
  }

  const isTraveller = user?.id === delivery.travellerId;
  const isSender = user?.id === delivery.senderId;
  const stageIndex = STAGES.indexOf(delivery.stage as typeof STAGES[number]);

  const onPickup = async () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await confirmPickup(delivery.id);
  };

  const onDeliver = async () => {
    try {
      await confirmDelivery(delivery.id, otpInput.trim());
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Alert.alert("Could not confirm", e instanceof Error ? e.message : "Wrong OTP");
    }
  };

  const onFail = () => {
    Alert.alert(
      "Mark as failed?",
      "Use this if the receiver was not available. Escrow will be returned.",
      [
        { text: "Keep trying", style: "cancel" },
        {
          text: "Mark failed",
          style: "destructive",
          onPress: () => markDeliveryFailed(delivery.id, "Receiver unavailable"),
        },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.header}>
          <RouteRow from={parcel.fromCity} to={parcel.toCity} size="lg" />
          <Pill label={STAGE_LABEL[delivery.stage]} tone={STAGE_TONE[delivery.stage]} />
        </View>

        <View style={styles.tracker}>
          {STAGES.map((s, i) => {
            const done = i <= stageIndex && delivery.stage !== "FAILED";
            const failed = delivery.stage === "FAILED" && i === 0;
            const active = i === stageIndex && delivery.stage !== "DELIVERED" && delivery.stage !== "FAILED";
            return (
              <React.Fragment key={s}>
                <View style={styles.trackerStep}>
                  <View
                    style={[
                      styles.trackerDot,
                      {
                        backgroundColor: failed
                          ? c.destructive
                          : done
                            ? c.success
                            : c.secondary,
                        borderColor: active ? c.primary : "transparent",
                        borderWidth: active ? 3 : 0,
                      },
                    ]}
                  >
                    <Feather
                      name={
                        i === 0 ? "package" : i === 1 ? "truck" : "check"
                      }
                      size={14}
                      color={done || failed ? "#FFFFFF" : c.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      styles.trackerLabel,
                      { color: done || active ? c.foreground : c.mutedForeground },
                    ]}
                  >
                    {STAGE_LABEL[s]}
                  </Text>
                </View>
                {i < STAGES.length - 1 ? (
                  <View
                    style={[
                      styles.trackerLine,
                      { backgroundColor: i < stageIndex ? c.success : c.border },
                    ]}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Payment in escrow</Text>
        <View style={styles.escrowRow}>
          <View style={[styles.escrowIcon, { backgroundColor: delivery.escrowReleased ? c.success : c.accent }]}>
            <Feather name={delivery.escrowReleased ? "check-circle" : "lock"} size={18} color={delivery.escrowReleased ? "#FFFFFF" : c.accentForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.escrowAmount, { color: c.foreground }]}>{formatPrice(delivery.pricePaid)}</Text>
            <Text style={[styles.escrowSub, { color: c.mutedForeground }]}>
              {delivery.escrowReleased
                ? "Released to traveller"
                : "Held safely. Released on confirmed delivery."}
            </Text>
          </View>
        </View>
      </Card>

      {isSender && delivery.stage !== "DELIVERED" && delivery.stage !== "FAILED" ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Your delivery code</Text>
          <Text style={[styles.otpHelp, { color: c.mutedForeground }]}>
            Share this 4-digit code with your receiver. They give it to the traveller at handoff.
          </Text>
          <View style={[styles.otpBox, { backgroundColor: c.foreground }]}>
            <Text style={[styles.otpText, { color: c.background }]}>{delivery.otp}</Text>
          </View>
        </Card>
      ) : null}

      {isTraveller && delivery.stage === "AWAITING_PICKUP" ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Pickup parcel</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>
            Confirm once you have the parcel from the sender.
          </Text>
          <Button
            title="Confirm pickup"
            onPress={onPickup}
            fullWidth
            style={{ marginTop: 12 }}
            icon={<Feather name="package" size={16} color={c.primaryForeground} />}
          />
        </Card>
      ) : null}

      {isTraveller && delivery.stage === "IN_TRANSIT" ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Confirm delivery</Text>
          <Text style={[styles.helper, { color: c.mutedForeground }]}>
            Ask the receiver for the 4-digit OTP and enter it below.
          </Text>
          <Input
            placeholder="1234"
            value={otpInput}
            onChangeText={setOtpInput}
            keyboardType="number-pad"
            maxLength={4}
            containerStyle={{ marginTop: 12 }}
          />
          <Button
            title="Confirm delivery"
            onPress={onDeliver}
            fullWidth
            variant="success"
            style={{ marginTop: 12 }}
            icon={<Feather name="check" size={16} color="#FFFFFF" />}
          />
          <View style={{ height: 8 }} />
          <Button title="Receiver unavailable" onPress={onFail} variant="ghost" fullWidth />
        </Card>
      ) : null}

      {req ? (
        <Card>
          <Button
            title="Open chat"
            onPress={() => router.push(`/chat/${req.id}`)}
            variant="secondary"
            fullWidth
            icon={<Feather name="message-circle" size={16} color={c.foreground} />}
          />
        </Card>
      ) : null}

      {delivery.stage === "DELIVERED" ? (
        <Card>
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: c.success }]}>
              <Feather name="check" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: c.foreground }]}>Delivery complete</Text>
            <Text style={[styles.successSub, { color: c.mutedForeground }]}>
              Payment of {formatPrice(delivery.pricePaid)} released to {trip.travellerName}.
            </Text>
          </View>
        </Card>
      ) : null}

      {delivery.stage === "FAILED" ? (
        <Card>
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: c.destructive }]}>
              <Feather name="x" size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: c.foreground }]}>Delivery failed</Text>
            <Text style={[styles.successSub, { color: c.mutedForeground }]}>
              {delivery.failedReason ?? "Could not complete handoff."} Escrow returned to sender.
            </Text>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  tracker: { flexDirection: "row", alignItems: "flex-start", marginTop: 20, paddingHorizontal: 4 },
  trackerStep: { alignItems: "center", gap: 6, width: 80 },
  trackerDot: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  trackerLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center" },
  trackerLine: { flex: 1, height: 2, marginTop: 17 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, marginBottom: 8 },
  escrowRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  escrowIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  escrowAmount: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.3 },
  escrowSub: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  otpHelp: { fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 12 },
  otpBox: { padding: 24, borderRadius: 16, alignItems: "center" },
  otpText: { fontFamily: "Inter_700Bold", fontSize: 42, letterSpacing: 12 },
  helper: { fontFamily: "Inter_500Medium", fontSize: 13 },
  successBox: { alignItems: "center", padding: 12, gap: 8 },
  successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  successSub: { fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", lineHeight: 19 },
});
