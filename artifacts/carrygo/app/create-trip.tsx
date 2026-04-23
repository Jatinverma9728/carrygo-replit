import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ChipPicker } from "@/components/ChipPicker";
import { DateStepper } from "@/components/DateStepper";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import type { VehicleType } from "@/types";

const VEHICLES: readonly VehicleType[] = ["Bike", "Car", "Bus", "Train", "Flight"] as const;

export default function CreateTripScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createTrip } = useData();

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [vehicle, setVehicle] = useState<VehicleType>("Car");
  const [capacity, setCapacity] = useState<string>("5");
  const [date, setDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!user) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: c.background }]}>
        <Text style={{ color: c.foreground, fontFamily: "Inter_600SemiBold" }}>Please sign in first.</Text>
        <View style={{ height: 12 }} />
        <Button title="Sign in" onPress={() => router.replace("/auth")} />
      </View>
    );
  }

  const onSubmit = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert("Missing route", "Add both from and to cities.");
      return;
    }
    const cap = parseFloat(capacity);
    if (Number.isNaN(cap) || cap <= 0) {
      Alert.alert("Invalid capacity", "Capacity should be a number in kg.");
      return;
    }
    setLoading(true);
    try {
      const trip = await createTrip({
        travellerId: user.id,
        travellerName: user.name,
        travellerRating: user.rating,
        fromCity: from.trim(),
        toCity: to.trim(),
        date: date.getTime(),
        vehicle,
        capacityKg: cap,
        notes: notes.trim() || undefined,
      });
      router.replace(`/trip/${trip.id}`);
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 16) : 0;

  return (
    <KeyboardAwareScrollView
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 12, paddingBottom: insets.bottom + 32 }]}
    >
      <Text style={[styles.section, { color: c.foreground }]}>Route</Text>
      <Input
        label="From"
        placeholder="Mumbai"
        value={from}
        onChangeText={setFrom}
        autoCapitalize="words"
        leftAdornment={<Feather name="map-pin" size={16} color={c.mutedForeground} style={{ marginRight: 10 }} />}
      />
      <Input
        label="To"
        placeholder="Delhi"
        value={to}
        onChangeText={setTo}
        autoCapitalize="words"
        leftAdornment={<Feather name="flag" size={16} color={c.mutedForeground} style={{ marginRight: 10 }} />}
      />

      <Text style={[styles.section, { color: c.foreground }]}>When are you going?</Text>
      <DateStepper value={date} onChange={setDate} minDate={new Date()} />

      <Text style={[styles.section, { color: c.foreground }]}>Vehicle</Text>
      <ChipPicker value={vehicle} options={VEHICLES} onChange={setVehicle} scrollable />

      <Text style={[styles.section, { color: c.foreground }]}>Capacity</Text>
      <Input
        placeholder="5"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="decimal-pad"
        rightAdornment={<Text style={[styles.suffix, { color: c.mutedForeground }]}>kg</Text>}
      />

      <Text style={[styles.section, { color: c.foreground }]}>Notes (optional)</Text>
      <Input
        placeholder="Cabin baggage only, no food."
        value={notes}
        onChangeText={setNotes}
        multiline
        style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
      />

      <Button title="Post trip" onPress={onSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  section: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 12 },
  suffix: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginLeft: 8 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
