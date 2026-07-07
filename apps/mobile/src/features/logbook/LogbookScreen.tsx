import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, radius, spacing } from "../../theme";
import { TRANSPORT_MULTIPLIERS } from "@terra/core";
import { useTrips } from "./useTrips";
import type { RootStackParamList } from "../../navigation/types";
import type { Trip } from "../../types";

const MODE_EMOJI: Record<string, string> = {
  walk: "🚶", bike: "🚲", train: "🚆", bus: "🚌", ferry: "⛴️", car: "🚗", plane: "✈️",
};

export function LogbookScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: trips, isLoading, refetch, isRefetching } = useTrips();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={font.h1}>Logbook</Text>
        <Button title="＋ Log a trip" onPress={() => navigation.navigate("NewTrip")} />
      </View>

      <FlatList
        data={trips ?? []}
        keyExtractor={(t) => t.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[font.muted, styles.empty]}>
              No trips yet. Log your first journey to start claiming the map.
            </Text>
          ) : null
        }
        renderItem={({ item }) => <TripRow trip={item} />}
        contentContainerStyle={{ paddingBottom: spacing(4) }}
      />
    </Screen>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const mult = TRANSPORT_MULTIPLIERS[trip.transport_mode];
  const date = new Date(trip.started_at).toLocaleDateString();
  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{MODE_EMOJI[trip.transport_mode] ?? "📍"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={font.body}>
          {trip.transport_mode} · ×{mult}
        </Text>
        <Text style={font.muted}>{date}</Text>
      </View>
      <Text style={[styles.badge, trip.status === "verified" ? styles.verified : styles.draft]}>
        {trip.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(2),
  },
  empty: { marginTop: spacing(6), textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
    marginBottom: spacing(1),
  },
  emoji: { fontSize: 26 },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: spacing(1),
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  verified: { color: colors.primaryText, backgroundColor: colors.primary },
  draft: { color: colors.textMuted, backgroundColor: colors.surfaceAlt },
});
