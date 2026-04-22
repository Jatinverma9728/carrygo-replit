import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ParcelCard } from "@/components/ParcelCard";
import { SectionHeader } from "@/components/SectionHeader";
import { TripCard } from "@/components/TripCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { trips, parcels, deliveries, hydrated, seedDemoIfEmpty } = useData();
  const { counts } = useNotifications();

  useEffect(() => {
    if (hydrated) seedDemoIfEmpty();
  }, [hydrated, seedDemoIfEmpty]);

  const myTrips = useMemo(
    () => (user ? trips.filter((t) => t.travellerId === user.id).slice(0, 3) : []),
    [trips, user],
  );
  const myParcels = useMemo(
    () => (user ? parcels.filter((p) => p.senderId === user.id).slice(0, 3) : []),
    [parcels, user],
  );
  const activeDeliveries = useMemo(() => {
    if (!user) return [];
    return deliveries.filter(
      (d) =>
        (d.senderId === user.id || d.travellerId === user.id) &&
        (d.stage === "AWAITING_PICKUP" || d.stage === "IN_TRANSIT"),
    );
  }, [deliveries, user]);

  const featuredTrips = useMemo(
    () =>
      trips
        .filter((t) => t.status === "ACTIVE" && (!user || t.travellerId !== user.id))
        .slice(0, 4),
    [trips, user],
  );

  const topPad = (Platform.OS === "web" ? Math.max(insets.top, 16) : insets.top) + 12;
  const bottomPad = (Platform.OS === "web" ? 100 : insets.bottom + 80);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: c.mutedForeground }]}>
            {user ? "Welcome back" : "Welcome to"}
          </Text>
          <Text style={[styles.greeting, { color: c.foreground }]}>
            {user ? user.name.split(" ")[0] : "CarryGo"}
          </Text>
        </View>
        {user ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/notifications")}
              hitSlop={10}
              style={[styles.bell, { backgroundColor: c.accent, borderColor: c.border }]}
            >
              <Feather name="bell" size={18} color={c.foreground} />
              {counts.notifications > 0 ? (
                <View style={[styles.bellDot, { backgroundColor: c.primary, borderColor: c.background }]}>
                  <Text style={styles.bellDotText}>
                    {counts.notifications > 9 ? "9+" : String(counts.notifications)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => router.push("/profile")} hitSlop={10}>
              <Avatar name={user.name} color={user.avatarColor} size={44} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push("/auth")}
            style={[styles.signIn, { backgroundColor: c.foreground }]}
          >
            <Text style={[styles.signInText, { color: c.background }]}>Sign in</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => (user ? router.push("/create-parcel") : router.push("/auth"))}
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: c.foreground,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: c.primary }]}>
            <Feather name="package" size={20} color={c.primaryForeground} />
          </View>
          <Text style={[styles.actionTitle, { color: c.background }]}>Send a parcel</Text>
          <Text style={[styles.actionSub, { color: "#9CA3AF" }]}>Find a traveller on your route</Text>
        </Pressable>
        <Pressable
          onPress={() => (user ? router.push("/create-trip") : router.push("/auth"))}
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: c.primary,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
            <Feather name="navigation" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.actionTitle, { color: "#FFFFFF" }]}>Post a trip</Text>
          <Text style={[styles.actionSub, { color: "rgba(255,255,255,0.78)" }]}>
            Earn while you travel
          </Text>
        </Pressable>
      </View>

      {activeDeliveries.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Active deliveries" subtitle={`${activeDeliveries.length} in progress`} />
          <View style={styles.cardList}>
            {activeDeliveries.map((d) => {
              const parcel = parcels.find((p) => p.id === d.parcelId);
              if (!parcel) return null;
              const isTraveller = d.travellerId === user?.id;
              return (
                <Card key={d.id} onPress={() => router.push(`/delivery/${d.id}`)}>
                  <View style={styles.deliveryRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            d.stage === "IN_TRANSIT" ? c.warning : c.primary,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.deliveryTitle, { color: c.foreground }]}>
                        {parcel.fromCity} → {parcel.toCity}
                      </Text>
                      <Text style={[styles.deliverySub, { color: c.mutedForeground }]}>
                        {isTraveller ? "You are carrying" : "Being carried"} · {d.stage === "IN_TRANSIT" ? "In transit" : "Awaiting pickup"}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={c.mutedForeground} />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title="Travellers near you"
          subtitle="Active routes you can use"
        />
        {featuredTrips.length === 0 ? (
          <EmptyState
            icon="navigation"
            title="No active travellers yet"
            description="Be the first to post a trip and start earning."
          />
        ) : (
          <View style={styles.cardList}>
            {featuredTrips.map((t) => (
              <TripCard key={t.id} trip={t} onPress={() => router.push(`/trip/${t.id}`)} />
            ))}
          </View>
        )}
      </View>

      {myParcels.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Your parcels" />
          <View style={styles.cardList}>
            {myParcels.map((p) => (
              <ParcelCard key={p.id} parcel={p} onPress={() => router.push(`/parcel/${p.id}`)} />
            ))}
          </View>
        </View>
      ) : null}

      {myTrips.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Your trips" />
          <View style={styles.cardList}>
            {myTrips.map((t) => (
              <TripCard key={t.id} trip={t} onPress={() => router.push(`/trip/${t.id}`)} showTraveller={false} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 28 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  signIn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  signInText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  actions: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    padding: 18,
    minHeight: 150,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.2,
    marginTop: 12,
  },
  actionSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 4,
  },
  section: { gap: 4 },
  cardList: { gap: 12 },
  deliveryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  deliveryTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  deliverySub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  bellDot: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  bellDotText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
  },
});
