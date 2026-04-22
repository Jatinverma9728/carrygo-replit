import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ChipPicker } from "@/components/ChipPicker";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import type { ParcelCategory } from "@/types";

const CATEGORIES: readonly ParcelCategory[] = [
  "Documents",
  "Electronics",
  "Clothing",
  "Food",
  "Medicine",
  "Other",
] as const;

export default function CreateParcelScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createParcel } = useData();

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [category, setCategory] = useState<ParcelCategory>("Documents");
  const [description, setDescription] = useState<string>("");
  const [weight, setWeight] = useState<string>("1");
  const [price, setPrice] = useState<string>("300");
  const [date, setDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [receiverName, setReceiverName] = useState<string>("");
  const [receiverPhone, setReceiverPhone] = useState<string>("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "We need access to your photos to attach a parcel image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const shiftDate = (days: number) => {
    setDate(new Date(date.getTime() + days * 24 * 60 * 60 * 1000));
  };

  const onSubmit = async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert("Missing route", "Add both from and to cities.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Add a description", "Tell the traveller what's inside.");
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim()) {
      Alert.alert("Receiver details", "Add the receiver's name and phone.");
      return;
    }
    const w = parseFloat(weight);
    const p = parseFloat(price);
    if (Number.isNaN(w) || w <= 0 || Number.isNaN(p) || p <= 0) {
      Alert.alert("Invalid number", "Weight and price should be positive numbers.");
      return;
    }
    setLoading(true);
    try {
      const parcel = await createParcel({
        senderId: user.id,
        senderName: user.name,
        fromCity: from.trim(),
        toCity: to.trim(),
        date: date.getTime(),
        category,
        description: description.trim(),
        weightKg: w,
        priceOffer: p,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        imageUri,
      });
      router.replace(`/matching/${parcel.id}`);
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

      <Text style={[styles.section, { color: c.foreground }]}>Pickup date</Text>
      <View style={[styles.dateBox, { borderColor: c.border, backgroundColor: c.card }]}>
        <Pressable onPress={() => shiftDate(-1)} hitSlop={10} style={[styles.dateBtn, { backgroundColor: c.background, borderColor: c.border }]}>
          <Feather name="chevron-left" size={18} color={c.foreground} />
        </Pressable>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={[styles.dateLarge, { color: c.foreground }]}>
            {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </Text>
          <Text style={[styles.dateSmall, { color: c.mutedForeground }]}>
            {date.toLocaleDateString(undefined, { year: "numeric" })}
          </Text>
        </View>
        <Pressable onPress={() => shiftDate(1)} hitSlop={10} style={[styles.dateBtn, { backgroundColor: c.background, borderColor: c.border }]}>
          <Feather name="chevron-right" size={18} color={c.foreground} />
        </Pressable>
      </View>

      <Text style={[styles.section, { color: c.foreground }]}>Category</Text>
      <ChipPicker value={category} options={CATEGORIES} onChange={setCategory} scrollable />

      <Input label="Description" placeholder="Sealed envelope with documents." value={description} onChangeText={setDescription} multiline style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }} containerStyle={{ marginTop: 8 }} />

      <View style={styles.twoCol}>
        <Input label="Weight" placeholder="1" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" rightAdornment={<Text style={[styles.suffix, { color: c.mutedForeground }]}>kg</Text>} containerStyle={{ flex: 1 }} />
        <Input label="Your offer" placeholder="300" value={price} onChangeText={setPrice} keyboardType="decimal-pad" leftAdornment={<Text style={[styles.suffix, { color: c.mutedForeground, marginRight: 8 }]}>₹</Text>} containerStyle={{ flex: 1 }} />
      </View>

      <Text style={[styles.section, { color: c.foreground }]}>Photo (optional)</Text>
      <Pressable
        onPress={pickImage}
        style={[styles.imageBox, { borderColor: c.border, backgroundColor: c.card }]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePrompt}>
            <Feather name="image" size={22} color={c.mutedForeground} />
            <Text style={[styles.imageText, { color: c.mutedForeground }]}>Tap to add a photo</Text>
          </View>
        )}
      </Pressable>

      <Text style={[styles.section, { color: c.foreground }]}>Receiver</Text>
      <Input label="Name" placeholder="Receiver's full name" value={receiverName} onChangeText={setReceiverName} autoCapitalize="words" />
      <Input label="Phone" placeholder="+91 98765 43210" value={receiverPhone} onChangeText={setReceiverPhone} keyboardType="phone-pad" />

      <Button title="Find a traveller" onPress={onSubmit} loading={loading} fullWidth size="lg" style={{ marginTop: 16 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12 },
  section: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 12 },
  dateBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1 },
  dateBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  dateLarge: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: -0.2 },
  dateSmall: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  suffix: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginLeft: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  imageBox: { borderRadius: 14, borderWidth: 1, borderStyle: "dashed", height: 140, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  imagePrompt: { alignItems: "center", gap: 6 },
  imageText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  image: { width: "100%", height: "100%" },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
});
