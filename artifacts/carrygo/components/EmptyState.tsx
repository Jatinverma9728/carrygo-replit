import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  const c = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: c.secondary }]}>
        <Feather name={icon} size={28} color={c.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: c.mutedForeground }]}>{description}</Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    textAlign: "center",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  action: { marginTop: 16 },
});
