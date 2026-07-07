import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TRANSPORT_MULTIPLIERS, type TransportMode } from "@terra/core";
import { colors, radius, spacing } from "../../theme";

const MODES: { mode: TransportMode; emoji: string; label: string }[] = [
  { mode: "walk", emoji: "🚶", label: "Walk" },
  { mode: "bike", emoji: "🚲", label: "Bike" },
  { mode: "train", emoji: "🚆", label: "Train" },
  { mode: "bus", emoji: "🚌", label: "Bus" },
  { mode: "ferry", emoji: "⛴️", label: "Ferry" },
  { mode: "car", emoji: "🚗", label: "Car" },
  { mode: "plane", emoji: "✈️", label: "Plane" },
];

/** Transport picker. Each option shows its multiplier so the green nudge is legible. */
export function TransportModePicker({
  value,
  onChange,
}: {
  value: TransportMode | null;
  onChange: (mode: TransportMode) => void;
}) {
  return (
    <View style={styles.grid}>
      {MODES.map(({ mode, emoji, label }) => {
        const selected = value === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
            <Text style={[styles.mult, selected && styles.labelSelected]}>
              ×{TRANSPORT_MULTIPLIERS[mode]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1) },
  chip: {
    width: "31%",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing(1.5),
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceAlt },
  emoji: { fontSize: 24 },
  label: { color: colors.text, marginTop: 4, fontSize: 13 },
  labelSelected: { color: colors.primary, fontWeight: "700" },
  mult: { color: colors.textMuted, fontSize: 12 },
});
