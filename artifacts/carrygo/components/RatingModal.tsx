import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  counterpartName: string;
  onCancel: () => void;
  onSubmit: (stars: number, comment: string) => Promise<void>;
};

export function RatingModal({ visible, counterpartName, onCancel, onSubmit }: Props) {
  const c = useColors();
  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const submit = async () => {
    if (stars < 1) return;
    setSubmitting(true);
    try {
      await onSubmit(stars, comment.trim());
    } catch (e) {
      Alert.alert("Could not submit rating", e instanceof Error ? e.message : "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.foreground }]}>How was your handoff?</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Rate your experience with {counterpartName}.
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                hitSlop={6}
                onPress={() => setStars(n)}
                style={styles.starBtn}
              >
                <Feather
                  name={n <= stars ? "star" : "star"}
                  size={36}
                  color={n <= stars ? c.warning : c.border}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a quick note (optional)"
            placeholderTextColor={c.mutedForeground}
            multiline
            style={[styles.input, { color: c.foreground, backgroundColor: c.background, borderColor: c.border }]}
          />
          <View style={styles.actions}>
            <Button title="Skip" variant="ghost" onPress={onCancel} fullWidth />
            <Button title="Submit rating" onPress={submit} loading={submitting} fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 22,
    padding: 22,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 20, letterSpacing: -0.3 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 13 },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  starBtn: { padding: 4 },
  input: {
    minHeight: 70,
    borderRadius: 12,
    padding: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    textAlignVertical: "top",
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
});
