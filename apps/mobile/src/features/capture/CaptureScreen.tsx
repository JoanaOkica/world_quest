import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Screen } from "../../components/Screen";
import { Button } from "../../components/Button";
import { colors, font, spacing } from "../../theme";
import { useCapture } from "./useCapture";
import { useScoreTrip } from "../trips/useTripMutations";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

/**
 * LIVE camera only — there is deliberately no gallery/image-picker path. A photo
 * here is the proof that binds the trip's claims to your real location.
 */
export function CaptureScreen({ navigation, route }: Props) {
  const { tripId, mode, regionIds } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const capture = useCapture(tripId);
  const scoreTrip = useScoreTrip();
  const [verifiedCount, setVerifiedCount] = useState(0);

  if (!permission) return <Screen><View /></Screen>;

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={font.h2}>Camera access needed</Text>
          <Text style={[font.muted, styles.mb]}>
            Proof photos are taken live, in the app. We never open your gallery.
          </Text>
          <Button title="Grant camera access" onPress={requestPermission} />
        </View>
      </Screen>
    );
  }

  async function onShoot() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) return;
      await capture.mutateAsync(photo.uri);
      setVerifiedCount((n) => n + 1);
    } catch (e) {
      Alert.alert("Capture failed", (e as Error).message);
    }
  }

  async function onFinish() {
    try {
      const visits = regionIds.map((regionId) => ({ regionId, mode }));
      const res = await scoreTrip.mutateAsync({ tripId, visits });
      Alert.alert("Trip scored!", `You earned ${res.totalPoints} points.`);
      navigation.navigate("Tabs");
    } catch (e) {
      Alert.alert("Scoring failed", (e as Error).message);
    }
  }

  return (
    <View style={styles.fill}>
      <CameraView ref={cameraRef} style={styles.fill} facing="back" />
      <View style={styles.overlay}>
        <Text style={styles.hint}>
          {verifiedCount === 0
            ? "Take a live photo where you are to verify this trip"
            : `${verifiedCount} proof${verifiedCount > 1 ? "s" : ""} verified`}
        </Text>

        <Pressable style={styles.shutter} onPress={onShoot} disabled={capture.isPending}>
          <View style={styles.shutterInner} />
        </Pressable>

        {verifiedCount > 0 ? (
          <Button
            title="Finish & score trip"
            onPress={onFinish}
            loading={scoreTrip.isPending}
            style={styles.finish}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing(1.5) },
  mb: { textAlign: "center", marginBottom: spacing(2) },
  overlay: {
    position: "absolute",
    bottom: spacing(5),
    left: 0,
    right: 0,
    alignItems: "center",
    gap: spacing(2),
  },
  hint: {
    ...font.muted,
    color: "#fff",
    backgroundColor: "#000a",
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 20,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary },
  finish: { alignSelf: "stretch", marginHorizontal: spacing(3) },
});
