import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Mapbox, { Camera, FillLayer, LineLayer, MapView, ShapeSource } from "@rnmapbox/maps";
import { Screen } from "../../components/Screen";
import { colors, font, spacing } from "../../theme";
import { env } from "../../lib/env";
import { useMapData } from "./useMapData";

Mapbox.setAccessToken(env.mapboxToken);

export function MapScreen() {
  const { data, isLoading, error } = useMapData();

  useEffect(() => {
    // Location is only requested while logging a trip, never in the background.
  }, []);

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
      <MapView style={styles.fill} styleURL={Mapbox.StyleURL.Dark} scaleBarEnabled={false}>
        <Camera zoomLevel={3.5} centerCoordinate={[4.9, 46.0]} animationDuration={0} />
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
});
