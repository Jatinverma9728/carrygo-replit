import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatTimeAgo } from "@/lib/format";

export default function ChatScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useAuth();
  const { requests, parcels, trips, threadMessages, sendMessage, deliveries, loadThreadMessages, markThreadRead, hydrated } = useData();
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!threadId) return;
    loadThreadMessages(threadId).catch(() => {});
    markThreadRead(threadId).catch(() => {});
    const id = setInterval(() => {
      loadThreadMessages(threadId).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [threadId, loadThreadMessages, markThreadRead]);

  const req = useMemo(() => requests.find((r) => r.id === threadId), [requests, threadId]);
  const parcel = req ? parcels.find((p) => p.id === req.parcelId) : undefined;
  const trip = req ? trips.find((t) => t.id === req.tripId) : undefined;
  const counterpart = req && user ? (req.senderId === user.id ? trip?.travellerName : parcel?.senderName) : undefined;
  const messages = useMemo(() => (threadId ? threadMessages(threadId) : []), [threadId, threadMessages]);
  const delivery = req ? deliveries.find((d) => d.requestId === req.id) : undefined;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <EmptyState icon="message-circle" title="Sign in to chat" />
      </View>
    );
  }

  if (!req || !parcel) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        {hydrated ? (
          <EmptyState icon="message-circle" title="Conversation unavailable" description="It may have been removed or is not yet shared with you." />
        ) : (
          <ActivityIndicator color={c.mutedForeground} />
        )}
      </View>
    );
  }

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    await sendMessage(threadId!, user.id, t);
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, backgroundColor: c.background }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.headerBar, { borderBottomColor: c.border }]}>
        <Avatar name={counterpart ?? "?"} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.foreground }]} numberOfLines={1}>{counterpart}</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]} numberOfLines={1}>
            {parcel.fromCity} → {parcel.toCity}
          </Text>
        </View>
        {delivery ? (
          <Pressable onPress={() => router.push(`/delivery/${delivery.id}`)} hitSlop={10} style={[styles.headerAction, { backgroundColor: c.secondary }]}>
            <Feather name="truck" size={16} color={c.foreground} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(m) => m.id}
        inverted
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 8 }}
        renderItem={({ item }) => {
          const mine = item.senderId === user.id;
          return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: mine ? c.primary : c.secondary,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { color: mine ? c.primaryForeground : c.foreground }]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.75)" : c.mutedForeground }]}>
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="message-circle"
            title="Start the conversation"
            description="Plan the meet — pickup time, location, and any handoff details."
          />
        }
      />

      <View style={[styles.inputBar, { borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={c.mutedForeground}
          style={[styles.input, { color: c.foreground, backgroundColor: c.secondary }]}
          multiline
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim()}
          style={[styles.sendBtn, { backgroundColor: text.trim() ? c.primary : c.secondary }]}
        >
          <Feather name="send" size={18} color={text.trim() ? c.primaryForeground : c.mutedForeground} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 },
  headerAction: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bubbleText: { fontFamily: "Inter_500Medium", fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 4 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center",
  },
});
