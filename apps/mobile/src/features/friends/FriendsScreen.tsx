import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, radius, spacing } from "../../theme";
import { useAcceptFriend, useAddFriend, useFriends, type FriendRow } from "./useFriends";

export function FriendsScreen() {
  const { data: friends, refetch, isRefetching } = useFriends();
  const addFriend = useAddFriend();
  const acceptFriend = useAcceptFriend();
  const [handle, setHandle] = useState("");

  async function onAdd() {
    if (!handle.trim()) return;
    try {
      await addFriend.mutateAsync(handle.trim());
      setHandle("");
      Alert.alert("Request sent");
    } catch (e) {
      Alert.alert("Couldn't add friend", (e as Error).message);
    }
  }

  return (
    <Screen>
      <Text style={font.h1}>Friends</Text>
      <Text style={[font.muted, styles.sub]}>
        Add friends by their exact handle to contest each other's territory.
      </Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="@handle"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          value={handle}
          onChangeText={setHandle}
        />
        <Button title="Add" onPress={onAdd} loading={addFriend.isPending} />
      </View>

      <FlatList
        data={friends ?? []}
        keyExtractor={(f) => f.other_id}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={<Text style={[font.muted, styles.empty]}>No friends yet.</Text>}
        renderItem={({ item }) => (
          <FriendItem item={item} onAccept={() => acceptFriend.mutate(item.other_id)} />
        )}
      />
    </Screen>
  );
}

function FriendItem({ item, onAccept }: { item: FriendRow; onAccept: () => void }) {
  const incomingPending = item.status === "pending" && item.direction === "incoming";
  return (
    <View style={styles.row}>
      <Text style={[font.body, { flex: 1 }]}>{item.display_name}</Text>
      {item.status === "accepted" ? (
        <Text style={styles.accepted}>friends</Text>
      ) : incomingPending ? (
        <Button title="Accept" onPress={onAccept} />
      ) : (
        <Text style={font.muted}>requested</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: spacing(0.5), marginBottom: spacing(2) },
  addRow: { flexDirection: "row", gap: spacing(1), marginBottom: spacing(2) },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing(2),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing(2),
    marginBottom: spacing(1),
  },
  accepted: { color: colors.primary, fontWeight: "600" },
  empty: { marginTop: spacing(6), textAlign: "center" },
});
