import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ParcelCard } from "@/components/ParcelCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { TripCard } from "@/components/TripCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/format";

export default function ProfileScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { trips, parcels, deliveries } = useData();

  const myTrips = useMemo(
    () => (user ? trips.filter((t) => t.travellerId === user.id) : []),
    [trips, user],
  );
  const myParcels = useMemo(
    () => (user ? parcels.filter((p) => p.senderId === user.id) : []),
    [parcels, user],
  );
  const completed = useMemo(
    () =>
      user
        ? deliveries.filter(
            (d) =>
              (d.senderId === user.id || d.travellerId === user.id) &&
              d.stage === "DELIVERED",
          ).length
        : 0,
    [deliveries, user],
  );

  const bottomPad = Platform.OS === "web" ? 110 : insets.bottom + 90;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <ScreenHeader title="Profile" />
        <EmptyState
          icon="user"
          title="Create your account"
          description="Sign in to send parcels, post trips, and build your reputation."
          action={<Button title="Sign in or sign up" onPress={() => router.push("/auth")} />}
        />
      </View>
    );
  }

  const onSignOut = () => {
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
    >
      <ScreenHeader
        title="Profile"
        right={
          <Pressable onPress={onSignOut} hitSlop={10}>
            <Feather name="log-out" size={20} color={c.mutedForeground} />
          </Pressable>
        }
      />
      <View style={styles.identity}>
        <Avatar name={user.name} color={user.avatarColor} size={84} />
        <Text style={[styles.name, { color: c.foreground }]}>{user.name}</Text>
        <Text style={[styles.phone, { color: c.mutedForeground }]}>{user.phone}</Text>
        <View style={styles.statsRow}>
          <Stat value={user.rating.toFixed(1)} label="Rating" icon="star" tint={c.warning} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Stat value={String(completed)} label="Deliveries" icon="check-circle" tint={c.success} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Stat value={formatDate(user.joinedAt)} label="Joined" icon="calendar" tint={c.primary} small />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 28 }}>
        <View>
          <SectionHeader title="Your trips" subtitle={`${myTrips.length} posted`} />
          {myTrips.length === 0 ? (
            <Card>
              <Text style={[styles.empty, { color: c.mutedForeground }]}>
                You have not posted any trips yet.
              </Text>
              <View style={{ height: 12 }} />
              <Button title="Post a trip" onPress={() => router.push("/create-trip")} />
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {myTrips.map((t) => (
                <TripCard key={t.id} trip={t} onPress={() => router.push(`/trip/${t.id}`)} showTraveller={false} />
              ))}
            </View>
          )}
        </View>

        <View>
          <SectionHeader title="Your parcels" subtitle={`${myParcels.length} sent`} />
          {myParcels.length === 0 ? (
            <Card>
              <Text style={[styles.empty, { color: c.mutedForeground }]}>
                No parcels yet — send one to find a traveller.
              </Text>
              <View style={{ height: 12 }} />
              <Button title="Send a parcel" onPress={() => router.push("/create-parcel")} />
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {myParcels.map((p) => (
                <ParcelCard key={p.id} parcel={p} onPress={() => router.push(`/parcel/${p.id}`)} />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({
  value,
  label,
  icon,
  tint,
  small,
}: {
  value: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  tint: string;
  small?: boolean;
}) {
  const c = useColors();
  return (
    <View style={styles.stat}>
      <View style={styles.statValue}>
        <Feather name={icon} size={14} color={tint} />
        <Text
          style={[
            styles.statValueText,
            { color: c.foreground, fontSize: small ? 13 : 18 },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", paddingVertical: 24, gap: 6 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.3, marginTop: 12 },
  phone: { fontFamily: "Inter_500Medium", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValueText: { fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.3, textTransform: "uppercase" },
  divider: { width: StyleSheet.hairlineWidth, height: 32 },
  empty: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
