import type { ExpoConfig } from "expo/config";

// Native modules (Mapbox, camera, attestation, location) require a dev build.
const config: ExpoConfig = {
  name: "World Quest",
  slug: "world-quest",
  scheme: "worldquest",
  orientation: "portrait",
  plugins: [
    [
      "expo-camera",
      { cameraPermission: "World Quest uses the camera for live proof photos of your trips." },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "World Quest uses your location only while logging a trip, to know which region you're in.",
      },
    ],
    ["@rnmapbox/maps", { RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN }],
  ],
  ios: { bundleIdentifier: "app.worldquest.mobile", supportsTablet: false },
  android: { package: "app.worldquest.mobile" },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
  },
};
export default config;
