import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Mapbox, { Camera, FillLayer, LineLayer, MapView, ShapeSource } from "@rnmapbox/maps";
import { Screen } from "../../components/Screen";
import { colors, font, radius, spacing } from "../../theme";
import { env } from "../../lib/env";
import { useMapData, type MapFilter } from "./useMapData";

Mapbox.setAccessToken(env.mapboxToken);

const FILTERS: { key: MapFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "me", label: "Eu" },
  { key: "friends", label: "Amigos" },
];

export function MapScreen() {
  const [filter, setFilter] = useState<MapFilter>("all");
  const { data, isLoading, error } = useMapData(filter);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.error}>Couldn't load the map.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.fill}>
      {/* Globe projection needs the Mapbox v11 native SDK (set in app.config.ts). */}
      <MapView
        style={styles.fill}
        styleURL={Mapbox.StyleURL.Dark}
        projection="globe"
        scaleBarEnabled={false}
      >
        <Camera zoomLevel={1.6} centerCoordinate={[4.9, 46.0]} animationDuration={0} />
        {data ? (
          <ShapeSource id="regions" shape={data}>
            <FillLayer
              id="region-fill"
              style={{ fillColor: ["get", "color"], fillOpacity: 0.45 }}
            />
            <LineLayer
              id="region-outline"
              style={{ lineColor: ["get", "color"], lineWidth: 1.2, lineOpacity: 0.9 }}
            />
          </ShapeSource>
        ) : null}
      </MapView>

      <View style={styles.legend} pointerEvents="none">
        <Text style={font.h2}>Your map</Text>
        <Text style={font.muted}>Green is you. Grey is up for grabs.</Text>
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, on && styles.filterChipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: colors.danger },
  legend: {
    position: "absolute",
    top: spacing(7),
    left: spacing(2),
    backgroundColor: colors.surface + "cc",
    padding: spacing(1.5),
    borderRadius: 12,
  },
  filterBar: {
    position: "absolute",
    bottom: spacing(3),
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing(1),
    backgroundColor: colors.surface + "e6",
    padding: spacing(0.75),
    borderRadius: radius.lg,
  },
  filterChip: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    borderRadius: radius.lg,
  },
  filterChipOn: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontWeight: "600", fontSize: 13.5 },
  filterTextOn: { color: colors.primary },
});
