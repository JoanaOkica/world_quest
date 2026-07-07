import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../components/Screen";
import { colors, font, radius, spacing } from "../../theme";
import { useUserId } from "../../state/authStore";
import { useFriendLeaderboard, useGlobalLeaderboard } from "./useLeaderboard";

type Tab = "friends" | "global";

export function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>("friends");
  const youId = useUserId();
  const friends = useFriendLeaderboard();
  const global = useGlobalLeaderboard();

  return (
    <Screen>
      <Text style={font.h1}>Leaderboard</Text>

      <View style={styles.tabs}>
        {(["friends", "global"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabOn]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
              {t === "friends" ? "Friends" : "Global"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "friends" ? (
        <FlatList
          data={friends.data ?? []}
          keyExtractor={(r) => r.user_id}
          onRefresh={friends.refetch}
          refreshing={friends.isRefetching}
          ListEmptyComponent={<Empty text="Add friends to start competing." />}
          renderItem={({ item, index }) => (
            <Row
              rank={index + 1}
              name={item.user_id === youId ? `${item.display_name} (you)` : item.display_name}
              value={item.regions_owned}
              highlight={item.user_id === youId}
            />
          )}
        />
      ) : (
        <FlatList
          data={global.data ?? []}
          keyExtractor={(r) => r.handle}
          onRefresh={global.refetch}
          refreshing={global.isRefetching}
          ListEmptyComponent={<Empty text="Opt into the global board in your profile." />}
          renderItem={({ item }) => (
            <Row rank={item.rank} name={`@${item.handle}`} value={item.regions_owned} />
          )}
        />
      )}
    </Screen>
  );
}

function Row({
  rank,
  name,
  value,
  highlight,
}: {
  rank: number;
  name: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.row, highlight && styles.rowHighlight]}>
      <Text style={styles.rank}>#{rank}</Text>
      <Text style={[font.body, { flex: 1 }]}>{name}</Text>
      <Text style={styles.value}>{value} regions</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={[font.muted, styles.empty]}>{text}</Text>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: spacing(1), marginVertical: spacing(2) },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing(1.25),
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  tabOn: { backgroundColor: colors.surfaceAlt, borderColor: colors.primary, borderWidth: 1 },
  tabText: { color: colors.textMuted, fontWeight: "600" },
  tabTextOn: { color: colors.primary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(1.5),
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
    marginBottom: spacing(1),
  },
  rowHighlight: { borderColor: colors.primary, borderWidth: 1 },
  rank: { color: colors.textMuted, fontWeight: "700", width: 36 },
  value: { color: colors.primary, fontWeight: "600" },
  empty: { marginTop: spacing(6), textAlign: "center" },
});
