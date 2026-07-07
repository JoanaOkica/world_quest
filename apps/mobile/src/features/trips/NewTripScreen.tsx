import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TransportMode } from "@terra/core";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, radius, spacing } from "../../theme";
import { TransportModePicker } from "./TransportModePicker";
import { useRegions } from "./useRegions";
import { useCreateTrip } from "./useTripMutations";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "NewTrip">;

export function NewTripScreen({ navigation }: Props) {
  const { data: regions } = useRegions();
  const createTrip = useCreateTrip();
  const [mode, setMode] = useState<TransportMode | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleRegion(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function onContinue() {
    if (!mode) return Alert.alert("Pick how you traveled");
    if (selected.size === 0) return Alert.alert("Pick at least one place you visited");
    const startedAt = new Date().toISOString();
    try {
      const regionIds = [...selected];
      const tripId = await createTrip.mutateAsync({ mode, regionIds, startedAt });
      // Live proof is required before a trip can be scored.
      navigation.replace("Capture", { tripId, mode, regionIds });
    } catch (e) {
      Alert.alert("Couldn't start trip", (e as Error).message);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={font.h1}>Log a trip</Text>

        <Text style={styles.section}>How did you travel?</Text>
        <TransportModePicker value={mode} onChange={setMode} />

        <Text style={styles.section}>Where did you go?</Text>
        <View style={styles.regionList}>
          {(regions ?? []).map((r) => {
            const on = selected.has(r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => toggleRegion(r.id)}
                style={[styles.region, on && styles.regionOn]}
              >
                <Text style={[styles.regionText, on && styles.regionTextOn]}>
                  {on ? "✓ " : ""}{r.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>
          Next you'll take a live photo as proof — it binds this claim to your real
          location. Gallery uploads aren't allowed.
        </Text>

        <Button
          title="Continue to live proof"
          onPress={onContinue}
          loading={createTrip.isPending}
          style={{ marginTop: spacing(2) }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...font.h2, marginTop: spacing(3), marginBottom: spacing(1.5) },
  regionList: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1) },
  region: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
  },
  regionOn: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  regionText: { color: colors.text },
  regionTextOn: { color: colors.primary, fontWeight: "700" },
  note: { ...font.muted, marginTop: spacing(3) },
});
