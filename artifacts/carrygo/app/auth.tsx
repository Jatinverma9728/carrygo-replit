import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const onSend = async () => {
    if (phone.trim().length < 6) {
      Alert.alert("Enter a valid phone number");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Enter your name");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    setLoading(true);
    try {
      await verifyOtp(phone, otp, name);
      router.back();
    } catch (e) {
      Alert.alert("Could not sign in", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const topPad = (Platform.OS === "web" ? Math.max(insets.top, 16) : insets.top) + 12;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAwareScrollView
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 32 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
          <Feather name="x" size={22} color={c.foreground} />
        </Pressable>

        <View style={[styles.logoWrap, { backgroundColor: c.foreground }]}>
          <Feather name="navigation" size={26} color={c.background} />
        </View>
        <Text style={[styles.title, { color: c.foreground }]}>
          {step === "phone" ? "Welcome to CarryGo" : "Verify your number"}
        </Text>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {step === "phone"
            ? "Send parcels with travellers going your way. Confirmed handoff, every time."
            : `We sent a 4-digit code to ${phone}. Use 1234 in demo mode.`}
        </Text>

        <View style={styles.form}>
          {step === "phone" ? (
            <>
              <Input
                label="Your name"
                placeholder="Aarav Mehta"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <Input
                label="Phone number"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                leftAdornment={<Feather name="phone" size={16} color={c.mutedForeground} style={{ marginRight: 10 }} />}
              />
              <Button title="Send code" onPress={onSend} loading={loading} fullWidth />
            </>
          ) : (
            <>
              <Input
                label="Verification code"
                placeholder="1234"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Button title="Verify and continue" onPress={onVerify} loading={loading} fullWidth />
              <Pressable onPress={() => setStep("phone")} hitSlop={8} style={{ alignSelf: "center", marginTop: 4 }}>
                <Text style={[styles.alt, { color: c.primary }]}>Change number</Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={[styles.legal, { color: c.mutedForeground }]}>
          By continuing you agree to CarryGo&apos;s Terms and acknowledge handoffs are confirmed by both parties.
        </Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 16 },
  close: { alignSelf: "flex-end", padding: 6 },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  form: { gap: 14 },
  alt: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  legal: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 16 },
});
