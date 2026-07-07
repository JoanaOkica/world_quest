import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, radius, spacing } from "../../theme";
import { signOut } from "../auth/useAuth";
import {
  deleteMyAccount,
  exportMyData,
  useProfile,
  useUpdateProfile,
} from "./useProfile";

export function ProfileScreen() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name ?? "");
      setHandle(profile.handle ?? "");
    }
  }, [profile]);

  async function onSave() {
    try {
      await updateProfile.mutateAsync({
        display_name: name.trim(),
        handle: handle.trim() ? handle.trim().replace(/^@/, "") : null,
      });
      Alert.alert("Saved");
    } catch (e) {
      Alert.alert("Couldn't save", (e as Error).message);
    }
  }

  async function onExport() {
    setBusy(true);
    try {
      const data = await exportMyData();
      await Share.share({ message: JSON.stringify(data, null, 2) });
    } catch (e) {
      Alert.alert("Export failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onDelete() {
    Alert.alert(
      "Delete account?",
      "This permanently erases your trips, photos, claims and friendships. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMyAccount();
            } catch (e) {
              Alert.alert("Delete failed", (e as Error).message);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={font.h1}>Profile</Text>

        <Text style={styles.label}>Display name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Handle (for friend requests)</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          placeholder="@yourhandle"
          placeholderTextColor={colors.textMuted}
          value={handle}
          onChangeText={setHandle}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={font.body}>Global leaderboard</Text>
            <Text style={font.muted}>Shows only your handle + rank. No map, no location.</Text>
          </View>
          <Switch
            value={profile?.global_opt_in ?? false}
            onValueChange={(v) => updateProfile.mutate({ global_opt_in: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Button title="Save" onPress={onSave} loading={updateProfile.isPending} />

        <Text style={styles.sectionTitle}>Your data</Text>
        <Button
          title="Export my data (GDPR)"
          variant="secondary"
          onPress={onExport}
          loading={busy}
          style={{ marginBottom: spacing(1) }}
        />
        <Button
          title="Delete my account"
          variant="danger"
          onPress={onDelete}
          style={{ marginBottom: spacing(1) }}
        />
        <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...font.muted, marginTop: spacing(2), marginBottom: spacing(0.5) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    padding: spacing(1.5),
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(2),
    marginVertical: spacing(2.5),
  },
  sectionTitle: { ...font.h2, marginTop: spacing(4), marginBottom: spacing(1.5) },
});
